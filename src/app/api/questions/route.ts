import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { validateQuestionText, validateLecturer, validateLecture } from '@/lib/validation';
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimit';

const DB_ERROR_MESSAGE = 'Service temporarily unavailable. Please try again shortly.';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

export async function GET(): Promise<NextResponse> {
  const repo = getRepository();
  try {
    const questions = await repo.findAll();
    return NextResponse.json(questions, { status: 200 });
  } catch (err) {
    if (isDbError(err)) {
      return NextResponse.json({ error: DB_ERROR_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Rate limiting ---
  // x-forwarded-for is set by Vercel and most reverse proxies; take the first
  // (leftmost) address which is the original client IP.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') ?? 'unknown');

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: `Too many requests. You can submit at most ${RATE_LIMIT_MAX} questions per ${RATE_LIMIT_WINDOW_MS / 60_000} minute(s). Please try again in ${retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { text, author, lecturer, lecture } = body as Record<string, unknown>;

  // Validate text
  const textValidation = validateQuestionText(text);
  if (!textValidation.isValid) {
    return NextResponse.json({ error: textValidation.error }, { status: 400 });
  }

  // Validate lecturer
  const lecturerValidation = validateLecturer(lecturer);
  if (!lecturerValidation.isValid) {
    return NextResponse.json({ error: lecturerValidation.error }, { status: 400 });
  }

  // Validate lecture belongs to the selected lecturer
  const lectureValidation = validateLecture(lecturer, lecture);
  if (!lectureValidation.isValid) {
    return NextResponse.json({ error: lectureValidation.error }, { status: 400 });
  }

  // Coerce author: empty string → null
  const authorValue: string | null =
    typeof author === 'string' && author.trim().length > 0 ? author : null;

  const repo = getRepository();
  try {
    const question = await repo.create({
      text: text as string,
      author: authorValue,
      lecturer: lecturer as string,
      lecture: lecture as string,
    });
    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    if (isDbError(err)) {
      return NextResponse.json({ error: DB_ERROR_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

/**
 * Heuristic to detect database/service-layer errors vs unexpected application errors.
 * All errors thrown from repo methods are considered DB errors and mapped to 503.
 * This can be refined later if specific error types are introduced.
 */
function isDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  // Unexpected application programming errors (e.g. TypeError, ReferenceError)
  // should surface as 500 rather than 503.
  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof SyntaxError) {
    return false;
  }
  return true;
}

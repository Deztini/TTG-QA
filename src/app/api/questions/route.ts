import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { validateQuestionText } from '@/lib/validation';

const DB_ERROR_MESSAGE = 'Service temporarily unavailable. Please try again shortly.';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

export async function GET(): Promise<NextResponse> {
  const repo = getRepository();
  try {
    const questions = await repo.findAll();
    return NextResponse.json(questions, { status: 200 });
  } catch (err) {
    // All errors from the repository are treated as DB/service errors → 503
    if (isDbError(err)) {
      return NextResponse.json({ error: DB_ERROR_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const { text, author } = body as Record<string, unknown>;

  // Validate text
  const validation = validateQuestionText(text);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Coerce author: empty string → null
  const authorValue: string | null =
    typeof author === 'string' && author.trim().length > 0 ? author : null;

  const repo = getRepository();
  try {
    const question = await repo.create({
      text: text as string,
      author: authorValue,
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

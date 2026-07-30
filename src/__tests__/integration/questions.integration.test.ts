/**
 * @jest-environment node
 *
 * Integration tests for GET/POST /api/questions route handlers
 * wired to a real SQLite :memory: database.
 *
 * Requirements: 1.3, 1.6, 2.2, 4.2, 4.3
 */

import { NextRequest } from 'next/server';
import { SQLiteQuestionRepository } from '@/lib/db/sqlite';
import * as dbModule from '@/lib/db';

// Mock the db module so getRepository() returns our in-memory repo
jest.mock('@/lib/db', () => {
  const actual = jest.requireActual('@/lib/db');
  return {
    ...actual,
    getRepository: jest.fn(),
  };
});

// Import route handlers AFTER mocking so they pick up the mock
import { GET, POST } from '@/app/api/questions/route';

const mockedGetRepository = dbModule.getRepository as jest.MockedFunction<
  typeof dbModule.getRepository
>;

/** Valid lecturer/lecture pair used across tests */
const VALID_LECTURER = 'Prof. Adejumoke';
const VALID_LECTURE = 'Introduction to TTG';

/**
 * Helper: build a NextRequest for POST /api/questions
 */
function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/questions', () => {
  let repo: SQLiteQuestionRepository;

  beforeEach(() => {
    repo = new SQLiteQuestionRepository(':memory:');
    repo.initSchema();
    mockedGetRepository.mockReturnValue(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns [] when no questions exist', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  test('returns questions ordered by timestamp descending', async () => {
    const db = (repo as unknown as { db: import('better-sqlite3').Database }).db;

    db.prepare(
      'INSERT INTO questions (id, text, author, lecturer, lecture, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('id-1', 'First question', 'Alice', VALID_LECTURER, VALID_LECTURE, '2024-01-01T10:00:00.000Z');

    db.prepare(
      'INSERT INTO questions (id, text, author, lecturer, lecture, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('id-2', 'Second question', 'Bob', VALID_LECTURER, VALID_LECTURE, '2024-01-01T11:00:00.000Z');

    db.prepare(
      'INSERT INTO questions (id, text, author, lecturer, lecture, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('id-3', 'Third question', null, VALID_LECTURER, VALID_LECTURE, '2024-01-01T10:30:00.000Z');

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveLength(3);
    expect(data[0].id).toBe('id-2');
    expect(data[1].id).toBe('id-3');
    expect(data[2].id).toBe('id-1');

    const timestamps = data.map((q: { timestamp: string }) => q.timestamp);
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(new Date(timestamps[i]).getTime()).toBeGreaterThanOrEqual(
        new Date(timestamps[i + 1]).getTime()
      );
    }
  });

  test('returns 503 when database throws', async () => {
    jest.spyOn(repo, 'findAll').mockRejectedValue(new Error('DB connection failed'));

    const response = await GET();

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

describe('POST /api/questions', () => {
  let repo: SQLiteQuestionRepository;

  beforeEach(() => {
    repo = new SQLiteQuestionRepository(':memory:');
    repo.initSchema();
    mockedGetRepository.mockReturnValue(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('creates a question and returns 201 with the created record', async () => {
    const request = makePostRequest({
      text: 'What is a closure?',
      author: 'Alice',
      lecturer: VALID_LECTURER,
      lecture: VALID_LECTURE,
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toMatchObject({
      text: 'What is a closure?',
      author: 'Alice',
      lecturer: VALID_LECTURER,
      lecture: VALID_LECTURE,
    });
    expect(data.id).toBeTruthy();
    expect(() => new Date(data.timestamp)).not.toThrow();
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  test('returns 400 when text is missing', async () => {
    const request = makePostRequest({ author: 'Alice', lecturer: VALID_LECTURER, lecture: VALID_LECTURE });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when text is empty', async () => {
    const request = makePostRequest({ text: '', author: 'Alice', lecturer: VALID_LECTURER, lecture: VALID_LECTURE });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when lecturer is missing', async () => {
    const request = makePostRequest({ text: 'Valid question?', author: null, lecture: VALID_LECTURE });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when lecture is missing', async () => {
    const request = makePostRequest({ text: 'Valid question?', author: null, lecturer: VALID_LECTURER });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when lecture does not belong to lecturer', async () => {
    const request = makePostRequest({
      text: 'Valid question?',
      author: null,
      lecturer: VALID_LECTURER,
      lecture: 'Vision Analysis', // belongs to Pst. Obed Onos, not Prof. Adejumoke
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 503 when database throws', async () => {
    jest.spyOn(repo, 'create').mockRejectedValue(new Error('DB connection failed'));

    const request = makePostRequest({ text: 'Valid question text', author: null, lecturer: VALID_LECTURER, lecture: VALID_LECTURE });
    const response = await POST(request);

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

describe('POST → GET round trip', () => {
  let repo: SQLiteQuestionRepository;

  beforeEach(() => {
    repo = new SQLiteQuestionRepository(':memory:');
    repo.initSchema();
    mockedGetRepository.mockReturnValue(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('submitted question appears in subsequent GET response', async () => {
    const postRequest = makePostRequest({
      text: 'What is the event loop?',
      author: 'Charlie',
      lecturer: VALID_LECTURER,
      lecture: VALID_LECTURE,
    });
    const postResponse = await POST(postRequest);
    expect(postResponse.status).toBe(201);
    const createdQuestion = await postResponse.json();

    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
    const questions = await getResponse.json();

    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      id: createdQuestion.id,
      text: 'What is the event loop?',
      author: 'Charlie',
      lecturer: VALID_LECTURER,
      lecture: VALID_LECTURE,
    });
  });

  test('multiple submitted questions appear in GET ordered newest first', async () => {
    const texts = ['First question', 'Second question', 'Third question'];

    for (const text of texts) {
      const req = makePostRequest({ text, author: null, lecturer: VALID_LECTURER, lecture: VALID_LECTURE });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }

    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
    const questions = await getResponse.json();

    expect(questions).toHaveLength(3);

    for (let i = 0; i < questions.length - 1; i++) {
      expect(new Date(questions[i].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(questions[i + 1].timestamp).getTime()
      );
    }
  });
});

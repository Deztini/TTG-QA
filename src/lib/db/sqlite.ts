import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Question, CreateQuestionDTO } from '@/types/question';
import type { QuestionRepository } from './repository';

export class SQLiteQuestionRepository implements QuestionRepository {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
  }

  initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id        TEXT PRIMARY KEY,
        text      TEXT NOT NULL,
        author    TEXT,
        timestamp TEXT NOT NULL
      )
    `);
  }

  async create(dto: CreateQuestionDTO): Promise<Question> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const author = dto.author ?? null;

    const stmt = this.db.prepare(
      'INSERT INTO questions (id, text, author, timestamp) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, dto.text, author, timestamp);

    return Promise.resolve({ id, text: dto.text, author, timestamp });
  }

  async findAll(): Promise<Question[]> {
    const stmt = this.db.prepare(
      'SELECT id, text, author, timestamp FROM questions ORDER BY timestamp DESC'
    );
    const rows = stmt.all() as Array<{
      id: string;
      text: string;
      author: string | null;
      timestamp: string;
    }>;

    const questions: Question[] = rows.map((row) => ({
      id: row.id,
      text: row.text,
      author: row.author ?? null,
      // Normalise to ISO string — SQLite stores TEXT, ensure it's a valid ISO 8601 string
      timestamp: new Date(row.timestamp).toISOString(),
    }));

    return Promise.resolve(questions);
  }
}

// Singleton instance for production use (file-backed or in-memory based on env)
const DB_PATH = process.env.SQLITE_DB_PATH ?? ':memory:';
export const sqliteRepository = new SQLiteQuestionRepository(DB_PATH);

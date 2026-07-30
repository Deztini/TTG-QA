import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import type { Question, CreateQuestionDTO } from '@/types/question';
import type { QuestionRepository } from './repository';

export class PostgresQuestionRepository implements QuestionRepository {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async findAll(): Promise<Question[]> {
    const result = await this.pool.query<{
      id: string;
      text: string;
      author: string | null;
      lecturer: string;
      lecture: string;
      timestamp: Date;
    }>(
      'SELECT id, text, author, lecturer, lecture, timestamp FROM questions ORDER BY timestamp DESC'
    );

    return result.rows.map((row) => ({
      id: row.id,
      text: row.text,
      author: row.author,
      lecturer: row.lecturer,
      lecture: row.lecture,
      timestamp: new Date(row.timestamp).toISOString(),
    }));
  }

  async create(dto: CreateQuestionDTO): Promise<Question> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    await this.pool.query(
      'INSERT INTO questions (id, text, author, lecturer, lecture, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, dto.text, dto.author, dto.lecturer, dto.lecture, timestamp]
    );

    return {
      id,
      text: dto.text,
      author: dto.author,
      lecturer: dto.lecturer,
      lecture: dto.lecture,
      timestamp,
    };
  }
}

/**
 * Factory function — reads DATABASE_URL from the environment when no
 * connection string is supplied explicitly.
 */
export function createPostgresRepository(
  connectionString: string = process.env.DATABASE_URL ?? ''
): PostgresQuestionRepository {
  return new PostgresQuestionRepository(connectionString);
}

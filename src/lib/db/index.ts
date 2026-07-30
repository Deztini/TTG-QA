import { SQLiteQuestionRepository } from './sqlite';
import { PostgresQuestionRepository } from './postgres';
import type { QuestionRepository } from './repository';

// Re-export interface and implementations for convenience
export type { QuestionRepository };
export { SQLiteQuestionRepository } from './sqlite';
export { PostgresQuestionRepository } from './postgres';

let instance: QuestionRepository | null = null;

/**
 * Returns a singleton QuestionRepository.
 *
 * - Uses SQLiteQuestionRepository (in-memory) when NODE_ENV === 'test'
 *   or DATABASE_URL is absent/empty.
 * - Uses PostgresQuestionRepository otherwise.
 */
export function getRepository(): QuestionRepository {
  if (instance !== null) {
    return instance;
  }

  const isTest = process.env.NODE_ENV === 'test';
  const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

  if (isTest || !hasDatabase) {
    const repo = new SQLiteQuestionRepository(':memory:');
    repo.initSchema();
    instance = repo;
  } else {
    instance = new PostgresQuestionRepository(process.env.DATABASE_URL!);
  }

  return instance;
}

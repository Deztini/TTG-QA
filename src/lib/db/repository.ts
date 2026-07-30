import type { Question, CreateQuestionDTO } from '@/types/question';

export interface QuestionRepository {
  findAll(): Promise<Question[]>;
  create(dto: CreateQuestionDTO): Promise<Question>;
}

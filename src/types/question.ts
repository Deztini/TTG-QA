export interface Question {
  id: string;
  text: string;
  author: string | null;
  timestamp: string;
}

export interface CreateQuestionDTO {
  text: string;
  author: string | null;
}

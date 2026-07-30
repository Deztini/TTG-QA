export interface Question {
  id: string;
  text: string;
  author: string | null;
  lecturer: string;
  lecture: string;
  timestamp: string;
}

export interface CreateQuestionDTO {
  text: string;
  author: string | null;
  lecturer: string;
  lecture: string;
}

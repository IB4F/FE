export interface QuizItemDTO {
  id: string;
  question: string | null;
  quizType: string | null;
  parentQuizId: string | null;
  points: number;
}

export interface UserConceptMasteryDTO {
  conceptTagId?: string;
  conceptTagName?: string | null;
  masteryLevel?: number;
  totalAttempts?: number;
  correctAttempts?: number;
  nextReviewDate?: string | null;
  lastAttemptAt?: string;
}

import { z } from "zod";

export const ScoringSchema = z.object({
  open: z.number().int().min(0).max(10),
  read: z.number().int().min(0).max(10),
  interested: z.number().int().min(0).max(10),
});

export type Scoring = z.infer<typeof ScoringSchema>;

let SCORING: Scoring = { open: 1, read: 2, interested: 1 };

export function getScoring(): Scoring {
  return SCORING;
}

export function setScoring(next: Scoring) {
  SCORING = next;
}

import type { Question } from "@/types/question";

/**
 * Merges incoming questions into the existing list, deduplicating by ID.
 *
 * - Appends only incoming questions whose `id` is not already in `existing`
 * - Preserves the relative order of the existing questions
 * - Returns the combined list sorted by `timestamp` descending (newest first)
 */
export function mergeQuestions(
  existing: Question[],
  incoming: Question[]
): Question[] {
  const existingIds = new Set(existing.map((q) => q.id));

  const newQuestions = incoming.filter((q) => !existingIds.has(q.id));

  const merged = [...existing, ...newQuestions];

  return merged.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

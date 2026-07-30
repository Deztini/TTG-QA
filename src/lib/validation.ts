/**
 * Validates the question text field against the rules defined in Requirements 1.4, 1.5, and 4.4:
 * - Must be a string
 * - Must not be empty or whitespace-only (min 1 non-whitespace character)
 * - Must not exceed 500 characters
 */
export function validateQuestionText(
  text: unknown
): { isValid: boolean; error?: string } {
  if (typeof text !== "string") {
    return { isValid: false, error: "text is required and must be a string" };
  }

  if (text.trim().length === 0) {
    return { isValid: false, error: "text is required and must not be empty" };
  }

  if (text.length > 500) {
    return {
      isValid: false,
      error: "text must be 500 characters or fewer",
    };
  }

  return { isValid: true };
}

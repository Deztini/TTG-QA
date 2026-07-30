import { isValidLecturer, isValidLecture } from './lecturers';

/**
 * Validates the question text field:
 * - Must be a non-empty string
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

/**
 * Validates that the lecturer is one of the known lecturers.
 */
export function validateLecturer(
  lecturer: unknown
): { isValid: boolean; error?: string } {
  if (typeof lecturer !== "string" || lecturer.trim().length === 0) {
    return { isValid: false, error: "Please select a lecturer" };
  }
  if (!isValidLecturer(lecturer)) {
    return { isValid: false, error: "Invalid lecturer selected" };
  }
  return { isValid: true };
}

/**
 * Validates that the lecture belongs to the given lecturer.
 */
export function validateLecture(
  lecturerName: unknown,
  lecture: unknown
): { isValid: boolean; error?: string } {
  if (typeof lecture !== "string" || lecture.trim().length === 0) {
    return { isValid: false, error: "Please select a lecture" };
  }
  if (typeof lecturerName !== "string" || !isValidLecture(lecturerName, lecture)) {
    return { isValid: false, error: "Invalid lecture for the selected lecturer" };
  }
  return { isValid: true };
}

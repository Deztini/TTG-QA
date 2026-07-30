"use client";

import { useState } from "react";
import { Question } from "@/types/question";
import { validateQuestionText } from "@/lib/validation";

export interface QuestionFormProps {
  onSubmitted: (question: Question) => void;
}

type SubmissionState = "idle" | "submitting" | "success" | "error";

export default function QuestionForm({ onSubmitted }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState("");
  const [author, setAuthor] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [textError, setTextError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const isSubmitting = submissionState === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear previous errors
    setTextError(null);
    setSubmissionError(null);

    // Client-side validation — no fetch if invalid
    const validation = validateQuestionText(questionText);
    if (!validation.isValid) {
      setTextError(validation.error ?? "Invalid question text.");
      return;
    }

    setSubmissionState("submitting");

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: questionText,
          author: author.trim() || null,
        }),
      });

      if (response.status === 201) {
        const newQuestion: Question = await response.json();
        // Clear only the question text; author stays
        setQuestionText("");
        onSubmitted(newQuestion);
        setSubmissionState("idle");
      } else {
        let errorMessage = "Submission failed. Please try again.";
        if (response.status === 503) {
          errorMessage = "Submission failed — the server is temporarily unavailable.";
        } else {
          try {
            const body = await response.json();
            if (body?.error) {
              errorMessage = body.error;
            }
          } catch {
            // Use fallback message
          }
        }
        setSubmissionError(errorMessage);
        setSubmissionState("error");
      }
    } catch {
      setSubmissionError("Submission failed. Please check your connection and try again.");
      setSubmissionState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Question text field */}
      <div className="flex flex-col gap-1">
        <label htmlFor="questionText" className="text-sm font-medium text-gray-700">
          Your question <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="questionText"
          name="questionText"
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            // Clear text error as user types
            if (textError) setTextError(null);
          }}
          maxLength={500}
          rows={4}
          disabled={isSubmitting}
          aria-describedby={textError ? "questionText-error" : "questionText-hint"}
          aria-invalid={textError ? "true" : undefined}
          placeholder="Type your question here…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
        <div className="flex items-start justify-between gap-2">
          <span
            id="questionText-hint"
            className="text-xs text-gray-500"
            aria-live="polite"
          >
            {questionText.length}/500 characters
          </span>
        </div>
        {textError && (
          <p
            id="questionText-error"
            role="alert"
            className="text-sm text-red-600"
          >
            {textError}
          </p>
        )}
      </div>

      {/* Author field */}
      <div className="flex flex-col gap-1">
        <label htmlFor="author" className="text-sm font-medium text-gray-700">
          Your name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          id="author"
          name="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={100}
          disabled={isSubmitting}
          placeholder="Anonymous"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submission error */}
      {submissionState === "error" && submissionError && (
        <p role="alert" className="text-sm text-red-600">
          {submissionError}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting ? "true" : undefined}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            {/* Loading spinner */}
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Submitting…
          </>
        ) : (
          "Submit Question"
        )}
      </button>
    </form>
  );
}

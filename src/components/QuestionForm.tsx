"use client";

import { useState } from "react";
import { Question } from "@/types/question";
import { validateQuestionText, validateLecturer, validateLecture } from "@/lib/validation";
import { LECTURERS, getLecturesForLecturer } from "@/lib/lecturers";
import AnimatedSelect from "@/components/AnimatedSelect";

export interface QuestionFormProps {
  onSubmitted: (question: Question) => void;
}

type SubmissionState = "idle" | "submitting" | "success" | "error";

export default function QuestionForm({ onSubmitted }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState("");
  const [author, setAuthor] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [lecture, setLecture] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [textError, setTextError] = useState<string | null>(null);
  const [lecturerError, setLecturerError] = useState<string | null>(null);
  const [lectureError, setLectureError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const isSubmitting = submissionState === "submitting";
  const availableLectures = getLecturesForLecturer(lecturer);

  function handleLecturerChange(value: string) {
    setLecturer(value);
    setLecture("");
    if (lecturerError) setLecturerError(null);
    if (lectureError) setLectureError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTextError(null);
    setLecturerError(null);
    setLectureError(null);
    setSubmissionError(null);

    const textValidation = validateQuestionText(questionText);
    if (!textValidation.isValid) setTextError(textValidation.error ?? "Invalid question.");

    const lecturerValidation = validateLecturer(lecturer);
    if (!lecturerValidation.isValid) setLecturerError(lecturerValidation.error ?? "Select a lecturer.");

    const lectureValidation = validateLecture(lecturer, lecture);
    if (!lectureValidation.isValid) setLectureError(lectureValidation.error ?? "Select a lecture.");

    if (!textValidation.isValid || !lecturerValidation.isValid || !lectureValidation.isValid) return;

    setSubmissionState("submitting");

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: questionText,
          author: author.trim() || null,
          lecturer,
          lecture,
        }),
      });

      if (response.status === 201) {
        const newQuestion: Question = await response.json();
        setQuestionText("");
        setLecturer("");
        setLecture("");
        onSubmitted(newQuestion);
        setSubmissionState("idle");
      } else {
        let errorMessage = "Submission failed. Please try again.";
        if (response.status === 429) {
          try {
            const body = await response.json();
            errorMessage = body?.error ?? "Too many submissions. Please wait before trying again.";
          } catch { errorMessage = "Too many submissions. Please wait before trying again."; }
        } else if (response.status === 503) {
          errorMessage = "Service temporarily unavailable.";
        } else {
          try {
            const body = await response.json();
            if (body?.error) errorMessage = body.error;
          } catch { /* use fallback */ }
        }
        setSubmissionError(errorMessage);
        setSubmissionState("error");
      }
    } catch {
      setSubmissionError("Submission failed. Check your connection and try again.");
      setSubmissionState("error");
    }
  }

  const inputBase =
    "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-shadow focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 sm:p-6">
      {/* Form header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">Ask a question</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Select the lecturer and topic, then type your question.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Cascading dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lecturer */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lecturer" className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Lecturer <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <AnimatedSelect
              id="lecturer"
              aria-label="Lecturer"
              value={lecturer}
              onChange={handleLecturerChange}
              options={LECTURERS.map((l) => ({ value: l.name, label: l.name }))}
              placeholder="Select lecturer"
              disabled={isSubmitting}
              aria-describedby={lecturerError ? "lecturer-error" : undefined}
              aria-invalid={lecturerError ? "true" : undefined}
            />
            {lecturerError && (
              <p id="lecturer-error" role="alert" className="text-xs text-red-500">{lecturerError}</p>
            )}
          </div>

          {/* Lecture */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lecture" className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Topic <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <AnimatedSelect
              id="lecture"
              aria-label="Lecture topic"
              value={lecture}
              onChange={(v) => { setLecture(v); if (lectureError) setLectureError(null); }}
              options={availableLectures.map((lec) => ({ value: lec, label: lec }))}
              placeholder={lecturer ? "Select topic" : "Select lecturer first"}
              disabled={isSubmitting || !lecturer}
              aria-describedby={lectureError ? "lecture-error" : undefined}
              aria-invalid={lectureError ? "true" : undefined}
            />
            {lectureError && (
              <p id="lecture-error" role="alert" className="text-xs text-red-500">{lectureError}</p>
            )}
          </div>
        </div>

        {/* Question textarea */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="questionText" className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Your question <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => { setQuestionText(e.target.value); if (textError) setTextError(null); }}
            maxLength={500}
            rows={4}
            disabled={isSubmitting}
            placeholder="What would you like to ask?"
            aria-describedby={textError ? "questionText-error" : "char-count"}
            aria-invalid={textError ? "true" : undefined}
            className={`${inputBase} resize-none`}
          />
          <div className="flex items-center justify-between">
            <span id="char-count" className="text-xs text-zinc-400" aria-live="polite">
              {questionText.length}/500
            </span>
            {textError && (
              <p id="questionText-error" role="alert" className="text-xs text-red-500">{textError}</p>
            )}
          </div>
        </div>

        {/* Author input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author" className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Your name <span className="text-zinc-300 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
            placeholder="Anonymous"
            className={inputBase}
          />
        </div>

        {/* Submission error */}
        {submissionState === "error" && submissionError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submissionError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting ? "true" : undefined}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </>
          ) : (
            "Submit question"
          )}
        </button>
      </form>
    </div>
  );
}

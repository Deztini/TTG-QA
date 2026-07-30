import { Question } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  error: string | null;
  hasPriorData: boolean;
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading questions" className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 w-full animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function QuestionList({
  questions,
  loading,
  error,
  hasPriorData,
}: QuestionListProps) {
  // State 1: Initial load — show skeleton, no prior data
  if (loading && !hasPriorData) {
    return <LoadingSkeleton />;
  }

  // State 2: Error with no prior data — full-page error
  if (error && !hasPriorData) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <svg
          className="w-12 h-12 text-red-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <p className="text-red-600 font-semibold text-lg mb-1">
          Unable to load questions
        </p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* State 3: Error with prior data — non-blocking banner at top */}
      {error && hasPriorData && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 text-sm"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* State 4: Empty state */}
      {!loading && !error && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-base">
            No questions yet. Be the first to ask!
          </p>
        </div>
      )}

      {/* State 5: Question list */}
      {questions.length > 0 && (
        <ul className="space-y-4 list-none p-0 m-0">
          {questions.map((question) => (
            <li key={question.id}>
              <QuestionCard question={question} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

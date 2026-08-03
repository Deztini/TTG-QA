import { Question } from "@/types/question";
import QuestionGroup from "@/components/QuestionGroup";

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  error: string | null;
  hasPriorData: boolean;
}

// ── Grouping helpers ────────────────────────────────────────────────────────

interface LectureGroup {
  lecture: string;
  lecturer: string;
  questions: Question[]; // newest-first (inherited from API sort)
}

/**
 * Groups a flat, newest-first question array by lecture topic.
 * Groups are sorted by the timestamp of their most recent question so the
 * most active topic always appears first.
 */
function groupByLecture(questions: Question[]): LectureGroup[] {
  const map = new Map<string, LectureGroup>();

  for (const q of questions) {
    if (!map.has(q.lecture)) {
      map.set(q.lecture, { lecture: q.lecture, lecturer: q.lecturer, questions: [] });
    }
    map.get(q.lecture)!.questions.push(q);
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.questions[0]?.timestamp ?? 0).getTime();
    const bTime = new Date(b.questions[0]?.timestamp ?? 0).getTime();
    return bTime - aTime;
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

// ── Main component ──────────────────────────────────────────────────────────

export default function QuestionList({
  questions,
  loading,
  error,
  hasPriorData,
}: QuestionListProps) {
  // State 1: Initial load — skeleton, no prior data yet
  if (loading && !hasPriorData) {
    return <LoadingSkeleton />;
  }

  // State 2: Hard error with no prior data — full-page error
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

  const groups = groupByLecture(questions);

  return (
    <div className="w-full space-y-3">
      {/* State 3: Non-blocking error banner with prior data */}
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

      {/* State 5: Grouped question list */}
      {groups.length > 0 && (
        <ul className="space-y-3 list-none p-0 m-0">
          {groups.map((group, index) => (
            <li key={group.lecture}>
              <QuestionGroup
                lecture={group.lecture}
                lecturer={group.lecturer}
                questions={group.questions}
                defaultExpanded={index === 0} // auto-expand the most active topic
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

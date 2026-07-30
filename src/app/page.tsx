"use client";

import { useState, useCallback } from "react";
import type { Question } from "@/types/question";
import { usePoller } from "@/hooks/usePoller";
import { mergeQuestions } from "@/lib/mergeQuestions";
import QuestionForm from "@/components/QuestionForm";
import QuestionList from "@/components/QuestionList";
import FilterBar from "@/components/FilterBar";

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasPriorData, setHasPriorData] = useState(false);
  const [pollerStopped, setPollerStopped] = useState(false);
  const [connectivityBanner, setConnectivityBanner] = useState<string | null>(null);

  // Filter state
  const [filterLecturer, setFilterLecturer] = useState("");
  const [filterLecture, setFilterLecture] = useState("");

  const handleQuestions = useCallback((incoming: Question[]) => {
    setHasPriorData(true);
    setLoadingInitial(false);
    setQuestions((prev) => mergeQuestions(prev, incoming));
    setConnectivityBanner(null);
    setFetchError(null);
  }, []);

  const handleError = useCallback(
    (err: string) => {
      setConnectivityBanner("Connection interrupted — retrying…");
      if (!hasPriorData) {
        setFetchError(err);
        setLoadingInitial(false);
      }
    },
    [hasPriorData]
  );

  const handleStopped = useCallback(() => {
    setPollerStopped(true);
    setConnectivityBanner(null);
  }, []);

  const { restart } = usePoller({
    onQuestions: handleQuestions,
    onError: handleError,
    onStopped: handleStopped,
  });

  const handleSubmitted = useCallback((newQuestion: Question) => {
    setQuestions((prev) => [newQuestion, ...prev]);
  }, []);

  const handleRetry = useCallback(() => {
    setPollerStopped(false);
    setConnectivityBanner(null);
    restart();
  }, [restart]);

  const handleLecturerFilterChange = useCallback((lecturer: string) => {
    setFilterLecturer(lecturer);
    setFilterLecture(""); // reset lecture when lecturer changes
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilterLecturer("");
    setFilterLecture("");
  }, []);

  // Compute filtered questions — purely derived, no extra state
  const filteredQuestions = questions.filter((q) => {
    if (filterLecturer && q.lecturer !== filterLecturer) return false;
    if (filterLecture && q.lecture !== filterLecture) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Connectivity banner */}
      {connectivityBanner && !pollerStopped && (
        <div
          role="alert"
          aria-live="polite"
          className="sticky top-0 z-10 w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-800"
        >
          {connectivityBanner}
        </div>
      )}

      {/* Connection lost banner */}
      {pollerStopped && (
        <div
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-10 w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-sm text-red-800 flex items-center justify-center gap-3"
        >
          <span>Connection lost.</span>
          <button
            onClick={handleRetry}
            className="underline font-semibold hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">TTG QA</h1>

        <section className="mb-8">
          <QuestionForm onSubmitted={handleSubmitted} />
        </section>

        <section>
          {/* Filter bar — only render once we have data */}
          {hasPriorData && (
            <div className="mb-4">
              <FilterBar
                selectedLecturer={filterLecturer}
                selectedLecture={filterLecture}
                totalCount={questions.length}
                filteredCount={filteredQuestions.length}
                onLecturerChange={handleLecturerFilterChange}
                onLectureChange={setFilterLecture}
                onClear={handleClearFilter}
              />
            </div>
          )}

          <QuestionList
            questions={filteredQuestions}
            loading={loadingInitial}
            error={fetchError}
            hasPriorData={hasPriorData}
          />
        </section>
      </div>
    </main>
  );
}

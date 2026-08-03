"use client";

import { useState, useCallback } from "react";
import type { Question } from "@/types/question";
import { usePoller } from "@/hooks/usePoller";
import { mergeQuestions } from "@/lib/mergeQuestions";
import QuestionForm from "@/components/QuestionForm";
import QuestionList from "@/components/QuestionList";

export default function Page() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasPriorData, setHasPriorData] = useState(false);
  const [pollerStopped, setPollerStopped] = useState(false);
  const [connectivityBanner, setConnectivityBanner] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Connectivity banner ── */}
      {connectivityBanner && !pollerStopped && (
        <div
          role="alert"
          aria-live="polite"
          className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-700 font-medium"
        >
          {connectivityBanner}
        </div>
      )}

      {/* ── Connection lost banner ── */}
      {pollerStopped && (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-sm text-red-700 flex items-center justify-center gap-3"
        >
          <span className="font-medium">Connection lost.</span>
          <button
            onClick={handleRetry}
            className="underline font-semibold hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Retry
          </button>
        </div>
      )}

      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">TTG QA</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Real-time question &amp; answer</p>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6" id="main-content">
        {/* Question form */}
        <QuestionForm onSubmitted={handleSubmitted} />

        {/* Question list */}
        <QuestionList
          questions={questions}
          loading={loadingInitial}
          error={fetchError}
          hasPriorData={hasPriorData}
        />
      </main>
    </div>
  );
}

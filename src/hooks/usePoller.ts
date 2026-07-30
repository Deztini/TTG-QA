"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Question } from "@/types/question";

interface UsePollerOptions {
  onQuestions: (questions: Question[]) => void;
  onError: (err: string) => void;
  onStopped: () => void;
  intervalMs?: number;
  maxConsecutiveFailures?: number;
}

interface UsePollerResult {
  stopped: boolean;
  restart: () => void;
}

export function usePoller({
  onQuestions,
  onError,
  onStopped,
  intervalMs = 5000,
  maxConsecutiveFailures = 6,
}: UsePollerOptions): UsePollerResult {
  const [stopped, setStopped] = useState(false);

  // Capture callbacks in refs so the poll function never goes stale
  const onQuestionsRef = useRef(onQuestions);
  const onErrorRef = useRef(onError);
  const onStoppedRef = useRef(onStopped);

  useEffect(() => { onQuestionsRef.current = onQuestions; }, [onQuestions]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onStoppedRef.current = onStopped; }, [onStopped]);

  // Mutable runtime state kept in refs so closure always reads current values
  const consecutiveFailuresRef = useRef(0);
  const stoppedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store stable refs for intervalMs and maxConsecutiveFailures so the poll
  // closure picks up the latest values without needing to be recreated
  const intervalMsRef = useRef(intervalMs);
  const maxConsecutiveFailuresRef = useRef(maxConsecutiveFailures);
  useEffect(() => { intervalMsRef.current = intervalMs; }, [intervalMs]);
  useEffect(() => { maxConsecutiveFailuresRef.current = maxConsecutiveFailures; }, [maxConsecutiveFailures]);

  // pollRef breaks the circular dependency between poll and scheduleNext
  const pollRef = useRef<() => Promise<void>>(async () => { /* replaced below */ });

  const scheduleNext = useCallback(() => {
    if (stoppedRef.current) return;
    timeoutRef.current = setTimeout(() => pollRef.current(), intervalMsRef.current);
  }, []); // stable — reads everything through refs

  const poll = useCallback(async () => {
    if (stoppedRef.current) return;

    try {
      const res = await fetch("/api/questions");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const questions: Question[] = await res.json();

      consecutiveFailuresRef.current = 0;
      onQuestionsRef.current(questions);
      scheduleNext();
    } catch (err) {
      consecutiveFailuresRef.current += 1;
      const message = err instanceof Error ? err.message : "Polling error";
      onErrorRef.current(message);

      if (consecutiveFailuresRef.current >= maxConsecutiveFailuresRef.current) {
        stoppedRef.current = true;
        setStopped(true);
        onStoppedRef.current();
        // No scheduleNext — polling has halted
      } else {
        scheduleNext();
      }
    }
  }, [scheduleNext]);

  // Keep pollRef in sync with the latest poll function
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const restart = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    consecutiveFailuresRef.current = 0;
    stoppedRef.current = false;
    setStopped(false);
    pollRef.current();
  }, []); // stable — acts through refs

  // Start polling once on mount; clean up on unmount
  useEffect(() => {
    stoppedRef.current = false;
    consecutiveFailuresRef.current = 0;
    pollRef.current();

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { stopped, restart };
}

"use client";

import { useState } from "react";
import type { Question } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 5;

interface QuestionGroupProps {
  lecture: string;
  lecturer: string;
  questions: Question[];
  defaultExpanded?: boolean;
}

export default function QuestionGroup({
  lecture,
  lecturer,
  questions,
  defaultExpanded = false,
}: QuestionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visibleQuestions = questions.slice(0, visibleCount);
  const remaining = questions.length - visibleCount;
  const hasMore = remaining > 0;
  const nextBatch = Math.min(remaining, LOAD_MORE_STEP);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* ── Group header ── */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated chevron */}
          <svg
            className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 text-sm sm:text-[15px] truncate leading-snug">
              {lecture}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{lecturer}</p>
          </div>
        </div>

        {/* Count badge */}
        <span className={`
          flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none
          ${isExpanded
            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
          }
        `}>
          {questions.length}
        </span>
      </button>

      {/* ── Expanded content ── */}
      {isExpanded && (
        <div className="border-t border-zinc-100 px-4 py-4 sm:px-5 space-y-3">
          {visibleQuestions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}

          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
              className="w-full py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Show {nextBatch} more question{nextBatch !== 1 ? "s" : ""} ↓
            </button>
          )}
        </div>
      )}
    </div>
  );
}

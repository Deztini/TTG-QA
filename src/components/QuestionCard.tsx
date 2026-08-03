import { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const formattedTime = new Date(question.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(question.timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="card-hover bg-white rounded-xl border border-zinc-200 p-4 w-full shadow-sm">
      {/* Topic badge */}
      <div className="mb-3">
        <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 leading-none">
          {question.lecture}
        </span>
      </div>

      {/* Question text */}
      <p className="text-zinc-900 text-[15px] leading-relaxed font-medium mb-4">
        {question.text}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar placeholder */}
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 text-[10px] font-bold uppercase">
              {(question.author ?? "A")[0]}
            </span>
          </div>
          <span className="text-sm font-medium text-zinc-700 truncate">
            {question.author ?? "Anonymous"}
          </span>
        </div>
        <time
          dateTime={question.timestamp}
          className="text-xs text-zinc-400 whitespace-nowrap flex-shrink-0"
        >
          {formattedDate} · {formattedTime}
        </time>
      </div>
    </article>
  );
}

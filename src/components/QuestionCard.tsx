import { Question } from "@/types/question";

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const formattedTimestamp = new Date(question.timestamp).toLocaleString();

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 w-full">
      <p className="text-gray-900 text-base sm:text-lg leading-relaxed mb-3">
        {question.text}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm text-gray-500">
        <span className="font-medium text-gray-600">
          {question.author ?? "Anonymous"}
        </span>
        <time dateTime={question.timestamp} className="text-gray-400">
          {formattedTimestamp}
        </time>
      </div>
    </article>
  );
}

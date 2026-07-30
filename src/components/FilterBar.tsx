"use client";

import { LECTURERS, getLecturesForLecturer } from "@/lib/lecturers";

interface FilterBarProps {
  selectedLecturer: string;
  selectedLecture: string;
  totalCount: number;
  filteredCount: number;
  onLecturerChange: (lecturer: string) => void;
  onLectureChange: (lecture: string) => void;
  onClear: () => void;
}

export default function FilterBar({
  selectedLecturer,
  selectedLecture,
  totalCount,
  filteredCount,
  onLecturerChange,
  onLectureChange,
  onClear,
}: FilterBarProps) {
  const availableLectures = getLecturesForLecturer(selectedLecturer);
  const isFiltering = selectedLecturer !== "" || selectedLecture !== "";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Filter questions</span>
        {isFiltering && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Lecturer filter */}
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="filter-lecturer" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Lecturer
          </label>
          <select
            id="filter-lecturer"
            value={selectedLecturer}
            onChange={(e) => onLecturerChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All lecturers</option>
            {LECTURERS.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lecture filter — only active when a lecturer is selected */}
        <div className="flex flex-col gap-1 flex-1">
          <label htmlFor="filter-lecture" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Lecture / Topic
          </label>
          <select
            id="filter-lecture"
            value={selectedLecture}
            onChange={(e) => onLectureChange(e.target.value)}
            disabled={!selectedLecturer}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {selectedLecturer ? "All topics" : "Select a lecturer first"}
            </option>
            {availableLectures.map((lec) => (
              <option key={lec} value={lec}>
                {lec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-400">
        {isFiltering ? (
          <>
            Showing{" "}
            <span className="font-semibold text-gray-600">{filteredCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-gray-600">{totalCount}</span>{" "}
            question{totalCount !== 1 ? "s" : ""}
          </>
        ) : (
          <>
            <span className="font-semibold text-gray-600">{totalCount}</span>{" "}
            question{totalCount !== 1 ? "s" : ""} total
          </>
        )}
      </p>
    </div>
  );
}

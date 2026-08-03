"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface AnimatedSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
}

export default function AnimatedSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  "aria-label": ariaLabel,
  "aria-describedby": describedby,
  "aria-invalid": invalid,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;

  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  // Sync focused index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ── */}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-describedby={describedby}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={[
          "w-full flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-sm text-left",
          "shadow-sm transition-all duration-150 focus:outline-none",
          isOpen
            ? "border-indigo-400 ring-2 ring-indigo-100"
            : invalid === "true"
            ? "border-red-300 hover:border-red-400 focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-100"
            : "border-zinc-300 hover:border-zinc-400 focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-100",
          disabled
            ? "bg-zinc-50 text-zinc-400 cursor-not-allowed"
            : "bg-white cursor-pointer",
        ].join(" ")}
      >
        <span className={selectedOption ? "text-zinc-900" : "text-zinc-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* Chevron — flips 180° on open */}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {/* 
        CSS-only animation: we always render the panel but toggle opacity/scale/translate.
        This keeps the DOM stable for screen readers while the visual transition plays.
      */}
      <div
        id={listboxId}
        role="listbox"
        aria-label={placeholder}
        aria-hidden={!isOpen}
        className={[
          "absolute z-50 mt-1.5 w-full rounded-xl border border-zinc-200 bg-white shadow-xl",
          "overflow-hidden origin-top",
          "transition-all duration-[160ms] ease-out",
          isOpen
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none",
        ].join(" ")}
      >
        <ul className="max-h-52 overflow-y-auto py-1.5">
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              onMouseEnter={() => setFocusedIndex(index)}
              className={[
                "flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm cursor-pointer",
                "transition-colors duration-100 select-none",
                index === focusedIndex
                  ? "bg-indigo-50 text-indigo-700"
                  : option.value === value
                  ? "bg-zinc-50 text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
            >
              <span>{option.label}</span>

              {/* Checkmark for selected item */}
              {option.value === value && (
                <svg
                  className="h-4 w-4 flex-shrink-0 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

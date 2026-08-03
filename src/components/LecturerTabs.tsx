"use client";

interface Tab {
  id: string;      // "" for All, lecturer name for others
  label: string;
  count: number;
}

interface LecturerTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function LecturerTabs({ tabs, activeTab, onChange }: LecturerTabsProps) {
  return (
    <div className="bg-transparent border-b border-zinc-200 sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-sm -mx-4 px-4 sm:mx-0 sm:px-0">
      <nav
        role="tablist"
        aria-label="Filter by lecturer"
        className="flex no-scrollbar overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            data-active={String(activeTab === tab.id)}
            className={`
              tab-item flex items-center gap-2 px-4 py-3 text-sm font-medium
              whitespace-nowrap border-b-2 focus:outline-none focus-visible:ring-2
              focus-visible:ring-inset focus-visible:ring-indigo-400 transition-colors
              ${activeTab === tab.id
                ? "text-indigo-600 border-indigo-600"
                : "text-zinc-500 border-transparent hover:text-zinc-800 hover:border-zinc-300"
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`
                  inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                  ${activeTab === tab.id
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-zinc-100 text-zinc-500"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

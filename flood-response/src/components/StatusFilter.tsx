import React from "react";
import type { Classification, Ticket } from "../types";
import { CLASSIFICATION_LABELS } from "../lib/classificationColors";

interface Props {
  activeStatus: Ticket["status"] | "all";
  activeClass: Classification | "all";
  onStatusChange: (s: Ticket["status"] | "all") => void;
  onClassChange: (c: Classification | "all") => void;
}

const STATUSES: Array<{ value: Ticket["status"] | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
];

const CLASSES: Array<{ value: Classification | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "medical", label: CLASSIFICATION_LABELS.medical },
  { value: "hazard", label: CLASSIFICATION_LABELS.hazard },
  { value: "food_water", label: CLASSIFICATION_LABELS.food_water },
  { value: "transportation", label: CLASSIFICATION_LABELS.transportation },
  { value: "other", label: CLASSIFICATION_LABELS.other },
];

export const StatusFilter: React.FC<Props> = ({
  activeStatus,
  activeClass,
  onStatusChange,
  onClassChange,
}) => {
  return (
    <div
      className="flex flex-wrap gap-3 rounded-xl bg-white/90 p-3 shadow-md backdrop-blur"
      role="group"
      aria-label="Filter tickets"
    >
      {/* Status filter */}
      <fieldset>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Status
        </legend>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onStatusChange(value)}
              aria-pressed={activeStatus === value}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeStatus === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Classification filter */}
      <fieldset>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Category
        </legend>
        <div className="flex flex-wrap gap-1">
          {CLASSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onClassChange(value)}
              aria-pressed={activeClass === value}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeClass === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

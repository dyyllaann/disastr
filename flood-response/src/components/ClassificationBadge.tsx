import React from "react";
import type { Classification } from "../types";
import {
  CLASSIFICATION_TAILWIND,
  CLASSIFICATION_LABELS,
} from "../lib/classificationColors";

interface Props {
  classification: Classification;
  size?: "sm" | "md";
}

export const ClassificationBadge: React.FC<Props> = ({
  classification,
  size = "md",
}) => {
  const base =
    "inline-flex items-center rounded-full border font-medium uppercase tracking-wide";
  const sizing = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`${base} ${sizing} ${CLASSIFICATION_TAILWIND[classification]}`}
      aria-label={`Classification: ${CLASSIFICATION_LABELS[classification]}`}
    >
      {CLASSIFICATION_LABELS[classification]}
    </span>
  );
};

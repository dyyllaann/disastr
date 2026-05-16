import type { Classification } from "../types";

export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  medical: "#ef4444",       // red-500
  hazard: "#f97316",        // orange-500
  food_water: "#3b82f6",    // blue-500
  transportation: "#a855f7", // purple-500
  other: "#6b7280",         // gray-500
};

export const CLASSIFICATION_TAILWIND: Record<Classification, string> = {
  medical: "bg-red-100 text-red-800 border-red-300",
  hazard: "bg-orange-100 text-orange-800 border-orange-300",
  food_water: "bg-blue-100 text-blue-800 border-blue-300",
  transportation: "bg-purple-100 text-purple-800 border-purple-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  medical: "Medical",
  hazard: "Hazard",
  food_water: "Food & Water",
  transportation: "Transportation",
  other: "Other",
};

export const STATUS_TAILWIND: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  resolved: "bg-gray-100 text-gray-600 border-gray-300",
};

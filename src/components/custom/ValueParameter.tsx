import { ValueParameter as APIValueParameter } from "@/types/type";
import React from "react";

interface ValueParameterProps {
  parameters: APIValueParameter[];
}

const paramMeta: Record<
  string,
  {
    label: string;
    description: string;
    suffix: string;
    benchmark: number;
    icon: string;
  }
> = {
  roi: {
    label: "ROI",
    description: "Return on Investment — your overall gain relative to capital deployed",
    suffix: "%",
    benchmark: 10,
    icon: "trending_up",
  },
  rentalyield: {
    label: "Rental Yield",
    description: "Annual income generated from credit leasing and yield farming",
    suffix: "%",
    benchmark: 4,
    icon: "payments",
  },
  appreciation: {
    label: "Appreciation",
    description: "Projected annual increase in credit value over time",
    suffix: "%",
    benchmark: 5,
    icon: "show_chart",
  },
};

function getPerformance(key: string, value: number) {
  const meta = paramMeta[key.toLowerCase()];
  if (!meta) return { color: "gray", label: "—" };
  const ratio = value / meta.benchmark;
  if (ratio >= 1.5) return { color: "emerald", label: "Excellent" };
  if (ratio >= 1.0) return { color: "emerald", label: "Above Average" };
  if (ratio >= 0.7) return { color: "amber", label: "Average" };
  return { color: "red", label: "Below Average" };
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; badgeText: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100",
    badgeText: "text-red-700",
  },
  gray: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
    badge: "bg-gray-100",
    badgeText: "text-gray-700",
  },
};

const ValueParameter: React.FC<ValueParameterProps> = ({ parameters }) => {
  if (!parameters || parameters.length === 0) return null;

  const entries = Object.entries(parameters[0]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {entries.map(([key, val], index) => {
        const numVal = typeof val === "number" ? val : parseFloat(String(val));
        const perf = getPerformance(key, numVal);
        const colors = colorMap[perf.color] || colorMap.gray;
        const meta = paramMeta[key.toLowerCase()];

        return (
          <div
            key={index}
            className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">
                {meta?.label || key.charAt(0).toUpperCase() + key.slice(1)}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge} ${colors.badgeText}`}
              >
                {perf.label}
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-1`}>
              {typeof val === "number" ? val : val}
              {meta?.suffix || ""}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {meta?.description || "Project performance metric"}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ValueParameter;

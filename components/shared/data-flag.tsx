import { AlertCircle, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataFlag, DataFlagType } from "@/lib/types";

interface DataFlagBadgeProps {
  flag: DataFlag;
  compact?: boolean;
}

const flagConfig: Record<
  DataFlagType,
  { icon: typeof AlertCircle; color: string; bgColor: string; borderColor: string; ringColor: string }
> = {
  missing: {
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200/80",
    ringColor: "ring-red-100",
  },
  incomplete: {
    icon: AlertTriangle,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200/80",
    ringColor: "ring-amber-100",
  },
  low_confidence: {
    icon: AlertCircle,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200/80",
    ringColor: "ring-amber-100",
  },
  contradictory: {
    icon: HelpCircle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200/80",
    ringColor: "ring-red-100",
  },
};

export function DataFlagBadge({ flag, compact = false }: DataFlagBadgeProps) {
  const config = flagConfig[flag.type];
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-1.5 transition-all duration-200 hover:ring-2",
          config.bgColor,
          config.borderColor,
          config.ringColor,
          "border shadow-sm"
        )}
        title={flag.message}
      >
        <Icon className={cn("h-3 w-3", config.color)} />
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-sm transition-all duration-200 hover:shadow-md",
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.color)} />
      <span className={cn("text-xs font-medium", config.color)}>
        {flag.message}
      </span>
    </div>
  );
}

interface DataFlagsListProps {
  flags: DataFlag[];
  compact?: boolean;
}

export function DataFlagsList({ flags, compact = false }: DataFlagsListProps) {
  if (flags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {flags.map((flag, index) => (
        <DataFlagBadge key={index} flag={flag} compact={compact} />
      ))}
    </div>
  );
}

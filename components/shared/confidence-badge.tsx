import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceBadge({
  confidence,
  showLabel = true,
  size = "md",
}: ConfidenceBadgeProps) {
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.5) return "medium";
    return "low";
  };

  const level = getConfidenceLevel();

  const colorClasses = {
    high: "bg-green-50 text-green-700 border-green-200/80 shadow-sm shadow-green-100",
    medium: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-sm shadow-amber-100",
    low: "bg-red-50 text-red-700 border-red-200/80 shadow-sm shadow-red-100",
  };

  const dotClasses = {
    high: "bg-green-500 ring-2 ring-green-200",
    medium: "bg-amber-500 ring-2 ring-amber-200",
    low: "bg-red-500 ring-2 ring-red-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border transition-all duration-200 hover:shadow-md",
        colorClasses[level],
        size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotClasses[level])} />
      {showLabel && (
        <span className="font-semibold">
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
}

interface ConfidenceMeterProps {
  confidence: number;
  className?: string;
}

export function ConfidenceMeter({ confidence, className }: ConfidenceMeterProps) {
  const getColor = () => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  const getBgColor = () => {
    if (confidence >= 0.8) return "bg-green-100";
    if (confidence >= 0.5) return "bg-amber-100";
    return "bg-red-100";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("h-2 flex-1 rounded-full overflow-hidden", getBgColor())}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", getColor())}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 tabular-nums min-w-[2.5rem] text-right">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  AlertCircle,
  Brain,
  Eye,
  Lightbulb,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveInsight } from "@/lib/types";

interface InsightsFeedProps {
  insights: LiveInsight[];
  onDismiss?: (insightId: string) => void;
}

const insightConfig = {
  observation: {
    icon: Eye,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  suggestion: {
    icon: Lightbulb,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  alert: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  context: {
    icon: Brain,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 min ago";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
}

export function InsightsFeed({ insights, onDismiss }: InsightsFeedProps) {
  const [localDismissedIds, setLocalDismissedIds] = useState<string[]>([]);
  
  const visibleInsights = insights.filter(
    (i) => !localDismissedIds.includes(i.id) && !i.dismissed
  );
  const highPriorityInsights = visibleInsights.filter((i) => i.priority === "high");
  const otherInsights = visibleInsights.filter((i) => i.priority !== "high");

  const handleDismiss = (id: string) => {
    // Update local state immediately for responsiveness
    setLocalDismissedIds((prev) => [...prev, id]);
    
    // Call parent handler to persist
    onDismiss?.(id);
  };

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Live Insights</h2>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {visibleInsights.length} active
        </span>
      </div>

      {/* Insights list */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {visibleInsights.length === 0 ? (
          <div className="p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No active insights</p>
            <p className="text-xs text-gray-400">AI agents are analyzing the conversation</p>
          </div>
        ) : (
          <>
            {/* High priority first */}
            {highPriorityInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={() => handleDismiss(insight.id)}
              />
            ))}
            {/* Then others */}
            {otherInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={() => handleDismiss(insight.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: LiveInsight;
  onDismiss: () => void;
}

function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const config = insightConfig[insight.type] || insightConfig.observation;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-4 transition-colors hover:bg-gray-50/50",
        insight.priority === "high" && "bg-red-50/30"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            config.bgColor
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium capitalize",
                  config.bgColor, config.color
                )}
              >
                {insight.type}
              </span>
              {insight.priority === "high" && (
                <span className="ml-2 text-xs font-medium text-red-600">
                  High Priority
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="h-3 w-3 text-gray-400" />
            </Button>
          </div>
          <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">
            {insight.content}
          </p>
          <span className="mt-2 inline-block text-xs text-gray-400">
            {formatRelativeTime(insight.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

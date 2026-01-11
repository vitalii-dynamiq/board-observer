"use client";

import { Check, Star, ThumbsDown, ThumbsUp, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConfirmedDecision } from "@/lib/types";

interface DecisionsListProps {
  decisions: ConfirmedDecision[];
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function DecisionsList({ decisions }: DecisionsListProps) {
  if (decisions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-8 text-center">
        <Star className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No decisions recorded</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Decisions Made</h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {decisions.length} total
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {decisions.map((decision, index) => (
          <DecisionCard key={decision.id} decision={decision} index={index + 1} />
        ))}
      </div>
    </div>
  );
}

interface DecisionCardProps {
  decision: ConfirmedDecision;
  index: number;
}

function DecisionCard({ decision, index }: DecisionCardProps) {
  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-medium text-blue-700">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{decision.description}</p>
          
          {decision.rationale && (
            <p className="mt-1 text-sm text-gray-500">
              <span className="font-medium">Rationale:</span> {decision.rationale}
            </p>
          )}

          <div className="mt-3 flex items-center gap-4">
            {decision.votingResult && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {decision.votingResult.for}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  {decision.votingResult.against}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MinusCircle className="h-3.5 w-3.5" />
                  {decision.votingResult.abstained}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-400">
              {formatDate(decision.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

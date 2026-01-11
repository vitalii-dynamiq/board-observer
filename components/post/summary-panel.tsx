"use client";

import { FileText, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MeetingSummary, DiscussionSummary } from "@/lib/types";

interface SummaryPanelProps {
  summary: MeetingSummary;
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  // Safety check for summary
  if (!summary) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Summary</h2>
        <p className="text-gray-500">No summary available yet.</p>
      </div>
    );
  }

  const keyDiscussions = summary.keyDiscussions || [];
  const nextSteps = summary.nextSteps || [];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Summary</h2>
        <p className="text-gray-700 leading-relaxed">{summary.overview}</p>
        
        {summary.attendanceNotes && (
          <p className="mt-4 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
            {summary.attendanceNotes}
          </p>
        )}
      </div>

      {/* Key Discussions */}
      {keyDiscussions.length > 0 && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-base font-semibold text-gray-900">Key Discussions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {keyDiscussions.map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Next Steps</h2>
          <ul className="space-y-2">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface DiscussionCardProps {
  discussion: DiscussionSummary;
}

function DiscussionCard({ discussion }: DiscussionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">{discussion.title}</h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{discussion.summary}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {discussion.duration}m
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4 animate-fade-in">
          {/* Key Points */}
          {discussion.keyPoints && discussion.keyPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Key Points
              </h4>
              <ul className="space-y-1">
                {discussion.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Outcome */}
          {discussion.outcome && (
            <div className="rounded-lg bg-green-50 border border-green-100 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-1">
                Outcome
              </h4>
              <p className="text-sm text-green-800">{discussion.outcome}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

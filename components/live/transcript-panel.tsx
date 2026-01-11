"use client";

import { useRef, useEffect } from "react";
import { Flag, MessageSquare, Target, AlertTriangle, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TranscriptEntry, TranscriptHighlight } from "@/lib/types";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  autoScroll?: boolean;
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    second: "2-digit",
  });
}

const highlightConfig: Record<TranscriptHighlight["type"], {
  icon: typeof Flag;
  color: string;
  bgColor: string;
}> = {
  action: { icon: Target, color: "text-green-600", bgColor: "bg-green-100" },
  decision: { icon: Star, color: "text-blue-600", bgColor: "bg-blue-100" },
  question: { icon: MessageSquare, color: "text-purple-600", bgColor: "bg-purple-100" },
  risk: { icon: AlertTriangle, color: "text-red-600", bgColor: "bg-red-100" },
  important: { icon: Flag, color: "text-amber-600", bgColor: "bg-amber-100" },
};

export function TranscriptPanel({ entries, autoScroll = true }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, autoScroll]);

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Live Transcript</h2>
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Recording
          </span>
        </div>
        <span className="text-xs text-gray-500">{entries.length} entries</span>
      </div>

      {/* Transcript entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No transcript yet</h3>
            <p className="text-xs text-gray-500 max-w-[200px]">
              Transcript will appear here once the AI bot joins and starts recording
            </p>
          </div>
        ) : (
          <>
            {entries.map((entry, index) => (
              <TranscriptEntryItem
                key={entry.id}
                entry={entry}
                isLatest={index === entries.length - 1}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}

interface TranscriptEntryItemProps {
  entry: TranscriptEntry;
  isLatest?: boolean;
}

function TranscriptEntryItem({ entry, isLatest = false }: TranscriptEntryItemProps) {
  const speakerName = entry.speakerName || 'Unknown';
  const initials = speakerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "group flex gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50",
        isLatest && "animate-fade-in bg-blue-50/30"
      )}
    >
      {/* Speaker avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {initials}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {speakerName}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(entry.timestamp)}
          </span>
          {entry.confidence < 0.9 && (
            <span className="text-xs text-amber-600">
              {Math.round(entry.confidence * 100)}% confidence
            </span>
          )}
        </div>
        
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">
          {entry.content}
        </p>

        {/* Highlights */}
        {entry.highlights && entry.highlights.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.highlights.map((highlight, idx) => {
              const config = highlightConfig[highlight.type];
              const Icon = config.icon;
              return (
                <span
                  key={idx}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                    config.bgColor, config.color
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {highlight.type}
                  {highlight.note && `: ${highlight.note}`}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon-sm" title="Flag this">
          <Flag className="h-3.5 w-3.5 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}

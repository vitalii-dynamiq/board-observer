"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgendaItem } from "@/lib/types";

interface AgendaPanelProps {
  items: AgendaItem[];
  onEdit?: (item: AgendaItem) => void;
  onDelete?: (itemId: string) => void;
}

export function AgendaPanel({ items, onEdit, onDelete }: AgendaPanelProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(
    items.filter((i) => i.aiAnalysis).map((i) => i.id).slice(0, 2)
  );

  const toggleItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-8 text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900">No agenda items</h3>
        <p className="text-sm text-gray-500 mt-1">Add items to build your meeting agenda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Agenda</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <AgendaItemCard
            key={item.id}
            item={item}
            index={index + 1}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={() => toggleItem(item.id)}
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onDelete={onDelete ? () => onDelete(item.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

interface AgendaItemCardProps {
  item: AgendaItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function AgendaItemCard({ item, index, isExpanded, onToggle, onEdit, onDelete }: AgendaItemCardProps) {
  const statusConfig = {
    pending: { color: "bg-gray-100 text-gray-600", label: "Pending" },
    "in-progress": { color: "bg-blue-100 text-blue-700", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-700", label: "Completed" },
    skipped: { color: "bg-gray-100 text-gray-500", label: "Skipped" },
  };

  const status = statusConfig[item.status] || statusConfig.pending;

  return (
    <div className="p-4 group">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-600">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={onToggle}
            className="w-full text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                {item.description && (
                  <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", status.color)}>
                  {status.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </button>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration} min
              </span>
              {item.presenter && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.presenter}
                </span>
              )}
              {item.documents && item.documents.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {item.documents.length} doc{item.documents.length > 1 ? "s" : ""}
                </span>
              )}
              {item.aiAnalysis && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Sparkles className="h-3 w-3" />
                  AI Analysis
                </span>
              )}
            </div>
            
            {/* Edit/Delete buttons */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && item.aiAnalysis && (
        <div className="mt-4 ml-10 space-y-4 animate-fade-in">
          {/* AI Summary */}
          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                AI Analysis
              </span>
              <span className="ml-auto text-xs text-blue-500">
                {Math.round(item.aiAnalysis.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {item.aiAnalysis.summary}
            </p>
          </div>

          {/* Key Points */}
          {item.aiAnalysis.keyPoints && item.aiAnalysis.keyPoints.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Key Points
              </h4>
              <ul className="space-y-1">
                {item.aiAnalysis.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks & Opportunities */}
          <div className="grid gap-4 sm:grid-cols-2">
            {item.aiAnalysis.risks && item.aiAnalysis.risks.length > 0 && (
              <div className="rounded-lg bg-red-50/50 border border-red-100 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">
                  Risks
                </h4>
                <ul className="space-y-1">
                  {item.aiAnalysis.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            {item.aiAnalysis.opportunities && item.aiAnalysis.opportunities.length > 0 && (
              <div className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
                  Opportunities
                </h4>
                <ul className="space-y-1">
                  {item.aiAnalysis.opportunities.map((opp, idx) => (
                    <li key={idx} className="text-sm text-green-700">• {opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {item.aiAnalysis.suggestedQuestions && item.aiAnalysis.suggestedQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Suggested Questions
              </h4>
              <div className="space-y-2">
                {item.aiAnalysis.suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Lightbulb className="h-3.5 w-3.5 mr-2 text-amber-500 flex-shrink-0" />
                    <span className="line-clamp-2">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {item.documents && item.documents.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Documents
              </h4>
              <div className="space-y-2">
                {item.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      {doc.summary && (
                        <p className="text-xs text-gray-500 line-clamp-1">{doc.summary}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 uppercase">{doc.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

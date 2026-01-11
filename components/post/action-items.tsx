"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/lib/types";

interface ActionItemsProps {
  items: ActionItem[];
  onDelete?: (actionId: string) => void;
  onUpdateStatus?: (actionId: string, status: string) => void;
}

type FilterType = "all" | "pending" | "in-progress" | "completed";

const priorityConfig = {
  high: { color: "text-red-600", bg: "bg-red-100", border: "border-l-red-500" },
  medium: { color: "text-amber-600", bg: "bg-amber-100", border: "border-l-amber-500" },
  low: { color: "text-gray-600", bg: "bg-gray-100", border: "border-l-gray-300" },
};

const statusConfig = {
  pending: { icon: Circle, color: "text-gray-400", label: "Pending" },
  "in-progress": { icon: Clock, color: "text-blue-600", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-green-600", label: "Completed" },
  overdue: { icon: Clock, color: "text-red-600", label: "Overdue" },
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActionItems({ items, onDelete, onUpdateStatus }: ActionItemsProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "overdue").length;
  const inProgressCount = items.filter((i) => i.status === "in-progress").length;
  const completedCount = items.filter((i) => i.status === "completed").length;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Action Items</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {completedCount}/{items.length} completed
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 flex items-center gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            count={items.length}
          >
            All
          </FilterButton>
          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            count={pendingCount}
          >
            Pending
          </FilterButton>
          <FilterButton
            active={filter === "in-progress"}
            onClick={() => setFilter("in-progress")}
            count={inProgressCount}
          >
            In Progress
          </FilterButton>
          <FilterButton
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
            count={completedCount}
          >
            Completed
          </FilterButton>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No action items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ActionItemCard 
              key={item.id} 
              item={item} 
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, count, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
    >
      {children}
      <span className="ml-1.5 opacity-70">{count}</span>
    </button>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  onDelete?: (actionId: string) => void;
  onUpdateStatus?: (actionId: string, status: string) => void;
}

function ActionItemCard({ item, onDelete, onUpdateStatus }: ActionItemCardProps) {
  const priority = priorityConfig[item.priority] || priorityConfig.medium;
  const status = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = item.status !== "completed" && dueDate && dueDate < new Date();

  const handleStatusClick = () => {
    if (!onUpdateStatus) return;
    
    // Cycle through statuses
    const nextStatus = {
      pending: "in-progress",
      "in-progress": "completed",
      completed: "pending",
      overdue: "in-progress",
    };
    
    onUpdateStatus(item.id, nextStatus[item.status] || "pending");
  };

  return (
    <div
      className={cn(
        "p-4 border-l-2 group",
        priority.border,
        item.status === "completed" && "opacity-60"
      )}
    >
      <div className="flex gap-3">
        <button 
          onClick={handleStatusClick}
          disabled={!onUpdateStatus}
          className={cn(
            "flex-shrink-0 mt-0.5",
            onUpdateStatus && "cursor-pointer hover:scale-110 transition-transform"
          )}
          title={onUpdateStatus ? "Click to change status" : undefined}
        >
          <StatusIcon
            className={cn(
              "h-5 w-5",
              isOverdue ? "text-red-500" : status.color
            )}
          />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium text-gray-900",
              item.status === "completed" && "line-through text-gray-500"
            )}
          >
            {item.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {item.assignee && (
              <span className="flex items-center gap-1 text-gray-500">
                <User className="h-3 w-3" />
                {item.assignee}
              </span>
            )}
            {dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                )}
              >
                <Calendar className="h-3 w-3" />
                {isOverdue && "Overdue: "}
                {formatDate(dueDate)}
              </span>
            )}
            <span className={cn("rounded-md px-1.5 py-0.5", priority.bg, priority.color)}>
              {item.priority}
            </span>
          </div>

          {item.notes && (
            <p className="mt-2 text-xs text-gray-500 italic">{item.notes}</p>
          )}
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

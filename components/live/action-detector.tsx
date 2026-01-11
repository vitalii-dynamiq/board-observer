"use client";

import { Check, X, Target, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DetectedAction, DetectedDecision } from "@/lib/types";

interface ActionDetectorProps {
  actions: DetectedAction[];
  decisions: DetectedDecision[];
  onConfirmAction?: (actionId: string, data?: any) => void;
  onRejectAction?: (actionId: string) => void;
  onConfirmDecision?: (decisionId: string, data?: any) => void;
  onRejectDecision?: (decisionId: string) => void;
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ActionDetector({ 
  actions, 
  decisions,
  onConfirmAction,
  onRejectAction,
  onConfirmDecision,
  onRejectDecision,
}: ActionDetectorProps) {
  const pendingActions = actions.filter((a) => a.status === "detected");
  const confirmedActions = actions.filter((a) => a.status === "confirmed");
  const pendingDecisions = decisions.filter((d) => d.status === "detected");
  const confirmedDecisions = decisions.filter((d) => d.status === "confirmed");

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Detected Items</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-600" />
              {actions.length} actions
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-blue-600" />
              {decisions.length} decisions
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {/* Pending items need attention */}
        {(pendingActions.length > 0 || pendingDecisions.length > 0) && (
          <div className="bg-amber-50/30">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
              Needs Confirmation
            </div>
            {pendingActions.map((action) => (
              <ActionItem 
                key={action.id} 
                action={action}
                onConfirm={onConfirmAction ? () => onConfirmAction(action.id) : undefined}
                onReject={onRejectAction ? () => onRejectAction(action.id) : undefined}
              />
            ))}
            {pendingDecisions.map((decision) => (
              <DecisionItem 
                key={decision.id} 
                decision={decision}
                onConfirm={onConfirmDecision ? () => onConfirmDecision(decision.id) : undefined}
                onReject={onRejectDecision ? () => onRejectDecision(decision.id) : undefined}
              />
            ))}
          </div>
        )}

        {/* Confirmed items */}
        {(confirmedActions.length > 0 || confirmedDecisions.length > 0) && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Confirmed
            </div>
            {confirmedActions.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
            {confirmedDecisions.map((decision) => (
              <DecisionItem key={decision.id} decision={decision} />
            ))}
          </div>
        )}

        {actions.length === 0 && decisions.length === 0 && (
          <div className="p-8 text-center">
            <Target className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No items detected yet</p>
            <p className="text-xs text-gray-400">Actions and decisions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionItemProps {
  action: DetectedAction;
  onConfirm?: () => void;
  onReject?: () => void;
}

function ActionItem({ action, onConfirm, onReject }: ActionItemProps) {
  const isPending = action.status === "detected";

  return (
    <div className={cn("p-4", isPending && "bg-white")}>
      <div className="flex gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
          <Target className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
              Action
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(action.timestamp)}
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(action.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-700">{action.description}</p>
          {action.assignee && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              {action.assignee}
            </p>
          )}
          
          {isPending && (onConfirm || onReject) && (
            <div className="mt-3 flex items-center gap-2">
              {onConfirm && (
                <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={onConfirm}>
                  <Check className="h-3 w-3" />
                  Confirm
                </Button>
              )}
              {onReject && (
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onReject}>
                  <X className="h-3 w-3" />
                  Reject
                </Button>
              )}
            </div>
          )}
          
          {!isPending && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Confirmed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DecisionItemProps {
  decision: DetectedDecision;
  onConfirm?: () => void;
  onReject?: () => void;
}

function DecisionItem({ decision, onConfirm, onReject }: DecisionItemProps) {
  const isPending = decision.status === "detected";

  return (
    <div className={cn("p-4", isPending && "bg-white")}>
      <div className="flex gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
          <Star className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
              Decision
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(decision.timestamp)}
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(decision.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-700">{decision.description}</p>
          
          {isPending && (onConfirm || onReject) && (
            <div className="mt-3 flex items-center gap-2">
              {onConfirm && (
                <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={onConfirm}>
                  <Check className="h-3 w-3" />
                  Confirm
                </Button>
              )}
              {onReject && (
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onReject}>
                  <X className="h-3 w-3" />
                  Reject
                </Button>
              )}
            </div>
          )}
          
          {!isPending && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600">
              <Check className="h-3 w-3" />
              Confirmed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

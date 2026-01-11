"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Brain,
  ChevronDown,
  ChevronRight,
  Mic,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIAgent, AgentType } from "@/lib/types";

interface AgentsPanelProps {
  agents: AIAgent[];
  expanded?: boolean;
}

const agentConfig: Record<AgentType, {
  icon: typeof Mic;
  color: string;
  bgColor: string;
  activeColor: string;
  description: string;
}> = {
  transcriber: {
    icon: Mic,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    activeColor: "bg-blue-500",
    description: "Converting speech to text in real-time",
  },
  analyst: {
    icon: Brain,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    activeColor: "bg-purple-500",
    description: "Analyzing topics and providing context",
  },
  tracker: {
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-50",
    activeColor: "bg-green-500",
    description: "Detecting actions and decisions",
  },
  advisor: {
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    activeColor: "bg-amber-500",
    description: "Generating suggestions and insights",
  },
};

const statusConfig = {
  active: { label: "Active", color: "text-green-600", dot: "bg-green-500" },
  processing: { label: "Processing", color: "text-blue-600", dot: "bg-blue-500 animate-pulse" },
  idle: { label: "Idle", color: "text-gray-500", dot: "bg-gray-400" },
  error: { label: "Error", color: "text-red-600", dot: "bg-red-500" },
};

export function AgentsPanel({ agents, expanded = true }: AgentsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const activeCount = agents.filter((a) => a.status === "active" || a.status === "processing").length;

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-gray-900">AI Agents</h2>
            <p className="text-xs text-gray-500">{activeCount} of {agents.length} active</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicators */}
          <div className="flex -space-x-1">
            {agents.map((agent) => {
              const config = agentConfig[agent.type];
              const status = statusConfig[agent.status];
              return (
                <div
                  key={agent.id}
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center ring-2 ring-white",
                    config.bgColor
                  )}
                  title={`${agent.name}: ${status.label}`}
                >
                  <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                </div>
              );
            })}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Agent grid */}
      {isExpanded && (
        <div className="p-4 animate-fade-in">
          {agents.length === 0 ? (
            <div className="text-center py-6">
              <Zap className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No agents active</p>
              <p className="text-xs text-gray-400">AI agents will appear when recording starts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AgentCardProps {
  agent: AIAgent;
}

function AgentCard({ agent }: AgentCardProps) {
  const config = agentConfig[agent.type];
  const status = statusConfig[agent.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        agent.status === "active" || agent.status === "processing"
          ? "border-gray-200 bg-white shadow-sm"
          : "border-gray-100 bg-gray-50/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            config.bgColor
          )}
        >
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{agent.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} />
              <span className={cn("text-xs font-medium", status.color)}>
                {status.label}
              </span>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
            {config.description}
          </p>
          {agent.metrics && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {agent.metrics.itemsProcessed} processed
              </span>
              {agent.metrics.accuracy && (
                <span>{Math.round(agent.metrics.accuracy * 100)}% accuracy</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebar
export function AgentsStatusBar({ agents }: { agents: AIAgent[] }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
      <Zap className="h-4 w-4 text-gray-600" />
      <span className="text-xs font-medium text-gray-600">Agents</span>
      <div className="flex -space-x-1 ml-auto">
        {agents.map((agent) => {
          const config = agentConfig[agent.type];
          const status = statusConfig[agent.status];
          return (
            <div
              key={agent.id}
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-gray-100",
                agent.status === "active" || agent.status === "processing"
                  ? config.activeColor
                  : "bg-gray-300"
              )}
              title={`${agent.name}: ${status.label}`}
            >
              <config.icon className="h-2.5 w-2.5 text-white" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

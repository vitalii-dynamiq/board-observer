"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ChevronRight,
  Clock,
  Radio,
  Search,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/lib/types";

interface MeetingSidebarProps {
  meetings: Meeting[];
  isOpen?: boolean;
  onClose?: () => void;
}

function formatMeetingDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const phaseConfig = {
  live: {
    label: "Live Now",
    icon: Radio,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  upcoming: {
    label: "Upcoming",
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  completed: {
    label: "Past",
    icon: CheckCircle2,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

export function MeetingSidebar({ meetings, isOpen = true, onClose }: MeetingSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  // Group meetings by phase
  const liveMeetings = meetings.filter((m) => m.phase === "live");
  const upcomingMeetings = meetings.filter((m) => m.phase === "upcoming");
  const completedMeetings = meetings.filter((m) => m.phase === "completed");

  const filteredMeetings = searchQuery
    ? meetings.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 border-r border-gray-200/80 bg-white/95 backdrop-blur-sm transition-transform duration-300 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Meetings</h2>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Meeting list */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {filteredMeetings ? (
            // Search results
            <div className="space-y-2">
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} isActive={pathname.includes(meeting.id)} />
              ))}
              {filteredMeetings.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-8">
                  No meetings found
                </p>
              )}
            </div>
          ) : (
            // Grouped by phase
            <div className="space-y-6">
              {/* Live meetings */}
              {liveMeetings.length > 0 && (
                <MeetingGroup
                  title="Live Now"
                  meetings={liveMeetings}
                  phase="live"
                  pathname={pathname}
                />
              )}

              {/* Upcoming meetings */}
              {upcomingMeetings.length > 0 && (
                <MeetingGroup
                  title="Upcoming"
                  meetings={upcomingMeetings}
                  phase="upcoming"
                  pathname={pathname}
                />
              )}

              {/* Completed meetings */}
              {completedMeetings.length > 0 && (
                <MeetingGroup
                  title="Past Meetings"
                  meetings={completedMeetings}
                  phase="completed"
                  pathname={pathname}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            View Calendar
          </Link>
        </div>
      </div>
    </aside>
  );
}

interface MeetingGroupProps {
  title: string;
  meetings: Meeting[];
  phase: Meeting["phase"];
  pathname: string;
}

function MeetingGroup({ title, meetings, phase, pathname }: MeetingGroupProps) {
  const config = phaseConfig[phase];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <config.icon className={cn("h-4 w-4", config.color)} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {meetings.length}
        </span>
      </div>
      <div className="space-y-2">
        {meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            isActive={pathname.includes(meeting.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  isActive: boolean;
}

function MeetingCard({ meeting, isActive }: MeetingCardProps) {
  const config = phaseConfig[meeting.phase];

  return (
    <Link
      href={meeting.phase === "live" ? `/${meeting.id}/live` : `/${meeting.id}`}
      className={cn(
        "group block rounded-xl border p-3 transition-all duration-200",
        isActive
          ? "border-gray-900 bg-gray-900 text-white shadow-md"
          : cn(
              "border-gray-200/80 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
              meeting.phase === "live" && "border-green-200 bg-green-50/50"
            )
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isActive ? "text-white" : "text-gray-900"
            )}
          >
            {meeting.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {meeting.phase === "live" ? (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isActive ? "text-green-300" : "text-green-600"
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            ) : (
              <span className={isActive ? "text-gray-300" : "text-gray-500"}>
                {formatMeetingDate(meeting.scheduledStart)}
              </span>
            )}
            <span className={isActive ? "text-gray-400" : "text-gray-400"}>•</span>
            <span className={isActive ? "text-gray-300" : "text-gray-500"} suppressHydrationWarning>
              {formatTime(meeting.scheduledStart)}
            </span>
          </div>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5",
            isActive ? "text-gray-400" : "text-gray-400"
          )}
        />
      </div>
      {meeting.phase === "live" && meeting.recording?.isRecording && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs",
            isActive ? "text-red-300" : "text-red-600"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Recording • {meeting.recording.duration}m
        </div>
      )}
    </Link>
  );
}

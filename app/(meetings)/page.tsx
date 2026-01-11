'use client';

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Radio,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { MeetingForm } from "@/components/forms/meeting-form";
import { cn } from "@/lib/utils";
import { useMeetings } from "@/lib/hooks/use-meetings";
import type { Meeting } from "@/lib/types";

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours * 60)}m`;
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

const typeLabels: Record<Meeting["type"], string> = {
  board: "Board Meeting",
  committee: "Committee",
  review: "Review",
  strategy: "Strategy Session",
  operations: "Operations",
};

export default function MeetingsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { meetings, isLoading, isError, mutate } = useMeetings();

  const liveMeetings = meetings.filter((m) => m.phase === "live");
  const upcomingMeetings = meetings.filter((m) => m.phase === "upcoming");
  const completedMeetings = meetings.filter((m) => m.phase === "completed");

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    mutate();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Meetings"
        description="Prepare, participate, and follow up on board meetings"
        actions={
          <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        }
      />

      {/* Loading skeleton */}
      {isLoading && !meetings.length && (
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-gray-200" />
            <div className="h-5 w-24 rounded bg-gray-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 rounded bg-gray-200" />
                  <div className="h-5 w-16 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-3/4 rounded bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backend connection indicator */}
      {isError && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Unable to connect to backend.</span> Start the backend server with{" "}
            <code className="rounded bg-yellow-100 px-1.5 py-0.5 font-mono text-xs">
              cd backend && npm run dev
            </code>{" "}
            to enable full functionality.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Live Meetings - Priority display */}
        {liveMeetings.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Live Now</h2>
            </div>
            <div className="grid gap-4">
              {liveMeetings.map((meeting) => (
                <LiveMeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {upcomingMeetings.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMeetings.map((meeting, index) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Meetings */}
        {completedMeetings.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Past Meetings</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {completedMeetings.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedMeetings.map((meeting, index) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  compact
                  style={{ animationDelay: `${250 + index * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && meetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No meetings</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by scheduling a new meeting.</p>
            <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        )}
      </div>

      {/* Create meeting modal */}
      {showCreateForm && (
        <MeetingForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </PageContainer>
  );
}

function LiveMeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link
      href={`/${meeting.id}/live`}
      className="group relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-white p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* Live indicator */}
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
        </span>
        <span className="text-xs font-semibold text-green-700">Live</span>
        {meeting.recording?.isRecording && (
          <>
            <span className="h-1 w-1 rounded-full bg-green-400" />
            <span className="text-xs text-green-600">{meeting.recording.duration}m</span>
          </>
        )}
      </div>

      <div className="pr-24">
        <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 mb-2">
          {typeLabels[meeting.type]}
        </span>
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
          {meeting.title}
        </h3>
        
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            {meeting.isVirtual ? (
              <Video className="h-4 w-4 text-gray-400" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-400" />
            )}
            {meeting.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" />
            {meeting.attendees.filter(a => a.isPresent).length}/{meeting.attendees.length} present
          </span>
          <span className="flex items-center gap-1.5" suppressHydrationWarning>
            <Clock className="h-4 w-4 text-gray-400" />
            Started {formatTime(meeting.actualStart || meeting.scheduledStart)}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button className="gap-2">
            Join Meeting
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline">View Agenda</Button>
        </div>
      </div>
    </Link>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  compact?: boolean;
  style?: React.CSSProperties;
}

function MeetingCard({ meeting, compact = false, style }: MeetingCardProps) {
  const config = phaseConfig[meeting.phase];
  const href = meeting.phase === "completed" 
    ? `/${meeting.id}/summary` 
    : `/${meeting.id}/prepare`;

  return (
    <Link
      href={href}
      className="group animate-fade-in rounded-xl border border-gray-200/80 bg-white p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {typeLabels[meeting.type]}
            </span>
            {meeting.phase === "upcoming" && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                config.bgColor, config.color
              )}>
                <config.icon className="h-3 w-3" />
                {config.label}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 truncate">
            {meeting.title}
          </h3>
          
          {!compact && (
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {formatDate(meeting.scheduledStart)}
              </p>
              <p className="flex items-center gap-1.5" suppressHydrationWarning>
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
                <span className="text-gray-400">
                  ({formatDuration(meeting.scheduledStart, meeting.scheduledEnd)})
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                {meeting.isVirtual ? (
                  <Video className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                )}
                {meeting.location}
              </p>
            </div>
          )}

          {compact && (
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(meeting.scheduledStart)}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>

      {!compact && meeting.attendees && meeting.attendees.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-2">
            {meeting.attendees.slice(0, 4).map((attendee) => (
              <div
                key={attendee.id}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-xs font-medium text-gray-600"
                title={attendee.name}
              >
                {attendee.name.split(" ").map(n => n[0]).join("")}
              </div>
            ))}
            {meeting.attendees.length > 4 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-600">
                +{meeting.attendees.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {meeting.attendees.length} attendees
          </span>
        </div>
      )}
    </Link>
  );
}

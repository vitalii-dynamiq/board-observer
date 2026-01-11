"use client";

import { Check, X, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { removeAttendeeFromMeeting, updateAttendeeStatus } from "@/lib/api/meetings";
import type { Attendee } from "@/lib/types";

interface AttendeesPanelProps {
  attendees: Attendee[];
  isLive?: boolean;
  meetingId?: string;
  onUpdate?: () => void;
}

export function AttendeesPanel({ attendees, isLive = false, meetingId, onUpdate }: AttendeesPanelProps) {
  const present = attendees.filter((a) => a.isPresent);
  const absent = attendees.filter((a) => !a.isPresent);

  const handleRemove = async (attendeeId: string) => {
    if (!meetingId) return;
    if (!confirm('Remove this attendee from the meeting?')) return;
    
    try {
      await removeAttendeeFromMeeting(meetingId, attendeeId);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove attendee:', error);
    }
  };

  const handleTogglePresence = async (attendeeId: string, isPresent: boolean) => {
    if (!meetingId || !isLive) return;
    
    try {
      await updateAttendeeStatus(meetingId, attendeeId, { isPresent: !isPresent });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update attendee status:', error);
    }
  };

  if (attendees.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-card p-6 text-center">
        <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No attendees added yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Attendees</h2>
          {isLive && (
            <span className="text-sm text-gray-500">
              {present.length}/{attendees.length} present
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {attendees.map((attendee) => (
          <AttendeeItem
            key={attendee.id}
            attendee={attendee}
            showStatus={isLive}
            canRemove={!!meetingId && !isLive}
            canToggle={!!meetingId && isLive}
            onRemove={() => handleRemove(attendee.id)}
            onToggle={() => handleTogglePresence(attendee.id, attendee.isPresent ?? false)}
          />
        ))}
      </div>
    </div>
  );
}

interface AttendeeItemProps {
  attendee: Attendee;
  showStatus?: boolean;
  canRemove?: boolean;
  canToggle?: boolean;
  onRemove?: () => void;
  onToggle?: () => void;
}

function AttendeeItem({ attendee, showStatus = false, canRemove, canToggle, onRemove, onToggle }: AttendeeItemProps) {
  const initials = attendee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 p-4 group">
      <div className="relative">
        <button
          onClick={canToggle ? onToggle : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
            attendee.isPresent || !showStatus
              ? "bg-gray-100 text-gray-700"
              : "bg-gray-50 text-gray-400",
            canToggle && "cursor-pointer hover:ring-2 hover:ring-gray-200"
          )}
        >
          {initials}
        </button>
        {showStatus && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white",
              attendee.isPresent ? "bg-green-500" : "bg-gray-300"
            )}
          >
            {attendee.isPresent ? (
              <Check className="h-2.5 w-2.5 text-white" />
            ) : (
              <X className="h-2.5 w-2.5 text-white" />
            )}
          </span>
        )}
        {attendee.isSpeaking && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          attendee.isPresent || !showStatus ? "text-gray-900" : "text-gray-500"
        )}>
          {attendee.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {attendee.title || attendee.role}
          {(attendee.department || attendee.organization) && ` • ${attendee.department || attendee.organization}`}
        </p>
      </div>

      {attendee.isSpeaking && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          Speaking
        </span>
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

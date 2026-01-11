'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Play,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingPhases } from "@/components/meetings/meeting-phases";
import { AgendaPanel } from "@/components/prepare/agenda-panel";
import { PrepQuestions } from "@/components/prepare/prep-questions";
import { AttendeesPanel } from "@/components/prepare/attendees-panel";
import { MeetingForm } from "@/components/forms/meeting-form";
import { AgendaForm } from "@/components/forms/agenda-form";
import { AttendeeForm } from "@/components/forms/attendee-form";
import { useMeeting, useAttendees, useAgendaItems } from "@/lib/hooks/use-meetings";
import { startMeeting, deleteMeeting, addAttendeeToMeeting, deleteAgendaItem } from "@/lib/api/meetings";
import { getMeetingById, mockPrepQuestions } from "@/lib/mock-data";

interface PreparePageProps {
  params: { id: string };
}

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

export default function PreparePage({ params }: PreparePageProps) {
  const router = useRouter();
  const { meeting: apiMeeting, isLoading, isError, mutate: mutateMeeting } = useMeeting(params.id);
  const { attendees: allAttendees } = useAttendees();
  const { agendaItems: apiAgenda, mutate: mutateAgenda } = useAgendaItems(params.id);
  
  // Fallback to mock data if API fails
  const mockMeeting = getMeetingById(params.id);
  const meeting = apiMeeting || mockMeeting;
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [showAttendeeForm, setShowAttendeeForm] = useState(false);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use API agenda items if available, otherwise use meeting's agenda
  const agendaItems = apiAgenda.length > 0 || !isError ? apiAgenda : meeting?.agenda || [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    );
  }

  if (!meeting) {
    router.replace("/");
    return null;
  }

  const handleStartMeeting = async () => {
    setIsStarting(true);
    try {
      await startMeeting(params.id);
      router.push(`/${params.id}/live`);
    } catch (error) {
      // For mock data, just redirect
      router.push(`/${params.id}/live`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    setIsDeleting(true);
    try {
      await deleteMeeting(params.id);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddAttendee = async (attendee: any) => {
    try {
      await addAttendeeToMeeting(params.id, attendee.id);
      mutateMeeting();
    } catch (error) {
      console.error('Failed to add attendee:', error);
    }
    setShowAttendeeForm(false);
  };

  const handleEditAgenda = (item: any) => {
    setSelectedAgendaItem(item);
    setShowAgendaForm(true);
  };

  const handleDeleteAgenda = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return;
    
    try {
      await deleteAgendaItem(params.id, itemId);
      mutateAgenda();
    } catch (error) {
      console.error('Failed to delete agenda item:', error);
    }
  };

  const handleAgendaSuccess = () => {
    setShowAgendaForm(false);
    setSelectedAgendaItem(null);
    mutateAgenda();
  };

  const handleMeetingEditSuccess = () => {
    setShowEditForm(false);
    mutateMeeting();
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Top row - Back button and actions */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Meetings</span>
            </Link>
            
            {/* Phase tabs - hidden on mobile, shown inline on desktop */}
            <div className="hidden md:block">
              <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 sm:px-3"
                onClick={() => setShowEditForm(true)}
              >
                <Edit2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteMeeting}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {meeting.phase === "live" && (
                <Button asChild size="sm" className="h-8 px-2 sm:px-3">
                  <Link href={`/${params.id}/live`}>
                    <Play className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Join Meeting</span>
                  </Link>
                </Button>
              )}
              {meeting.phase === "upcoming" && (
                <Button onClick={handleStartMeeting} disabled={isStarting} size="sm" className="h-8 px-2 sm:px-3">
                  <Play className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden xs:inline">{isStarting ? 'Starting...' : 'Start'}</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile phase tabs */}
          <div className="md:hidden mb-3 -mx-1 overflow-x-auto scrollbar-hide">
            <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
          </div>

          {/* Meeting info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 sm:line-clamp-none">
                {meeting.title}
              </h1>
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <span className="hidden xs:inline">{formatDate(meeting.scheduledStart)}</span>
                  <span className="xs:hidden">{new Date(meeting.scheduledStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5" suppressHydrationWarning>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  {meeting.isVirtual ? (
                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  )}
                  <span className="truncate max-w-[150px] sm:max-w-none">{meeting.location}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content - Agenda */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Agenda</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAgendaItem(null);
                  setShowAgendaForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </Button>
            </div>
            <AgendaPanel 
              items={agendaItems} 
              onEdit={handleEditAgenda}
              onDelete={handleDeleteAgenda}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PrepQuestions questions={meeting.prepQuestions || mockPrepQuestions} />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Attendees</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttendeeForm(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <AttendeesPanel 
              attendees={meeting.attendees} 
              meetingId={params.id}
              onUpdate={() => mutateMeeting()}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditForm && (
        <MeetingForm
          meeting={meeting}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleMeetingEditSuccess}
        />
      )}

      {showAgendaForm && (
        <AgendaForm
          meetingId={params.id}
          item={selectedAgendaItem}
          onClose={() => {
            setShowAgendaForm(false);
            setSelectedAgendaItem(null);
          }}
          onSuccess={handleAgendaSuccess}
        />
      )}

      {showAttendeeForm && (
        <AttendeeForm
          onClose={() => setShowAttendeeForm(false)}
          onSuccess={handleAddAttendee}
        />
      )}
    </div>
  );
}

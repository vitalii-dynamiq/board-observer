'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingPhases } from "@/components/meetings/meeting-phases";
import { SummaryPanel } from "@/components/post/summary-panel";
import { DecisionsList } from "@/components/post/decisions-list";
import { ActionItems } from "@/components/post/action-items";
import { ReportGenerator } from "@/components/post/report-generator";
import { ActionForm } from "@/components/forms/action-form";
import { DecisionForm } from "@/components/forms/decision-form";
import { useMeeting, useActionItems, useDecisions, useMeetingSummary } from "@/lib/hooks/use-meetings";
import { generateMeetingSummary, deleteActionItem, updateActionItem, getMeetingRecording, refreshMeetingRecording } from "@/lib/api/meetings";

interface SummaryPageProps {
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

function formatDuration(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

interface RecordingInfo {
  recordingUrl: string | null;
  transcriptUrl: string | null;
  duration: number;
  status: string;
}

export default function SummaryPage({ params }: SummaryPageProps) {
  const router = useRouter();
  const { meeting, isLoading, isError } = useMeeting(params.id);
  const { actionItems, mutate: mutateActions } = useActionItems(params.id);
  const { decisions, mutate: mutateDecisions } = useDecisions(params.id);
  const { summary, mutate: mutateSummary } = useMeetingSummary(params.id);
  
  const [showActionForm, setShowActionForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [recording, setRecording] = useState<RecordingInfo | null>(null);
  const [isRefreshingRecording, setIsRefreshingRecording] = useState(false);

  // Fetch recording info
  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const recordingData = await getMeetingRecording(params.id);
        setRecording(recordingData);
      } catch (error) {
        // Recording may not exist, ignore error
      }
    };
    fetchRecording();
  }, [params.id]);

  const handleRefreshRecording = async () => {
    setIsRefreshingRecording(true);
    try {
      const recordingData = await refreshMeetingRecording(params.id);
      setRecording(recordingData);
    } catch (error) {
      console.error('Failed to refresh recording:', error);
    } finally {
      setIsRefreshingRecording(false);
    }
  };

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

  // Use actual times for completed meetings, scheduled times otherwise
  const startTime = meeting.actualStart || meeting.scheduledStart;
  const endTime = meeting.actualEnd || meeting.scheduledEnd;
  const duration = formatDuration(startTime, endTime);
  const attendeeCount = meeting.attendees?.length || 0;

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      await generateMeetingSummary(params.id);
      mutateSummary();
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleActionSuccess = () => {
    setShowActionForm(false);
    mutateActions();
  };

  const handleDecisionSuccess = () => {
    setShowDecisionForm(false);
    mutateDecisions();
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;
    
    try {
      await deleteActionItem(params.id, actionId);
      mutateActions();
    } catch (error) {
      console.error('Failed to delete action:', error);
    }
  };

  const handleUpdateActionStatus = async (actionId: string, status: string) => {
    try {
      await updateActionItem(params.id, actionId, { status: status as any });
      mutateActions();
    } catch (error) {
      console.error('Failed to update action:', error);
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Meetings</span>
            </Link>
            
            {/* Phase tabs - hidden on mobile */}
            <div className="hidden md:block">
              <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5 h-8 px-2 sm:px-3"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isGeneratingSummary ? 'Generating...' : 'Regenerate'}</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2 sm:px-3">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile phase tabs */}
          <div className="md:hidden mb-3 -mx-1 overflow-x-auto scrollbar-hide">
            <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
          </div>

          {/* Meeting info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Completed
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-gray-900 line-clamp-2 sm:line-clamp-none">
                {meeting.title}
              </h1>
              <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <span className="hidden xs:inline">{formatDate(startTime)}</span>
                  <span className="xs:hidden">{new Date(startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5" suppressHydrationWarning>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  {formatTime(startTime)} - {formatTime(endTime)}
                  <span className="hidden xs:inline">({duration})</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5 hidden sm:flex">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  {attendeeCount} attendees
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  {meeting.isVirtual ? (
                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-none">{meeting.location}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording Section */}
            {(recording?.recordingUrl || meeting?.recordingUrl) && (
              <div className="rounded-xl border border-gray-200/80 bg-white shadow-card overflow-hidden">
                <div className="border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Meeting Recording</h2>
                      <p className="text-xs text-gray-500">
                        {recording?.duration ? `${Math.round(recording.duration / 60)} minutes` : 'Recording available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshRecording}
                      disabled={isRefreshingRecording}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshingRecording ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Video Player */}
                  {(recording?.recordingUrl || meeting?.recordingUrl) && (
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                      <video 
                        controls 
                        className="w-full h-full"
                        src={recording?.recordingUrl || meeting?.recordingUrl || ''}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {/* Download Links */}
                  <div className="flex items-center gap-3 pt-2">
                    {(recording?.recordingUrl || meeting?.recordingUrl) && (
                      <a
                        href={recording?.recordingUrl || meeting?.recordingUrl || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download Video
                      </a>
                    )}
                    {(recording?.transcriptUrl || meeting?.transcriptUrl) && (
                      <a
                        href={recording?.transcriptUrl || meeting?.transcriptUrl || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Download Transcript
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <SummaryPanel summary={summary} />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Decisions</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDecisionForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Decision
              </Button>
            </div>
            <DecisionsList decisions={decisions} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ReportGenerator meetingId={params.id} meetingTitle={meeting.title} />
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Action Items</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActionForm(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ActionItems 
              items={actionItems} 
              onDelete={handleDeleteAction}
              onUpdateStatus={handleUpdateActionStatus}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showActionForm && (
        <ActionForm
          meetingId={params.id}
          attendees={meeting.attendees?.map(a => ({ id: a.id, name: a.name })) || []}
          onClose={() => setShowActionForm(false)}
          onSuccess={handleActionSuccess}
        />
      )}

      {showDecisionForm && (
        <DecisionForm
          meetingId={params.id}
          onClose={() => setShowDecisionForm(false)}
          onSuccess={handleDecisionSuccess}
        />
      )}
    </div>
  );
}

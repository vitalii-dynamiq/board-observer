'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Pause,
  Phone,
  Play,
  Radio,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingPhases } from "@/components/meetings/meeting-phases";
import { AgentsPanel } from "@/components/live/agents-panel";
import { TranscriptPanel } from "@/components/live/transcript-panel";
import { InsightsFeed } from "@/components/live/insights-feed";
import { ActionDetector } from "@/components/live/action-detector";
import { ChatAssistant } from "@/components/live/chat-assistant";
import { JoinBotDialog } from "@/components/live/join-bot-dialog";
import { AttendeesPanel } from "@/components/prepare/attendees-panel";
import { useMeeting } from "@/lib/hooks/use-meetings";
import { useLiveMeeting } from "@/lib/hooks/use-socket";
import { endMeeting, type BotStatus } from "@/lib/api/meetings";

interface LivePageProps {
  params: { id: string };
}

function formatDuration(startDate: Date | string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${minutes}m`;
}

export default function LivePage({ params }: LivePageProps) {
  const router = useRouter();
  const { meeting: apiMeeting, isLoading, isError, mutate } = useMeeting(params.id);
  
  // WebSocket connection for real-time updates
  // @AI-INTEGRATION-POINT: This connects to the WebSocket server for live AI updates
  const {
    isConnected,
    isRecording,
    agents,
    transcript: liveTranscript,
    insights: liveInsights,
    detectedActions: liveDetectedActions,
    detectedDecisions: liveDetectedDecisions,
    startRecording,
    stopRecording,
    confirmAction,
    dismissInsight,
  } = useLiveMeeting(params.id, true);

  const [isEnding, setIsEnding] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  
  // Use API data directly - no mock fallbacks
  const meeting = apiMeeting;

  // Duration calculation
  const [duration, setDuration] = useState("0m");
  useEffect(() => {
    if (!meeting) return;
    
    const updateDuration = () => {
      setDuration(formatDuration(meeting.actualStart || meeting.scheduledStart));
    };
    
    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [meeting]);

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

  const handleEndMeeting = async () => {
    if (!confirm('Are you sure you want to end this meeting?')) return;
    
    setIsEnding(true);
    try {
      await endMeeting(params.id);
      router.push(`/${params.id}/summary`);
    } catch (error) {
      // For mock data, just redirect
      router.push(`/${params.id}/summary`);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording || meeting.recording?.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const presentCount = meeting.attendees?.filter((a) => a.isPresent).length || 0;
  const recordingActive = isRecording || meeting.recording?.isRecording;
  const recordingDuration = meeting.recording?.duration || 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <div>
              <h1 className="text-base font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                {meeting.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {/* Live indicator */}
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Live
                </span>
                
                {/* WebSocket status */}
                {isConnected ? (
                  <span className="text-blue-600">Connected</span>
                ) : (
                  <span className="text-yellow-600">Connecting...</span>
                )}
                
                {/* Duration */}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </span>
                
                {/* Attendees */}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {presentCount}/{meeting.attendees?.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
            
            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* AI Bot Integration */}
            <JoinBotDialog
              meetingId={params.id}
              isVirtual={meeting.isVirtual}
              onBotStatusChange={setBotStatus}
            />

            <div className="h-6 w-px bg-gray-200 mx-2" />
            
            {/* Recording indicator */}
            {(recordingActive || botStatus?.status === 'in_meeting') && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-700">
                  {botStatus?.status === 'in_meeting' ? 'AI Active' : 'Recording'}
                </span>
                <span className="text-xs text-red-600">{recordingDuration}m</span>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={handleToggleRecording}
            >
              {recordingActive ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Record
                </>
              )}
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-1.5"
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              <Phone className="h-3.5 w-3.5" />
              {isEnding ? 'Ending...' : 'End'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content - 3 column layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          {/* Left column - Transcript */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-4 h-full overflow-hidden">
            <TranscriptPanel entries={liveTranscript} />
          </div>

          {/* Middle column - Chat + Insights */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <ChatAssistant meetingId={params.id} />
            </div>
            <div className="flex-shrink-0">
              <InsightsFeed 
                insights={liveInsights} 
                onDismiss={dismissInsight}
              />
            </div>
          </div>

          {/* Right column - Agents + Actions + Attendees */}
          <div className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-hide">
            <AgentsPanel agents={agents} />
            <ActionDetector 
              actions={liveDetectedActions} 
              decisions={liveDetectedDecisions}
              onConfirmAction={confirmAction}
            />
            <AttendeesPanel 
              attendees={meeting.attendees || []} 
              isLive 
              meetingId={params.id}
              onUpdate={() => mutate()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

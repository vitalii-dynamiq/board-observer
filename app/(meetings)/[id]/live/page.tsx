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
    <div className="flex min-h-0 h-full flex-col">
      {/* Header - Compact on mobile */}
      <div className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">
        {/* Top row - Title and exit */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </Link>
            
            <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden sm:block" />
            
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {meeting.title}
              </h1>
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap">
                {/* Live indicator */}
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-full w-full rounded-full bg-green-500" />
                  </span>
                  Live
                </span>
                
                {/* WebSocket status - Hidden on very small screens */}
                <span className="hidden xs:inline">
                  {isConnected ? (
                    <span className="text-blue-600">Connected</span>
                  ) : (
                    <span className="text-yellow-600">Connecting...</span>
                  )}
                </span>
                
                {/* Duration */}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </span>
                
                {/* Attendees - Hidden on mobile */}
                <span className="hidden sm:flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {presentCount}/{meeting.attendees?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Actions - Right side */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Phase tabs - Hidden on mobile */}
            <div className="hidden lg:block">
              <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
            </div>
            
            <div className="hidden lg:block h-6 w-px bg-gray-200 mx-1" />

            {/* AI Bot Integration */}
            <JoinBotDialog
              meetingId={params.id}
              isVirtual={meeting.isVirtual}
              onBotStatusChange={setBotStatus}
            />
            
            {/* Recording indicator - Compact on mobile */}
            {(recordingActive || botStatus?.status === 'in_meeting') && (
              <div className="flex items-center gap-1.5 rounded-md sm:rounded-lg bg-red-50 border border-red-200 px-2 sm:px-3 py-1 sm:py-1.5">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-700 hidden sm:inline">
                  {botStatus?.status === 'in_meeting' ? 'AI Active' : 'Recording'}
                </span>
                <span className="text-xs text-red-600">{recordingDuration}m</span>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3"
              onClick={handleToggleRecording}
            >
              {recordingActive ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Record</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3"
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isEnding ? 'Ending...' : 'End'}</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile phase tabs - Show below header on small screens */}
        <div className="lg:hidden mt-2 -mx-1 overflow-x-auto scrollbar-hide">
          <MeetingPhases meetingId={params.id} currentPhase={meeting.phase} />
        </div>
      </div>

      {/* Main content - Scrollable on mobile, grid on desktop */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="lg:h-full flex flex-col lg:grid lg:grid-cols-12 gap-4 p-3 sm:p-4">
          {/* Transcript Panel */}
          <div className="lg:col-span-5 xl:col-span-4 min-h-[300px] lg:min-h-0 lg:h-full lg:overflow-hidden order-1">
            <TranscriptPanel entries={liveTranscript} />
          </div>

          {/* Chat + Insights */}
          <div className="lg:col-span-4 xl:col-span-5 flex flex-col gap-4 min-h-[400px] lg:min-h-0 lg:h-full lg:overflow-hidden order-2">
            <div className="flex-1 min-h-[250px] lg:min-h-0">
              <ChatAssistant meetingId={params.id} />
            </div>
            <div className="flex-shrink-0">
              <InsightsFeed 
                insights={liveInsights} 
                onDismiss={dismissInsight}
              />
            </div>
          </div>

          {/* Agents + Actions + Attendees */}
          <div className="lg:col-span-3 space-y-4 lg:overflow-y-auto scrollbar-hide order-3">
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

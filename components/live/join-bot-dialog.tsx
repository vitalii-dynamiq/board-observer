'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Loader2,
  Video,
  Link2,
} from 'lucide-react';
import { joinMeetingBot, leaveMeetingBot, getBotStatus, type BotStatus } from '@/lib/api/meetings';

interface JoinBotDialogProps {
  meetingId: string;
  isVirtual?: boolean;
  onBotStatusChange?: (status: BotStatus | null) => void;
}

const PLATFORM_HINTS = [
  { name: 'Zoom', pattern: 'zoom.us', placeholder: 'https://zoom.us/j/1234567890' },
  { name: 'Google Meet', pattern: 'meet.google.com', placeholder: 'https://meet.google.com/abc-defg-hij' },
  { name: 'Microsoft Teams', pattern: 'teams.microsoft.com', placeholder: 'https://teams.microsoft.com/l/meetup-join/...' },
];

function detectPlatform(url: string): string | null {
  for (const platform of PLATFORM_HINTS) {
    if (url.includes(platform.pattern)) {
      return platform.name;
    }
  }
  return null;
}

export function JoinBotDialog({
  meetingId,
  isVirtual = false,
  onBotStatusChange,
}: JoinBotDialogProps) {
  const [open, setOpen] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [botName, setBotName] = useState('Board Observer AI');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const detectedPlatform = meetingUrl ? detectPlatform(meetingUrl) : null;

  // Auto-poll status when bot is joining or created
  useEffect(() => {
    // Only check status string to avoid infinite loop with object reference
    const shouldPoll = botStatus && 
      ['created', 'joining', 'waiting_room'].includes(botStatus.status);
    
    if (shouldPoll) {
      pollingRef.current = setInterval(async () => {
        try {
          const status = await getBotStatus(meetingId);
          if (status) {
            setBotStatus(status);
            onBotStatusChange?.(status);
            
            // Stop polling once in meeting or error
            if (['in_meeting', 'left', 'completed', 'error'].includes(status.status)) {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botStatus?.status, meetingId, onBotStatusChange]);

  const handleJoin = async () => {
    if (!meetingUrl.trim()) {
      setError('Please enter a meeting URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(meetingUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const status = await joinMeetingBot(meetingId, {
        meetingUrl: meetingUrl.trim(),
        botName: botName.trim() || 'Board Observer AI',
      });
      setBotStatus(status);
      onBotStatusChange?.(status);
    } catch (err: any) {
      setError(err.message || 'Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveMeetingBot(meetingId);
      setBotStatus(null);
      onBotStatusChange?.(null);
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to leave meeting');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      const status = await getBotStatus(meetingId);
      setBotStatus(status);
      onBotStatusChange?.(status);
    } catch {
      // Ignore
    }
  };

  // Check bot status when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setError(null);
      await handleRefreshStatus();
    }
  };

  const isInMeeting = botStatus?.status === 'in_meeting';
  const isJoiningStatus = botStatus?.status === 'joining' || botStatus?.status === 'waiting_room';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          {isInMeeting ? 'Bot Active' : 'Join Bot'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-gray-600" />
            AI Bot Integration
          </DialogTitle>
          <DialogDescription>
            {isInMeeting
              ? 'The AI bot is currently in the meeting, providing real-time transcription and insights.'
              : 'Send the AI bot to join your meeting for real-time transcription and intelligent assistance.'}
          </DialogDescription>
        </DialogHeader>

        {/* Bot Status */}
        {botStatus && (
          <div className={`rounded-lg border p-3 ${
            isInMeeting
              ? 'border-green-200 bg-green-50'
              : isJoiningStatus
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isInMeeting ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isJoiningStatus ? (
                  <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium">
                  {isInMeeting
                    ? 'Bot is active'
                    : isJoiningStatus
                    ? 'Bot is joining...'
                    : `Status: ${botStatus.status}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshStatus}
                className="text-xs h-7"
              >
                Refresh
              </Button>
            </div>

            {isInMeeting && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-green-700">
                  Transcription and AI insights are active. The bot will automatically
                  provide strategic recommendations during the meeting.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Join Form (only show if not in meeting) */}
        {!isInMeeting && !isJoiningStatus && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-url">Meeting URL</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="meeting-url"
                  placeholder="https://zoom.us/j/... or meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              {detectedPlatform && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Detected: {detectedPlatform}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Supports Zoom, Google Meet, and Microsoft Teams
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot-name">Bot Display Name (Optional)</Label>
              <Input
                id="bot-name"
                placeholder="Board Observer AI"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This name will appear in the meeting participant list
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isInMeeting || isJoiningStatus ? (
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
              className="w-full sm:w-auto"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                'Remove Bot from Meeting'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={isJoining || !meetingUrl.trim()}
              className="w-full sm:w-auto"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Bot...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Send Bot to Meeting
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

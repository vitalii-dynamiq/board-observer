// Meeting-centric type definitions for Board Observer

// ============================================
// Multi-Tenancy Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  _count?: {
    meetings: number;
    attendees: number;
  };
}

export interface OrganizationStats {
  totalMeetings: number;
  liveMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  totalAttendees: number;
}

// ============================================
// Meeting Types
// ============================================

export type MeetingPhase = "upcoming" | "live" | "completed";
export type MeetingType = "board" | "committee" | "review" | "strategy" | "operations";

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  phase: MeetingPhase;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;  // External meeting link (Zoom, Meet, Teams)
  organization?: Organization;
  organizationId?: string;
  attendees: Attendee[];
  agenda: AgendaItem[];
  prepQuestions?: PrepQuestion[];
  documents?: BriefingDocument[];
  recording?: {
    isRecording: boolean;
    duration: number;
  };
  recordingUrl?: string;
  transcriptUrl?: string;
  recordingDuration?: number;
}

export interface Attendee {
  id: string;
  name: string;
  title: string;       // Job title
  department?: string;
  role?: string;       // Deprecated, use title
  organization?: string; // Deprecated, use department
  avatar?: string;
  isPresent?: boolean;
  isSpeaking?: boolean;
  isExternal?: boolean;
}

// ============================================
// Pre-Meeting (Prepare) Types
// ============================================

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description?: string;
  duration: number; // minutes
  presenter?: string;
  documents?: BriefingDocument[];
  aiAnalysis?: AIAnalysis;
  status: "pending" | "in-progress" | "completed" | "skipped";
}

export interface BriefingDocument {
  id: string;
  title: string;
  type: "pdf" | "doc" | "spreadsheet" | "presentation" | "link";
  url: string;
  uploadedAt: Date;
  summary?: string;
}

export interface AIAnalysis {
  id: string;
  summary: string;
  keyPoints: string[];
  risks?: string[];
  opportunities?: string[];
  suggestedQuestions: string[];
  relatedTopics?: string[];
  confidence: number;
}

export interface PrepQuestion {
  id: string;
  question: string;
  category: "clarification" | "risk" | "opportunity" | "strategic" | "operational";
  priority: "high" | "medium" | "low";
  agendaItemId?: string;
  aiGenerated: boolean;
  answered?: boolean;
}

// ============================================
// In-Meeting (Live) Types
// ============================================

export type AgentType = "transcriber" | "analyst" | "tracker" | "advisor";
export type AgentStatus = "active" | "processing" | "idle" | "error";

export interface AIAgent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  status: AgentStatus;
  lastUpdate: Date;
  metrics?: {
    itemsProcessed: number;
    accuracy?: number;
  };
}

export interface TranscriptEntry {
  id: string;
  timestamp: Date;
  speakerId: string;
  speakerName: string;
  content: string;
  confidence: number;
  agendaItemId?: string;
  highlights?: TranscriptHighlight[];
}

export interface TranscriptHighlight {
  type: "action" | "decision" | "question" | "risk" | "important";
  startIndex: number;
  endIndex: number;
  note?: string;
}

export interface LiveInsight {
  id: string;
  type: "observation" | "suggestion" | "alert" | "context";
  agentId: string;
  content: string;
  timestamp: Date;
  priority: "high" | "medium" | "low";
  agendaItemId?: string;
  dismissed?: boolean;
}

export interface DetectedAction {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  status: "detected" | "confirmed" | "rejected";
  confidence: number;
  sourceTranscriptId: string;
  timestamp: Date;
}

export interface DetectedDecision {
  id: string;
  description: string;
  status: "detected" | "confirmed" | "rejected";
  confidence: number;
  sourceTranscriptId: string;
  timestamp: Date;
  votedFor?: number;
  votedAgainst?: number;
  abstained?: number;
}

// ============================================
// Post-Meeting Types
// ============================================

export interface MeetingSummary {
  id: string;
  meetingId: string;
  generatedAt: Date;
  overview: string;
  keyDiscussions: DiscussionSummary[];
  decisions: ConfirmedDecision[];
  actionItems: ActionItem[];
  nextSteps: string[];
  attendanceNotes?: string;
}

export interface DiscussionSummary {
  id: string;
  agendaItemId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  outcome?: string;
  duration: number;
}

export interface ConfirmedDecision {
  id: string;
  description: string;
  rationale?: string;
  votingResult?: {
    for: number;
    against: number;
    abstained: number;
  };
  timestamp: Date;
}

// Alias for API compatibility
export interface Decision {
  id: string;
  description: string;
  rationale?: string;
  votedFor?: number;
  votedAgainst?: number;
  abstained?: number;
  timestamp: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: Date;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "overdue";
  agendaItemId?: string;
  notes?: string;
}

export interface BoardReport {
  id: string;
  meetingId: string;
  generatedAt: Date;
  format: "pdf" | "docx" | "html";
  sections: ReportSection[];
  status: "draft" | "review" | "final";
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  confidence?: number;
  relatedQuestions?: string[];
}

export interface ChatSource {
  id: string;
  type: "transcript" | "document" | "agenda" | "external";
  name: string;
  reference?: string;
}

// ============================================
// Data Quality Types
// ============================================

export type DataFlagType = "missing" | "incomplete" | "low_confidence" | "contradictory";

export interface DataFlag {
  type: DataFlagType;
  message: string;
  field?: string;
}

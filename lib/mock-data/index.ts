// Central export for all mock data

export {
  mockMeetings,
  mockAttendees,
  mockAgendaItems,
  mockDocuments,
  mockPrepQuestions,
  getMeetingById,
  getMeetingsByPhase,
} from "./meetings";

export {
  mockAgents,
  mockTranscript,
  mockInsights,
  mockDetectedActions,
  mockDetectedDecisions,
  getAgentByType,
} from "./agents";

export {
  mockSummary,
  mockActionItems,
  getActionItemsByStatus,
  getOverdueActionItems,
} from "./summaries";

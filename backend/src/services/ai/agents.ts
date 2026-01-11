/**
 * AI Agents Status Service
 * 
 * @AI-INTEGRATION-POINT
 * This module tracks the status of AI agents during live meetings.
 * 
 * To integrate with real AI service:
 * 1. Connect to agentic platform via WebSocket
 * 2. Subscribe to agent status events
 * 3. Expected events: agent-started, agent-processing, agent-idle, agent-error
 * 
 * Available agents:
 * - transcriber: Real-time speech-to-text transcription
 * - analyst: Contextual analysis and insight generation
 * - tracker: Action item and decision detection
 * - advisor: Strategic recommendations and suggestions
 * 
 * Environment variables for real integration:
 * - AI_SERVICE_URL: Base URL of the agentic platform
 * - AI_WEBSOCKET_URL: WebSocket URL for real-time events
 */

export type AgentId = 'transcriber' | 'analyst' | 'tracker' | 'advisor';

export type AgentStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
  metrics: {
    processed: number;
    confidence: number;
  };
}

// @AI-INTEGRATION-POINT: In production, these would be managed by the agentic platform
const mockAgents: Record<AgentId, Agent> = {
  transcriber: {
    id: 'transcriber',
    name: 'Live Transcriber',
    description: 'Real-time speech-to-text transcription with speaker identification',
    status: 'listening',
    metrics: {
      processed: 847,
      confidence: 0.94,
    },
  },
  analyst: {
    id: 'analyst',
    name: 'Meeting Analyst',
    description: 'Contextual analysis and insight generation from meeting content',
    status: 'processing',
    metrics: {
      processed: 23,
      confidence: 0.89,
    },
  },
  tracker: {
    id: 'tracker',
    name: 'Action Tracker',
    description: 'Automatic detection of action items, decisions, and commitments',
    status: 'listening',
    metrics: {
      processed: 12,
      confidence: 0.92,
    },
  },
  advisor: {
    id: 'advisor',
    name: 'Strategic Advisor',
    description: 'AI-powered recommendations based on historical context and best practices',
    status: 'idle',
    metrics: {
      processed: 5,
      confidence: 0.87,
    },
  },
};

/**
 * Get all agents with current status
 * 
 * @AI-INTEGRATION-POINT
 * Replace with real-time status from agentic platform:
 * 
 * async function getAgentsStatus(): Promise<Agent[]> {
 *   const response = await fetch(`${process.env.AI_SERVICE_URL}/agents/status`);
 *   return response.json();
 * }
 */
export function getAgentsStatus(): Agent[] {
  // @AI-INTEGRATION-POINT: This returns MOCKED status
  return Object.values(mockAgents);
}

/**
 * Get single agent status
 */
export function getAgentStatus(agentId: AgentId): Agent | undefined {
  // @AI-INTEGRATION-POINT: This returns MOCKED status
  return mockAgents[agentId];
}

/**
 * Update agent status (for mock simulation)
 * 
 * @AI-INTEGRATION-POINT
 * In production, agent status would be updated by the agentic platform
 * via WebSocket events, not by this function.
 */
export function updateAgentStatus(agentId: AgentId, status: AgentStatus): Agent | undefined {
  if (mockAgents[agentId]) {
    mockAgents[agentId].status = status;
    return mockAgents[agentId];
  }
  return undefined;
}

/**
 * Increment agent processed count (for mock simulation)
 */
export function incrementAgentProcessed(agentId: AgentId): void {
  if (mockAgents[agentId]) {
    mockAgents[agentId].metrics.processed++;
  }
}

/**
 * Reset agent metrics (for mock simulation at meeting start)
 */
export function resetAgentMetrics(): void {
  Object.values(mockAgents).forEach(agent => {
    agent.metrics.processed = 0;
    agent.status = 'idle';
  });
}

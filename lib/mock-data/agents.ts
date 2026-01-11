import type {
  AIAgent,
  TranscriptEntry,
  LiveInsight,
  DetectedAction,
  DetectedDecision,
} from "@/lib/types";

// ============================================
// AI Agents Configuration
// ============================================

export const mockAgents: AIAgent[] = [
  {
    id: "agent-transcriber",
    type: "transcriber",
    name: "Transcriber",
    description: "Converting speech to text in real-time",
    status: "active",
    lastUpdate: new Date(),
    metrics: {
      itemsProcessed: 847,
      accuracy: 0.96,
    },
  },
  {
    id: "agent-analyst",
    type: "analyst",
    name: "Analyst",
    description: "Analyzing topics and providing context",
    status: "processing",
    lastUpdate: new Date(Date.now() - 15000),
    metrics: {
      itemsProcessed: 23,
      accuracy: 0.89,
    },
  },
  {
    id: "agent-tracker",
    type: "tracker",
    name: "Tracker",
    description: "Action item and decision detection",
    status: "active",
    lastUpdate: new Date(Date.now() - 5000),
    metrics: {
      itemsProcessed: 12,
      accuracy: 0.91,
    },
  },
  {
    id: "agent-advisor",
    type: "advisor",
    name: "Advisor",
    description: "Suggested questions and strategic insights",
    status: "idle",
    lastUpdate: new Date(Date.now() - 60000),
    metrics: {
      itemsProcessed: 8,
    },
  },
];

// ============================================
// Enterprise-Grade Transcript Entries
// ============================================

export const mockTranscript: TranscriptEntry[] = [
  {
    id: "tr-1",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    speakerId: "att-1",
    speakerName: "Margaret Thornton",
    content: "Good morning, everyone. I'd like to call this meeting to order. The Corporate Secretary has confirmed we have a quorum with eight of nine directors present. Before we proceed, I want to note that this meeting is being recorded for compliance purposes. Let's begin with the approval of minutes from our October 15th meeting.",
    confidence: 0.98,
    agendaItemId: "agenda-1",
  },
  {
    id: "tr-2",
    timestamp: new Date(Date.now() - 44 * 60 * 1000),
    speakerId: "att-3",
    speakerName: "Dr. Amira Hassan",
    content: "I move to approve the minutes as distributed in the board materials.",
    confidence: 0.97,
    agendaItemId: "agenda-1",
  },
  {
    id: "tr-3",
    timestamp: new Date(Date.now() - 43 * 60 * 1000),
    speakerId: "att-8",
    speakerName: "Thomas Chen",
    content: "Seconded.",
    confidence: 0.99,
    agendaItemId: "agenda-1",
  },
  {
    id: "tr-4",
    timestamp: new Date(Date.now() - 42 * 60 * 1000),
    speakerId: "att-1",
    speakerName: "Margaret Thornton",
    content: "Motion approved unanimously. Robert, please proceed with the CEO report.",
    confidence: 0.96,
    agendaItemId: "agenda-1",
  },
  {
    id: "tr-5",
    timestamp: new Date(Date.now() - 41 * 60 * 1000),
    speakerId: "att-2",
    speakerName: "Robert Castellano",
    content: "Thank you, Margaret. I'm pleased to report that Q4 represents our strongest quarter on record. Revenue came in at $4.2 billion, which is 8.3% year-over-year growth and 2.1% above our guidance. EBITDA margin expanded to 22.4%, up 180 basis points from prior year.",
    confidence: 0.95,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "important", startIndex: 70, endIndex: 160, note: "Q4 revenue and growth metrics" },
    ],
  },
  {
    id: "tr-6",
    timestamp: new Date(Date.now() - 39 * 60 * 1000),
    speakerId: "att-2",
    speakerName: "Robert Castellano",
    content: "Our digital transformation program continues to deliver results. Phase II was completed on budget, and we've already realized $410 million in run-rate savings, which exceeds our original target by 2%. I want to commend the transformation office and the broader organization for this achievement.",
    confidence: 0.94,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "important", startIndex: 100, endIndex: 180, note: "Phase II savings achievement" },
    ],
  },
  {
    id: "tr-7",
    timestamp: new Date(Date.now() - 37 * 60 * 1000),
    speakerId: "att-3",
    speakerName: "Dr. Amira Hassan",
    content: "Robert, the geopolitical situation in the Asia-Pacific region has been evolving rapidly. Given that a significant portion of our operations and supply chain is exposed to that region, what contingency planning has been done, and what is our current risk assessment?",
    confidence: 0.96,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "question", startIndex: 0, endIndex: 270, note: "Risk question - APAC exposure" },
    ],
  },
  {
    id: "tr-8",
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    speakerId: "att-2",
    speakerName: "Robert Castellano",
    content: "Excellent question, and one we've been actively addressing. We've developed a comprehensive scenario planning framework that considers various levels of disruption. We've diversified our supplier base, established secondary manufacturing capabilities in Mexico and Eastern Europe, and secured strategic inventory for critical components. William can speak to the detailed risk assessment.",
    confidence: 0.93,
    agendaItemId: "agenda-2",
  },
  {
    id: "tr-9",
    timestamp: new Date(Date.now() - 33 * 60 * 1000),
    speakerId: "att-7",
    speakerName: "William Okonkwo",
    content: "Thank you, Robert. Our Enterprise Risk Management team has modeled three scenarios: baseline, adverse, and severe. Under the severe scenario, which assumes a 60% reduction in APAC supply chain capacity for six months, we estimate a $280 million EBITDA impact. However, with the mitigation measures Robert mentioned, we believe we can reduce that impact by approximately 40%.",
    confidence: 0.94,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "risk", startIndex: 70, endIndex: 260, note: "APAC scenario risk assessment" },
    ],
  },
  {
    id: "tr-10",
    timestamp: new Date(Date.now() - 31 * 60 * 1000),
    speakerId: "att-1",
    speakerName: "Margaret Thornton",
    content: "William, I'd like the Risk Committee to conduct a deeper review of these scenarios and provide a report to the full board at our next meeting. Can you commit to that timeline?",
    confidence: 0.97,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "action", startIndex: 13, endIndex: 140, note: "Action - Risk Committee review" },
    ],
  },
  {
    id: "tr-11",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    speakerId: "att-7",
    speakerName: "William Okonkwo",
    content: "Absolutely, Margaret. We'll present a comprehensive assessment including updated probability weightings and our recommended additional mitigation measures.",
    confidence: 0.95,
    agendaItemId: "agenda-2",
  },
  {
    id: "tr-12",
    timestamp: new Date(Date.now() - 28 * 60 * 1000),
    speakerId: "att-8",
    speakerName: "Thomas Chen",
    content: "Robert, you mentioned the competitor acquisition announcement. How does that change our competitive positioning, particularly in the enterprise segment where we've been gaining market share?",
    confidence: 0.94,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "question", startIndex: 0, endIndex: 180, note: "Competitive positioning question" },
    ],
  },
  {
    id: "tr-13",
    timestamp: new Date(Date.now() - 26 * 60 * 1000),
    speakerId: "att-2",
    speakerName: "Robert Castellano",
    content: "Thomas, we've conducted a thorough analysis. The combined entity will have greater scale, but their integration will take 18 to 24 months. This creates a window of opportunity for us to accelerate customer acquisition. We're proposing to increase our sales capacity by 15% in the enterprise segment, which is reflected in the FY2026 budget Victoria will present.",
    confidence: 0.92,
    agendaItemId: "agenda-2",
    highlights: [
      { type: "decision", startIndex: 200, endIndex: 340, note: "Proposed sales capacity increase" },
    ],
  },
  {
    id: "tr-14",
    timestamp: new Date(Date.now() - 24 * 60 * 1000),
    speakerId: "att-3",
    speakerName: "Dr. Amira Hassan",
    content: "I support that strategic response. However, I want to ensure we're not just reacting but also accelerating our own strategic initiatives. How does this align with the Phase III digital transformation authorization we'll be discussing later?",
    confidence: 0.95,
    agendaItemId: "agenda-2",
  },
  {
    id: "tr-15",
    timestamp: new Date(Date.now() - 22 * 60 * 1000),
    speakerId: "att-2",
    speakerName: "Robert Castellano",
    content: "It's directly aligned. Phase III includes AI-powered sales enablement tools and customer analytics capabilities that will give our sales team a significant productivity advantage. We believe this, combined with the capacity increase, will allow us to capture an additional 2 to 3 percentage points of market share over the next two years.",
    confidence: 0.93,
    agendaItemId: "agenda-2",
  },
  {
    id: "tr-16",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    speakerId: "att-1",
    speakerName: "Margaret Thornton",
    content: "Thank you, Robert. Before we move to Victoria's financial review, are there any other questions on the CEO report? Seeing none, Victoria, please proceed with the Q4 financial results and budget proposal.",
    confidence: 0.96,
    agendaItemId: "agenda-2",
  },
  {
    id: "tr-17",
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    speakerId: "att-4",
    speakerName: "Victoria Blackwood",
    content: "Thank you, Margaret. Turning to our financial results, as Robert mentioned, we delivered $4.2 billion in revenue for Q4, bringing our full-year revenue to $16.4 billion, which exceeded our guidance by $340 million. Operating cash flow was strong at $3.1 billion, representing 19% of revenue.",
    confidence: 0.95,
    agendaItemId: "agenda-3",
    highlights: [
      { type: "important", startIndex: 65, endIndex: 200, note: "Financial results summary" },
    ],
  },
  {
    id: "tr-18",
    timestamp: new Date(Date.now() - 16 * 60 * 1000),
    speakerId: "att-4",
    speakerName: "Victoria Blackwood",
    content: "Our balance sheet remains strong with $2.8 billion in liquidity, including cash and committed facilities. We've maintained our investment-grade credit rating, and Moody's recently affirmed our outlook as stable. The proposed FY2026 budget totals $18.6 billion in operating expenditure, with a 6.2% revenue growth target.",
    confidence: 0.94,
    agendaItemId: "agenda-3",
    highlights: [
      { type: "important", startIndex: 0, endIndex: 150, note: "Liquidity and credit rating" },
    ],
  },
];

// ============================================
// Live Insights
// ============================================

export const mockInsights: LiveInsight[] = [
  {
    id: "insight-1",
    type: "observation",
    agentId: "agent-analyst",
    content: "Discussion tracking 5 minutes ahead of schedule. Strategic Initiative item may benefit from additional time allocation.",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    priority: "low",
    agendaItemId: "agenda-2",
  },
  {
    id: "insight-2",
    type: "context",
    agentId: "agent-analyst",
    content: "Industry benchmark: Peer companies report average EBITDA margin of 18.7%. Organization's 22.4% margin is in top quartile.",
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    priority: "medium",
    agendaItemId: "agenda-2",
  },
  {
    id: "insight-3",
    type: "suggestion",
    agentId: "agent-advisor",
    content: "Consider requesting quantitative analysis of the 15% sales capacity increase ROI projection before budget approval.",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    priority: "medium",
    agendaItemId: "agenda-2",
  },
  {
    id: "insight-4",
    type: "alert",
    agentId: "agent-tracker",
    content: "Potential action item detected: Risk Committee to provide comprehensive APAC scenario assessment at next board meeting.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    priority: "high",
    agendaItemId: "agenda-2",
  },
  {
    id: "insight-5",
    type: "context",
    agentId: "agent-analyst",
    content: "Reference: Phase II savings of $410M exceeded original business case by $8M. Strengthens credibility for Phase III projections.",
    timestamp: new Date(Date.now() - 38 * 60 * 1000),
    priority: "low",
    agendaItemId: "agenda-2",
  },
  {
    id: "insight-6",
    type: "context",
    agentId: "agent-analyst",
    content: "SEC climate disclosure requirements reference: Final rule effective for FY2026 annual reports. Implementation status should be confirmed.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    priority: "medium",
    agendaItemId: "agenda-7",
  },
  {
    id: "insight-7",
    type: "suggestion",
    agentId: "agent-advisor",
    content: "Given third-party concentration risk in Risk Register, consider requesting vendor diversification timeline from management.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    priority: "medium",
    agendaItemId: "agenda-4",
  },
];

// ============================================
// Detected Actions
// ============================================

export const mockDetectedActions: DetectedAction[] = [
  {
    id: "action-1",
    description: "Risk Committee to present comprehensive APAC scenario assessment with updated probability weightings at next board meeting",
    assignee: "William Okonkwo",
    status: "confirmed",
    confidence: 0.94,
    sourceTranscriptId: "tr-10",
    timestamp: new Date(Date.now() - 31 * 60 * 1000),
  },
  {
    id: "action-2",
    description: "Finance to prepare quantitative analysis of 15% sales capacity increase ROI for budget discussion",
    assignee: "Victoria Blackwood",
    status: "detected",
    confidence: 0.78,
    sourceTranscriptId: "tr-13",
    timestamp: new Date(Date.now() - 26 * 60 * 1000),
  },
  {
    id: "action-3",
    description: "Management to provide vendor diversification timeline addressing third-party concentration risks",
    status: "detected",
    confidence: 0.72,
    sourceTranscriptId: "tr-9",
    timestamp: new Date(Date.now() - 33 * 60 * 1000),
  },
  {
    id: "action-4",
    description: "Corporate Secretary to circulate board materials for Phase III authorization vote",
    assignee: "Catherine Wells",
    status: "detected",
    confidence: 0.81,
    sourceTranscriptId: "tr-15",
    timestamp: new Date(Date.now() - 22 * 60 * 1000),
  },
];

// ============================================
// Detected Decisions
// ============================================

export const mockDetectedDecisions: DetectedDecision[] = [
  {
    id: "decision-1",
    description: "Minutes from Q3 Board Meeting (October 15, 2024) approved as distributed",
    status: "confirmed",
    confidence: 0.98,
    sourceTranscriptId: "tr-4",
    timestamp: new Date(Date.now() - 42 * 60 * 1000),
    votedFor: 8,
    votedAgainst: 0,
    abstained: 0,
  },
  {
    id: "decision-2",
    description: "Approval of 15% sales capacity increase in enterprise segment for FY2026",
    status: "detected",
    confidence: 0.82,
    sourceTranscriptId: "tr-13",
    timestamp: new Date(Date.now() - 26 * 60 * 1000),
  },
  {
    id: "decision-3",
    description: "Risk Committee tasked with comprehensive APAC risk review before next board meeting",
    status: "confirmed",
    confidence: 0.91,
    sourceTranscriptId: "tr-10",
    timestamp: new Date(Date.now() - 31 * 60 * 1000),
  },
];

// ============================================
// Helper Functions
// ============================================

export function getAgentByType(type: AIAgent["type"]): AIAgent | undefined {
  return mockAgents.find((a) => a.type === type);
}

export function getTranscriptByAgendaItem(agendaItemId: string): TranscriptEntry[] {
  return mockTranscript.filter((t) => t.agendaItemId === agendaItemId);
}

export function getInsightsByPriority(priority: LiveInsight["priority"]): LiveInsight[] {
  return mockInsights.filter((i) => i.priority === priority);
}

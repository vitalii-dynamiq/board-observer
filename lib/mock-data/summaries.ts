import type {
  MeetingSummary,
  DiscussionSummary,
  ConfirmedDecision,
  ActionItem,
} from "@/lib/types";

// ============================================
// Meeting Summary - Q3 Board Meeting (Completed)
// ============================================

export const mockSummary: MeetingSummary = {
  id: "summary-1",
  meetingId: "meeting-4",
  generatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  overview: "The Q3 Board of Directors meeting addressed quarterly performance, enterprise risk management updates, and strategic initiatives. The board approved the FY2025 capital program amendment and endorsed preliminary FY2026 budget guidelines. Key discussions focused on digital transformation progress, cybersecurity posture, and succession planning for executive leadership positions.",
  keyDiscussions: [
    {
      id: "disc-1",
      agendaItemId: "agenda-1",
      title: "Q3 Financial Performance Review",
      summary: "CFO presented quarterly results showing $3.9B revenue with 7.2% YoY growth. EBITDA margin reached 21.8%, exceeding guidance. Cash generation remained strong with operating cash flow of $740M.",
      keyPoints: [
        "Revenue: $3.9B (7.2% YoY growth, 1.5% above guidance)",
        "EBITDA margin: 21.8% (up 140bps YoY)",
        "Operating cash flow: $740M (19% of revenue)",
        "Free cash flow: $520M after capital investments",
        "Liquidity position strengthened to $2.6B",
      ],
      outcome: "Board expressed satisfaction with financial performance and risk management",
      duration: 40,
    },
    {
      id: "disc-2",
      agendaItemId: "agenda-2",
      title: "Digital Transformation - Phase II Completion",
      summary: "CEO presented Phase II completion report. Program delivered $410M in run-rate savings, exceeding the $400M target. Cloud migration completed for 78% of enterprise applications.",
      keyPoints: [
        "Phase II completed on time and under budget",
        "Run-rate savings: $410M (102% of target)",
        "Cloud migration: 78% of applications migrated",
        "Process automation: 340 processes digitized",
        "Employee adoption: 94% training completion",
      ],
      outcome: "Board approved Phase III proposal for Q4 authorization",
      duration: 35,
    },
    {
      id: "disc-3",
      agendaItemId: "agenda-3",
      title: "Enterprise Risk Management Update",
      summary: "CRO presented quarterly risk register update. Three risks elevated to critical status requiring enhanced monitoring. New AI governance framework recommended for board consideration.",
      keyPoints: [
        "47 risks actively monitored (3 critical, 12 high)",
        "New emerging risk: AI governance and liability",
        "Third-party concentration exceeds thresholds for 4 vendors",
        "Cyber threat landscape assessment updated",
        "Climate risk modeling enhanced per TCFD recommendations",
      ],
      outcome: "Board directed Risk Committee to develop AI governance oversight framework",
      duration: 30,
    },
    {
      id: "disc-4",
      agendaItemId: "agenda-4",
      title: "Executive Succession Planning",
      summary: "Board Chair presented succession planning update in executive session. Emergency and planned succession protocols reviewed for CEO and C-suite positions.",
      keyPoints: [
        "CEO succession: Two internal candidates identified",
        "CFO succession: External search initiated as backup",
        "Emergency succession protocols validated",
        "Development plans for high-potential executives",
        "Board director succession needs identified",
      ],
      outcome: "Compensation Committee to provide detailed development plans at next meeting",
      duration: 25,
    },
  ],
  decisions: [
    {
      id: "cd-1",
      description: "Approved amendment to FY2025 Capital Program increasing authorization by $180M for infrastructure modernization",
      rationale: "Required to accelerate data center consolidation and support cloud migration targets",
      votingResult: { for: 8, against: 0, abstained: 0 },
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
    },
    {
      id: "cd-2",
      description: "Endorsed preliminary FY2026 operating budget guidelines with 6.2% revenue growth target",
      rationale: "Aligned with strategic plan and market opportunity assessment; final approval deferred to Q4 meeting",
      votingResult: { for: 7, against: 0, abstained: 1 },
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
    },
    {
      id: "cd-3",
      description: "Authorized management to proceed with Phase III digital transformation planning",
      rationale: "Phase II results exceeded expectations, supporting investment case for Phase III",
      votingResult: { for: 8, against: 0, abstained: 0 },
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
    },
    {
      id: "cd-4",
      description: "Approved formation of AI Governance Subcommittee under Risk Committee",
      rationale: "Emerging AI risks require dedicated board-level oversight structure",
      votingResult: { for: 8, against: 0, abstained: 0 },
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 150 * 60 * 1000),
    },
    {
      id: "cd-5",
      description: "Ratified executive compensation adjustments as recommended by Compensation Committee",
      rationale: "Adjustments reflect market competitiveness analysis and performance achievements",
      votingResult: { for: 6, against: 1, abstained: 1 },
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 170 * 60 * 1000),
    },
  ],
  actionItems: [
    {
      id: "ai-1",
      description: "Present comprehensive Phase III business case with detailed ROI analysis and implementation timeline",
      assignee: "Robert Castellano",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "completed",
      agendaItemId: "agenda-2",
    },
    {
      id: "ai-2",
      description: "Develop AI Governance Framework and present to Risk Committee for review",
      assignee: "William Okonkwo",
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "in-progress",
      agendaItemId: "agenda-3",
    },
    {
      id: "ai-3",
      description: "Complete third-party vendor risk remediation plan for four vendors exceeding concentration thresholds",
      assignee: "Richard Ng",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "in-progress",
      agendaItemId: "agenda-3",
    },
    {
      id: "ai-4",
      description: "Prepare detailed executive development plans for succession pipeline candidates",
      assignee: "Margaret Thornton",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "in-progress",
      agendaItemId: "agenda-4",
    },
    {
      id: "ai-5",
      description: "Finalize FY2026 operating budget with scenario analysis for board approval",
      assignee: "Victoria Blackwood",
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "completed",
    },
    {
      id: "ai-6",
      description: "Update SEC climate disclosure implementation timeline for Audit Committee review",
      assignee: "Richard Ng",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "pending",
      agendaItemId: "agenda-3",
    },
  ],
  nextSteps: [
    "Q4 Board Meeting scheduled for current date with Phase III authorization vote",
    "Risk Committee to present AI Governance Framework at February meeting",
    "Audit Committee to review external auditor report at January meeting",
    "Compensation Committee to finalize executive development recommendations",
    "Management to provide updated APAC scenario analysis before Q4 meeting",
  ],
  attendanceNotes: "All eight board members present throughout the meeting. General Counsel participated for compliance-related items. External auditor joined for Audit Committee update portion.",
};

// ============================================
// Action Items for Current/Upcoming Meetings
// ============================================

export const mockActionItems: ActionItem[] = [
  {
    id: "action-current-1",
    description: "Present Phase III digital transformation business case with $340M authorization request",
    assignee: "Robert Castellano",
    dueDate: new Date(),
    priority: "high",
    status: "in-progress",
    agendaItemId: "agenda-6",
    notes: "Materials prepared and included in board pack. ROI analysis shows 2.4x return over 5 years.",
  },
  {
    id: "action-current-2",
    description: "Present FY2026 operating budget for board approval",
    assignee: "Victoria Blackwood",
    dueDate: new Date(),
    priority: "high",
    status: "completed",
    agendaItemId: "agenda-3",
    notes: "Budget materials distributed. Key assumptions documented in supporting materials.",
  },
  {
    id: "action-current-3",
    description: "Provide Enterprise Risk Register quarterly update with emerging risk analysis",
    assignee: "William Okonkwo",
    dueDate: new Date(),
    priority: "high",
    status: "in-progress",
    agendaItemId: "agenda-4",
    notes: "Risk register updated. Three new emerging risks identified for board discussion.",
  },
  {
    id: "action-current-4",
    description: "Present annual cybersecurity posture assessment and NIST CSF maturity report",
    assignee: "Jennifer Martinez",
    dueDate: new Date(),
    priority: "high",
    status: "completed",
    agendaItemId: "agenda-5",
    notes: "Assessment complete. Overall maturity improved to 3.8/5.0.",
  },
  {
    id: "action-current-5",
    description: "Update regulatory compliance certification matrix for board review",
    assignee: "Richard Ng",
    dueDate: new Date(),
    priority: "medium",
    status: "pending",
    agendaItemId: "agenda-7",
  },
  {
    id: "action-current-6",
    description: "Prepare executive session discussion points on CEO performance review",
    assignee: "Margaret Thornton",
    dueDate: new Date(),
    priority: "medium",
    status: "completed",
    agendaItemId: "agenda-9",
    notes: "Discussion framework prepared for independent directors.",
  },
  {
    id: "action-current-7",
    description: "Compile ESG progress metrics and sustainability initiative updates",
    assignee: "Robert Castellano",
    dueDate: new Date(),
    priority: "medium",
    status: "completed",
    agendaItemId: "agenda-8",
    notes: "MSCI rating upgrade to AA highlights included.",
  },
  {
    id: "action-current-8",
    description: "Prepare APAC scenario analysis with updated probability assessments",
    assignee: "William Okonkwo",
    dueDate: new Date(),
    priority: "high",
    status: "in-progress",
    agendaItemId: "agenda-2",
    notes: "Analysis covers baseline, adverse, and severe scenarios with mitigation strategies.",
  },
];

// ============================================
// Helper Functions
// ============================================

export function getActionItemsByStatus(status: ActionItem["status"]): ActionItem[] {
  return mockActionItems.filter((ai) => ai.status === status);
}

export function getOverdueActionItems(): ActionItem[] {
  const now = new Date();
  return mockActionItems.filter(
    (ai) => ai.status !== "completed" && ai.dueDate < now
  );
}

export function getActionItemsByAssignee(assignee: string): ActionItem[] {
  return mockActionItems.filter((ai) => ai.assignee === assignee);
}

export function getActionItemsByPriority(priority: ActionItem["priority"]): ActionItem[] {
  return mockActionItems.filter((ai) => ai.priority === priority);
}

export function getPendingHighPriorityItems(): ActionItem[] {
  return mockActionItems.filter(
    (ai) => ai.status !== "completed" && ai.priority === "high"
  );
}

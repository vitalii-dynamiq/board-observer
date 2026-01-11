import type {
  Meeting,
  Attendee,
  AgendaItem,
  BriefingDocument,
  PrepQuestion,
} from "@/lib/types";

// ============================================
// Enterprise Attendees
// ============================================

export const mockAttendees: Attendee[] = [
  {
    id: "att-1",
    name: "Margaret Thornton",
    role: "Board Chair",
    organization: "Board of Directors",
    isPresent: true,
  },
  {
    id: "att-2",
    name: "Robert Castellano",
    role: "Chief Executive Officer",
    organization: "Executive Leadership",
    isPresent: true,
    isSpeaking: true,
  },
  {
    id: "att-3",
    name: "Dr. Amira Hassan",
    role: "Independent Director",
    organization: "Board of Directors",
    isPresent: true,
  },
  {
    id: "att-4",
    name: "Victoria Blackwood",
    role: "Chief Financial Officer",
    organization: "Executive Leadership",
    isPresent: true,
  },
  {
    id: "att-5",
    name: "Richard Ng",
    role: "General Counsel",
    organization: "Legal & Compliance",
    isPresent: false,
  },
  {
    id: "att-6",
    name: "Catherine Wells",
    role: "Corporate Secretary",
    organization: "Governance",
    isPresent: true,
  },
  {
    id: "att-7",
    name: "William Okonkwo",
    role: "Chief Risk Officer",
    organization: "Risk Management",
    isPresent: true,
  },
  {
    id: "att-8",
    name: "Jennifer Martinez",
    role: "Chief Information Security Officer",
    organization: "Information Security",
    isPresent: true,
  },
  {
    id: "att-9",
    name: "Thomas Chen",
    role: "Independent Director",
    organization: "Board of Directors",
    isPresent: true,
  },
  {
    id: "att-10",
    name: "Patricia Sullivan",
    role: "Head of Internal Audit",
    organization: "Internal Audit",
    isPresent: true,
  },
];

// Committee-specific attendees
export const auditCommitteeAttendees: Attendee[] = [
  mockAttendees[2], // Dr. Hassan (Chair)
  mockAttendees[8], // Thomas Chen
  mockAttendees[3], // Victoria Blackwood
  mockAttendees[9], // Patricia Sullivan
  {
    id: "att-ext-1",
    name: "David Morrison",
    role: "External Audit Partner",
    organization: "Deloitte LLP",
    isPresent: true,
  },
];

export const riskCommitteeAttendees: Attendee[] = [
  mockAttendees[8], // Thomas Chen (Chair)
  mockAttendees[0], // Margaret Thornton
  mockAttendees[6], // William Okonkwo
  mockAttendees[7], // Jennifer Martinez
];

// ============================================
// Briefing Documents
// ============================================

export const mockDocuments: BriefingDocument[] = [
  {
    id: "doc-1",
    title: "FY2025 Q4 Consolidated Financial Statements (Unaudited)",
    type: "pdf",
    url: "/documents/fy25-q4-financials.pdf",
    uploadedAt: new Date("2024-01-10"),
    summary: "Consolidated financial results for Q4 FY2025 showing $4.2B revenue, 8.3% YoY growth. EBITDA margin at 22.4%, ahead of guidance.",
  },
  {
    id: "doc-2",
    title: "Enterprise Risk Register - Q4 Update",
    type: "spreadsheet",
    url: "/documents/risk-register-q4.xlsx",
    uploadedAt: new Date("2024-01-11"),
    summary: "Updated enterprise risk assessment with 47 identified risks. 3 elevated to critical status: cyber threat landscape, supply chain concentration, regulatory changes.",
  },
  {
    id: "doc-3",
    title: "Digital Transformation Program - Phase III Authorization Request",
    type: "presentation",
    url: "/documents/digital-transform-phase3.pptx",
    uploadedAt: new Date("2024-01-12"),
    summary: "Request for $340M capital authorization for Phase III of enterprise digital transformation. Expected ROI of 2.4x over 5 years.",
  },
  {
    id: "doc-4",
    title: "Cybersecurity Posture Assessment - Annual Review",
    type: "pdf",
    url: "/documents/cyber-assessment-fy25.pdf",
    uploadedAt: new Date("2024-01-09"),
    summary: "Annual NIST CSF assessment results. Overall maturity score improved to 3.8/5.0. Zero critical findings, 4 high-priority remediation items.",
  },
  {
    id: "doc-5",
    title: "Capital Expenditure Authorization - Infrastructure Modernization",
    type: "pdf",
    url: "/documents/capex-infrastructure.pdf",
    uploadedAt: new Date("2024-01-11"),
    summary: "Authorization request for $890M infrastructure modernization program across 12 regional facilities.",
  },
  {
    id: "doc-6",
    title: "Regulatory Compliance Certification Matrix - FY2025",
    type: "spreadsheet",
    url: "/documents/compliance-matrix-fy25.xlsx",
    uploadedAt: new Date("2024-01-08"),
    summary: "Comprehensive compliance status across 23 regulatory frameworks including SOX, GDPR, CCPA, and sector-specific requirements.",
  },
  {
    id: "doc-7",
    title: "ESG Progress Report & Sustainability Metrics",
    type: "pdf",
    url: "/documents/esg-report-q4.pdf",
    uploadedAt: new Date("2024-01-10"),
    summary: "Quarterly ESG performance metrics. Carbon reduction target 94% achieved. Diversity metrics improved across all categories.",
  },
  {
    id: "doc-8",
    title: "Internal Audit Findings Summary - Q4 FY2025",
    type: "pdf",
    url: "/documents/internal-audit-q4.pdf",
    uploadedAt: new Date("2024-01-07"),
    summary: "Summary of 8 completed audits. 2 material findings in procurement controls, 5 moderate findings, all with remediation plans.",
  },
];

// ============================================
// Agenda Items
// ============================================

export const mockAgendaItems: AgendaItem[] = [
  {
    id: "agenda-1",
    order: 1,
    title: "Call to Order & Approval of Minutes",
    description: "Review and approve minutes from Q3 Board Meeting held October 15, 2024",
    duration: 10,
    presenter: "Margaret Thornton",
    status: "completed",
    aiAnalysis: {
      id: "ai-1",
      summary: "Standard procedural item. Q3 minutes contain no contested items or required amendments.",
      keyPoints: [
        "Quorum confirmed with 8 of 9 directors present",
        "No amendments to previous minutes requested",
      ],
      suggestedQuestions: [],
      confidence: 0.98,
    },
  },
  {
    id: "agenda-2",
    order: 2,
    title: "CEO Report & Strategic Update",
    description: "Quarterly business performance review, market conditions, and strategic initiative progress",
    duration: 35,
    presenter: "Robert Castellano",
    documents: [mockDocuments[0]],
    status: "in-progress",
    aiAnalysis: {
      id: "ai-2",
      summary: "Strong Q4 performance with $4.2B revenue representing 8.3% YoY growth. Three strategic initiatives on track, one requires board attention due to regulatory complexity.",
      keyPoints: [
        "Revenue: $4.2B (8.3% YoY growth, 2.1% above guidance)",
        "EBITDA margin: 22.4% (up 180bps YoY)",
        "Customer NPS improved to 72 (from 68)",
        "Digital transformation Phase II completed on budget",
        "Workforce expanded by 2,400 FTEs globally",
      ],
      risks: [
        "Geopolitical tensions affecting APAC operations",
        "Key competitor announced major acquisition",
        "Talent retention in critical technology roles at 84%",
      ],
      opportunities: [
        "Adjacent market entry opportunity identified ($2.8B TAM)",
        "Strategic partnership discussions with three Fortune 100 companies",
        "AI/ML capabilities driving 15% productivity improvement",
      ],
      suggestedQuestions: [
        "What contingency plans exist for APAC operational disruptions?",
        "How does the competitor acquisition change our competitive positioning?",
        "What retention initiatives are planned for critical technology talent?",
      ],
      confidence: 0.91,
    },
  },
  {
    id: "agenda-3",
    order: 3,
    title: "Financial Review & FY2026 Budget Approval",
    description: "Q4 FY2025 financial results and FY2026 operating budget for board approval",
    duration: 45,
    presenter: "Victoria Blackwood",
    documents: [mockDocuments[0]],
    status: "pending",
    aiAnalysis: {
      id: "ai-3",
      summary: "Strong financial position with $2.8B liquidity. FY2026 budget proposes $18.6B operating expenditure with 6.2% revenue growth target.",
      keyPoints: [
        "FY2025 Revenue: $16.4B (exceeded guidance by $340M)",
        "Operating cash flow: $3.1B (19% of revenue)",
        "Liquidity position: $2.8B (cash + facilities)",
        "FY2026 Budget: $18.6B total, $890M R&D allocation",
        "Capital program: $3.2B over 3 years",
        "Dividend maintained at $2.40/share annually",
      ],
      risks: [
        "Currency exposure: 34% of revenue in non-USD",
        "Interest rate sensitivity on $4.2B floating debt",
        "Pension funding status requires monitoring",
      ],
      suggestedQuestions: [
        "What hedging strategies are in place for currency exposure?",
        "How does the capital program prioritization align with strategic objectives?",
        "What is the contingency if revenue growth targets are not met?",
      ],
      confidence: 0.94,
    },
  },
  {
    id: "agenda-4",
    order: 4,
    title: "Enterprise Risk Management Review",
    description: "Quarterly enterprise risk register review and emerging risk assessment",
    duration: 30,
    presenter: "William Okonkwo",
    documents: [mockDocuments[1]],
    status: "pending",
    aiAnalysis: {
      id: "ai-4",
      summary: "47 risks monitored, 3 elevated to critical status. New emerging risks identified in AI governance and third-party concentration.",
      keyPoints: [
        "3 critical risks: cyber threats, supply chain, regulatory",
        "12 high risks, 20 medium, 12 low",
        "New emerging risk: AI governance and liability",
        "Third-party risk: 4 vendors exceed concentration thresholds",
        "Insurance coverage reviewed and adequate",
      ],
      risks: [
        "Cyber threat landscape increasingly sophisticated",
        "Regulatory changes in EU and APAC accelerating",
        "Climate-related risks require enhanced modeling",
      ],
      suggestedQuestions: [
        "What board oversight is recommended for AI governance?",
        "What is the remediation timeline for critical risks?",
        "How are third-party concentration risks being addressed?",
      ],
      confidence: 0.89,
    },
  },
  {
    id: "agenda-5",
    order: 5,
    title: "Cybersecurity Posture Assessment",
    description: "Annual cybersecurity review, incident summary, and NIST framework compliance",
    duration: 25,
    presenter: "Jennifer Martinez",
    documents: [mockDocuments[3]],
    status: "pending",
    aiAnalysis: {
      id: "ai-5",
      summary: "NIST CSF maturity improved to 3.8/5.0. Zero material breaches in FY2025. Four high-priority remediation items in progress.",
      keyPoints: [
        "NIST CSF maturity: 3.8/5.0 (up from 3.4)",
        "Zero material security incidents in FY2025",
        "1,247 phishing attempts blocked (94% automated)",
        "Third-party security assessments: 98% compliance",
        "Security awareness training: 99.2% completion",
        "SOC 2 Type II certification renewed",
      ],
      risks: [
        "Nation-state threat actors increasingly targeting sector",
        "AI-powered attack vectors emerging",
        "Legacy system vulnerabilities in acquired entities",
      ],
      suggestedQuestions: [
        "What is the investment required to reach 4.0+ maturity?",
        "How are we addressing AI-powered threat vectors?",
        "What is the status of legacy system remediation?",
      ],
      confidence: 0.92,
    },
  },
  {
    id: "agenda-6",
    order: 6,
    title: "Digital Transformation - Phase III Authorization",
    description: "Request for capital authorization for Phase III of enterprise digital transformation program",
    duration: 35,
    presenter: "Robert Castellano",
    documents: [mockDocuments[2], mockDocuments[4]],
    status: "pending",
    aiAnalysis: {
      id: "ai-6",
      summary: "Phase III requires $340M authorization over 24 months. Expected to deliver $820M in annual run-rate savings by FY2028.",
      keyPoints: [
        "Investment: $340M over 24 months",
        "Expected ROI: 2.4x over 5 years",
        "Annual run-rate savings: $820M by FY2028",
        "Key components: Cloud migration, AI/ML platform, process automation",
        "Workforce impact: 1,200 roles transformed, 400 new digital roles",
        "Phase I & II delivered $410M in savings (102% of target)",
      ],
      risks: [
        "Integration complexity with legacy systems",
        "Change management and adoption risk",
        "Vendor dependency on three critical technology partners",
      ],
      opportunities: [
        "Positions organization for AI-first operating model",
        "Enables 40% reduction in time-to-market",
        "Creates platform for ecosystem partnerships",
      ],
      suggestedQuestions: [
        "What governance structure will oversee Phase III execution?",
        "How are workforce transition impacts being managed?",
        "What are the key decision gates and milestones?",
      ],
      confidence: 0.87,
    },
  },
  {
    id: "agenda-7",
    order: 7,
    title: "Regulatory & Compliance Update",
    description: "Regulatory compliance status, pending matters, and policy updates",
    duration: 20,
    presenter: "Richard Ng",
    documents: [mockDocuments[5]],
    status: "pending",
    aiAnalysis: {
      id: "ai-7",
      summary: "Full compliance maintained across 23 regulatory frameworks. Three new regulatory requirements effective Q2 FY2026.",
      keyPoints: [
        "SOX compliance: Unqualified opinion expected",
        "GDPR/CCPA: Zero material findings",
        "New EU AI Act requirements effective Q2 2026",
        "SEC climate disclosure rules: Implementation on track",
        "Pending litigation: 4 matters, none material",
      ],
      suggestedQuestions: [
        "What resources are required for EU AI Act compliance?",
        "What is the status of the pending litigation matters?",
        "Are there any regulatory examinations in progress?",
      ],
      confidence: 0.93,
    },
  },
  {
    id: "agenda-8",
    order: 8,
    title: "ESG & Sustainability Progress",
    description: "Environmental, social, and governance metrics review and sustainability initiatives",
    duration: 20,
    presenter: "Robert Castellano",
    documents: [mockDocuments[6]],
    status: "pending",
    aiAnalysis: {
      id: "ai-8",
      summary: "On track to meet 2030 net-zero commitment. Diversity metrics improved across all categories. MSCI ESG rating upgraded to AA.",
      keyPoints: [
        "Carbon emissions: 42% reduction from 2019 baseline",
        "Renewable energy: 78% of operations",
        "Board diversity: 44% women, 33% underrepresented groups",
        "Executive diversity: 38% women, 28% underrepresented",
        "MSCI ESG rating: Upgraded to AA (from A)",
        "Community investment: $47M in FY2025",
      ],
      suggestedQuestions: [
        "What investments are required to achieve the 2030 net-zero target?",
        "How does our ESG performance compare to peer group?",
        "What are the key priorities for improving to AAA rating?",
      ],
      confidence: 0.90,
    },
  },
  {
    id: "agenda-9",
    order: 9,
    title: "Executive Session & Adjournment",
    description: "Board executive session without management present",
    duration: 20,
    presenter: "Margaret Thornton",
    status: "pending",
  },
];

// ============================================
// Preparation Questions
// ============================================

export const mockPrepQuestions: PrepQuestion[] = [
  {
    id: "pq-1",
    question: "Given the geopolitical tensions affecting APAC, what scenario planning has been conducted for potential operational disruptions?",
    category: "risk",
    priority: "high",
    agendaItemId: "agenda-2",
    aiGenerated: true,
    answered: false,
  },
  {
    id: "pq-2",
    question: "How does the proposed $340M Phase III investment compare to peer digital transformation spending as a percentage of revenue?",
    category: "strategic",
    priority: "high",
    agendaItemId: "agenda-6",
    aiGenerated: true,
    answered: false,
  },
  {
    id: "pq-3",
    question: "What board-level oversight structure is recommended for the emerging AI governance risks identified in the risk register?",
    category: "risk",
    priority: "high",
    agendaItemId: "agenda-4",
    aiGenerated: true,
    answered: false,
  },
  {
    id: "pq-4",
    question: "With 34% of revenue in non-USD currencies, what is the potential P&L impact of a 10% adverse currency movement?",
    category: "operational",
    priority: "medium",
    agendaItemId: "agenda-3",
    aiGenerated: true,
    answered: false,
  },
  {
    id: "pq-5",
    question: "What is the succession planning status for the CEO and other C-suite positions?",
    category: "strategic",
    priority: "medium",
    aiGenerated: false,
    answered: false,
  },
  {
    id: "pq-6",
    question: "How are nation-state cyber threats being specifically addressed given their increasing sophistication?",
    category: "risk",
    priority: "high",
    agendaItemId: "agenda-5",
    aiGenerated: true,
    answered: false,
  },
  {
    id: "pq-7",
    question: "What is the expected timeline and cost to remediate the two material findings from Internal Audit?",
    category: "operational",
    priority: "medium",
    agendaItemId: "agenda-3",
    aiGenerated: false,
    answered: false,
  },
  {
    id: "pq-8",
    question: "How does the workforce transformation in Phase III align with our talent strategy and retention goals?",
    category: "strategic",
    priority: "medium",
    agendaItemId: "agenda-6",
    aiGenerated: true,
    answered: false,
  },
];

// ============================================
// Meetings
// ============================================

export const mockMeetings: Meeting[] = [
  {
    id: "meeting-1",
    title: "Q4 Board of Directors Meeting",
    type: "board",
    phase: "live",
    scheduledStart: new Date(),
    scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
    actualStart: new Date(Date.now() - 45 * 60 * 1000),
    location: "Board Room A - Executive Conference Center",
    isVirtual: false,
    attendees: mockAttendees.slice(0, 8),
    agenda: mockAgendaItems,
    recording: {
      isRecording: true,
      duration: 45,
    },
  },
  {
    id: "meeting-2",
    title: "Audit Committee - Q4 Review",
    type: "committee",
    phase: "upcoming",
    scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
    location: "Virtual - Microsoft Teams",
    isVirtual: true,
    attendees: auditCommitteeAttendees,
    agenda: [],
  },
  {
    id: "meeting-3",
    title: "Risk Committee - Enterprise Risk Review",
    type: "committee",
    phase: "upcoming",
    scheduledStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    location: "Conference Room B - Regional Office",
    isVirtual: false,
    attendees: riskCommitteeAttendees,
    agenda: [],
  },
  {
    id: "meeting-4",
    title: "Q3 Board of Directors Meeting",
    type: "board",
    phase: "completed",
    scheduledStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    actualStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    actualEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
    location: "Board Room A - Executive Conference Center",
    isVirtual: false,
    attendees: mockAttendees.slice(0, 8),
    agenda: [],
  },
  {
    id: "meeting-5",
    title: "Strategic Planning Session - FY2026",
    type: "strategy",
    phase: "completed",
    scheduledStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    actualStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    actualEnd: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000),
    location: "Executive Retreat Center",
    isVirtual: false,
    attendees: mockAttendees.slice(0, 6),
    agenda: [],
  },
];

// ============================================
// Helper Functions
// ============================================

export function getMeetingById(id: string): Meeting | undefined {
  return mockMeetings.find((m) => m.id === id);
}

export function getMeetingsByPhase(phase: Meeting["phase"]): Meeting[] {
  return mockMeetings.filter((m) => m.phase === phase);
}

export function getAttendeeById(id: string): Attendee | undefined {
  return mockAttendees.find((a) => a.id === id);
}

export function getPresentAttendees(): Attendee[] {
  return mockAttendees.filter((a) => a.isPresent);
}

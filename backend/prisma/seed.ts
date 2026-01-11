import { PrismaClient, MeetingType, MeetingPhase, AgendaItemStatus, Priority, QuestionCategory, DocumentType, ActionItemStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.discussionSummary.deleteMany();
  await prisma.meetingSummary.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.detectedDecision.deleteMany();
  await prisma.detectedAction.deleteMany();
  await prisma.liveInsight.deleteMany();
  await prisma.transcriptEntry.deleteMany();
  await prisma.prepQuestion.deleteMany();
  await prisma.briefingDocument.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.attendee.deleteMany();

  // ============================================
  // CREATE ATTENDEES
  // ============================================
  
  const attendees = await Promise.all([
    prisma.attendee.create({
      data: {
        name: 'Margaret Thornton',
        email: 'margaret.thornton@company.com',
        role: 'Board Chair',
        organization: 'Board of Directors',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Robert Castellano',
        email: 'robert.castellano@company.com',
        role: 'Chief Executive Officer',
        organization: 'Executive Leadership',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Dr. Amira Hassan',
        email: 'amira.hassan@company.com',
        role: 'Independent Director',
        organization: 'Board of Directors',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Victoria Blackwood',
        email: 'victoria.blackwood@company.com',
        role: 'Chief Financial Officer',
        organization: 'Executive Leadership',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Richard Ng',
        email: 'richard.ng@company.com',
        role: 'General Counsel',
        organization: 'Legal & Compliance',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Catherine Wells',
        email: 'catherine.wells@company.com',
        role: 'Corporate Secretary',
        organization: 'Governance',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'William Okonkwo',
        email: 'william.okonkwo@company.com',
        role: 'Chief Risk Officer',
        organization: 'Risk Management',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@company.com',
        role: 'Chief Information Security Officer',
        organization: 'Information Security',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Thomas Chen',
        email: 'thomas.chen@company.com',
        role: 'Independent Director',
        organization: 'Board of Directors',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Patricia Sullivan',
        email: 'patricia.sullivan@company.com',
        role: 'Head of Internal Audit',
        organization: 'Internal Audit',
      },
    }),
  ]);

  console.log(`✅ Created ${attendees.length} attendees`);

  // ============================================
  // CREATE MEETINGS
  // ============================================

  const now = new Date();
  
  // Live meeting
  const liveMeeting = await prisma.meeting.create({
    data: {
      title: 'Q4 Board of Directors Meeting',
      type: MeetingType.BOARD,
      phase: MeetingPhase.LIVE,
      scheduledStart: new Date(now.getTime() - 45 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      actualStart: new Date(now.getTime() - 45 * 60 * 1000),
      location: 'Board Room A - Executive Conference Center',
      isVirtual: false,
      isRecording: true,
      recordingDuration: 45,
    },
  });

  // Upcoming meetings
  const upcomingMeeting1 = await prisma.meeting.create({
    data: {
      title: 'Audit Committee - Q4 Review',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      scheduledStart: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
      location: 'Virtual - Microsoft Teams',
      isVirtual: true,
    },
  });

  const upcomingMeeting2 = await prisma.meeting.create({
    data: {
      title: 'Risk Committee - Enterprise Risk Review',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      scheduledStart: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Conference Room B - Regional Office',
      isVirtual: false,
    },
  });

  // Completed meetings
  const completedMeeting1 = await prisma.meeting.create({
    data: {
      title: 'Q3 Board of Directors Meeting',
      type: MeetingType.BOARD,
      phase: MeetingPhase.COMPLETED,
      scheduledStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      actualStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      actualEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
      location: 'Board Room A - Executive Conference Center',
      isVirtual: false,
    },
  });

  const completedMeeting2 = await prisma.meeting.create({
    data: {
      title: 'Strategic Planning Session - FY2026',
      type: MeetingType.STRATEGY,
      phase: MeetingPhase.COMPLETED,
      scheduledStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      actualStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      actualEnd: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000),
      location: 'Executive Retreat Center',
      isVirtual: false,
    },
  });

  console.log('✅ Created 5 meetings');

  // ============================================
  // ADD ATTENDEES TO MEETINGS
  // ============================================

  // Live meeting attendees
  for (let i = 0; i < 8; i++) {
    await prisma.meetingAttendee.create({
      data: {
        meetingId: liveMeeting.id,
        attendeeId: attendees[i].id,
        isPresent: i !== 4, // Richard Ng not present
        isSpeaking: i === 1, // Robert Castellano speaking
      },
    });
  }

  // Audit committee attendees
  const auditAttendeeIds = [2, 8, 3, 9]; // Dr. Hassan, Thomas Chen, Victoria Blackwood, Patricia Sullivan
  for (const idx of auditAttendeeIds) {
    await prisma.meetingAttendee.create({
      data: {
        meetingId: upcomingMeeting1.id,
        attendeeId: attendees[idx].id,
        isPresent: false,
      },
    });
  }

  // Risk committee attendees
  const riskAttendeeIds = [8, 0, 6, 7]; // Thomas Chen, Margaret Thornton, William Okonkwo, Jennifer Martinez
  for (const idx of riskAttendeeIds) {
    await prisma.meetingAttendee.create({
      data: {
        meetingId: upcomingMeeting2.id,
        attendeeId: attendees[idx].id,
        isPresent: false,
      },
    });
  }

  console.log('✅ Added attendees to meetings');

  // ============================================
  // CREATE AGENDA ITEMS FOR LIVE MEETING
  // ============================================

  const agendaItems = await Promise.all([
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 1,
        title: 'Call to Order & Approval of Minutes',
        description: 'Review and approve minutes from Q3 Board Meeting held October 15, 2024',
        duration: 10,
        presenter: 'Margaret Thornton',
        status: AgendaItemStatus.COMPLETED,
        aiAnalysis: {
          summary: 'Standard procedural item. Q3 minutes contain no contested items or required amendments.',
          keyPoints: ['Quorum confirmed with 8 of 9 directors present', 'No amendments to previous minutes requested'],
          suggestedQuestions: [],
          confidence: 0.98,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 2,
        title: 'CEO Report & Strategic Update',
        description: 'Quarterly business performance review, market conditions, and strategic initiative progress',
        duration: 35,
        presenter: 'Robert Castellano',
        status: AgendaItemStatus.IN_PROGRESS,
        aiAnalysis: {
          summary: 'Strong Q4 performance with $4.2B revenue representing 8.3% YoY growth. Three strategic initiatives on track, one requires board attention due to regulatory complexity.',
          keyPoints: [
            'Revenue: $4.2B (8.3% YoY growth, 2.1% above guidance)',
            'EBITDA margin: 22.4% (up 180bps YoY)',
            'Customer NPS improved to 72 (from 68)',
            'Digital transformation Phase II completed on budget',
            'Workforce expanded by 2,400 FTEs globally',
          ],
          risks: [
            'Geopolitical tensions affecting APAC operations',
            'Key competitor announced major acquisition',
            'Talent retention in critical technology roles at 84%',
          ],
          opportunities: [
            'Adjacent market entry opportunity identified ($2.8B TAM)',
            'Strategic partnership discussions with three Fortune 100 companies',
            'AI/ML capabilities driving 15% productivity improvement',
          ],
          suggestedQuestions: [
            'What contingency plans exist for APAC operational disruptions?',
            'How does the competitor acquisition change our competitive positioning?',
            'What retention initiatives are planned for critical technology talent?',
          ],
          confidence: 0.91,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 3,
        title: 'Financial Review & FY2026 Budget Approval',
        description: 'Q4 FY2025 financial results and FY2026 operating budget for board approval',
        duration: 45,
        presenter: 'Victoria Blackwood',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: 'Strong financial position with $2.8B liquidity. FY2026 budget proposes $18.6B operating expenditure with 6.2% revenue growth target.',
          keyPoints: [
            'FY2025 Revenue: $16.4B (exceeded guidance by $340M)',
            'Operating cash flow: $3.1B (19% of revenue)',
            'Liquidity position: $2.8B (cash + facilities)',
            'FY2026 Budget: $18.6B total, $890M R&D allocation',
            'Capital program: $3.2B over 3 years',
            'Dividend maintained at $2.40/share annually',
          ],
          risks: [
            'Currency exposure: 34% of revenue in non-USD',
            'Interest rate sensitivity on $4.2B floating debt',
            'Pension funding status requires monitoring',
          ],
          suggestedQuestions: [
            'What hedging strategies are in place for currency exposure?',
            'How does the capital program prioritization align with strategic objectives?',
            'What is the contingency if revenue growth targets are not met?',
          ],
          confidence: 0.94,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 4,
        title: 'Enterprise Risk Management Review',
        description: 'Quarterly enterprise risk register review and emerging risk assessment',
        duration: 30,
        presenter: 'William Okonkwo',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: '47 risks monitored, 3 elevated to critical status. New emerging risks identified in AI governance and third-party concentration.',
          keyPoints: [
            '3 critical risks: cyber threats, supply chain, regulatory',
            '12 high risks, 20 medium, 12 low',
            'New emerging risk: AI governance and liability',
            'Third-party risk: 4 vendors exceed concentration thresholds',
            'Insurance coverage reviewed and adequate',
          ],
          risks: [
            'Cyber threat landscape increasingly sophisticated',
            'Regulatory changes in EU and APAC accelerating',
            'Climate-related risks require enhanced modeling',
          ],
          suggestedQuestions: [
            'What board oversight is recommended for AI governance?',
            'What is the remediation timeline for critical risks?',
            'How are third-party concentration risks being addressed?',
          ],
          confidence: 0.89,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 5,
        title: 'Cybersecurity Posture Assessment',
        description: 'Annual cybersecurity review, incident summary, and NIST framework compliance',
        duration: 25,
        presenter: 'Jennifer Martinez',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: 'NIST CSF maturity improved to 3.8/5.0. Zero material breaches in FY2025. Four high-priority remediation items in progress.',
          keyPoints: [
            'NIST CSF maturity: 3.8/5.0 (up from 3.4)',
            'Zero material security incidents in FY2025',
            '1,247 phishing attempts blocked (94% automated)',
            'Third-party security assessments: 98% compliance',
            'Security awareness training: 99.2% completion',
            'SOC 2 Type II certification renewed',
          ],
          suggestedQuestions: [
            'What is the investment required to reach 4.0+ maturity?',
            'How are we addressing AI-powered threat vectors?',
            'What is the status of legacy system remediation?',
          ],
          confidence: 0.92,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 6,
        title: 'Digital Transformation - Phase III Authorization',
        description: 'Request for capital authorization for Phase III of enterprise digital transformation program',
        duration: 35,
        presenter: 'Robert Castellano',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: 'Phase III requires $340M authorization over 24 months. Expected to deliver $820M in annual run-rate savings by FY2028.',
          keyPoints: [
            'Investment: $340M over 24 months',
            'Expected ROI: 2.4x over 5 years',
            'Annual run-rate savings: $820M by FY2028',
            'Key components: Cloud migration, AI/ML platform, process automation',
            'Workforce impact: 1,200 roles transformed, 400 new digital roles',
            'Phase I & II delivered $410M in savings (102% of target)',
          ],
          risks: [
            'Integration complexity with legacy systems',
            'Change management and adoption risk',
            'Vendor dependency on three critical technology partners',
          ],
          suggestedQuestions: [
            'What governance structure will oversee Phase III execution?',
            'How are workforce transition impacts being managed?',
            'What are the key decision gates and milestones?',
          ],
          confidence: 0.87,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 7,
        title: 'Regulatory & Compliance Update',
        description: 'Regulatory compliance status, pending matters, and policy updates',
        duration: 20,
        presenter: 'Richard Ng',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: 'Full compliance maintained across 23 regulatory frameworks. Three new regulatory requirements effective Q2 FY2026.',
          keyPoints: [
            'SOX compliance: Unqualified opinion expected',
            'GDPR/CCPA: Zero material findings',
            'New EU AI Act requirements effective Q2 2026',
            'SEC climate disclosure rules: Implementation on track',
            'Pending litigation: 4 matters, none material',
          ],
          suggestedQuestions: [
            'What resources are required for EU AI Act compliance?',
            'What is the status of the pending litigation matters?',
            'Are there any regulatory examinations in progress?',
          ],
          confidence: 0.93,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 8,
        title: 'ESG & Sustainability Progress',
        description: 'Environmental, social, and governance metrics review and sustainability initiatives',
        duration: 20,
        presenter: 'Robert Castellano',
        status: AgendaItemStatus.PENDING,
        aiAnalysis: {
          summary: 'On track to meet 2030 net-zero commitment. Diversity metrics improved across all categories. MSCI ESG rating upgraded to AA.',
          keyPoints: [
            'Carbon emissions: 42% reduction from 2019 baseline',
            'Renewable energy: 78% of operations',
            'Board diversity: 44% women, 33% underrepresented groups',
            'Executive diversity: 38% women, 28% underrepresented',
            'MSCI ESG rating: Upgraded to AA (from A)',
            'Community investment: $47M in FY2025',
          ],
          suggestedQuestions: [
            'What investments are required to achieve the 2030 net-zero target?',
            'How does our ESG performance compare to peer group?',
            'What are the key priorities for improving to AAA rating?',
          ],
          confidence: 0.90,
        },
      },
    }),
    prisma.agendaItem.create({
      data: {
        meetingId: liveMeeting.id,
        order: 9,
        title: 'Executive Session & Adjournment',
        description: 'Board executive session without management present',
        duration: 20,
        presenter: 'Margaret Thornton',
        status: AgendaItemStatus.PENDING,
      },
    }),
  ]);

  console.log(`✅ Created ${agendaItems.length} agenda items`);

  // ============================================
  // CREATE DOCUMENTS
  // ============================================

  await Promise.all([
    prisma.briefingDocument.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[1].id,
        title: 'FY2025 Q4 Consolidated Financial Statements (Unaudited)',
        type: DocumentType.PDF,
        url: '/documents/fy25-q4-financials.pdf',
        summary: 'Consolidated financial results for Q4 FY2025 showing $4.2B revenue, 8.3% YoY growth. EBITDA margin at 22.4%, ahead of guidance.',
      },
    }),
    prisma.briefingDocument.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[3].id,
        title: 'Enterprise Risk Register - Q4 Update',
        type: DocumentType.SPREADSHEET,
        url: '/documents/risk-register-q4.xlsx',
        summary: 'Updated enterprise risk assessment with 47 identified risks. 3 elevated to critical status.',
      },
    }),
    prisma.briefingDocument.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[5].id,
        title: 'Digital Transformation Program - Phase III Authorization Request',
        type: DocumentType.PRESENTATION,
        url: '/documents/digital-transform-phase3.pptx',
        summary: 'Request for $340M capital authorization for Phase III of enterprise digital transformation.',
      },
    }),
    prisma.briefingDocument.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[4].id,
        title: 'Cybersecurity Posture Assessment - Annual Review',
        type: DocumentType.PDF,
        url: '/documents/cyber-assessment-fy25.pdf',
        summary: 'Annual NIST CSF assessment results. Overall maturity score improved to 3.8/5.0.',
      },
    }),
  ]);

  console.log('✅ Created briefing documents');

  // ============================================
  // CREATE PREP QUESTIONS
  // ============================================

  await Promise.all([
    prisma.prepQuestion.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[1].id,
        question: 'Given the geopolitical tensions affecting APAC, what scenario planning has been conducted for potential operational disruptions?',
        category: QuestionCategory.RISK,
        priority: Priority.HIGH,
        aiGenerated: true,
      },
    }),
    prisma.prepQuestion.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[5].id,
        question: 'How does the proposed $340M Phase III investment compare to peer digital transformation spending as a percentage of revenue?',
        category: QuestionCategory.STRATEGIC,
        priority: Priority.HIGH,
        aiGenerated: true,
      },
    }),
    prisma.prepQuestion.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[3].id,
        question: 'What board-level oversight structure is recommended for the emerging AI governance risks identified in the risk register?',
        category: QuestionCategory.RISK,
        priority: Priority.HIGH,
        aiGenerated: true,
      },
    }),
    prisma.prepQuestion.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[2].id,
        question: 'With 34% of revenue in non-USD currencies, what is the potential P&L impact of a 10% adverse currency movement?',
        category: QuestionCategory.OPERATIONAL,
        priority: Priority.MEDIUM,
        aiGenerated: true,
      },
    }),
    prisma.prepQuestion.create({
      data: {
        meetingId: liveMeeting.id,
        question: 'What is the succession planning status for the CEO and other C-suite positions?',
        category: QuestionCategory.STRATEGIC,
        priority: Priority.MEDIUM,
        aiGenerated: false,
      },
    }),
  ]);

  console.log('✅ Created prep questions');

  // ============================================
  // CREATE SUMMARY FOR COMPLETED MEETING
  // ============================================

  const summary = await prisma.meetingSummary.create({
    data: {
      meetingId: completedMeeting1.id,
      overview: 'The Q3 Board of Directors meeting addressed quarterly performance, enterprise risk management updates, and strategic initiatives. The board approved the FY2025 capital program amendment and endorsed preliminary FY2026 budget guidelines.',
      attendanceNotes: 'All eight board members present throughout the meeting. General Counsel participated for compliance-related items.',
      nextSteps: [
        'Q4 Board Meeting scheduled for current date with Phase III authorization vote',
        'Risk Committee to present AI Governance Framework at February meeting',
        'Audit Committee to review external auditor report at January meeting',
      ],
    },
  });

  await Promise.all([
    prisma.discussionSummary.create({
      data: {
        summaryId: summary.id,
        agendaItemId: agendaItems[0].id, // Using live meeting agenda item for reference
        title: 'Q3 Financial Performance Review',
        summary: 'CFO presented quarterly results showing $3.9B revenue with 7.2% YoY growth. EBITDA margin reached 21.8%, exceeding guidance.',
        keyPoints: [
          'Revenue: $3.9B (7.2% YoY growth, 1.5% above guidance)',
          'EBITDA margin improved to 21.8%',
          'Cash position strengthened to $2.6B',
        ],
        outcome: 'Board expressed satisfaction with financial performance',
        duration: 40,
      },
    }),
  ]);

  console.log('✅ Created meeting summary');

  // ============================================
  // CREATE DECISIONS FOR COMPLETED MEETING
  // ============================================

  await Promise.all([
    prisma.decision.create({
      data: {
        meetingId: completedMeeting1.id,
        description: 'Approved amendment to FY2025 Capital Program increasing authorization by $180M for infrastructure modernization',
        rationale: 'Required to accelerate data center consolidation and support cloud migration targets',
        votedFor: 8,
        votedAgainst: 0,
        abstained: 0,
      },
    }),
    prisma.decision.create({
      data: {
        meetingId: completedMeeting1.id,
        description: 'Endorsed preliminary FY2026 operating budget guidelines with 6.2% revenue growth target',
        rationale: 'Aligned with strategic plan and market opportunity assessment',
        votedFor: 7,
        votedAgainst: 0,
        abstained: 1,
      },
    }),
  ]);

  console.log('✅ Created decisions');

  // ============================================
  // CREATE ACTION ITEMS
  // ============================================

  await Promise.all([
    prisma.actionItem.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[5].id,
        description: 'Present Phase III digital transformation business case with $340M authorization request',
        assigneeId: attendees[1].id, // Robert Castellano
        dueDate: now,
        priority: Priority.HIGH,
        status: ActionItemStatus.IN_PROGRESS,
        notes: 'Materials prepared and included in board pack.',
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[2].id,
        description: 'Present FY2026 operating budget for board approval',
        assigneeId: attendees[3].id, // Victoria Blackwood
        dueDate: now,
        priority: Priority.HIGH,
        status: ActionItemStatus.COMPLETED,
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId: liveMeeting.id,
        agendaItemId: agendaItems[3].id,
        description: 'Provide Enterprise Risk Register quarterly update with emerging risk analysis',
        assigneeId: attendees[6].id, // William Okonkwo
        dueDate: now,
        priority: Priority.HIGH,
        status: ActionItemStatus.IN_PROGRESS,
      },
    }),
    prisma.actionItem.create({
      data: {
        meetingId: completedMeeting1.id,
        description: 'Develop AI Governance Framework and present to Risk Committee for review',
        assigneeId: attendees[6].id, // William Okonkwo
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
        status: ActionItemStatus.IN_PROGRESS,
      },
    }),
  ]);

  console.log('✅ Created action items');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

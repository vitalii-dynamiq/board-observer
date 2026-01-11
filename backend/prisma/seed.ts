import { PrismaClient, MeetingType, MeetingPhase, AgendaItemStatus, Priority, QuestionCategory, DocumentType, ActionItemStatus, UserRole, OrgMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ORGANIZATION-SPECIFIC SEED DATA
// ============================================

interface OrgSeedData {
  name: string;
  slug: string;
  logo?: string;
  industry: string;
  country: string;
  attendees: {
    name: string;
    email: string;
    title: string;
    department: string;
    isExternal?: boolean;
  }[];
  meetings: {
    title: string;
    type: MeetingType;
    phase: MeetingPhase;
    dayOffset: number; // Days from now (negative = past)
    durationHours: number;
    location: string;
    isVirtual: boolean;
    agendaItems: {
      title: string;
      description: string;
      duration: number;
      presenterIndex: number;
    }[];
  }[];
}

// ============================================
// EMIRATES POST - Postal & Logistics
// ============================================
const emiratesPostData: OrgSeedData = {
  name: 'Emirates Post',
  slug: 'emirates-post',
  logo: '/logos/emirates-post.png',
  industry: 'Postal & Logistics',
  country: 'UAE',
  attendees: [
    { name: 'H.E. Abdulla Mohammed Al Ashram', email: 'a.alashram@emiratespost.ae', title: 'Group CEO', department: 'Executive Office' },
    { name: 'Fatima Al Marzouqi', email: 'f.almarzouqi@emiratespost.ae', title: 'Deputy CEO - Operations', department: 'Operations' },
    { name: 'Khalid bin Rashid', email: 'k.rashid@emiratespost.ae', title: 'Chief Financial Officer', department: 'Finance' },
    { name: 'Sara Al Hammadi', email: 's.alhammadi@emiratespost.ae', title: 'Chief Digital Officer', department: 'Digital Transformation' },
    { name: 'Ahmed Al Suwaidi', email: 'a.alsuwaidi@emiratespost.ae', title: 'Chief Commercial Officer', department: 'Commercial' },
    { name: 'Mariam Al Khoori', email: 'm.alkhoori@emiratespost.ae', title: 'Chief Human Resources Officer', department: 'Human Resources' },
    { name: 'Dr. Rashid Al Mansoori', email: 'r.almansoori@emiratespost.ae', title: 'Board Member', department: 'Board of Directors', isExternal: true },
    { name: 'Noura Al Shamsi', email: 'n.alshamsi@emiratespost.ae', title: 'Head of Corporate Governance', department: 'Governance' },
  ],
  meetings: [
    {
      title: 'Q4 2025 Board of Directors Meeting',
      type: MeetingType.BOARD,
      phase: MeetingPhase.LIVE,
      dayOffset: 0,
      durationHours: 3,
      location: 'Emirates Post HQ - Board Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Call to Order & Approval of Previous Minutes', description: 'Review and approve Q3 2025 Board Meeting minutes', duration: 10, presenterIndex: 0 },
        { title: 'Group CEO Strategic Update', description: 'Overview of postal network modernization and e-commerce fulfillment growth', duration: 30, presenterIndex: 0 },
        { title: 'Financial Performance Review - Q4 2025', description: 'Revenue analysis: AED 2.8B | Parcel volumes up 34% YoY | Last-mile delivery expansion', duration: 35, presenterIndex: 2 },
        { title: 'Digital Transformation Progress', description: 'Smart Locker Network rollout (847 units deployed) | Mobile app adoption at 2.1M users', duration: 25, presenterIndex: 3 },
        { title: 'E-Commerce Fulfillment Center Expansion', description: 'Request approval for AED 890M investment in 3 new fulfillment centers across UAE', duration: 30, presenterIndex: 4 },
        { title: 'Fleet Electrification Program Update', description: '450 EV delivery vehicles deployed | On track for 80% electric fleet by 2028', duration: 20, presenterIndex: 1 },
        { title: 'Regional Expansion Strategy - GCC Markets', description: 'Proposed entry into Saudi Arabia and Oman postal markets through strategic partnerships', duration: 25, presenterIndex: 4 },
        { title: 'Any Other Business & Adjournment', description: 'Board executive session', duration: 15, presenterIndex: 0 },
      ],
    },
    {
      title: 'Audit Committee - Year-End Review',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      dayOffset: 3,
      durationHours: 2.5,
      location: 'Virtual - Microsoft Teams',
      isVirtual: true,
      agendaItems: [
        { title: 'External Audit Findings Presentation', description: 'PWC presents FY2025 audit findings and management letter', duration: 45, presenterIndex: 2 },
        { title: 'Internal Audit Report', description: 'Summary of 12 internal audits conducted in FY2025', duration: 30, presenterIndex: 7 },
        { title: 'Compliance Update', description: 'Regulatory compliance status across UAE postal regulations', duration: 25, presenterIndex: 7 },
      ],
    },
    {
      title: 'Q3 Board of Directors Meeting',
      type: MeetingType.BOARD,
      phase: MeetingPhase.COMPLETED,
      dayOffset: -45,
      durationHours: 3,
      location: 'Emirates Post HQ - Board Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Q3 Financial Review', description: 'Quarterly financial performance and budget variance analysis', duration: 40, presenterIndex: 2 },
        { title: 'Operational Excellence Program', description: 'Delivery time improvements and customer satisfaction scores', duration: 30, presenterIndex: 1 },
      ],
    },
  ],
};

// ============================================
// ABU DHABI DEPARTMENT OF FINANCE - Government Finance
// ============================================
const adDeptFinanceData: OrgSeedData = {
  name: 'Abu Dhabi Department of Finance',
  slug: 'ad-dept-finance',
  logo: '/logos/addof.png',
  industry: 'Government Finance',
  country: 'UAE',
  attendees: [
    { name: 'H.E. Jassem Mohamed Al Zaabi', email: 'j.alzaabi@dof.abudhabi.ae', title: 'Chairman', department: 'Executive Office' },
    { name: 'Maryam Al Suwaidi', email: 'm.alsuwaidi@dof.abudhabi.ae', title: 'Director General', department: 'Executive Office' },
    { name: 'Mohammed Al Shorafa', email: 'm.alshorafa@dof.abudhabi.ae', title: 'Executive Director - Budget & Revenue', department: 'Budget & Revenue' },
    { name: 'Khaled Al Qubaisi', email: 'k.alqubaisi@dof.abudhabi.ae', title: 'Executive Director - Investment', department: 'Investment Office' },
    { name: 'Dr. Aisha Al Mulla', email: 'a.almulla@dof.abudhabi.ae', title: 'Executive Director - Policy & Strategy', department: 'Policy & Strategy' },
    { name: 'Sultan Al Dhaheri', email: 's.aldhaheri@dof.abudhabi.ae', title: 'Chief Financial Officer', department: 'Finance' },
    { name: 'Nadia Hassan', email: 'n.hassan@dof.abudhabi.ae', title: 'Director - Government Relations', department: 'Government Relations' },
    { name: 'Rashid Al Ketbi', email: 'r.alketbi@dof.abudhabi.ae', title: 'Director - Internal Audit', department: 'Internal Audit' },
    { name: 'Salem Al Ameri', email: 's.alameri@mof.gov.ae', title: 'Ministry of Finance Representative', department: 'Federal Government', isExternal: true },
  ],
  meetings: [
    {
      title: 'FY2026 Budget Planning Committee',
      type: MeetingType.STRATEGY,
      phase: MeetingPhase.LIVE,
      dayOffset: 0,
      durationHours: 4,
      location: 'ADGM Tower - Executive Conference Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Opening & Strategic Context', description: 'Emirate economic outlook and fiscal priorities for FY2026', duration: 20, presenterIndex: 0 },
        { title: 'FY2025 Budget Execution Review', description: 'AED 89.4B executed | 97.2% execution rate | Surplus of AED 4.2B', duration: 40, presenterIndex: 2 },
        { title: 'FY2026 Revenue Projections', description: 'Non-oil revenue diversification progress | Projected government revenue AED 98.7B', duration: 35, presenterIndex: 2 },
        { title: 'Infrastructure Investment Priorities', description: 'AED 32B infrastructure program | Housing, transport, utilities allocation', duration: 30, presenterIndex: 3 },
        { title: 'Public Sector Compensation Review', description: 'Benchmarking study results and recommendations for civil service pay scales', duration: 25, presenterIndex: 4 },
        { title: 'Sovereign Wealth Coordination', description: 'Alignment with ADIA and Mubadala investment strategies', duration: 30, presenterIndex: 3 },
        { title: 'Digital Government Investment', description: 'TAMM platform expansion and government services digitization budget', duration: 25, presenterIndex: 4 },
        { title: 'Budget Approval & Next Steps', description: 'Committee recommendations for Executive Council submission', duration: 15, presenterIndex: 0 },
      ],
    },
    {
      title: 'Government Entity Financial Review',
      type: MeetingType.REVIEW,
      phase: MeetingPhase.UPCOMING,
      dayOffset: 5,
      durationHours: 3,
      location: 'Department of Finance HQ',
      isVirtual: false,
      agendaItems: [
        { title: 'GRE Financial Performance Overview', description: 'Consolidated review of 47 Government-Related Entities', duration: 45, presenterIndex: 5 },
        { title: 'Entity-Specific Deep Dives', description: 'Focus on ADNOC, Mubadala, ADQ performance', duration: 60, presenterIndex: 3 },
        { title: 'Risk Assessment Update', description: 'Credit ratings, debt levels, and contingent liabilities', duration: 30, presenterIndex: 7 },
      ],
    },
    {
      title: 'Q3 Financial Performance Review',
      type: MeetingType.BOARD,
      phase: MeetingPhase.COMPLETED,
      dayOffset: -30,
      durationHours: 2.5,
      location: 'ADGM Tower - Executive Conference Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Q3 Revenue Collection', description: 'Tax revenue, fees, and investment income analysis', duration: 40, presenterIndex: 2 },
        { title: 'Expenditure Analysis', description: 'Department spending patterns and variance analysis', duration: 35, presenterIndex: 5 },
      ],
    },
  ],
};

// ============================================
// ABU DHABI DEPARTMENT OF HEALTH - Healthcare
// ============================================
const adDeptHealthData: OrgSeedData = {
  name: 'Abu Dhabi Department of Health',
  slug: 'ad-dept-health',
  logo: '/logos/doh.png',
  industry: 'Healthcare & Public Health',
  country: 'UAE',
  attendees: [
    { name: 'H.E. Sheikh Abdullah bin Mohammed Al Hamed', email: 's.alhamed@doh.gov.ae', title: 'Chairman', department: 'Executive Office' },
    { name: 'Dr. Jamal Al Kaabi', email: 'j.alkaabi@doh.gov.ae', title: 'Undersecretary', department: 'Executive Office' },
    { name: 'Dr. Noura Al Ghaithi', email: 'n.alghaithi@doh.gov.ae', title: 'Executive Director - Healthcare Quality', department: 'Healthcare Quality' },
    { name: 'Dr. Farida Al Hosani', email: 'f.alhosani@doh.gov.ae', title: 'Executive Director - Public Health', department: 'Public Health' },
    { name: 'Salem Al Nuaimi', email: 's.alnuaimi@doh.gov.ae', title: 'Executive Director - Strategy & Performance', department: 'Strategy' },
    { name: 'Hamad Al Rumaithi', email: 'h.alrumaithi@doh.gov.ae', title: 'Chief Financial Officer', department: 'Finance' },
    { name: 'Dr. Omniyat Al Hajeri', email: 'o.alhajeri@doh.gov.ae', title: 'Director - Medical Education', department: 'Medical Education' },
    { name: 'Fatima Al Kaabi', email: 'f.alkaabi@doh.gov.ae', title: 'Director - Healthcare Licensing', department: 'Licensing & Regulation' },
    { name: 'Dr. Ahmed Al Mazrouei', email: 'a.almazrouei@seha.ae', title: 'SEHA Group CEO', department: 'SEHA Health System', isExternal: true },
  ],
  meetings: [
    {
      title: 'Healthcare System Transformation Committee',
      type: MeetingType.STRATEGY,
      phase: MeetingPhase.LIVE,
      dayOffset: 0,
      durationHours: 3.5,
      location: 'DoH Headquarters - Al Mamoura',
      isVirtual: false,
      agendaItems: [
        { title: 'Opening & Healthcare Vision 2030 Progress', description: 'Strategic alignment with UAE Centennial 2071 healthcare goals', duration: 15, presenterIndex: 0 },
        { title: 'Population Health Outcomes Report', description: 'Life expectancy increased to 82.1 years | Chronic disease management improvements', duration: 30, presenterIndex: 3 },
        { title: 'Healthcare Capacity Expansion', description: '3,400 new hospital beds added in FY2025 | 94.2% bed occupancy rate optimization', duration: 35, presenterIndex: 1 },
        { title: 'Thiqa Insurance Program Update', description: '1.2M beneficiaries | AED 4.8B claims processed | Provider network expansion', duration: 25, presenterIndex: 5 },
        { title: 'Digital Health Transformation', description: 'Riayati platform: 3.8M registered users | Telemedicine consultations up 156%', duration: 30, presenterIndex: 4 },
        { title: 'Healthcare Workforce Development', description: 'Emiratization in healthcare: 12.4% (target 15%) | Medical residency program expansion', duration: 25, presenterIndex: 6 },
        { title: 'SEHA Integration & Performance', description: 'Public hospital network performance metrics and integration roadmap', duration: 30, presenterIndex: 8 },
        { title: 'Mental Health Services Expansion', description: 'New mental health facilities and community programs | AED 340M investment request', duration: 20, presenterIndex: 3 },
        { title: 'Closing & Action Items', description: 'Summary of decisions and next steps', duration: 10, presenterIndex: 0 },
      ],
    },
    {
      title: 'Healthcare Quality & Patient Safety Committee',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      dayOffset: 7,
      durationHours: 2,
      location: 'Virtual - Webex',
      isVirtual: true,
      agendaItems: [
        { title: 'Hospital Accreditation Status', description: 'JCI and CBAHI accreditation progress across 47 facilities', duration: 35, presenterIndex: 2 },
        { title: 'Patient Safety Metrics', description: 'Adverse event reporting and improvement initiatives', duration: 30, presenterIndex: 2 },
        { title: 'Licensing Compliance Review', description: 'Healthcare professional licensing and facility compliance', duration: 25, presenterIndex: 7 },
      ],
    },
    {
      title: 'Public Health Emergency Preparedness Review',
      type: MeetingType.OPERATIONS,
      phase: MeetingPhase.COMPLETED,
      dayOffset: -21,
      durationHours: 2,
      location: 'DoH Headquarters - Al Mamoura',
      isVirtual: false,
      agendaItems: [
        { title: 'Emergency Response Capabilities', description: 'Assessment of pandemic preparedness and response infrastructure', duration: 40, presenterIndex: 3 },
        { title: 'Vaccination Program Update', description: 'National immunization program coverage and expansion plans', duration: 35, presenterIndex: 3 },
      ],
    },
  ],
};

// ============================================
// ABU DHABI DEPARTMENT OF GOVERNMENT ENABLEMENT
// ============================================
const adDeptGovEnablementData: OrgSeedData = {
  name: 'Abu Dhabi Department of Government Enablement',
  slug: 'ad-dept-gov-enablement',
  logo: '/logos/dge.png',
  industry: 'Government Services',
  country: 'UAE',
  attendees: [
    { name: 'H.E. Ahmad Al Mazrouei', email: 'a.almazrouei@dge.gov.ae', title: 'Director General', department: 'Executive Office' },
    { name: 'Saeed Al Dhaheri', email: 's.aldhaheri@dge.gov.ae', title: 'Deputy Director General', department: 'Executive Office' },
    { name: 'Fatima Al Rumaithi', email: 'f.alrumaithi@dge.gov.ae', title: 'Executive Director - Shared Services', department: 'Shared Services' },
    { name: 'Omar Al Mheiri', email: 'o.almheiri@dge.gov.ae', title: 'Executive Director - Digital Government', department: 'Digital Government' },
    { name: 'Moza Al Nahyan', email: 'm.alnahyan@dge.gov.ae', title: 'Executive Director - Human Capital', department: 'Human Capital' },
    { name: 'Khalifa Al Qubaisi', email: 'k.alqubaisi@dge.gov.ae', title: 'Executive Director - Procurement', department: 'Procurement' },
    { name: 'Amna Al Ketbi', email: 'a.alketbi@dge.gov.ae', title: 'Director - Performance Management', department: 'Performance' },
    { name: 'Rashid Al Shamsi', email: 'r.alshamsi@dge.gov.ae', title: 'Chief Technology Officer', department: 'Technology' },
    { name: 'Hessa Al Blooshi', email: 'h.alblooshi@adda.gov.ae', title: 'ADDA Representative', department: 'Abu Dhabi Digital Authority', isExternal: true },
  ],
  meetings: [
    {
      title: 'Government Excellence Program Review',
      type: MeetingType.BOARD,
      phase: MeetingPhase.LIVE,
      dayOffset: 0,
      durationHours: 3,
      location: 'DGE Headquarters - Abu Dhabi',
      isVirtual: false,
      agendaItems: [
        { title: 'Opening & Government Excellence Framework Update', description: 'Progress on Abu Dhabi Government Excellence System implementation', duration: 15, presenterIndex: 0 },
        { title: 'Shared Services Performance Dashboard', description: 'Finance, HR, IT shared services: 47 entities served | 23% cost reduction achieved', duration: 35, presenterIndex: 2 },
        { title: 'TAMM Digital Platform Enhancement', description: '340+ government services digitized | 4.2M transactions processed | 92% satisfaction rate', duration: 30, presenterIndex: 3 },
        { title: 'Government Procurement Optimization', description: 'Centralized procurement: AED 8.4B processed | 18% savings through strategic sourcing', duration: 25, presenterIndex: 5 },
        { title: 'Civil Service Transformation', description: 'Workforce planning initiatives | Leadership development program: 2,400 participants', duration: 30, presenterIndex: 4 },
        { title: 'AI in Government Services', description: 'ChatGPT-powered citizen services | Predictive analytics for resource allocation', duration: 25, presenterIndex: 7 },
        { title: 'Inter-Entity Collaboration Initiatives', description: 'Cross-government integration projects and data sharing frameworks', duration: 20, presenterIndex: 8 },
        { title: 'FY2026 Strategic Priorities', description: 'Budget allocation and key initiatives for next fiscal year', duration: 20, presenterIndex: 1 },
      ],
    },
    {
      title: 'Digital Transformation Steering Committee',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      dayOffset: 4,
      durationHours: 2.5,
      location: 'Virtual - Microsoft Teams',
      isVirtual: true,
      agendaItems: [
        { title: 'Cloud Migration Progress', description: 'Government cloud adoption: 67% of systems migrated', duration: 30, presenterIndex: 7 },
        { title: 'Cybersecurity Posture Assessment', description: 'Government-wide security assessment and improvement roadmap', duration: 35, presenterIndex: 7 },
        { title: 'Data Governance Framework', description: 'Cross-entity data standards and privacy compliance', duration: 25, presenterIndex: 3 },
      ],
    },
    {
      title: 'Human Capital Development Review',
      type: MeetingType.REVIEW,
      phase: MeetingPhase.COMPLETED,
      dayOffset: -14,
      durationHours: 2,
      location: 'DGE Headquarters - Abu Dhabi',
      isVirtual: false,
      agendaItems: [
        { title: 'Emiratization Progress', description: 'Government sector Emiratization rates and programs', duration: 40, presenterIndex: 4 },
        { title: 'Training & Development Metrics', description: 'Learning hours, certifications, and capability building', duration: 35, presenterIndex: 4 },
      ],
    },
  ],
};

// ============================================
// ADDITIONAL ORGANIZATION - MUBADALA (Investment)
// ============================================
const mubadalaData: OrgSeedData = {
  name: 'Mubadala Investment Company',
  slug: 'mubadala',
  logo: '/logos/mubadala.png',
  industry: 'Sovereign Wealth Fund',
  country: 'UAE',
  attendees: [
    { name: 'H.E. Khaldoon Khalifa Al Mubarak', email: 'k.almubarak@mubadala.ae', title: 'Group CEO & Managing Director', department: 'Executive Office' },
    { name: 'Waleed Al Mokarrab Al Muhairi', email: 'w.almuhairi@mubadala.ae', title: 'Deputy Group CEO', department: 'Executive Office' },
    { name: 'Ahmed Saeed Al Calily', email: 'a.alcalily@mubadala.ae', title: 'Chief Financial Officer', department: 'Finance' },
    { name: 'Musabbeh Al Kaabi', email: 'm.alkaabi@mubadala.ae', title: 'CEO - UAE Investments Platform', department: 'UAE Investments' },
    { name: 'Badr Al-Olama', email: 'b.alolama@mubadala.ae', title: 'CEO - Aerospace, Renewables & ICT', department: 'Industry Platform' },
    { name: 'Homaid Al Shimmari', email: 'h.alshimmari@mubadala.ae', title: 'CEO - Industrials', department: 'Industrial Platform' },
    { name: 'Fatema Al Nuaimi', email: 'f.alnuaimi@mubadala.ae', title: 'Chief Human Capital Officer', department: 'Human Capital' },
    { name: 'Ibrahim Ajami', email: 'i.ajami@mubadala.ae', title: 'Head of Ventures', department: 'Ventures' },
    { name: 'Majid Al Shamsi', email: 'm.alshamsi@adia.ae', title: 'ADIA Liaison', department: 'Abu Dhabi Investment Authority', isExternal: true },
  ],
  meetings: [
    {
      title: 'Investment Committee - Q4 Portfolio Review',
      type: MeetingType.BOARD,
      phase: MeetingPhase.LIVE,
      dayOffset: 0,
      durationHours: 4,
      location: 'Mubadala Tower - Board Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Portfolio Performance Overview', description: 'AUM: $302B | Q4 returns: 8.2% | 5-year CAGR: 11.4%', duration: 25, presenterIndex: 0 },
        { title: 'Financial Results & NAV Update', description: 'Net asset value movements and financial position', duration: 35, presenterIndex: 2 },
        { title: 'Global Markets Assessment', description: 'Macroeconomic outlook and investment implications', duration: 30, presenterIndex: 1 },
        { title: 'Technology Investment Review', description: 'AI/ML portfolio: $18B deployed | Key positions: NVIDIA, Microsoft, OpenAI', duration: 35, presenterIndex: 7 },
        { title: 'Renewable Energy & Sustainability', description: 'Masdar performance: 20GW capacity | $30B green investment pipeline', duration: 30, presenterIndex: 4 },
        { title: 'Healthcare & Life Sciences', description: 'Cleveland Clinic Abu Dhabi | Life sciences venture portfolio', duration: 25, presenterIndex: 3 },
        { title: 'Industrial Platform Update', description: 'GTA, Strata, Emirates Steel performance metrics', duration: 25, presenterIndex: 5 },
        { title: 'New Investment Proposals', description: '3 new investments totaling $2.4B for approval', duration: 30, presenterIndex: 1 },
        { title: 'Executive Session', description: 'Confidential matters and board-only discussion', duration: 15, presenterIndex: 0 },
      ],
    },
    {
      title: 'Risk & Compliance Committee',
      type: MeetingType.COMMITTEE,
      phase: MeetingPhase.UPCOMING,
      dayOffset: 6,
      durationHours: 2,
      location: 'Mubadala Tower - Meeting Room 2',
      isVirtual: false,
      agendaItems: [
        { title: 'Portfolio Risk Assessment', description: 'Concentration risks, currency exposure, and hedging strategies', duration: 40, presenterIndex: 2 },
        { title: 'Regulatory Compliance Update', description: 'International investment regulations and compliance status', duration: 30, presenterIndex: 2 },
      ],
    },
    {
      title: 'Q3 Investment Committee Meeting',
      type: MeetingType.BOARD,
      phase: MeetingPhase.COMPLETED,
      dayOffset: -60,
      durationHours: 3.5,
      location: 'Mubadala Tower - Board Room',
      isVirtual: false,
      agendaItems: [
        { title: 'Q3 Portfolio Review', description: 'Performance analysis and rebalancing decisions', duration: 45, presenterIndex: 0 },
        { title: 'New Investment Approvals', description: 'Investment decisions on 4 new opportunities', duration: 50, presenterIndex: 1 },
      ],
    },
  ],
};

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedOrganization(data: OrgSeedData) {
  console.log(`\n📦 Seeding organization: ${data.name}`);

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      industry: data.industry,
      country: data.country,
      timezone: 'Asia/Dubai',
    },
  });

  // Create attendees
  const attendees = await Promise.all(
    data.attendees.map((a) =>
      prisma.attendee.create({
        data: {
          organizationId: org.id,
          name: a.name,
          email: a.email,
          title: a.title,
          department: a.department,
          isExternal: a.isExternal || false,
        },
      })
    )
  );

  console.log(`  ✅ Created ${attendees.length} attendees`);

  // Create meetings with agenda items
  const now = new Date();
  
  for (const meetingData of data.meetings) {
    const startTime = new Date(now.getTime() + meetingData.dayOffset * 24 * 60 * 60 * 1000);
    // If it's a live meeting, set start time to 45 mins ago
    if (meetingData.phase === MeetingPhase.LIVE) {
      startTime.setMinutes(startTime.getMinutes() - 45);
    }
    const endTime = new Date(startTime.getTime() + meetingData.durationHours * 60 * 60 * 1000);

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: org.id,
        title: meetingData.title,
        type: meetingData.type,
        phase: meetingData.phase,
        scheduledStart: startTime,
        scheduledEnd: endTime,
        actualStart: meetingData.phase !== MeetingPhase.UPCOMING ? startTime : null,
        actualEnd: meetingData.phase === MeetingPhase.COMPLETED ? endTime : null,
        location: meetingData.location,
        isVirtual: meetingData.isVirtual,
        isRecording: meetingData.phase === MeetingPhase.LIVE,
        recordingDuration: meetingData.phase === MeetingPhase.LIVE ? 45 : 0,
      },
    });

    // Add attendees to meeting
    const attendeeIndices = meetingData.phase === MeetingPhase.LIVE
      ? [0, 1, 2, 3, 4, 5, 6, 7] // Most attendees for live
      : meetingData.phase === MeetingPhase.UPCOMING
      ? [0, 1, 2, 3] // Fewer for upcoming
      : [0, 1, 2, 3, 4, 5]; // Some for completed

    for (const idx of attendeeIndices) {
      if (attendees[idx]) {
        await prisma.meetingAttendee.create({
          data: {
            meetingId: meeting.id,
            attendeeId: attendees[idx].id,
            isPresent: meetingData.phase === MeetingPhase.LIVE,
            isSpeaking: meetingData.phase === MeetingPhase.LIVE && idx === 0,
          },
        });
      }
    }

    // Create agenda items
    for (let i = 0; i < meetingData.agendaItems.length; i++) {
      const item = meetingData.agendaItems[i];
      const presenterIdx = Math.min(item.presenterIndex, attendees.length - 1);
      
      await prisma.agendaItem.create({
        data: {
          meetingId: meeting.id,
          order: i + 1,
          title: item.title,
          description: item.description,
          duration: item.duration,
          presenter: attendees[presenterIdx]?.name,
          status: i === 0 && meetingData.phase === MeetingPhase.LIVE
            ? AgendaItemStatus.COMPLETED
            : i === 1 && meetingData.phase === MeetingPhase.LIVE
            ? AgendaItemStatus.IN_PROGRESS
            : AgendaItemStatus.PENDING,
        },
      });
    }
  }

  console.log(`  ✅ Created ${data.meetings.length} meetings with agenda items`);

  return org;
}

async function main() {
  console.log('🌱 Seeding multi-tenant database...\n');

  // Clean existing data in correct order
  console.log('🧹 Cleaning existing data...');
  await prisma.discussionSummary.deleteMany();
  await prisma.meetingSummary.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.detectedDecision.deleteMany();
  await prisma.detectedAction.deleteMany();
  await prisma.liveInsight.deleteMany();
  await prisma.agentInsight.deleteMany();
  await prisma.transcriptEntry.deleteMany();
  await prisma.prepQuestion.deleteMany();
  await prisma.briefingDocument.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meetingBot.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@boardobserver.ai',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log('👤 Created admin user: admin@boardobserver.ai');

  // Seed all organizations
  const orgs = await Promise.all([
    seedOrganization(emiratesPostData),
    seedOrganization(adDeptFinanceData),
    seedOrganization(adDeptHealthData),
    seedOrganization(adDeptGovEnablementData),
    seedOrganization(mubadalaData),
  ]);

  // Add admin to all organizations
  for (const org of orgs) {
    await prisma.organizationMember.create({
      data: {
        userId: adminUser.id,
        organizationId: org.id,
        role: OrgMemberRole.OWNER,
      },
    });
  }

  console.log(`\n✅ Admin user added to all ${orgs.length} organizations`);

  console.log('\n🎉 Multi-tenant database seeded successfully!');
  console.log('\n📋 Organizations created:');
  for (const org of orgs) {
    console.log(`   - ${org.name} (${org.slug})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

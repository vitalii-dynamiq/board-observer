import { Router } from 'express';
import prisma from '../lib/prisma';
import { generateMeetingSummary } from '../services/ai/summary';

const router = Router();

// GET /api/meetings/:id/summary - Get meeting summary
router.get('/:id/summary', async (req, res, next) => {
  try {
    const { id } = req.params;

    const summary = await prisma.meetingSummary.findUnique({
      where: { meetingId: id },
      include: {
        discussions: {
          include: {
            agendaItem: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/summary/generate - Generate AI summary
// @AI-INTEGRATION-POINT: This endpoint triggers AI-generated meeting summary
router.post('/:id/summary/generate', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get meeting with all data needed for summary
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: {
            attendee: true,
          },
        },
        agendaItems: {
          orderBy: { order: 'asc' },
        },
        transcriptEntries: {
          orderBy: { timestamp: 'asc' },
        },
        decisions: true,
        actionItems: {
          include: {
            assignee: true,
          },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // @AI-INTEGRATION-POINT: Replace with real AI summary generation
    const summaryData = await generateMeetingSummary(meeting);

    // Delete existing summary if any
    await prisma.meetingSummary.deleteMany({
      where: { meetingId: id },
    });

    // Create new summary
    const summary = await prisma.meetingSummary.create({
      data: {
        meetingId: id,
        overview: summaryData.overview,
        attendanceNotes: summaryData.attendanceNotes,
        nextSteps: summaryData.nextSteps,
        discussions: {
          create: summaryData.discussions.map((d) => ({
            agendaItemId: d.agendaItemId,
            title: d.title,
            summary: d.summary,
            keyPoints: d.keyPoints,
            outcome: d.outcome,
            duration: d.duration,
          })),
        },
      },
      include: {
        discussions: {
          include: {
            agendaItem: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(summary);
  } catch (error) {
    next(error);
  }
});

// PUT /api/meetings/:id/summary - Update summary manually
router.put('/:id/summary', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { overview, attendanceNotes, nextSteps } = req.body;

    const summary = await prisma.meetingSummary.update({
      where: { meetingId: id },
      data: {
        ...(overview && { overview }),
        ...(attendanceNotes !== undefined && { attendanceNotes }),
        ...(nextSteps && { nextSteps }),
      },
      include: {
        discussions: {
          include: {
            agendaItem: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;

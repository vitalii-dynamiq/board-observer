import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createMeetingSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['BOARD', 'COMMITTEE', 'REVIEW', 'STRATEGY', 'OPERATIONS']),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  location: z.string().optional(),
  isVirtual: z.boolean().default(false),
});

const updateMeetingSchema = createMeetingSchema.partial().extend({
  phase: z.enum(['UPCOMING', 'LIVE', 'COMPLETED']).optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  isRecording: z.boolean().optional(),
  recordingDuration: z.number().optional(),
});

// GET /api/meetings - List all meetings
router.get('/', async (req, res, next) => {
  try {
    const { phase, type, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (phase) where.phase = phase;
    if (type) where.type = type;

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        attendees: {
          include: {
            attendee: true,
          },
        },
        agendaItems: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            documents: true,
            actionItems: true,
            decisions: true,
          },
        },
      },
      orderBy: { scheduledStart: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform to match frontend expectations
    const transformed = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type.toLowerCase(),
      phase: m.phase.toLowerCase(),
      scheduledStart: m.scheduledStart,
      scheduledEnd: m.scheduledEnd,
      actualStart: m.actualStart,
      actualEnd: m.actualEnd,
      location: m.location,
      isVirtual: m.isVirtual,
      isRecording: m.isRecording,
      recordingDuration: m.recordingDuration,
      attendees: m.attendees.map((ma) => ({
        id: ma.attendee.id,
        name: ma.attendee.name,
        role: ma.attendee.role,
        organization: ma.attendee.organization,
        isPresent: ma.isPresent,
        isSpeaking: ma.isSpeaking,
      })),
      agenda: m.agendaItems,
      _count: m._count,
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
});

// GET /api/meetings/:id - Get single meeting with all details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

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
          include: {
            documents: true,
            prepQuestions: true,
          },
        },
        documents: true,
        prepQuestions: true,
        actionItems: {
          include: {
            assignee: true,
          },
        },
        decisions: true,
        summary: {
          include: {
            discussions: true,
          },
        },
        transcriptEntries: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        liveInsights: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        detectedActions: true,
        detectedDecisions: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Transform to match frontend expectations
    const transformed = {
      id: meeting.id,
      title: meeting.title,
      type: meeting.type.toLowerCase(),
      phase: meeting.phase.toLowerCase(),
      scheduledStart: meeting.scheduledStart,
      scheduledEnd: meeting.scheduledEnd,
      actualStart: meeting.actualStart,
      actualEnd: meeting.actualEnd,
      location: meeting.location,
      isVirtual: meeting.isVirtual,
      recording: {
        isRecording: meeting.isRecording,
        duration: meeting.recordingDuration,
      },
      attendees: meeting.attendees.map((ma) => ({
        id: ma.attendee.id,
        name: ma.attendee.name,
        role: ma.attendee.role,
        organization: ma.attendee.organization,
        avatar: ma.attendee.avatar,
        isPresent: ma.isPresent,
        isSpeaking: ma.isSpeaking,
      })),
      agenda: meeting.agendaItems.map((item) => ({
        ...item,
        status: item.status.toLowerCase().replace('_', '-'),
        documents: item.documents,
      })),
      documents: meeting.documents,
      prepQuestions: meeting.prepQuestions.map((q) => ({
        ...q,
        category: q.category.toLowerCase(),
        priority: q.priority.toLowerCase(),
      })),
      actionItems: meeting.actionItems.map((a) => ({
        ...a,
        priority: a.priority.toLowerCase(),
        status: a.status.toLowerCase().replace('_', '-'),
        assignee: a.assignee?.name,
      })),
      decisions: meeting.decisions,
      summary: meeting.summary,
      transcript: meeting.transcriptEntries,
      insights: meeting.liveInsights.map((i) => ({
        ...i,
        type: i.type.toLowerCase(),
        priority: i.priority.toLowerCase(),
      })),
      detectedActions: meeting.detectedActions.map((a) => ({
        ...a,
        status: a.status.toLowerCase(),
      })),
      detectedDecisions: meeting.detectedDecisions.map((d) => ({
        ...d,
        status: d.status.toLowerCase(),
      })),
    };

    res.json(transformed);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings - Create new meeting
router.post('/', async (req, res, next) => {
  try {
    const data = createMeetingSchema.parse(req.body);

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        type: data.type,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        location: data.location,
        isVirtual: data.isVirtual,
      },
      include: {
        attendees: {
          include: {
            attendee: true,
          },
        },
      },
    });

    res.status(201).json({
      ...meeting,
      type: meeting.type.toLowerCase(),
      phase: meeting.phase.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id - Update meeting
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateMeetingSchema.parse(req.body);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.type) updateData.type = data.type;
    if (data.phase) updateData.phase = data.phase;
    if (data.scheduledStart) updateData.scheduledStart = new Date(data.scheduledStart);
    if (data.scheduledEnd) updateData.scheduledEnd = new Date(data.scheduledEnd);
    if (data.actualStart) updateData.actualStart = new Date(data.actualStart);
    if (data.actualEnd) updateData.actualEnd = new Date(data.actualEnd);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isVirtual !== undefined) updateData.isVirtual = data.isVirtual;
    if (data.isRecording !== undefined) updateData.isRecording = data.isRecording;
    if (data.recordingDuration !== undefined) updateData.recordingDuration = data.recordingDuration;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        attendees: {
          include: {
            attendee: true,
          },
        },
      },
    });

    res.json({
      ...meeting,
      type: meeting.type.toLowerCase(),
      phase: meeting.phase.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.meeting.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/start - Start a meeting (transition to LIVE)
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        phase: 'LIVE',
        actualStart: new Date(),
        isRecording: true,
      },
    });

    res.json({
      ...meeting,
      type: meeting.type.toLowerCase(),
      phase: meeting.phase.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/end - End a meeting (transition to COMPLETED)
router.post('/:id/end', async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        phase: 'COMPLETED',
        actualEnd: new Date(),
        isRecording: false,
      },
    });

    res.json({
      ...meeting,
      type: meeting.type.toLowerCase(),
      phase: meeting.phase.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/attendees - Add attendee to meeting
router.post('/:id/attendees', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attendeeId } = req.body;

    const meetingAttendee = await prisma.meetingAttendee.create({
      data: {
        meetingId: id,
        attendeeId,
        isPresent: false,
      },
      include: {
        attendee: true,
      },
    });

    res.status(201).json({
      id: meetingAttendee.attendee.id,
      name: meetingAttendee.attendee.name,
      role: meetingAttendee.attendee.role,
      organization: meetingAttendee.attendee.organization,
      isPresent: meetingAttendee.isPresent,
      isSpeaking: meetingAttendee.isSpeaking,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/meetings/:id/attendees/:attendeeId - Update attendee status
router.put('/:id/attendees/:attendeeId', async (req, res, next) => {
  try {
    const { id, attendeeId } = req.params;
    const { isPresent, isSpeaking } = req.body;

    const meetingAttendee = await prisma.meetingAttendee.update({
      where: {
        meetingId_attendeeId: {
          meetingId: id,
          attendeeId,
        },
      },
      data: {
        isPresent,
        isSpeaking,
        ...(isPresent && !isSpeaking ? { joinedAt: new Date() } : {}),
      },
      include: {
        attendee: true,
      },
    });

    res.json({
      id: meetingAttendee.attendee.id,
      name: meetingAttendee.attendee.name,
      role: meetingAttendee.attendee.role,
      organization: meetingAttendee.attendee.organization,
      isPresent: meetingAttendee.isPresent,
      isSpeaking: meetingAttendee.isSpeaking,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/meetings/:id/attendees/:attendeeId - Remove attendee from meeting
router.delete('/:id/attendees/:attendeeId', async (req, res, next) => {
  try {
    const { id, attendeeId } = req.params;

    await prisma.meetingAttendee.delete({
      where: {
        meetingId_attendeeId: {
          meetingId: id,
          attendeeId,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

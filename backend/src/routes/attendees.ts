import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAttendeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  title: z.string().min(1),
  department: z.string().optional(),
  organizationId: z.string().uuid(),
  avatar: z.string().url().optional(),
  isExternal: z.boolean().default(false),
});

const updateAttendeeSchema = createAttendeeSchema.partial();

// GET /api/attendees - List all attendees
router.get('/', async (req, res, next) => {
  try {
    const { search, organizationId, organizationSlug, limit = '100', offset = '0' } = req.query;

    const where: any = {};
    
    // Filter by organization
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (organizationSlug) {
      const org = await prisma.organization.findUnique({
        where: { slug: organizationSlug as string },
      });
      if (org) {
        where.organizationId = org.id;
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { department: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const attendees = await prisma.attendee.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(attendees);
  } catch (error) {
    next(error);
  }
});

// GET /api/attendees/:id - Get single attendee
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const attendee = await prisma.attendee.findUnique({
      where: { id },
      include: {
        meetings: {
          include: {
            meeting: {
              select: {
                id: true,
                title: true,
                type: true,
                phase: true,
                scheduledStart: true,
              },
            },
          },
          orderBy: {
            meeting: {
              scheduledStart: 'desc',
            },
          },
          take: 10,
        },
        actionItems: {
          where: {
            status: { not: 'COMPLETED' },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!attendee) {
      return res.status(404).json({ error: 'Attendee not found' });
    }

    res.json({
      ...attendee,
      recentMeetings: attendee.meetings.map((m) => ({
        ...m.meeting,
        type: m.meeting.type.toLowerCase(),
        phase: m.meeting.phase.toLowerCase(),
        isPresent: m.isPresent,
      })),
      pendingActions: attendee.actionItems.map((a) => ({
        ...a,
        priority: a.priority.toLowerCase(),
        status: a.status.toLowerCase().replace('_', '-'),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attendees - Create new attendee
router.post('/', async (req, res, next) => {
  try {
    const data = createAttendeeSchema.parse(req.body);

    const attendee = await prisma.attendee.create({
      data,
    });

    res.status(201).json(attendee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/attendees/:id - Update attendee
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateAttendeeSchema.parse(req.body);

    const attendee = await prisma.attendee.update({
      where: { id },
      data,
    });

    res.json(attendee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/attendees/:id - Delete attendee
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.attendee.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

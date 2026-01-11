import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/organizations - List all organizations (admin only for now)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            meetings: true,
            attendees: true,
          },
        },
      },
    });

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// GET /api/organizations/:slug - Get organization by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            meetings: true,
            attendees: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// GET /api/organizations/:slug/stats - Get organization statistics
router.get('/:slug/stats', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [totalMeetings, liveMeetings, upcomingMeetings, completedMeetings, totalAttendees] = await Promise.all([
      prisma.meeting.count({ where: { organizationId: organization.id } }),
      prisma.meeting.count({ where: { organizationId: organization.id, phase: 'LIVE' } }),
      prisma.meeting.count({ where: { organizationId: organization.id, phase: 'UPCOMING' } }),
      prisma.meeting.count({ where: { organizationId: organization.id, phase: 'COMPLETED' } }),
      prisma.attendee.count({ where: { organizationId: organization.id } }),
    ]);

    res.json({
      totalMeetings,
      liveMeetings,
      upcomingMeetings,
      completedMeetings,
      totalAttendees,
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ error: 'Failed to fetch organization stats' });
  }
});

export default router;

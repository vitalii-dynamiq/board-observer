import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schema for manual transcript entry
const createTranscriptEntrySchema = z.object({
  speakerId: z.string().optional(),
  speakerName: z.string().min(1),
  content: z.string().min(1),
  agendaItemId: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  highlights: z.array(z.string()).optional(),
});

// GET /api/meetings/:id/transcript - Get transcript entries
router.get('/:id/transcript', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = '100', offset = '0', agendaItemId } = req.query;

    const where: any = { meetingId: id };
    if (agendaItemId) where.agendaItemId = agendaItemId;

    const entries = await prisma.transcriptEntry.findMany({
      where,
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        agendaItem: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/transcript - Add transcript entry (manual or from AI)
// @AI-INTEGRATION-POINT: Real-time transcription service would POST here
router.post('/:id/transcript', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createTranscriptEntrySchema.parse(req.body);

    const entry = await prisma.transcriptEntry.create({
      data: {
        meetingId: id,
        speakerId: data.speakerId,
        speakerName: data.speakerName,
        content: data.content,
        agendaItemId: data.agendaItemId,
        confidence: data.confidence,
        highlights: data.highlights,
      },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        agendaItem: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    // Emit via WebSocket for real-time updates
    // This would be handled by the calling service
    
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/transcript/:entryId - Update transcript entry
router.put('/:id/transcript/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { content, speakerName, highlights } = req.body;

    const entry = await prisma.transcriptEntry.update({
      where: { id: entryId },
      data: {
        ...(content && { content }),
        ...(speakerName && { speakerName }),
        ...(highlights !== undefined && { highlights }),
      },
      include: {
        speaker: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        agendaItem: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/meetings/:id/transcript/:entryId - Delete transcript entry
router.delete('/:id/transcript/:entryId', async (req, res, next) => {
  try {
    const { entryId } = req.params;

    await prisma.transcriptEntry.delete({
      where: { id: entryId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/meetings/:id/detected-actions - Get AI-detected actions
// @AI-INTEGRATION-POINT: These are populated by AI action detection agent
router.get('/:id/detected-actions', async (req, res, next) => {
  try {
    const { id } = req.params;

    const actions = await prisma.detectedAction.findMany({
      where: { meetingId: id },
      orderBy: { timestamp: 'desc' },
    });

    res.json(actions.map((a) => ({
      ...a,
      status: a.status.toLowerCase(),
    })));
  } catch (error) {
    next(error);
  }
});

// PUT /api/meetings/:id/detected-actions/:actionId/confirm - Confirm detected action
router.put('/:id/detected-actions/:actionId/confirm', async (req, res, next) => {
  try {
    const { id, actionId } = req.params;
    const { assigneeId, dueDate, priority = 'MEDIUM' } = req.body;

    const detected = await prisma.detectedAction.update({
      where: { id: actionId },
      data: { status: 'CONFIRMED' },
    });

    // Create actual action item from detected action
    const action = await prisma.actionItem.create({
      data: {
        meetingId: id,
        description: detected.description,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
      },
      include: {
        assignee: true,
      },
    });

    res.json({
      detected: { ...detected, status: 'confirmed' },
      actionItem: {
        ...action,
        priority: action.priority.toLowerCase(),
        status: action.status.toLowerCase().replace('_', '-'),
        assignee: action.assignee?.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/meetings/:id/detected-actions/:actionId/dismiss - Dismiss detected action
router.put('/:id/detected-actions/:actionId/dismiss', async (req, res, next) => {
  try {
    const { actionId } = req.params;

    const action = await prisma.detectedAction.update({
      where: { id: actionId },
      data: { status: 'REJECTED' },
    });

    res.json({ ...action, status: 'rejected' });
  } catch (error) {
    next(error);
  }
});

// GET /api/meetings/:id/detected-decisions - Get AI-detected decisions
router.get('/:id/detected-decisions', async (req, res, next) => {
  try {
    const { id } = req.params;

    const decisions = await prisma.detectedDecision.findMany({
      where: { meetingId: id },
      orderBy: { timestamp: 'desc' },
    });

    res.json(decisions.map((d) => ({
      ...d,
      status: d.status.toLowerCase(),
    })));
  } catch (error) {
    next(error);
  }
});

// PUT /api/meetings/:id/detected-decisions/:decisionId/confirm - Confirm detected decision
router.put('/:id/detected-decisions/:decisionId/confirm', async (req, res, next) => {
  try {
    const { id, decisionId } = req.params;
    const { rationale, votedFor = 0, votedAgainst = 0, abstained = 0 } = req.body;

    const detected = await prisma.detectedDecision.update({
      where: { id: decisionId },
      data: { status: 'CONFIRMED' },
    });

    // Create actual decision from detected decision
    const decision = await prisma.decision.create({
      data: {
        meetingId: id,
        description: detected.description,
        rationale,
        votedFor: votedFor ?? detected.votedFor ?? 0,
        votedAgainst: votedAgainst ?? detected.votedAgainst ?? 0,
        abstained: abstained ?? detected.abstained ?? 0,
      },
    });

    res.json({
      detected: { ...detected, status: 'confirmed' },
      decision,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

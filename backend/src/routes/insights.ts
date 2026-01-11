import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schema for manual insight creation
const createInsightSchema = z.object({
  type: z.enum(['OBSERVATION', 'SUGGESTION', 'ALERT', 'CONTEXT']),
  agentId: z.string().default('manual'),
  content: z.string().min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  agendaItemId: z.string().optional(),
});

// GET /api/meetings/:id/insights - Get live insights
router.get('/:id/insights', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dismissed = 'false', limit = '50' } = req.query;

    const where: any = { meetingId: id };
    if (dismissed === 'false') where.dismissed = false;

    const insights = await prisma.liveInsight.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(insights.map((i) => ({
      ...i,
      type: i.type.toLowerCase(),
      priority: i.priority.toLowerCase(),
    })));
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/insights - Create insight (from AI or manual)
// @AI-INTEGRATION-POINT: AI analyst agent would POST here
router.post('/:id/insights', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createInsightSchema.parse(req.body);

    const insight = await prisma.liveInsight.create({
      data: {
        meetingId: id,
        type: data.type,
        agentId: data.agentId,
        content: data.content,
        priority: data.priority,
        agendaItemId: data.agendaItemId,
      },
    });

    res.status(201).json({
      ...insight,
      type: insight.type.toLowerCase(),
      priority: insight.priority.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/insights/:insightId/dismiss - Dismiss an insight
router.put('/:id/insights/:insightId/dismiss', async (req, res, next) => {
  try {
    const { insightId } = req.params;

    const insight = await prisma.liveInsight.update({
      where: { id: insightId },
      data: { dismissed: true },
    });

    res.json({
      ...insight,
      type: insight.type.toLowerCase(),
      priority: insight.priority.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/meetings/:id/insights/:insightId - Delete insight
router.delete('/:id/insights/:insightId', async (req, res, next) => {
  try {
    const { insightId } = req.params;

    await prisma.liveInsight.delete({
      where: { id: insightId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

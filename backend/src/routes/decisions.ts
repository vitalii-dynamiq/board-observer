import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createDecisionSchema = z.object({
  description: z.string().min(1),
  rationale: z.string().optional(),
  votedFor: z.number().default(0),
  votedAgainst: z.number().default(0),
  abstained: z.number().default(0),
});

const updateDecisionSchema = createDecisionSchema.partial();

// GET /api/meetings/:id/decisions - Get all decisions for a meeting
router.get('/:id/decisions', async (req, res, next) => {
  try {
    const { id } = req.params;

    const decisions = await prisma.decision.findMany({
      where: { meetingId: id },
      orderBy: { timestamp: 'desc' },
    });

    res.json(decisions);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/decisions - Record a decision
router.post('/:id/decisions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createDecisionSchema.parse(req.body);

    const decision = await prisma.decision.create({
      data: {
        meetingId: id,
        description: data.description,
        rationale: data.rationale,
        votedFor: data.votedFor,
        votedAgainst: data.votedAgainst,
        abstained: data.abstained,
      },
    });

    res.status(201).json(decision);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/decisions/:decisionId - Update decision
router.put('/:id/decisions/:decisionId', async (req, res, next) => {
  try {
    const { decisionId } = req.params;
    const data = updateDecisionSchema.parse(req.body);

    const decision = await prisma.decision.update({
      where: { id: decisionId },
      data,
    });

    res.json(decision);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/meetings/:id/decisions/:decisionId - Delete decision
router.delete('/:id/decisions/:decisionId', async (req, res, next) => {
  try {
    const { decisionId } = req.params;

    await prisma.decision.delete({
      where: { id: decisionId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

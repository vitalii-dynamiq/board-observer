import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAgendaItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(1),
  presenter: z.string().optional(),
  order: z.number().optional(),
});

const updateAgendaItemSchema = createAgendaItemSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
  aiAnalysis: z.any().optional(),
});

// GET /api/meetings/:id/agenda - Get all agenda items for a meeting
router.get('/:id/agenda', async (req, res, next) => {
  try {
    const { id } = req.params;

    const items = await prisma.agendaItem.findMany({
      where: { meetingId: id },
      include: {
        documents: true,
        prepQuestions: true,
      },
      orderBy: { order: 'asc' },
    });

    const transformed = items.map((item) => ({
      ...item,
      status: item.status.toLowerCase().replace('_', '-'),
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/agenda - Create new agenda item
router.post('/:id/agenda', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createAgendaItemSchema.parse(req.body);

    // Get the next order number if not provided
    let order = data.order;
    if (order === undefined) {
      const maxOrder = await prisma.agendaItem.findFirst({
        where: { meetingId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxOrder?.order ?? 0) + 1;
    }

    const item = await prisma.agendaItem.create({
      data: {
        meetingId: id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        presenter: data.presenter,
        order,
      },
      include: {
        documents: true,
        prepQuestions: true,
      },
    });

    res.status(201).json({
      ...item,
      status: item.status.toLowerCase().replace('_', '-'),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/agenda/:itemId - Update agenda item
router.put('/:id/agenda/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const data = updateAgendaItemSchema.parse(req.body);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration) updateData.duration = data.duration;
    if (data.presenter !== undefined) updateData.presenter = data.presenter;
    if (data.order) updateData.order = data.order;
    if (data.status) updateData.status = data.status;
    if (data.aiAnalysis !== undefined) updateData.aiAnalysis = data.aiAnalysis;

    const item = await prisma.agendaItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        documents: true,
        prepQuestions: true,
      },
    });

    res.json({
      ...item,
      status: item.status.toLowerCase().replace('_', '-'),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/meetings/:id/agenda/:itemId - Delete agenda item
router.delete('/:id/agenda/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params;

    await prisma.agendaItem.delete({
      where: { id: itemId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/agenda/reorder - Reorder agenda items
router.post('/:id/agenda/reorder', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { id, order }

    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.agendaItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    const updated = await prisma.agendaItem.findMany({
      where: { meetingId: id },
      orderBy: { order: 'asc' },
    });

    res.json(updated.map((item) => ({
      ...item,
      status: item.status.toLowerCase().replace('_', '-'),
    })));
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/agenda/:itemId/questions - Add prep question
router.post('/:id/agenda/:itemId/questions', async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { question, category, priority, aiGenerated = false } = req.body;

    const prepQuestion = await prisma.prepQuestion.create({
      data: {
        meetingId: id,
        agendaItemId: itemId,
        question,
        category: category.toUpperCase(),
        priority: priority.toUpperCase(),
        aiGenerated,
      },
    });

    res.status(201).json({
      ...prepQuestion,
      category: prepQuestion.category.toLowerCase(),
      priority: prepQuestion.priority.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

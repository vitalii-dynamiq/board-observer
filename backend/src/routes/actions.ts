import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createActionSchema = z.object({
  description: z.string().min(1),
  assigneeId: z.string().optional(),
  agendaItemId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  notes: z.string().optional(),
});

const updateActionSchema = createActionSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
});

// GET /api/meetings/:id/actions - Get all action items for a meeting
router.get('/:id/actions', async (req, res, next) => {
  try {
    const { id } = req.params;

    const actions = await prisma.actionItem.findMany({
      where: { meetingId: id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            title: true,
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
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });

    const transformed = actions.map((action) => ({
      id: action.id,
      description: action.description,
      assignee: action.assignee?.name,
      assigneeId: action.assigneeId,
      agendaItem: action.agendaItem,
      dueDate: action.dueDate,
      priority: action.priority.toLowerCase(),
      status: action.status.toLowerCase().replace('_', '-'),
      notes: action.notes,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/actions - Create new action item
router.post('/:id/actions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createActionSchema.parse(req.body);

    const action = await prisma.actionItem.create({
      data: {
        meetingId: id,
        description: data.description,
        assigneeId: data.assigneeId,
        agendaItemId: data.agendaItemId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        notes: data.notes,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            title: true,
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

    res.status(201).json({
      id: action.id,
      description: action.description,
      assignee: action.assignee?.name,
      assigneeId: action.assigneeId,
      agendaItem: action.agendaItem,
      dueDate: action.dueDate,
      priority: action.priority.toLowerCase(),
      status: action.status.toLowerCase().replace('_', '-'),
      notes: action.notes,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/actions/:actionId - Update action item
router.put('/:id/actions/:actionId', async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const data = updateActionSchema.parse(req.body);

    const updateData: any = {};
    if (data.description) updateData.description = data.description;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.agendaItemId !== undefined) updateData.agendaItemId = data.agendaItemId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const action = await prisma.actionItem.update({
      where: { id: actionId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            title: true,
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

    res.json({
      id: action.id,
      description: action.description,
      assignee: action.assignee?.name,
      assigneeId: action.assigneeId,
      agendaItem: action.agendaItem,
      dueDate: action.dueDate,
      priority: action.priority.toLowerCase(),
      status: action.status.toLowerCase().replace('_', '-'),
      notes: action.notes,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/meetings/:id/actions/:actionId - Delete action item
router.delete('/:id/actions/:actionId', async (req, res, next) => {
  try {
    const { actionId } = req.params;

    await prisma.actionItem.delete({
      where: { id: actionId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

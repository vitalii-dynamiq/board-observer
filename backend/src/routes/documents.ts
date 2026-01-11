import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Validation schema
const createDocumentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['PDF', 'DOC', 'SPREADSHEET', 'PRESENTATION', 'LINK']),
  url: z.string().url(),
  agendaItemId: z.string().optional(),
  summary: z.string().optional(),
  fileSize: z.number().optional(),
});

// GET /api/meetings/:id/documents - Get all documents for a meeting
router.get('/:id/documents', async (req, res, next) => {
  try {
    const { id } = req.params;

    const documents = await prisma.briefingDocument.findMany({
      where: { meetingId: id },
      include: {
        agendaItem: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const transformed = documents.map((doc) => ({
      ...doc,
      type: doc.type.toLowerCase(),
    }));

    res.json(transformed);
  } catch (error) {
    next(error);
  }
});

// POST /api/meetings/:id/documents - Upload a document
router.post('/:id/documents', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = createDocumentSchema.parse(req.body);

    const document = await prisma.briefingDocument.create({
      data: {
        meetingId: id,
        title: data.title,
        type: data.type,
        url: data.url,
        agendaItemId: data.agendaItemId,
        summary: data.summary,
        fileSize: data.fileSize,
      },
      include: {
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
      ...document,
      type: document.type.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
});

// PUT /api/meetings/:id/documents/:docId - Update document
router.put('/:id/documents/:docId', async (req, res, next) => {
  try {
    const { docId } = req.params;
    const { title, summary, agendaItemId } = req.body;

    const document = await prisma.briefingDocument.update({
      where: { id: docId },
      data: {
        ...(title && { title }),
        ...(summary !== undefined && { summary }),
        ...(agendaItemId !== undefined && { agendaItemId }),
      },
      include: {
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
      ...document,
      type: document.type.toLowerCase(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/meetings/:id/documents/:docId - Delete document
router.delete('/:id/documents/:docId', async (req, res, next) => {
  try {
    const { docId } = req.params;

    await prisma.briefingDocument.delete({
      where: { id: docId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

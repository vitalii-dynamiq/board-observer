/**
 * Webhook Routes
 * 
 * Handles incoming webhooks from external services like Recall.ai
 */

import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, processWebhook } from '../services/recall/webhooks';
import { webhookLogger as logger } from '../lib/logger';

const router = Router();

/**
 * POST /webhooks/recall
 * Receive webhooks from Recall.ai
 */
router.post('/recall', async (req: Request, res: Response) => {
  try {
    // Get signature for verification
    const signature = req.headers['x-recall-signature'] as string || '';
    // Use raw body captured by middleware for accurate signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify signature if RECALL_WEBHOOK_SECRET is configured (required in production)
    const webhookSecret = process.env.RECALL_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        logger.warn('Invalid webhook signature - rejecting request');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else if (isProduction) {
      // In production, webhook secret should always be configured
      logger.error('RECALL_WEBHOOK_SECRET not configured in production!');
      return res.status(500).json({ error: 'Webhook verification not configured' });
    }

    // Log incoming webhook
    logger.info({ event: req.body.event || 'unknown' }, 'Recall.ai webhook received');

    // Process the webhook
    await processWebhook(req.body);

    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error({ err: error }, 'Webhook processing error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /webhooks/recall/health
 * Health check for Recall.ai webhook endpoint
 */
router.get('/recall/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'recall-webhook',
    timestamp: new Date().toISOString(),
  });
});

export default router;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Logger
import logger from './lib/logger';

// Middleware
import { apiRateLimit, webhookRateLimit, aiRateLimit } from './middleware/rate-limit';
import { auditLog } from './middleware/audit-log';

// Routes
import organizationsRouter from './routes/organizations';
import meetingsRouter from './routes/meetings';
import attendeesRouter from './routes/attendees';
import agendaRouter from './routes/agenda';
import documentsRouter from './routes/documents';
import actionsRouter from './routes/actions';
import decisionsRouter from './routes/decisions';
import summariesRouter from './routes/summaries';
import transcriptRouter from './routes/transcript';
import insightsRouter from './routes/insights';
import webhooksRouter from './routes/webhooks';
import agentRouter from './routes/agent';

// WebSocket handlers
import { setupWebSocket } from './websocket/server';

// Transcript processing
import { initTranscriptWebhooks } from './services/recall/transcription';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some WebSocket scenarios
}));

// Capture raw body for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Store raw body for signature verification, then parse as JSON
  if (Buffer.isBuffer(req.body)) {
    (req as any).rawBody = req.body.toString('utf8');
    try {
      req.body = JSON.parse((req as any).rawBody);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }
  next();
});

// Parse JSON for all other routes
app.use(express.json());

// Audit logging (all requests)
app.use(auditLog({ logRequestBody: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook Routes (no /api prefix for external services)
// Higher rate limit for webhooks from Recall.ai
app.use('/webhooks', webhookRateLimit, webhooksRouter);

// API Routes with standard rate limiting
app.use('/api/organizations', apiRateLimit, organizationsRouter);
app.use('/api/meetings', apiRateLimit, meetingsRouter);
app.use('/api/attendees', attendeesRouter);
app.use('/api/meetings', agendaRouter);      // /api/meetings/:id/agenda
app.use('/api/meetings', documentsRouter);   // /api/meetings/:id/documents
app.use('/api/meetings', actionsRouter);     // /api/meetings/:id/actions
app.use('/api/meetings', decisionsRouter);   // /api/meetings/:id/decisions
app.use('/api/meetings', summariesRouter);   // /api/meetings/:id/summary
app.use('/api/meetings', transcriptRouter);  // /api/meetings/:id/transcript
app.use('/api/meetings', insightsRouter);    // /api/meetings/:id/insights

// Agent routes with stricter rate limiting for AI endpoints
app.use('/api', aiRateLimit, agentRouter);   // /api/meetings/:id/bot/*, /api/meetings/:id/agent/*

// Setup WebSocket handlers
setupWebSocket(io);

// Initialize transcript webhook listeners
initTranscriptWebhooks();

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Board Observer API running');
  logger.info('WebSocket server ready');
  logger.info({ healthCheck: `http://localhost:${PORT}/health` }, 'Health check endpoint available');
});

export { io };

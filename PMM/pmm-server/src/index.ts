import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { roadmapRoutes } from './routes/roadmaps';
import { workstreamRoutes } from './routes/workstreams';
import { featureRoutes } from './routes/features';
import { taskRoutes } from './routes/tasks';
import { dependencyRoutes } from './routes/dependencies';
import { aiRoutes } from './routes/ai';
import { viewRoutes } from './routes/views';
import { exportRoutes } from './routes/export';
import { setupWebSocket } from './websocket/server';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use('*', errorHandler);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pmm-server'
  });
});

// API routes
const apiRoutes = new Hono();

// Public routes (no auth required)
apiRoutes.route('/health', new Hono().get('/', (c) => c.json({ status: 'ok' })));

// Protected routes (auth required)
apiRoutes.use('/*', authMiddleware);

apiRoutes.route('/roadmaps', roadmapRoutes);
apiRoutes.route('/workstreams', workstreamRoutes);
apiRoutes.route('/features', featureRoutes);
apiRoutes.route('/tasks', taskRoutes);
apiRoutes.route('/dependencies', dependencyRoutes);
apiRoutes.route('/ai', aiRoutes);
apiRoutes.route('/views', viewRoutes);
apiRoutes.route('/export', exportRoutes);

app.route('/api/v1', apiRoutes);

// WebSocket server setup
const port = process.env.PMM_PORT || 3001;
const server = { fetch: app.fetch };

console.log(`🚀 PMM Server starting on port ${port}`);
console.log(`📡 API: http://localhost:${port}/api/v1`);
console.log(`🔌 WebSocket: ws://localhost:${port}`);

setupWebSocket(server);

export default {
  port,
  fetch: app.fetch,
};

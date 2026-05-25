import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import pg from 'pg';
import Redis from 'ioredis';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  }
});

// Register CORS
await fastify.register(cors, {
  origin: '*',
});

// Register Rate Limiting
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Register Multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
});

// Register WebSockets
await fastify.register(websocket);

// Database Client Pool
const { Pool } = pg;
// Parse postgres config
const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'claw_ops',
  user: process.env.POSTGRES_USER || 'mobu',
  password: process.env.POSTGRES_PASSWORD,
});

// Redis Clients
const redisPassword = process.env.REDIS_PASSWORD;
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  ...(redisPassword ? { password: redisPassword } : {}),
};

const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);
const redisClient = new Redis(redisConfig);

// Helper: Hash API Key
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Authentication Hook for HTTP Requests
fastify.decorate('authenticate', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Missing or malformed Authorization header' });
      return;
    }

    const apiKey = authHeader.substring(7).trim();
    const apiKeyHash = hashApiKey(apiKey);

    const result = await pool.query('SELECT id, name FROM tenants WHERE api_key_hash = $1', [apiKeyHash]);
    if (result.rows.length === 0) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid API Key' });
      return;
    }

    request.tenant = {
      id: result.rows[0].id,
      name: result.rows[0].name,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Internal Server Error', message: 'Auth validation failed' });
  }
});

// --- ROUTES ---

// 1. GET /health
fastify.get('/health', async (request, reply) => {
  let dbStatus = 'ok';
  let redisStatus = 'ok';

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    fastify.log.error('DB Healthcheck failed:', err);
    dbStatus = 'error';
  }

  try {
    const pong = await redisClient.ping();
    if (pong !== 'PONG') redisStatus = 'error';
  } catch (err) {
    fastify.log.error('Redis Healthcheck failed:', err);
    redisStatus = 'error';
  }

  const isHealthy = dbStatus === 'ok' && redisStatus === 'ok';
  reply.code(isHealthy ? 200 : 500).send({
    status: isHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    db: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

// Authenticated API Sub-routes
fastify.register(async (api) => {
  api.addHook('preHandler', fastify.authenticate);

  // 2. POST /v1/chat — Submit job
  api.post('/v1/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1 },
          session_id: { type: 'string' },
          profile: { type: 'string', default: 'default_fast' },
        }
      }
    }
  }, async (request, reply) => {
    const { message, session_id, profile } = request.body;
    const tenantId = request.tenant.id;

    let targetSessionId = session_id;

    // Check or create session
    if (targetSessionId) {
      const sessCheck = await pool.query(
        'SELECT id FROM sessions WHERE id = $1 AND tenant_id = $2',
        [targetSessionId, tenantId]
      );
      if (sessCheck.rows.length === 0) {
        // Create it
        await pool.query(
          'INSERT INTO sessions (id, tenant_id, profile) VALUES ($1, $2, $3)',
          [targetSessionId, tenantId, profile]
        );
      }
    } else {
      // Generate a new session
      targetSessionId = 'sess_' + crypto.randomBytes(12).toString('hex');
      await pool.query(
        'INSERT INTO sessions (id, tenant_id, profile) VALUES ($1, $2, $3)',
        [targetSessionId, tenantId, profile]
      );
    }

    // Generate job_id
    const jobId = 'job_' + crypto.randomBytes(12).toString('hex');

    // Insert job into database
    await pool.query(
      `INSERT INTO jobs (id, tenant_id, session_id, profile, input_type, input_text, status) 
       VALUES ($1, $2, $3, $4, 'text', $5, 'queued')`,
      [jobId, tenantId, targetSessionId, profile, message]
    );

    // Insert event
    const eventPayload = { job_id: jobId, session_id: targetSessionId };
    await pool.query(
      `INSERT INTO events (tenant_id, job_id, event_type, payload) 
       VALUES ($1, $2, 'job.queued', $3)`,
      [tenantId, jobId, JSON.stringify(eventPayload)]
    );

    // Publish to Redis Pub/Sub
    const eventMsg = {
      tenant_id: tenantId,
      job_id: jobId,
      event_type: 'job.queued',
      payload: eventPayload,
      created_at: new Date().toISOString(),
    };
    await redisPub.publish('claw_ops_events', JSON.stringify(eventMsg));

    // Push job to Redis queue for workers to consume
    const jobPayload = {
      job_id: jobId,
      tenant_id: tenantId,
      session_id: targetSessionId,
      profile,
      message,
    };
    await redisClient.rpush('claw_ops_jobs', JSON.stringify(jobPayload));

    reply.code(201).send({
      job_id: jobId,
      session_id: targetSessionId,
      status: 'queued',
    });
  });

  // 3. POST /v1/jobs/:id/cancel — Cancel job
  api.post('/v1/jobs/:id/cancel', async (request, reply) => {
    const jobId = request.params.id;
    const tenantId = request.tenant.id;

    // Check if job exists
    const jobCheck = await pool.query(
      'SELECT id, status FROM jobs WHERE id = $1 AND tenant_id = $2',
      [jobId, tenantId]
    );

    if (jobCheck.rows.length === 0) {
      reply.code(404).send({ error: 'Not Found', message: 'Job not found' });
      return;
    }

    const currentStatus = jobCheck.rows[0].status;
    if (['completed', 'failed', 'cancelled'].includes(currentStatus)) {
      reply.code(400).send({ error: 'Bad Request', message: `Job is already in ${currentStatus} state` });
      return;
    }

    // Update status to cancelled
    await pool.query(
      "UPDATE jobs SET status = 'cancelled', completed_at = now() WHERE id = $1",
      [jobId]
    );

    // Insert event
    const eventPayload = { job_id: jobId };
    await pool.query(
      `INSERT INTO events (tenant_id, job_id, event_type, payload) 
       VALUES ($1, $2, 'job.cancelled', $3)`,
      [tenantId, jobId, JSON.stringify(eventPayload)]
    );

    // Publish cancel signal for worker
    await redisPub.publish(`claw_ops_jobs_cancel:${jobId}`, 'cancel');

    // Publish event update
    const eventMsg = {
      tenant_id: tenantId,
      job_id: jobId,
      event_type: 'job.cancelled',
      payload: eventPayload,
      created_at: new Date().toISOString(),
    };
    await redisPub.publish('claw_ops_events', JSON.stringify(eventMsg));

    reply.send({
      job_id: jobId,
      status: 'cancelled',
    });
  });

  // 4. POST /v1/files/upload — Handle file upload
  api.post('/v1/files/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      reply.code(400).send({ error: 'Bad Request', message: 'No file uploaded' });
      return;
    }

    const tenantId = request.tenant.id;
    const jobId = data.fields.job_id?.value || null;

    const fileId = crypto.randomUUID();
    const extension = path.extname(data.filename);
    const filename = data.filename;
    const savedPath = path.join(UPLOADS_DIR, `${fileId}${extension}`);

    // Save to disk
    const writeStream = fs.createWriteStream(savedPath);
    await new Promise((resolve, reject) => {
      data.file.pipe(writeStream);
      data.file.on('end', resolve);
      data.file.on('error', reject);
    });

    const stats = fs.statSync(savedPath);

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO files (id, tenant_id, job_id, filename, path, size_bytes, mime_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, filename, size_bytes, mime_type`,
      [fileId, tenantId, jobId, filename, savedPath, stats.size, data.mimetype]
    );

    reply.code(201).send(result.rows[0]);
  });
});

// 5. WS /v1/events — Live Websocket Event Stream
fastify.route({
  method: 'GET',
  url: '/v1/events',
  handler: (request, reply) => {
    reply.code(400).send({ error: 'Bad Request', message: 'WebSocket connection required' });
  },
  wsHandler: async (connection, request) => {
    const { socket } = connection;
    fastify.log.info('New WebSocket connection request');

    // Auth validation on connection (via token query param)
    const token = request.query.token;
    if (!token) {
      socket.send(JSON.stringify({ error: 'Unauthorized', message: 'Missing token parameter' }));
      socket.close(4001, 'Unauthorized');
      return;
    }

    const apiKeyHash = hashApiKey(token);
    let tenantId = null;

    try {
      const result = await pool.query('SELECT id FROM tenants WHERE api_key_hash = $1', [apiKeyHash]);
      if (result.rows.length === 0) {
        socket.send(JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }));
        socket.close(4001, 'Unauthorized');
        return;
      }
      tenantId = result.rows[0].id;
    } catch (err) {
      fastify.log.error('WebSocket auth query failed:', err);
      socket.send(JSON.stringify({ error: 'Internal Error', message: 'Database query failed' }));
      socket.close(4003, 'DB Error');
      return;
    }

    // Success auth
    socket.send(JSON.stringify({ status: 'connected', tenant_id: tenantId }));

    // Setup listener
    const redisListener = (channel, message) => {
      try {
        const event = JSON.parse(message);
        // Multi-tenant check: filter out events not matching current connection's tenantId
        if (event.tenant_id === tenantId) {
          socket.send(JSON.stringify(event));
        }
      } catch (err) {
        fastify.log.error('Failed to parse redis event message:', err);
      }
    };

    redisSub.on('message', redisListener);

    socket.on('close', () => {
      fastify.log.info('WebSocket connection closed');
      redisSub.off('message', redisListener);
    });

    socket.on('error', (err) => {
      fastify.log.error('WebSocket socket error:', err);
      redisSub.off('message', redisListener);
    });
  }
});

// Setup Redis Subscription
await redisSub.subscribe('claw_ops_events');

// Start Server
try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Claw-Ops Gateway running on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

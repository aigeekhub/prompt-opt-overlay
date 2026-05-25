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

// Helper: Generate Signed URL for Live View
const LIVE_VIEW_SECRET = process.env.LIVE_VIEW_SECRET || 'mobu_live_view_secure_secret_key_2026';

function generateSignedUrl(request, jobId) {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
  const payload = JSON.stringify({ jobId, expiresAt });
  
  const hmac = crypto.createHmac('sha256', LIVE_VIEW_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  // Base64URL encode the payload + signature JSON
  const tokenObj = { payload: JSON.parse(payload), signature };
  const token = Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
  
  const host = request.headers.host || '127.0.0.1:3000';
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}/live/${jobId}?token=${token}`;
}

// Helper: Verify Live View Token
function verifyLiveViewToken(jobId, tokenString) {
  try {
    const jsonStr = Buffer.from(tokenString, 'base64url').toString('utf8');
    const { payload, signature } = JSON.parse(jsonStr);
    
    if (payload.jobId !== jobId) return false;
    if (Date.now() > payload.expiresAt) return false;
    
    const hmac = crypto.createHmac('sha256', LIVE_VIEW_SECRET);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (err) {
    return false;
  }
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

    const liveViewUrl = generateSignedUrl(request, jobId);

    reply.code(201).send({
      job_id: jobId,
      session_id: targetSessionId,
      status: 'queued',
      live_view: {
        available: true,
        url: liveViewUrl
      }
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

// Helper: HTML Escape
function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 6. GET /live/:job_id — Live View Page (authenticates via signed query token)
fastify.get('/live/:job_id', async (request, reply) => {
  const jobId = request.params.job_id;
  const token = request.query.token;

  if (!token) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Missing live view token parameter' });
    return;
  }

  const isValid = verifyLiveViewToken(jobId, token);
  if (!isValid) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired live view token' });
    return;
  }

  // Render a premium mock live view stub page
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLAW-Ops Live View - ${htmlEscape(jobId)}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0c16;
      --panel-bg: #14162e;
      --panel-border: rgba(0, 212, 255, 0.15);
      --text-color: #e0e0e8;
      --text-muted: #8c8ea6;
      --accent: #00d4ff;
      --accent-gradient: linear-gradient(135deg, #00d4ff 0%, #0077ff 100%);
      --success: #00cc88;
      --danger: #ff4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    header {
      background-color: rgba(20, 22, 46, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--panel-border);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-badge {
      background: var(--accent-gradient);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #0b0c16;
      font-size: 18px;
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
    }

    .logo-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .logo-title span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .status-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-pill {
      background-color: rgba(0, 204, 136, 0.1);
      border: 1px solid var(--success);
      color: var(--success);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }

    .job-id-badge {
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text-muted);
    }

    .main-container {
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
    }

    .screen-canvas-container {
      flex: 1;
      background-color: #030408;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .screen-mockup {
      width: 85%;
      aspect-ratio: 16/9;
      background: radial-gradient(circle at center, #1b1d3a 0%, #0d0e1b 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(0, 212, 255, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .screen-header {
      background-color: #121324;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      height: 36px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      justify-content: space-between;
    }

    .window-controls {
      display: flex;
      gap: 6px;
    }

    .window-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .window-dot.close { background-color: #ff5f56; }
    .window-dot.minimize { background-color: #ffbd2e; }
    .window-dot.maximize { background-color: #27c93f; }

    .window-title {
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .screen-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      position: relative;
    }

    .interactive-mock-desktop {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(0, 212, 255, 0.15) 1px, transparent 1px);
      background-size: 20px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .vnc-icon {
      font-size: 64px;
      margin-bottom: 16px;
      filter: drop-shadow(0 0 15px var(--accent));
      animation: float 4s ease-in-out infinite;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    .mock-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .mock-subtitle {
      color: var(--text-muted);
      font-size: 14px;
      text-align: center;
      max-width: 400px;
      line-height: 1.5;
    }

    .logs-panel {
      width: 380px;
      border-left: 1px solid var(--panel-border);
      background-color: #0e1022;
      display: flex;
      flex-direction: column;
      z-index: 5;
    }

    .logs-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logs-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logs-title svg {
      color: var(--accent);
    }

    .logs-badge {
      background-color: rgba(0, 212, 255, 0.1);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .logs-content {
      flex: 1;
      padding: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .log-line {
      line-height: 1.5;
      color: var(--text-muted);
    }

    .log-line.accent {
      color: var(--accent);
    }

    .log-line.success {
      color: var(--success);
    }

    .log-line.system {
      color: #bfa6ff;
    }

    .log-time {
      color: rgba(255, 255, 255, 0.25);
      margin-right: 8px;
    }

    footer {
      background-color: #090a12;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer-link {
      color: var(--accent);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-link:hover {
      color: #0077ff;
    }
  </style>
</head>
<body>

  <header>
    <div class="logo-container">
      <div class="logo-badge">🀄</div>
      <div class="logo-title">CLAW<span>-Ops</span></div>
    </div>
    <div class="status-container">
      <div class="job-id-badge">Job: ${htmlEscape(jobId)}</div>
      <div class="status-pill">
        <div class="status-dot"></div>
        Live View Ready
      </div>
    </div>
  </header>

  <div class="main-container">
    <div class="screen-canvas-container">
      <div class="screen-mockup">
        <div class="screen-header">
          <div class="window-controls">
            <div class="window-dot close"></div>
            <div class="window-dot minimize"></div>
            <div class="window-dot maximize"></div>
          </div>
          <div class="window-title">vnc_session_desktop</div>
          <div></div>
        </div>
        <div class="screen-body">
          <div class="interactive-mock-desktop">
            <div class="vnc-icon">🎯</div>
            <h2 class="mock-title">noVNC Live View</h2>
            <p class="mock-subtitle">A secure desktop session is ready to stream. In the next phase, this canvas will display your remote VPS XFCE environment.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="logs-panel">
      <div class="logs-header">
        <div class="logs-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          Console Logs
        </div>
        <div class="logs-badge">STUB</div>
      </div>
      <div class="logs-content">
        <div class="log-line system"><span class="log-time">[00:00:01]</span>Initializing secure WebSocket tunnels...</div>
        <div class="log-line system"><span class="log-time">[00:00:02]</span>Connecting VNC proxy interface...</div>
        <div class="log-line accent"><span class="log-time">[00:00:03]</span>VNC Server handshake complete.</div>
        <div class="log-line success"><span class="log-time">[00:00:04]</span>Authenticated and rendering virtual display frame...</div>
        <div class="log-line"><span class="log-time">[00:00:05]</span>Waiting for job timeline events...</div>
      </div>
    </div>
  </div>

  <footer>
    <div>CLAW-Ops VPS Brain &copy; 2026</div>
    <div>Secure Tailscale Overlay Tunnel &bull; <a href="https://github.com/aigeekhub/prompt-opt-overlay" class="footer-link" target="_blank">Repository</a></div>
  </footer>

</body>
</html>
  `;

  reply.type('text/html').send(htmlContent);
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

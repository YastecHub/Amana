import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import loanRoutes from './routes/loans';
import webhookRoutes from './routes/webhooks';
import assistantRoutes from './routes/assistant';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './lib/swagger';
import { ensureSeedData } from './lib/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Logging ─────────────────────────────────────────────────────
// Relax helmet's CSP for Swagger UI (needs inline scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

const allowedOriginPatterns = [
  /^https:\/\/amana.*\.vercel\.app$/, 
  /^https:\/\/amana-green\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/amana-m8kf\.onrender\.com$/
];

const extraOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // curl / Postman / Swagger
  if (extraOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some(re => re.test(origin));
}

// Handle preflight before helmet so headers aren't stripped
app.options('*', cors({ origin: isOriginAllowed, credentials: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Swagger UI ─────────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Amana API Docs',
    customCss: `
      .swagger-ui .topbar { background: #0d9488; }
      .swagger-ui .topbar-wrapper .link { display: none; }
      .swagger-ui .info .title { color: #0d9488; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

// Expose raw spec as JSON (useful for import into Postman / Insomnia)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Webhook route — needs raw body for HMAC signature verification ─────────
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// ── JSON body parser for all other routes ─────────────────────────────────
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/assistant', assistantRoutes);

// ── Health check (used by Render) ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
(async () => {
  if (process.env.NODE_ENV === 'production') {
    try {
      await ensureSeedData();
      console.log('✅ Production seed data ensured.');
    } catch (error) {
      console.error('Seed error:', error);
    }
  }
})();
// ── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Amana API running on port ${PORT}`);
  console.log(`📖 Swagger UI → /api/docs`);
  console.log(`📄 OpenAPI JSON → /api/docs.json\n`);
});

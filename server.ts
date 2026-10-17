process.on('unhandledRejection', (e) => console.error('[Unhandled Rejection]', e));

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

import {
  getDb,
  dbGetSettings,
  dbUpdateSettings,
  dbGetAllRoutes,
  dbGetRouteById,
  dbSaveOrUpdateRoute,
  dbDeleteRoute,
  dbSyncAllRoutes,
  dbResetToDefaults,
  dbGetRouteAuditLogs,
  dbGetTableStats,
  testFirestoreWrite,
  isFirestoreWritable,
  getInitError,
} from './server/db';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Requirement 5: 加上 app.set('trust proxy', 1)
app.set('trust proxy', 1);

// Enable JSON body parsing with large payload support for bulk import/excel data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// ----------------- Admin Authentication & Environment Config ----------------- //

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

// 沒設定時伺服器啟動失敗並顯示明確錯誤
if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_SESSION_SECRET) {
  const missing: string[] = [];
  if (!ADMIN_USER) missing.push('ADMIN_USER');
  if (!ADMIN_PASS) missing.push('ADMIN_PASS');
  if (!ADMIN_SESSION_SECRET) missing.push('ADMIN_SESSION_SECRET');
  const errorMsg = `[Fatal Configuration Error] 伺服器啟動失敗：缺少必要環境變數 [${missing.join(', ')}]。請於環境變數或 .env 檔案中設定後再啟動。`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

function createAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET!).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64');
}

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, tsStr, sig] = decoded.split(':');
    if (user !== 'admin' || !tsStr || !sig) return false;
    const ts = parseInt(tsStr, 10);
    // Token valid for 14 days
    if (isNaN(ts) || Date.now() - ts > 14 * 24 * 3600 * 1000) return false;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET!).update(`admin:${ts}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token =
    req.cookies?.admin_session ||
    (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : null) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (token && verifyAdminToken(token)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: '未授權：需要管理員權限以修改資料 (Admin authentication required)'
  });
}

// Rate limiting for login attempts: max 10 failed attempts within 5 minutes per IP
interface LoginAttemptRecord {
  attempts: number;
  firstAttemptAt: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 10;

// Admin login / logout / status endpoints
// Requirement 5: 登入失敗次數限制改用 req.ip
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  // Check rate limit
  if (record) {
    if (now - record.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (record.attempts >= MAX_FAILED_ATTEMPTS) {
      const remainingSecs = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `登入嘗試失敗次數過多（同一 IP 5 分鐘內最多 10 次），請於 ${remainingSecs} 秒後再試`
      });
    }
  }

  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // Clear failed attempts on successful login
    loginAttempts.delete(ip);
    const token = createAdminToken();
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 3600 * 1000
    });
    return res.json({ success: true, token });
  }

  // Record failed attempt
  const currentRecord = loginAttempts.get(ip);
  if (!currentRecord || now - currentRecord.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { attempts: 1, firstAttemptAt: now });
  } else {
    currentRecord.attempts += 1;
  }

  const totalFailed = loginAttempts.get(ip)?.attempts || 1;
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - totalFailed);

  return res.status(401).json({
    success: false,
    error: remaining > 0
      ? `帳號或密碼錯誤，請確認後重新輸入（剩餘嘗試次數：${remaining} 次）`
      : '登入失敗次數已達 10 次上限，請於 5 分鐘後再試'
  });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_session', { path: '/' });
  res.json({ success: true });
});

app.get('/api/admin/status', (req, res) => {
  const token =
    req.cookies?.admin_session ||
    (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : null) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  const isAdmin = !!(token && verifyAdminToken(token));
  res.json({ success: true, isAdmin });
});

// ----------------- Error Formatter Helper ----------------- //

/**
 * Requirement 1: 遇到權限錯誤時直接拋出錯誤，API 回傳 500 並在 error 訊息中註明
 * 「Firestore 權限不足，資料未儲存」，不可回傳 success。
 */
function handleApiRouteError(res: express.Response, error: any, defaultMessage: string = '操作失敗') {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isPermissionDenied =
    (error as any)?.code === 7 ||
    errMsg.includes('Firestore 權限不足') ||
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('Missing or insufficient permissions');

  if (isPermissionDenied) {
    return res.status(500).json({
      success: false,
      error: 'Firestore 權限不足，資料未儲存'
    });
  }

  if (errMsg.includes('CONFLICT')) {
    return res.status(409).json({ success: false, conflict: true, error: errMsg });
  }
  if (errMsg.includes('BLOCKED')) {
    return res.status(400).json({ success: false, blocked: true, error: errMsg });
  }

  return res.status(500).json({ success: false, error: errMsg || defaultMessage });
}

// ----------------- RESTful API Routes ----------------- //

// Requirement 3 & 5: 寫入測試狀態與最後一次 getDb() 初始化錯誤訊息
app.get('/api/health', (req, res) => {
  const writable = isFirestoreWritable();
  const initError = getInitError();
  res.json({
    status: writable ? 'ok' : 'firestore_unwritable',
    initError: initError || null,
    timestamp: new Date().toISOString()
  });
});

// Site Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await dbGetSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    handleApiRouteError(res, error, '讀取設定失敗');
  }
});

app.put('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = req.body;
    const updated = await dbUpdateSettings(settings);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    handleApiRouteError(res, error, '更新設定失敗');
  }
});

// Routes
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await dbGetAllRoutes();
    res.json({ success: true, data: routes });
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    handleApiRouteError(res, error, '讀取路線失敗');
  }
});

app.get('/api/routes/:id', async (req, res) => {
  try {
    const route = await dbGetRouteById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }
    res.json({ success: true, data: route });
  } catch (error: any) {
    console.error('Error fetching route:', error);
    handleApiRouteError(res, error, '讀取路線失敗');
  }
});

app.post('/api/routes', requireAdminAuth, async (req, res) => {
  try {
    const routeData = req.body;
    if (!routeData.id || !routeData.name) {
      return res.status(400).json({ success: false, error: 'Route id and name are required' });
    }
    const saved = await dbSaveOrUpdateRoute(routeData);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error('Error creating route:', error);
    handleApiRouteError(res, error, '新增路線失敗');
  }
});

app.put('/api/routes/:id', requireAdminAuth, async (req, res) => {
  try {
    const routeData = { ...req.body, id: req.params.id };
    const saved = await dbSaveOrUpdateRoute(routeData);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error('Error updating route:', error);
    handleApiRouteError(res, error, '更新路線失敗');
  }
});

// Authoritative permanent Excel overwrite endpoint
app.post('/api/routes/:id/excel-overwrite', requireAdminAuth, async (req, res) => {
  try {
    const routeId = req.params.id;
    const payload = {
      ...req.body,
      id: routeId,
      forceOverwrite: true,
      segmentsMode: 'replace' as const,
      allowShrink: true
    };
    console.log(`[API EXCEL OVERWRITE] Received permanent Excel overwrite request for route ${routeId} with ${payload.segments?.length || 0} segments`);
    const saved = await dbSaveOrUpdateRoute(payload);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error(`[API EXCEL OVERWRITE ERROR] Failed to permanently overwrite route ${req.params.id}:`, error);
    handleApiRouteError(res, error, 'Excel 覆蓋路線失敗');
  }
});

app.delete('/api/routes/:id', requireAdminAuth, async (req, res) => {
  try {
    await dbDeleteRoute(req.params.id);
    res.json({ success: true, message: `Route ${req.params.id} deleted successfully` });
  } catch (error: any) {
    console.error('Error deleting route:', error);
    handleApiRouteError(res, error, '刪除路線失敗');
  }
});

app.post('/api/routes/sync', requireAdminAuth, async (req, res) => {
  try {
    const { routes } = req.body;
    if (!Array.isArray(routes)) {
      return res.status(400).json({ success: false, error: 'routes array required' });
    }
    const synced = await dbSyncAllRoutes(routes);
    res.json({ success: true, data: synced });
  } catch (error: any) {
    console.error('Error syncing routes:', error);
    handleApiRouteError(res, error, '同步路線失敗');
  }
});

app.post('/api/routes/reset', requireAdminAuth, async (req, res) => {
  try {
    const routes = await dbResetToDefaults();
    res.json({ success: true, data: routes });
  } catch (error: any) {
    console.error('Error resetting routes:', error);
    handleApiRouteError(res, error, '重設路線失敗');
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const routeId = req.query.routeId ? String(req.query.routeId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 2000;
    const logs = await dbGetRouteAuditLogs(routeId, limit);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    handleApiRouteError(res, error, '讀取稽核紀錄失敗');
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await dbGetTableStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching table stats:', error);
    handleApiRouteError(res, error, '讀取統計資料失敗');
  }
});

function getSiteBaseUrl(req: express.Request): string {
  const envUrl = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^\s"'<>]+$/i.test(envUrl)) return envUrl;
  const host = String(req.get('host') || '');
  const safeHost = /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? host : 'localhost';
  return `${req.protocol}://${safeHost}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

app.get('/robots.txt', (req, res) => {
  const base = getSiteBaseUrl(req);
  res.type('text/plain; charset=utf-8').send(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n')
  );
});

app.get('/sitemap.xml', async (req, res) => {
  const base = getSiteBaseUrl(req);
  let lastmod = '';
  try {
    const routes = await dbGetAllRoutes();
    const times = routes
      .map((r: any) => Date.parse(r.updatedAt || ''))
      .filter((t: number) => Number.isFinite(t));
    if (times.length > 0) lastmod = new Date(Math.max(...times)).toISOString().slice(0, 10);
  } catch {
    // 資料庫暫時讀不到時，sitemap 仍然回傳（只是不含 lastmod）
  }
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n' +
    `    <loc>${escapeXml(base)}/</loc>\n` +
    (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
    '  </url>\n' +
    '</urlset>\n';
  res.type('application/xml; charset=utf-8').send(xml);
});

function buildSeoHead(base: string): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${base}/#organization`, name: '亞馬遜國家山岳協會', url: `${base}/` },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: `${base}/`,
        name: '上河地圖資料庫｜登山行程規劃',
        inLanguage: 'zh-TW',
        publisher: { '@id': `${base}/#organization` },
      },
    ],
  };
  const jsonLdText = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  return [
    `<link rel="canonical" href="${base}/" />`,
    `<meta property="og:url" content="${base}/" />`,
    `<script type="application/ld+json">${jsonLdText}</script>`,
  ].join('\n    ');
}

app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// ----------------- Vite & Static Middleware ----------------- //

async function startServer() {
  // Requirement 3: 伺服器啟動時做一次寫入測試（寫入並刪除 _health/startup 文件）
  await testFirestoreWrite();

  // Initialize Firestore Database and seed if empty
  try {
    await getDb();
  } catch (err: any) {
    console.error('[Server Init Warning] getDb() failed on startup:', err?.message || err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    let indexTemplate: string | null = null;

    app.use(
      express.static(distPath, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
        },
      })
    );

    app.get('*', (req, res) => {
      if (path.extname(req.path)) {
        return res.status(404).type('text/plain').send('Not Found');
      }
      if (req.path !== '/') {
        res.setHeader('X-Robots-Tag', 'noindex, follow');
      }
      res.setHeader('Cache-Control', 'no-cache');
      try {
        if (indexTemplate === null) indexTemplate = fs.readFileSync(indexPath, 'utf-8');
        const html = indexTemplate.replace('<!--SEO_HEAD-->', buildSeoHead(getSiteBaseUrl(req)));
        res.type('html').send(html);
      } catch (err) {
        console.error('[SEO] Failed to render index.html, falling back to static file:', err);
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Firestore Hiking Database and Planner API running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

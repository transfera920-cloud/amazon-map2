import { initializeApp as initAdminApp, getApp as getAdminApp, getApps as getAdminApps, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore, WriteBatch as AdminWriteBatch, Query as AdminQuery } from 'firebase-admin/firestore';
import { initializeApp as initClientApp, getApp as getClientApp, getApps as getClientApps } from 'firebase/app';
import {
  getFirestore as getClientFirestore,
  collection as clientCollection,
  doc as clientDoc,
  getDoc as getClientDoc,
  getDocs as getClientDocs,
  query as clientQuery,
  where as clientWhere,
  limit as clientLimit,
  Firestore as ClientFirestore
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { DEFAULT_MAIN_ROUTES } from '../src/data/defaultRoutes';
import { MainRoute, RouteImage, Segment, SiteSettings, SaveRoutePayload, SegmentsUpdateMode } from '../src/types';

// Load Firebase configuration
const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any;
try {
  const raw = fs.readFileSync(firebaseConfigPath, 'utf-8');
  firebaseConfig = JSON.parse(raw);
} catch (err) {
  console.error('[Firebase Init Error] Could not read firebase-applet-config.json:', err);
  throw err;
}

// Requirement 2: 若環境變數 FIREBASE_SERVICE_ACCOUNT 存在，就用 JSON.parse 後的服務帳戶金鑰 cert 初始化；否則使用預設憑證。
let adminAppOptions: AppOptions = {};
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminAppOptions = {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || firebaseConfig.projectId,
    };
    console.log('[Firebase Admin Init] Initialized using FIREBASE_SERVICE_ACCOUNT certificate.');
  } catch (parseErr) {
    console.error('[Firebase Admin Init Error] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseErr);
    throw new Error('FIREBASE_SERVICE_ACCOUNT 環境變數格式錯誤，無法解析為 JSON');
  }
} else {
  adminAppOptions = {
    projectId: firebaseConfig.projectId,
  };
  console.log(`[Firebase Admin Init] Initialized with default credentials for projectId: ${firebaseConfig.projectId}`);
}

const adminApp = getAdminApps().length === 0
  ? initAdminApp(adminAppOptions)
  : getAdminApp();

export const db: AdminFirestore = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

// Web SDK instance for public reads (evaluated by firestore.rules: allow read: if true)
const clientApp = getClientApps().length === 0
  ? initClientApp(firebaseConfig)
  : getClientApp();

const clientDb: ClientFirestore = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const isPermissionDenied =
    (error as any)?.code === 7 ||
    String((error as any)?.message || error).includes('PERMISSION_DENIED') ||
    String((error as any)?.message || error).includes('Missing or insufficient permissions');

  if (isPermissionDenied) {
    const err = new Error('Firestore 權限不足，資料未儲存');
    (err as any).code = 7;
    console.error(`[Firestore Permission Denied] ${operationType} on ${path}: Firestore 權限不足，資料未儲存`);
    throw err;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('[Firestore Admin Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- Health & Startup Write Test ---------------- //

let firestoreWritable = false;
let lastInitError: string | null = null;

export function getInitError(): string | null {
  return lastInitError;
}

/**
 * Requirement 3: 伺服器啟動時做一次寫入測試（寫入並刪除 _health/startup 文件），
 * 失敗就在日誌印出明確錯誤並讓 /api/health 回傳 status: "firestore_unwritable"。
 */
export async function testFirestoreWrite(): Promise<boolean> {
  const startupDocRef = db.collection('_health').doc('startup');
  try {
    await startupDocRef.set({
      test: true,
      timestamp: new Date().toISOString(),
    });
    await startupDocRef.delete();
    firestoreWritable = true;
    console.log('[Firestore Health] Startup write test passed: Firestore is writable.');
    return true;
  } catch (err: any) {
    firestoreWritable = false;
    console.error('[Firestore Health Error] Startup write test failed! Firestore is unwritable:', err?.message || err);
    return false;
  }
}

export function isFirestoreWritable(): boolean {
  return firestoreWritable;
}

// ---------------- In-Memory Cache (Valid Read Cache Only) ---------------- //

let routesCache: MainRoute[] | null = null;
let routesCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearRoutesCache(): void {
  routesCache = null;
  routesCacheTimestamp = 0;
  console.log('[Cache] Routes in-memory cache cleared');
}

let isInitialized = false;

/**
 * Requirement 2 & 5:
 * getDb() 的初始匯入判斷只能使用 firebase-admin 的讀取結果：
 * - 只有「admin 讀取成功」且 main_routes 完全沒有文件時才可以匯入
 * - admin 讀取失敗時，不可用網頁版 SDK 的結果判斷是否為空，直接記錄錯誤、不匯入
 * - 初始化失敗時不要設定 isInitialized = true，讓下一次請求可以重試，並記錄 lastInitError
 */
export async function getDb(): Promise<AdminFirestore> {
  if (isInitialized) return db;

  try {
    const snap = await db.collection('main_routes').limit(1).get();
    if (snap.empty) {
      console.log('[Firestore Init] admin 讀取成功且 main_routes 完全沒有文件，執行一次性初始匯入...');
      await seedInitialFirestoreData(false);
      console.log('[Firestore Init] 一次性初始匯入完成。');
    } else {
      console.log('[Firestore Init] Firestore 已有路線資料，保留雲端現有資料。');
    }
    isInitialized = true;
    lastInitError = null;
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Firestore Init Error] admin 讀取 main_routes 失敗，不執行初始匯入:', errMsg);
    lastInitError = errMsg;
    isInitialized = false;
  }

  return db;
}

/**
 * Requirement 2:
 * seedInitialFirestoreData() 開頭補回檢查：用 admin 再讀一次 main_routes，
 * 若已有任何文件就立刻中止，不得覆蓋。
 * 這個檢查在「重設為預設值」流程中要允許（isReset: true）。
 */
async function seedInitialFirestoreData(isReset: boolean = false): Promise<void> {
  if (!isReset) {
    try {
      const checkSnap = await db.collection('main_routes').limit(1).get();
      if (!checkSnap.empty) {
        console.warn('[Firestore Seed] 中止匯入：admin 檢查到 main_routes 已有文件，不得覆蓋現有資料。');
        return;
      }
    } catch (e: any) {
      console.error('[Firestore Seed Error] admin 無法驗證 main_routes，中止匯入：', e?.message || e);
      return;
    }
  }

  const persistentRoutesPath = path.join(process.cwd(), 'data', 'persistent_routes.json');
  const persistentSettingsPath = path.join(process.cwd(), 'data', 'persistent_settings.json');

  let routesToSeed: MainRoute[] = DEFAULT_MAIN_ROUTES;
  if (fs.existsSync(persistentRoutesPath)) {
    try {
      const raw = fs.readFileSync(persistentRoutesPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        routesToSeed = parsed;
        console.log(`[Firestore Seed] Loaded ${routesToSeed.length} routes from local persistent_routes.json for initial seed`);
      }
    } catch (e) {
      console.warn('[Firestore Seed] Could not parse persistent_routes.json, using DEFAULT_MAIN_ROUTES:', e);
    }
  }

  let settingsToSeed: SiteSettings = {
    orgName: '亞馬遜國家山岳協會',
    badgeText: 'Official',
    subTitle: 'Sunriver Map Database ｜ Trip Planner',
    systemTitle: '上河圖資登山行程規劃系統',
    logoInitial: 'A',
  };

  if (fs.existsSync(persistentSettingsPath)) {
    try {
      const raw = fs.readFileSync(persistentSettingsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.orgName) {
        settingsToSeed = { ...settingsToSeed, ...parsed };
      }
    } catch (e) {
      console.warn('[Firestore Seed] Could not parse persistent_settings.json:', e);
    }
  }

  // Seed site settings
  const settingsBatch = db.batch();
  settingsBatch.set(db.collection('site_settings').doc('global'), {
    ...settingsToSeed,
    updatedAt: new Date().toISOString()
  });
  await settingsBatch.commit();

  // Batch insert routes, images, segments in chunks of 400 operations
  let currentBatch = db.batch();
  let opCount = 0;

  async function checkAndCommit() {
    opCount++;
    if (opCount >= 400) {
      await currentBatch.commit();
      currentBatch = db.batch();
      opCount = 0;
    }
  }

  let routeOrder = 0;
  for (const route of routesToSeed) {
    routeOrder++;
    const routeId = route.id;
    const now = new Date().toISOString();

    currentBatch.set(db.collection('main_routes').doc(routeId), {
      id: routeId,
      code: route.code || routeId,
      name: route.name,
      mapUrl: route.mapUrl || '',
      gpxUrl: route.gpxUrl || '',
      description: route.description || '',
      sortOrder: routeOrder,
      createdAt: route.createdAt || now,
      updatedAt: route.updatedAt || now
    });
    await checkAndCommit();

    // Images
    let imgOrder = 0;
    for (const img of route.images || []) {
      imgOrder++;
      const imgId = img.id || `${routeId}_img_${imgOrder}`;
      currentBatch.set(db.collection('route_images').doc(imgId), {
        id: imgId,
        routeId,
        type: img.type || '行程示意圖',
        title: img.title || '',
        url: img.url,
        sortOrder: imgOrder
      });
      await checkAndCommit();
    }

    // Segments
    for (const seg of route.segments || []) {
      const segId = seg.id || `${routeId}_seg_${seg.seq}`;
      currentBatch.set(db.collection('route_segments').doc(segId), {
        id: segId,
        routeId,
        seq: Number(seg.seq) || 0,
        planName: seg.planName || '',
        startNode: seg.startNode || '',
        endNode: seg.endNode || '',
        duration: Number(seg.duration) || 0,
        note: seg.note || '',
        direction: seg.direction || '',
        category: seg.category || ''
      });
      await checkAndCommit();
    }
  }

  if (opCount > 0) {
    await currentBatch.commit();
  }
  clearRoutesCache();
}

// ---------------- Site Settings ---------------- //

export async function dbGetSettings(): Promise<SiteSettings> {
  const defaultSettings: SiteSettings = {
    orgName: '亞馬遜國家山岳協會',
    badgeText: 'Official',
    subTitle: 'Sunriver Map Database ｜ Trip Planner',
    systemTitle: '上河圖資登山行程規劃系統',
    logoInitial: 'A',
  };

  try {
    let data: any = null;
    try {
      const snap = await db.collection('site_settings').doc('global').get();
      if (snap.exists) {
        data = snap.data();
      }
    } catch {
      // Fallback to public client read (firestore.rules allow read: if true)
      const snap = await getClientDoc(clientDoc(clientDb, 'site_settings', 'global'));
      if (snap.exists()) {
        data = snap.data();
      }
    }

    if (data) {
      return {
        orgName: data.orgName || defaultSettings.orgName,
        badgeText: data.badgeText || defaultSettings.badgeText,
        subTitle: data.subTitle || defaultSettings.subTitle,
        systemTitle: data.systemTitle || defaultSettings.systemTitle,
        logoInitial: data.logoInitial || defaultSettings.logoInitial,
        updatedAt: data.updatedAt
      };
    }
    return defaultSettings;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, 'site_settings/global');
  }
}

export async function dbUpdateSettings(settings: SiteSettings): Promise<SiteSettings> {
  await getDb();
  const updated = {
    ...settings,
    updatedAt: new Date().toISOString()
  };

  try {
    const batch = db.batch();
    batch.set(db.collection('site_settings').doc('global'), updated, { merge: true });
    await batch.commit();
    return updated;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, 'site_settings/global');
  }
}

// ---------------- Routes Operations ---------------- //

/**
 * Retrieve all routes with server-side in-memory caching (5-minute TTL).
 * Cache is prioritized for GET /api/routes to reduce Firestore reads.
 * Requirement 3:
 * 若 admin 讀取失敗，改用網頁版 SDK 讀取時，如果三個集合全部回傳 0 筆，
 * 視為讀取失敗，拋出錯誤並回傳 500，不要回傳 success 的空陣列。
 */
export async function dbGetAllRoutes(useCache: boolean = true): Promise<MainRoute[]> {
  const now = Date.now();

  // Return in-memory cache if available and within TTL
  if (useCache && routesCache && (now - routesCacheTimestamp < CACHE_TTL_MS)) {
    return routesCache;
  }

  try {
    let routesDocs: any[] = [];
    let imagesDocs: any[] = [];
    let segmentsDocs: any[] = [];

    try {
      const [rSnap, iSnap, sSnap] = await Promise.all([
        db.collection('main_routes').get(),
        db.collection('route_images').get(),
        db.collection('route_segments').get()
      ]);
      routesDocs = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      imagesDocs = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      segmentsDocs = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (adminErr: any) {
      console.warn('[dbGetAllRoutes] admin 讀取失敗，改用網頁版 SDK 讀取:', adminErr?.message || adminErr);
      const [rSnap, iSnap, sSnap] = await Promise.all([
        getClientDocs(clientCollection(clientDb, 'main_routes')),
        getClientDocs(clientCollection(clientDb, 'route_images')),
        getClientDocs(clientCollection(clientDb, 'route_segments'))
      ]);
      routesDocs = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      imagesDocs = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      segmentsDocs = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Requirement 3: 如果三個集合全部回傳 0 筆，視為讀取失敗，拋出錯誤並回傳 500，不可回傳空陣列
      if (routesDocs.length === 0 && imagesDocs.length === 0 && segmentsDocs.length === 0) {
        throw new Error('Firestore 讀取失敗：網頁版 SDK 回傳 0 筆資料，可能處於離線狀態或資料庫連線中斷');
      }
    }

    // Group images by routeId
    const imagesByRoute: Record<string, RouteImage[]> = {};
    for (const d of imagesDocs) {
      const routeId = d.routeId;
      if (!routeId) continue;
      if (!imagesByRoute[routeId]) imagesByRoute[routeId] = [];
      imagesByRoute[routeId].push({
        id: d.id,
        type: d.type || '其他圖資',
        title: d.title || '',
        url: d.url || '',
        sortOrder: d.sortOrder || 0
      } as any);
    }

    // Group segments by routeId
    const segmentsByRoute: Record<string, Segment[]> = {};
    for (const d of segmentsDocs) {
      const routeId = d.routeId;
      if (!routeId) continue;
      if (!segmentsByRoute[routeId]) segmentsByRoute[routeId] = [];
      segmentsByRoute[routeId].push({
        id: d.id,
        seq: Number(d.seq) || 0,
        planName: d.planName || '',
        startNode: d.startNode || '',
        endNode: d.endNode || '',
        duration: Number(d.duration) || 0,
        note: d.note || '',
        direction: d.direction || '',
        category: d.category || ''
      });
    }

    const routes: MainRoute[] = [];
    for (const d of routesDocs) {
      const routeId = d.id;
      const images = (imagesByRoute[routeId] || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const segments = (segmentsByRoute[routeId] || []).sort((a, b) => a.seq - b.seq);

      routes.push({
        id: routeId,
        code: d.code || routeId,
        name: d.name || '',
        mapUrl: d.mapUrl || '',
        gpxUrl: d.gpxUrl || '',
        description: d.description || '',
        sortOrder: Number(d.sortOrder) || 0,
        images,
        segments,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt || new Date().toISOString()
      });
    }

    // Sort by sortOrder ASC, code ASC
    routes.sort((a, b) => {
      const orderA = a.sortOrder || 0;
      const orderB = b.sortOrder || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.code.localeCompare(b.code);
    });

    // Cache the result
    routesCache = routes;
    routesCacheTimestamp = Date.now();
    return routes;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, 'main_routes');
  }
}

export async function dbGetRouteById(id: string): Promise<MainRoute | null> {
  // Check memory cache first
  if (routesCache && routesCache.length > 0) {
    const cached = routesCache.find(r => r.id === id || r.code === id);
    if (cached) return cached;
  }

  const all = await dbGetAllRoutes(true);
  return all.find(r => r.id === id || r.code === id) || null;
}

export class SafetyGateError extends Error {
  auditOperation: string;
  auditStatus: string;
  existingSegCount: number;
  dbVersion?: string;

  constructor(
    message: string,
    operation: string,
    status: string,
    existingSegCount: number,
    dbVersion?: string
  ) {
    super(message);
    this.name = 'SafetyGateError';
    this.auditOperation = operation;
    this.auditStatus = status;
    this.existingSegCount = existingSegCount;
    this.dbVersion = dbVersion;
  }
}

export function recordRouteAuditLogInFirestore(
  batch: AdminWriteBatch,
  entry: {
    routeId: string;
    operation: string;
    reason: string;
    incomingCount?: number;
    existingCount?: number;
    expectedOriginalCount?: number;
    clientVersion?: string;
    serverVersion?: string;
    result: string;
    status: string;
  }
): void {
  const logRef = db.collection('route_audit_logs').doc();
  batch.set(logRef, {
    id: logRef.id,
    timestamp: new Date().toISOString(),
    routeId: entry.routeId,
    operation: entry.operation,
    reason: entry.reason,
    incomingCount: entry.incomingCount ?? 0,
    existingCount: entry.existingCount ?? 0,
    expectedOriginalCount: entry.expectedOriginalCount !== undefined && entry.expectedOriginalCount !== null ? entry.expectedOriginalCount : null,
    clientVersion: entry.clientVersion || null,
    serverVersion: entry.serverVersion || null,
    result: entry.result,
    status: entry.status
  });
}

/**
 * Save or update route in Firestore using atomic writeBatch.
 * Handles images, segments with safety gates, and audit logs.
 * Clears memory cache on write.
 * Requirement 1: Never fake success on permission errors.
 */
export async function dbSaveOrUpdateRoute(
  route: SaveRoutePayload & { id: string }
): Promise<MainRoute> {
  const routeId = route.id;
  const now = new Date().toISOString();

  // Invalidate memory cache immediately on write
  clearRoutesCache();

  try {
    // 1. Fetch existing route document
    let existingRoute: any = null;
    let existingSegCount = 0;
    let existingImagesDocs: any[] = [];
    let existingSegmentsDocs: any[] = [];

    try {
      const routeDocRef = db.collection('main_routes').doc(routeId);
      const routeDocSnap = await routeDocRef.get();
      existingRoute = routeDocSnap.exists ? routeDocSnap.data() : null;

      const [existingImagesSnap, existingSegmentsSnap] = await Promise.all([
        db.collection('route_images').where('routeId', '==', routeId).get(),
        db.collection('route_segments').where('routeId', '==', routeId).get()
      ]);
      existingSegCount = existingSegmentsSnap.size;
      existingImagesDocs = existingImagesSnap.docs;
      existingSegmentsDocs = existingSegmentsSnap.docs;
    } catch {
      // Client read fallback
      const rSnap = await getClientDoc(clientDoc(clientDb, 'main_routes', routeId));
      existingRoute = rSnap.exists() ? rSnap.data() : null;
      const [iSnap, sSnap] = await Promise.all([
        getClientDocs(clientQuery(clientCollection(clientDb, 'route_images'), clientWhere('routeId', '==', routeId))),
        getClientDocs(clientQuery(clientCollection(clientDb, 'route_segments'), clientWhere('routeId', '==', routeId)))
      ]);
      existingSegCount = sSnap.size;
      existingImagesDocs = iSnap.docs;
      existingSegmentsDocs = sSnap.docs;
    }

    const dbVersion = existingRoute?.updatedAt ? String(existingRoute.updatedAt) : undefined;
    const isForceOverwrite = route.forceOverwrite === true;
    const mode: SegmentsUpdateMode = isForceOverwrite
      ? 'replace'
      : (route.segmentsMode || (route.clearSegments === true ? 'clear' : 'preserve'));

    const batch = db.batch();

    // Safety Gates check for 'replace' mode
    if (mode === 'replace' || isForceOverwrite) {
      if (!Array.isArray(route.segments)) {
        throw new SafetyGateError(
          `[SAFETY GATE ERROR] mode='replace' requires a valid segments array for route ${routeId}`,
          'BLOCKED_INVALID_PAYLOAD',
          'BLOCKED',
          existingSegCount,
          dbVersion
        );
      }

      const incomingCount = route.segments.length;
      const isAuthoritative = isForceOverwrite || route.allowShrink === true;

      if (!isAuthoritative) {
        // OCC version check
        if (route.clientVersion && existingRoute?.updatedAt) {
          if (route.clientVersion !== dbVersion) {
            throw new SafetyGateError(
              `[OCC CONFLICT DETECTED] Route ${routeId} clientVersion (${route.clientVersion}) does not match dbVersion (${dbVersion}). Please reload latest route data.`,
              'BLOCKED_VERSION_CONFLICT',
              'CONFLICT',
              existingSegCount,
              dbVersion
            );
          }
        }

        // Expected original count check
        if (existingSegCount > 0) {
          if (route.expectedOriginalCount === undefined || route.expectedOriginalCount === null) {
            throw new SafetyGateError(
              `[SAFETY GATE CONFLICT] Route ${routeId} mode='replace' requires expectedOriginalCount to be provided when replacing existing segments.`,
              'BLOCKED_EXPECTED_COUNT',
              'CONFLICT',
              existingSegCount,
              dbVersion
            );
          }
          if (route.expectedOriginalCount !== existingSegCount) {
            throw new SafetyGateError(
              `[SAFETY GATE CONFLICT] Route ${routeId} expectedOriginalCount (${route.expectedOriginalCount}) !== DB current count (${existingSegCount}). Full replacement rejected.`,
              'BLOCKED_EXPECTED_COUNT',
              'CONFLICT',
              existingSegCount,
              dbVersion
            );
          }
        }

        // Shrink protection
        const isSignificantShrink = existingSegCount >= 5 && incomingCount < existingSegCount * 0.7;
        if (isSignificantShrink) {
          throw new SafetyGateError(
            `[SHRINK PROTECTION BLOCKED] Route ${routeId} segments would shrink from ${existingSegCount} to ${incomingCount} (-${Math.round((1 - incomingCount / existingSegCount) * 100)}%). Operation requires explicit allowShrink=true or forceOverwrite=true.`,
            'BLOCKED_SHRINK',
            'BLOCKED',
            existingSegCount,
            dbVersion
          );
        }
      }
    }

    // 3. Prepare MainRoute document updates
    const routeDocRef = db.collection('main_routes').doc(routeId);
    if (existingRoute) {
      const updatedCode = route.code !== undefined && route.code !== null && String(route.code).trim() !== ''
        ? String(route.code)
        : String(existingRoute.code);
      const updatedName = route.name !== undefined && route.name !== null && String(route.name).trim() !== ''
        ? String(route.name)
        : String(existingRoute.name);
      const updatedMapUrl = route.mapUrl !== undefined && route.mapUrl !== null
        ? String(route.mapUrl)
        : String(existingRoute.mapUrl || '');
      const updatedGpxUrl = route.gpxUrl !== undefined && route.gpxUrl !== null
        ? String(route.gpxUrl)
        : String(existingRoute.gpxUrl || '');
      const updatedDesc = route.description !== undefined && route.description !== null
        ? String(route.description)
        : String(existingRoute.description || '');

      batch.set(routeDocRef, {
        code: updatedCode,
        name: updatedName,
        mapUrl: updatedMapUrl,
        gpxUrl: updatedGpxUrl,
        description: updatedDesc,
        updatedAt: now
      }, { merge: true });
    } else {
      const newCode = route.code || routeId;
      const newName = route.name || newCode;
      batch.set(routeDocRef, {
        id: routeId,
        code: newCode,
        name: newName,
        mapUrl: route.mapUrl || '',
        gpxUrl: route.gpxUrl || '',
        description: route.description || '',
        sortOrder: Date.now(),
        createdAt: now,
        updatedAt: now
      });
    }

    // 4. Handle route_images
    if (route.images === undefined || route.images === null) {
      // Keep existing images
    } else if (Array.isArray(route.images) && route.images.length > 0) {
      existingImagesDocs.forEach(d => {
        batch.delete(db.collection('route_images').doc(d.id));
      });
      let imgOrder = 0;
      for (const img of route.images) {
        imgOrder++;
        const imgId = img.id || `${routeId}_img_${Date.now()}_${imgOrder}`;
        batch.set(db.collection('route_images').doc(imgId), {
          id: imgId,
          routeId,
          type: img.type || '其他圖資',
          title: img.title || '',
          url: img.url || '',
          sortOrder: imgOrder
        });
      }
    } else if (Array.isArray(route.images) && route.images.length === 0) {
      if (route.clearImages === true) {
        existingImagesDocs.forEach(d => {
          batch.delete(db.collection('route_images').doc(d.id));
        });
      }
    }

    // 5. Handle route_segments
    if (mode === 'preserve') {
      recordRouteAuditLogInFirestore(batch, {
        routeId,
        operation: 'PRESERVE',
        reason: 'MODE_PRESERVE',
        incomingCount: route.segments?.length ?? 0,
        existingCount: existingSegCount,
        expectedOriginalCount: route.expectedOriginalCount,
        clientVersion: route.clientVersion,
        serverVersion: dbVersion,
        result: `Preserved all ${existingSegCount} segments`,
        status: 'SUCCESS'
      });
    } else if (mode === 'clear') {
      if (route.clearSegments === true) {
        existingSegmentsDocs.forEach(d => {
          batch.delete(db.collection('route_segments').doc(d.id));
        });
        recordRouteAuditLogInFirestore(batch, {
          routeId,
          operation: 'CLEAR_SEGMENTS',
          reason: 'EXPLICIT_USER_CLEAR',
          incomingCount: 0,
          existingCount: existingSegCount,
          expectedOriginalCount: route.expectedOriginalCount,
          clientVersion: route.clientVersion,
          serverVersion: dbVersion,
          result: `Deleted ${existingSegCount} segments`,
          status: 'SUCCESS'
        });
      }
    } else if (mode === 'partial') {
      if (Array.isArray(route.segments) && route.segments.length > 0) {
        let order = existingSegCount;
        for (const seg of route.segments) {
          order++;
          const segId = seg.id || `${routeId}_seg_${Date.now()}_${order}`;
          batch.set(db.collection('route_segments').doc(segId), {
            id: segId,
            routeId,
            seq: seg.seq || order,
            planName: seg.planName || '',
            startNode: seg.startNode || '',
            endNode: seg.endNode || '',
            duration: Number(seg.duration) || 0,
            note: seg.note || '',
            direction: seg.direction || '',
            category: seg.category || ''
          }, { merge: true });
        }
        recordRouteAuditLogInFirestore(batch, {
          routeId,
          operation: 'PARTIAL_UPDATE',
          reason: 'USER_PARTIAL_UPDATE',
          incomingCount: route.segments.length,
          existingCount: existingSegCount,
          expectedOriginalCount: route.expectedOriginalCount,
          clientVersion: route.clientVersion,
          serverVersion: dbVersion,
          result: `Upserted ${route.segments.length} segments`,
          status: 'SUCCESS'
        });
      }
    } else if (mode === 'replace' || isForceOverwrite) {
      existingSegmentsDocs.forEach(d => {
        batch.delete(db.collection('route_segments').doc(d.id));
      });

      const segments = route.segments || [];
      let segOrder = 0;
      for (const seg of segments) {
        segOrder++;
        const segId = seg.id || `${routeId}_seg_${Date.now()}_${segOrder}`;
        batch.set(db.collection('route_segments').doc(segId), {
          id: segId,
          routeId,
          seq: seg.seq || segOrder,
          planName: seg.planName || '',
          startNode: seg.startNode || '',
          endNode: seg.endNode || '',
          duration: Number(seg.duration) || 0,
          note: seg.note || '',
          direction: seg.direction || '',
          category: seg.category || ''
        });
      }

      recordRouteAuditLogInFirestore(batch, {
        routeId,
        operation: isForceOverwrite ? 'PERMANENT_EXCEL_OVERWRITE' : 'FULL_REPLACE',
        reason: isForceOverwrite ? 'ADMIN_MANUAL_EXCEL_OVERWRITE' : 'EXPLICIT_FULL_REPLACE',
        incomingCount: segments.length,
        existingCount: existingSegCount,
        expectedOriginalCount: route.expectedOriginalCount,
        clientVersion: route.clientVersion,
        serverVersion: dbVersion,
        result: `Permanently replaced ${existingSegCount} with ${segments.length} segments`,
        status: 'SUCCESS'
      });
    }

    // 6. Commit atomic batch
    await batch.commit();

    const updatedRoute = await dbGetRouteById(routeId);
    if (!updatedRoute) {
      throw new Error(`Route ${routeId} could not be retrieved after saving`);
    }
    return updatedRoute;
  } catch (error: any) {
    if (error instanceof SafetyGateError) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `main_routes/${routeId}`);
  }
}

export async function dbDeleteRoute(routeId: string): Promise<boolean> {
  console.log(`[Firestore Route Delete] Deleting route ${routeId}`);

  // Invalidate memory cache immediately on delete
  clearRoutesCache();

  try {
    let imagesDocs: any[] = [];
    let segmentsDocs: any[] = [];

    try {
      const [imagesSnap, segmentsSnap] = await Promise.all([
        db.collection('route_images').where('routeId', '==', routeId).get(),
        db.collection('route_segments').where('routeId', '==', routeId).get()
      ]);
      imagesDocs = imagesSnap.docs;
      segmentsDocs = segmentsSnap.docs;
    } catch {
      const [iSnap, sSnap] = await Promise.all([
        getClientDocs(clientQuery(clientCollection(clientDb, 'route_images'), clientWhere('routeId', '==', routeId))),
        getClientDocs(clientQuery(clientCollection(clientDb, 'route_segments'), clientWhere('routeId', '==', routeId)))
      ]);
      imagesDocs = iSnap.docs;
      segmentsDocs = sSnap.docs;
    }

    const batch = db.batch();

    segmentsDocs.forEach(d => {
      batch.delete(db.collection('route_segments').doc(d.id));
    });

    imagesDocs.forEach(d => {
      batch.delete(db.collection('route_images').doc(d.id));
    });

    batch.delete(db.collection('main_routes').doc(routeId));

    batch.set(db.collection('deleted_routes').doc(routeId), {
      id: routeId,
      deletedAt: new Date().toISOString()
    });

    recordRouteAuditLogInFirestore(batch, {
      routeId,
      operation: 'DELETE_ROUTE',
      reason: 'EXPLICIT_ROUTE_DELETE',
      result: `Deleted route ${routeId}`,
      status: 'SUCCESS'
    });

    await batch.commit();
    console.log(`[Firestore Route Delete] Successfully deleted route ${routeId}`);
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `main_routes/${routeId}`);
  }
}

export async function dbSyncAllRoutes(routes: SaveRoutePayload[]): Promise<MainRoute[]> {
  console.log(`[Firestore Route Sync] Starting batch sync for ${routes.length} routes`);

  // Clear memory cache before syncing
  clearRoutesCache();

  for (const route of routes) {
    const safeSyncRoute: SaveRoutePayload & { id: string } = {
      ...route,
      id: route.id!,
      segmentsMode: route.forceOverwrite ? 'replace' : (route.segmentsMode || 'preserve'),
      forceOverwrite: route.forceOverwrite === true
    };
    await dbSaveOrUpdateRoute(safeSyncRoute);
  }

  // Clear cache again and fetch authoritative fresh routes
  clearRoutesCache();
  return dbGetAllRoutes(false);
}

export async function dbGetRouteAuditLogs(routeId?: string, limitCount: number = 2000): Promise<any[]> {
  try {
    let logs: any[] = [];
    try {
      let q: AdminQuery = db.collection('route_audit_logs');
      if (routeId) {
        q = q.where('routeId', '==', routeId);
      }
      const snap = await q.limit(limitCount).get();
      snap.forEach(docSnap => {
        logs.push(docSnap.data());
      });
    } catch {
      let cQuery = clientQuery(clientCollection(clientDb, 'route_audit_logs'), clientLimit(limitCount));
      if (routeId) {
        cQuery = clientQuery(clientCollection(clientDb, 'route_audit_logs'), clientWhere('routeId', '==', routeId), clientLimit(limitCount));
      }
      const snap = await getClientDocs(cQuery);
      snap.forEach(docSnap => {
        logs.push(docSnap.data());
      });
    }

    logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return logs;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, 'route_audit_logs');
  }
}

export async function dbGetTableStats() {
  try {
    let routesCount = 0;
    let segsCount = 0;
    let imgsCount = 0;
    let logsCount = 0;

    try {
      const [routesSnap, segsSnap, imgsSnap, logsSnap] = await Promise.all([
        db.collection('main_routes').get(),
        db.collection('route_segments').get(),
        db.collection('route_images').get(),
        db.collection('route_audit_logs').get()
      ]);
      routesCount = routesSnap.size;
      segsCount = segsSnap.size;
      imgsCount = imgsSnap.size;
      logsCount = logsSnap.size;
    } catch {
      const [routesSnap, segsSnap, imgsSnap, logsSnap] = await Promise.all([
        getClientDocs(clientCollection(clientDb, 'main_routes')),
        getClientDocs(clientCollection(clientDb, 'route_segments')),
        getClientDocs(clientCollection(clientDb, 'route_images')),
        getClientDocs(clientCollection(clientDb, 'route_audit_logs'))
      ]);
      routesCount = routesSnap.size;
      segsCount = segsSnap.size;
      imgsCount = imgsSnap.size;
      logsCount = logsSnap.size;
    }

    return {
      mainRoutesCount: routesCount,
      routeSegmentsCount: segsCount,
      routeImagesCount: imgsCount,
      routeAuditLogsCount: logsCount
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, 'stats');
  }
}

/**
 * Reset routes to defaults.
 * Requirement 4: dbResetToDefaults 中，若 route_backups 備份寫入失敗，必須中止重設並回傳錯誤，不可繼續刪除資料。
 * Clears memory cache on reset.
 */
export async function dbResetToDefaults(): Promise<MainRoute[]> {
  console.log(`[Firestore Route Reset] Explicit user reset requested.`);

  // Clear memory cache
  clearRoutesCache();

  // 1. Export current routes into a backup snapshot document in route_backups collection
  const currentRoutes = await dbGetAllRoutes(false);
  const backupId = `backup_${Date.now()}`;
  const backupTimestamp = new Date().toISOString();

  // Requirement 4: If backup fails, MUST abort and throw error, never proceed to delete!
  try {
    await db.collection('route_backups').doc(backupId).set({
      id: backupId,
      timestamp: backupTimestamp,
      routeCount: currentRoutes.length,
      routes: currentRoutes,
      createdReason: 'PRE_RESET_BACKUP'
    });
    console.log(`[Firestore Reset] Created snapshot backup ${backupId} (${currentRoutes.length} routes) in route_backups before resetting`);
  } catch (backupErr: any) {
    console.error('[Firestore Reset Error] route_backups 備份寫入失敗，中止重設流程以保護資料：', backupErr);
    handleFirestoreError(backupErr, OperationType.WRITE, `route_backups/${backupId}`);
  }

  try {
    const [routesSnap, segsSnap, imgsSnap] = await Promise.all([
      db.collection('main_routes').get(),
      db.collection('route_segments').get(),
      db.collection('route_images').get()
    ]);

    // Batch delete existing collections
    let batch = db.batch();
    let count = 0;

    for (const snap of segsSnap.docs) {
      batch.delete(snap.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    for (const snap of imgsSnap.docs) {
      batch.delete(snap.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    for (const snap of routesSnap.docs) {
      batch.delete(snap.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    // Record audit log for reset and backup
    try {
      await db.collection('route_audit_logs').add({
        id: `audit_reset_${Date.now()}`,
        timestamp: backupTimestamp,
        routeId: 'ALL',
        operation: 'RESET_ROUTES_WITH_BACKUP',
        reason: 'USER_EXPLICIT_RESET_TO_DEFAULTS',
        backupId,
        routesCount: currentRoutes.length,
        status: 'SUCCESS',
        result: `Backed up ${currentRoutes.length} routes to route_backups/${backupId} and reset database to defaults`
      });
    } catch {}

    // Re-seed with default data (pass isReset: true to allow re-seeding)
    await seedInitialFirestoreData(true);
    console.log(`[Firestore Route Reset] Re-seeded Firestore with defaults successfully`);

    clearRoutesCache();
    return dbGetAllRoutes(false);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'reset_routes');
  }
}

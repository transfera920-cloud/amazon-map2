import { MainRoute } from '../types';

const STORAGE_KEY = 'sunriver_authoritative_user_routes_v2';

interface StoredRouteRecord {
  route: MainRoute;
  savedAt: number;
  isExcelImport: boolean;
}

type StoredMap = Record<string, StoredRouteRecord>;

export function getAuthoritativeLocalMap(): StoredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredMap;
  } catch (e) {
    console.warn('[LOCAL STORAGE] Failed to parse local routes:', e);
    return {};
  }
}

export function saveAuthoritativeRouteLocally(route: MainRoute, isExcelImport = true): void {
  try {
    const current = getAuthoritativeLocalMap();
    current[route.id] = {
      route,
      savedAt: Date.now(),
      isExcelImport
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[LOCAL STORAGE] Failed to save route locally:', e);
  }
}

export function removeAuthoritativeRouteLocally(routeId: string): void {
  try {
    const current = getAuthoritativeLocalMap();
    if (current[routeId]) {
      delete current[routeId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('[LOCAL STORAGE] Failed to remove route locally:', e);
  }
}

export function clearAllLocalAuthoritativeRoutes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[LOCAL STORAGE] Cleared local cache');
  } catch (e) {
    console.warn('[LOCAL STORAGE] Failed to clear local cache:', e);
  }
}

/**
 * Cloud Firestore is the authoritative and unique source of truth.
 * Stale browser localStorage NEVER automatically overwrites cloud data.
 */
export function mergeAuthoritativeRoutesWithServer(serverRoutes: MainRoute[]): {
  merged: MainRoute[];
  needsServerResync: MainRoute[];
} {
  return {
    merged: serverRoutes,
    needsServerResync: []
  };
}

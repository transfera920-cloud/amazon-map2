import { API_BASE } from '../utils/urlHelper';
import { MainRoute, SiteSettings, SaveRoutePayload } from '../types';

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const res = await fetch(API_BASE + '/api/settings');
  if (!res.ok) {
    throw new Error(`Failed to load settings: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  const res = await fetch(API_BASE + '/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    throw new Error(`Failed to save settings: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchAllRoutes(): Promise<MainRoute[]> {
  const res = await fetch(API_BASE + '/api/routes');
  if (!res.ok) {
    throw new Error(`Failed to fetch routes: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data || [];
}

export async function fetchRouteById(id: string): Promise<MainRoute> {
  const res = await fetch(`${API_BASE}/api/routes/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch route ${id}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function saveOrUpdateRouteApi(route: SaveRoutePayload & { id: string }): Promise<MainRoute> {
  const res = await fetch(`${API_BASE}/api/routes/${encodeURIComponent(route.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(route)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to save route: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function overwriteRouteWithExcelApi(route: SaveRoutePayload & { id: string }): Promise<MainRoute> {
  const res = await fetch(`${API_BASE}/api/routes/${encodeURIComponent(route.id)}/excel-overwrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(route)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to permanently overwrite route with Excel data: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteRouteApi(routeId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/routes/${encodeURIComponent(routeId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to delete route ${routeId}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.success;
}

export async function syncAllRoutesApi(routes: SaveRoutePayload[]): Promise<MainRoute[]> {
  const res = await fetch(API_BASE + '/api/routes/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routes })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to sync routes: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function resetRoutesToDefaultsApi(): Promise<MainRoute[]> {
  const res = await fetch(API_BASE + '/api/routes/reset', {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to reset routes: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

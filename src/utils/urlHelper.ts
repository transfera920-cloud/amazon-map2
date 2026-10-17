/**
 * Format external URLs to guarantee safe, clickable http/https protocols.
 */
export function formatExternalUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Get effective GPX link for a route.
 * Prioritizes the backend-configured GPX / 健行筆記 URL.
 * Falls back to 健行筆記 GPX search for the trail name if not explicitly set.
 */
export function getEffectiveGpxUrl(gpxUrl?: string, routeName?: string): string {
  const formatted = formatExternalUrl(gpxUrl);
  if (formatted) {
    return formatted;
  }
  if (routeName && routeName.trim()) {
    // Strip route code like 'G20 ' or 'G02 ' for cleaner search keyword
    const cleanName = routeName.replace(/^[A-Z0-9]+\s*/, '').trim();
    return `https://hiking.biji.co/index.php?q=trail&act=gpx_list&keyword=${encodeURIComponent(cleanName || routeName)}`;
  }
  return 'https://hiking.biji.co/index.php?q=trail&act=gpx_list';
}

import React, { useState, useEffect, useCallback } from 'react';
import { MainRoute, SiteSettings } from './types';
import {
  fetchAllRoutes,
  fetchSiteSettings,
  saveOrUpdateRouteApi,
  deleteRouteApi,
  syncAllRoutesApi,
  resetRoutesToDefaultsApi,
  updateSiteSettings,
  overwriteRouteWithExcelApi,
} from './services/api';
import { Navbar } from './components/Navbar';
import { PlannerView } from './components/PlannerView';
import { AdminModal } from './components/AdminModal';
import { Mountain, ShieldCheck, Loader2 } from 'lucide-react';
import { API_BASE } from './utils/urlHelper';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  orgName: '亞馬遜國家山岳協會',
  badgeText: 'Official',
  subTitle: 'Sunriver Map Database ｜ Trip Planner',
  systemTitle: '上河圖資登山行程規劃系統',
  logoInitial: 'A',
};

export default function App() {
  const [routes, setRoutes] = useState<MainRoute[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Initial load from Firestore database API
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedSettings, fetchedRoutes] = await Promise.all([
        fetchSiteSettings().catch(err => {
          console.warn('Failed to load settings, using defaults:', err);
          return DEFAULT_SITE_SETTINGS;
        }),
        fetchAllRoutes(),
      ]);

      setSiteSettings(fetchedSettings);
      setRoutes(fetchedRoutes);
      setIsInitialized(true);
      console.log(
        `[ROUTE INIT] firestore_loaded=true, routes_count=${fetchedRoutes.length}`
      );

      if (fetchedRoutes.length > 0) {
        setSelectedRouteId(prev => {
          if (prev && fetchedRoutes.some(r => r.id === prev)) return prev;
          return fetchedRoutes[0].id;
        });
      }
    } catch (err: any) {
      console.error('Error loading data from Firestore database:', err);
      setLoadError(err.message || '無法自資料庫載入圖資資料');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check admin session status on mount
  useEffect(() => {
    fetch(API_BASE + '/api/admin/status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isAdmin) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Keep selectedRouteId valid if routes change
  useEffect(() => {
    if (routes.length > 0 && (!selectedRouteId || !routes.some(r => r.id === selectedRouteId))) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  // Handle route updates (Saves directly to Firestore DB)
  const handleUpdateRoutes = async (updatedRoutes: MainRoute[]) => {
    if (!isInitialized || isLoading) {
      console.warn('[ROUTE SYNC BLOCKED] Cannot sync while database is loading or not initialized.');
      return;
    }
    if (!updatedRoutes || updatedRoutes.length === 0) {
      console.warn('[ROUTE SYNC BLOCKED] Empty routes array received, ignoring to protect database.');
      return;
    }

    try {
      console.log(`[ROUTE SYNC] Invoking syncAllRoutesApi with ${updatedRoutes.length} routes`);
      const synced = await syncAllRoutesApi(updatedRoutes);
      setRoutes(synced);
    } catch (e: any) {
      console.error('Failed to sync updated routes to database:', e);
      // Optimistic update fallback in case of network issue
      setRoutes(updatedRoutes);
    }
  };

  // Handle site settings updates (Saves directly to Firestore DB)
  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
    try {
      const saved = await updateSiteSettings(newSettings);
      setSiteSettings(saved);
    } catch (e) {
      console.error('Failed to save settings to database:', e);
      setSiteSettings(newSettings);
    }
  };

  // Handle route deletion (True Firestore DELETE query execution)
  const handleDeleteRoute = async (routeId: string) => {
    try {
      await deleteRouteApi(routeId);
      // Fetch fresh routes from database to guarantee absolute consistency
      const freshRoutes = await fetchAllRoutes();
      setRoutes(freshRoutes);
      if (selectedRouteId === routeId && freshRoutes.length > 0) {
        setSelectedRouteId(freshRoutes[0].id);
      }
    } catch (e) {
      console.error('Failed to delete route from database:', e);
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    }
  };

  // Handle reset to default dataset (Re-seeds Firestore database)
  const handleResetDefaults = async () => {
    try {
      const fresh = await resetRoutesToDefaultsApi();
      setRoutes(fresh);
      if (fresh.length > 0) {
        setSelectedRouteId(fresh[0].id);
      }
    } catch (e) {
      console.error('Failed to reset routes in database:', e);
    }
  };

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0f14] text-[#f1f5f9] flex flex-col items-center justify-center font-['Noto_Sans_TC',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
          <div className="text-sm font-mono tracking-widest text-[#94a3b8] uppercase">
            正在載入圖資...
          </div>
        </div>
      </div>
    );
  }

  if (loadError && routes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c0f14] text-[#f1f5f9] flex flex-col items-center justify-center font-['Noto_Sans_TC',sans-serif] p-6">
        <div className="max-w-md w-full bg-[#141820] border border-[#2a3445] rounded-xs p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Mountain className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#f8fafc] mb-2">資料庫連線異常</h2>
          <p className="text-xs text-[#94a3b8] mb-6 leading-relaxed">{loadError}</p>
          <button
            onClick={() => loadInitialData()}
            className="w-full py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs tracking-wider rounded-xs transition-colors cursor-pointer"
          >
            重新整理並載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0f14] text-[#f1f5f9] flex flex-col font-['Noto_Sans_TC',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        activeRouteName={currentRoute?.name}
        siteSettings={siteSettings}
      />

      {/* Main Trip Planner Workspace */}
      <main className="flex-1">
        <h1 className="sr-only">上河地圖資料庫｜登山行程規劃</h1>
        <PlannerView
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#12161f] border-t border-[#242b38] py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#94a3b8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="https://amazon-hike.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#cbd5e1] hover:text-[#34d399] transition-colors group"
            title="前往 亞馬遜國家山岳協會 (https://amazon-hike.com/)"
          >
            <Mountain className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
            <span className="font-semibold">{siteSettings.orgName}</span>
            <span className="text-[#64748b]">|</span>
            <span>{siteSettings.systemTitle}</span>
          </a>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#10b981]">
            <ShieldCheck className="w-4 h-4" />
            <span>依據上河文化圖資標準步程計算</span>
          </div>
        </div>
        <nav aria-label="breadcrumb" className="max-w-7xl mx-auto mt-4 pt-4 border-t border-[#1e2533] text-[11px] text-[#94a3b8] flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
          <a href="https://amazon-hike.com/" className="hover:text-[#34d399] transition-colors">首頁</a>
          <span aria-hidden="true">/</span>
          <a href="https://amazon-hike.com/tools" className="hover:text-[#34d399] transition-colors">工具</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-[#cbd5e1]">上河地圖資料庫</span>
        </nav>
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-[#1e2533] text-[11px] text-[#64748b] leading-relaxed">
          安全提醒：登山行程規劃時間僅供參考，實際行進速度受個人體能、負重、天候路況及隊伍組成等因素影響。高山健行請做好充份體能訓練、攜帶合適裝備、留心氣象變化，並遵守無痕山林（LNT）與入山入園相關法規，安全第一。
        </div>
      </footer>

      {/* Admin Settings & Route Management Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        routes={routes}
        onUpdateRoutes={handleUpdateRoutes}
        onDeleteRoute={handleDeleteRoute}
        onResetDefaults={handleResetDefaults}
        isAdminLoggedIn={isAdminLoggedIn}
        onSetIsAdminLoggedIn={setIsAdminLoggedIn}
        siteSettings={siteSettings}
        onUpdateSiteSettings={handleUpdateSiteSettings}
      />
    </div>
  );
}

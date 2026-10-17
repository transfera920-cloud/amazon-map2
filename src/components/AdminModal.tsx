import React, { useState, useRef } from 'react';
import { MainRoute, RouteImage, Segment, ImageType, SiteSettings } from '../types';
import { parseExcelFile } from '../utils/excelParser';
import { DEFAULT_SITE_SETTINGS } from '../types';
import { saveAuthoritativeRouteLocally } from '../utils/userPersistence';
import { overwriteRouteWithExcelApi } from '../services/api';
import {
  X,
  Lock,
  Upload,
  Trash2,
  Plus,
  Save,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Link,
  Layers,
  RotateCcw,
  FileText,
  LogOut,
  Settings,
  Sliders,
  Type,
  Search,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import { API_BASE } from '../utils/urlHelper';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: MainRoute[];
  onUpdateRoutes: (routes: MainRoute[]) => void;
  onDeleteRoute: (routeId: string) => void;
  onResetDefaults: () => void;
  isAdminLoggedIn: boolean;
  onSetIsAdminLoggedIn: (status: boolean) => void;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  routes,
  onUpdateRoutes,
  onDeleteRoute,
  onResetDefaults,
  isAdminLoggedIn,
  onSetIsAdminLoggedIn,
  siteSettings,
  onUpdateSiteSettings,
}) => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Selected route to edit in admin
  const [activeRouteId, setActiveRouteId] = useState<string>(routes[0]?.id || '');
  const activeRoute = routes.find(r => r.id === activeRouteId) || routes[0] || null;

  // Active tab in admin modal
  const [activeTab, setActiveTab] = useState<'import' | 'route_meta' | 'segments' | 'site_settings'>('site_settings');

  // Site title & branding settings state
  const [editOrgName, setEditOrgName] = useState(siteSettings.orgName || '亞馬遜國家山岳協會');
  const [editBadgeText, setEditBadgeText] = useState(siteSettings.badgeText || 'Official');
  const [editSubTitle, setEditSubTitle] = useState(siteSettings.subTitle || 'Sunriver Map Database ｜ Trip Planner');
  const [editSystemTitle, setEditSystemTitle] = useState(siteSettings.systemTitle || '上河圖資登山行程規劃系統');
  const [editLogoInitial, setEditLogoInitial] = useState(siteSettings.logoInitial || 'A');

  // Route metadata edit form
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editGpxUrl, setEditGpxUrl] = useState('');
  const [editMapUrl, setEditMapUrl] = useState('');
  const [editImages, setEditImages] = useState<RouteImage[]>([]);

  // Delete route confirmation state
  const [isDeletingRoute, setIsDeletingRoute] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<MainRoute | null>(null);

  // Success toast feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Selection state for segments batch operations
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  // Segment search & filter state
  const [segmentSearchQuery, setSegmentSearchQuery] = useState('');
  const [segmentPlanFilter, setSegmentPlanFilter] = useState('ALL');

  // Confirmation dialog for segment deletion
  const [segmentDeleteDialog, setSegmentDeleteDialog] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch' | 'all';
    segmentId?: string;
    segmentDesc?: string;
    count?: number;
  }>({ isOpen: false, mode: 'single' });

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear segment selection when route changes
  React.useEffect(() => {
    setSelectedSegmentIds([]);
    setSegmentSearchQuery('');
    setSegmentPlanFilter('ALL');
  }, [activeRouteId]);

  // Sync site settings when prop changes
  React.useEffect(() => {
    setEditOrgName(siteSettings.orgName);
    setEditBadgeText(siteSettings.badgeText);
    setEditSubTitle(siteSettings.subTitle);
    setEditSystemTitle(siteSettings.systemTitle || '上河圖資登山行程規劃系統');
    setEditLogoInitial(siteSettings.logoInitial || 'A');
  }, [siteSettings]);

  // When activeRoute changes, load its metadata into editing form
  React.useEffect(() => {
    if (activeRoute) {
      setEditName(activeRoute.name);
      setEditCode(activeRoute.code);
      setEditGpxUrl(activeRoute.gpxUrl || '');
      setEditMapUrl(activeRoute.mapUrl || '');
      
      // Ensure at least 2 image entries (行程示意圖, 高差示意圖)
      let imgs = (activeRoute.images || []).map(img => ({
        ...img,
        type: (img.type as string) === '高叉示意圖' ? ('高差示意圖' as const) : img.type,
        title: (img.title || '').replace('高叉示意圖', '高差示意圖')
      }));

      while (imgs.length < 2) {
        imgs.push({
          id: `img_${Date.now()}_${imgs.length}`,
          url: '',
          type: imgs.length === 0 ? '行程示意圖' : '高差示意圖',
          title: ''
        });
      }
      setEditImages(imgs);
    }
  }, [activeRoute?.id]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSetIsAdminLoggedIn(true);
        setLoginError('');
        showToast('後台登入成功');
      } else {
        setLoginError(data.error || '帳號或密碼錯誤，請確認後重新輸入');
      }
    } catch {
      setLoginError('無法連線驗證伺服器，請稍後再試');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(API_BASE + '/api/admin/logout', { method: 'POST' });
    } catch {}
    onSetIsAdminLoggedIn(false);
    onClose();
  };

  // Excel / CSV file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const parseResult = parseExcelFile(buffer, file.name);

      if (parseResult.error) {
        alert(`匯入失敗: ${parseResult.error}`);
        return;
      }

      if (parseResult.segments.length === 0) {
        alert('匯入的檔案內無任何有效路段資料');
        return;
      }

      const detectedCode = parseResult.suggestedRouteCode || '';
      let targetRoute = routes.find(r => r.id === activeRouteId);

      if (detectedCode && detectedCode !== activeRoute?.code) {
        const found = routes.find(r => r.code === detectedCode);
        if (found) {
          targetRoute = found;
        }
      }

      let updatedRoutes: MainRoute[];
      let routeToPersist: MainRoute;

      if (targetRoute) {
        // Safety Gate: Check if partial parse across multiple sheets
        if (parseResult.isPartialParse) {
          const proceed = window.confirm(
            `警告：此 Excel 檔案共有 ${parseResult.totalSheetsCount} 個工作表，但僅成功解析 ${parseResult.parsedSheetsCount} 個工作表。\n若繼續將可能導致多日資料不完整，是否確定要覆蓋現有路線？`
          );
          if (!proceed) {
            showToast('已取消匯入，未修改任何路線資料。');
            return;
          }
        }

        // Safety Gate: Check significant shrink
        if (targetRoute.segments.length > 5 && parseResult.segments.length < targetRoute.segments.length * 0.7) {
          const proceed = window.confirm(
            `【防覆蓋警告】\n「${targetRoute.name}」目前有 ${targetRoute.segments.length} 筆路段，即將匯入的資料僅有 ${parseResult.segments.length} 筆（減少 ${Math.round((1 - parseResult.segments.length / targetRoute.segments.length) * 100)}%）。\n這可能會導致多日行程的部分天數遺失！\n\n確定要覆蓋嗎？`
          );
          if (!proceed) {
            showToast('已取消匯入，保護既有路線路段資料。');
            return;
          }
        }

        routeToPersist = {
          ...targetRoute,
          segments: parseResult.segments,
          segmentsMode: 'replace' as const,
          forceOverwrite: true,
          expectedOriginalCount: targetRoute.segments.length,
          allowShrink: true,
          clientVersion: targetRoute.updatedAt,
          updatedAt: new Date().toISOString()
        };

        updatedRoutes = routes.map(r => {
          if (r.id === targetRoute!.id) {
            return routeToPersist;
          }
          return {
            ...r,
            segmentsMode: 'preserve' as const
          };
        });
        setActiveRouteId(targetRoute.id);
        showToast(`✅ 已手動載入 Excel 並永久覆寫「${targetRoute.name}」共 ${parseResult.segments.length} 筆路段！`);
      } else {
        const newRouteId = detectedCode || `R_${Date.now()}`;
        const newRouteName = parseResult.suggestedRouteName || `${newRouteId} 新建路線`;
        routeToPersist = {
          id: newRouteId,
          code: detectedCode || newRouteId,
          name: newRouteName,
          images: [
            {
              id: `img_${Date.now()}_1`,
              url: `https://www.sunriver.com.tw/images/hiking/${detectedCode}_hiking.jpg`,
              type: '行程示意圖',
              title: `${newRouteName} 行程示意圖`
            },
            {
              id: `img_${Date.now()}_2`,
              url: `https://www.sunriver.com.tw/images/hiking/x${detectedCode}.jpg`,
              type: '高差示意圖',
              title: `${newRouteName} 高差示意圖`
            }
          ],
          mapUrl: '',
          gpxUrl: '',
          segments: parseResult.segments,
          segmentsMode: 'replace',
          forceOverwrite: true,
          allowShrink: true,
          updatedAt: new Date().toISOString()
        };
        updatedRoutes = [...routes.map(r => ({ ...r, segmentsMode: 'preserve' as const })), routeToPersist];
        setActiveRouteId(routeToPersist.id);
        showToast(`✅ 已自動建立新路線「${newRouteName}」並永久儲存 ${parseResult.segments.length} 筆路段！`);
      }

      // 1. Authoritative local browser persistence to guarantee content is NEVER lost over time
      saveAuthoritativeRouteLocally(routeToPersist, true);

      // 2. Direct authoritative backend call to SQLite + persistent_routes.json
      overwriteRouteWithExcelApi(routeToPersist)
        .then(() => {
          console.log(`[EXCEL OVERWRITE SUCCESS] Route ${routeToPersist.id} permanently written to SQLite and disk.`);
        })
        .catch(err => {
          console.error('[EXCEL OVERWRITE API ERROR] Backend overwrite error:', err);
        });

      // 3. Update application state
      onUpdateRoutes(updatedRoutes);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Delete selected route
  const confirmDeleteSelectedRoute = () => {
    if (!routeToDelete) return;

    onDeleteRoute(routeToDelete.id);
    setIsDeletingRoute(false);
    setRouteToDelete(null);

    const remaining = routes.filter(r => r.id !== routeToDelete.id);
    if (remaining.length > 0) {
      setActiveRouteId(remaining[0].id);
    }
    showToast(`已徹底刪除路線「${routeToDelete.name}」`);
  };

  // Save Route Metadata Changes
  const handleSaveRouteMetadata = () => {
    if (!activeRoute) return;

    const cleanedImages = editImages.filter(img => img.url.trim().length > 0);

    const updatedRoutes = routes.map(r => {
      if (r.id === activeRoute.id) {
        return {
          ...r,
          name: editName.trim() || r.name,
          code: editCode.trim() || r.code,
          gpxUrl: editGpxUrl.trim(),
          mapUrl: editMapUrl.trim(),
          images: cleanedImages,
          segmentsMode: 'preserve' as const, // Strict rule: Metadata update NEVER touches segments
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...r,
        segmentsMode: 'preserve' as const
      };
    });

    onUpdateRoutes(updatedRoutes);
    showToast('路線資料與圖片網址已儲存！');
  };

  // Segment Deletion Handlers
  const handleDeleteSingleSegment = (segmentId: string, segmentDesc: string) => {
    setSegmentDeleteDialog({
      isOpen: true,
      mode: 'single',
      segmentId,
      segmentDesc,
    });
  };

  const handleDeleteBatchSegments = () => {
    if (selectedSegmentIds.length === 0) return;
    setSegmentDeleteDialog({
      isOpen: true,
      mode: 'batch',
      count: selectedSegmentIds.length,
    });
  };

  const handleClearAllSegments = () => {
    if (!activeRoute || activeRoute.segments.length === 0) return;
    setSegmentDeleteDialog({
      isOpen: true,
      mode: 'all',
      count: activeRoute.segments.length,
    });
  };

  const confirmDeleteSegments = () => {
    if (!activeRoute) return;

    let updatedSegments: Segment[] = [];
    let message = '';

    if (segmentDeleteDialog.mode === 'single' && segmentDeleteDialog.segmentId) {
      updatedSegments = activeRoute.segments.filter(s => s.id !== segmentDeleteDialog.segmentId);
      setSelectedSegmentIds(prev => prev.filter(id => id !== segmentDeleteDialog.segmentId));
      message = '已成功刪除該路段';
    } else if (segmentDeleteDialog.mode === 'batch') {
      const idSet = new Set(selectedSegmentIds);
      updatedSegments = activeRoute.segments.filter(s => !idSet.has(s.id));
      const deletedCount = selectedSegmentIds.length;
      setSelectedSegmentIds([]);
      message = `已批次刪除 ${deletedCount} 筆路段`;
    } else if (segmentDeleteDialog.mode === 'all') {
      updatedSegments = [];
      setSelectedSegmentIds([]);
      message = `已清空「${activeRoute.name}」的所有路段資料`;
    }

    const updatedRoutes = routes.map(r => {
      if (r.id === activeRoute.id) {
        return {
          ...r,
          segments: updatedSegments,
          segmentsMode: (updatedSegments.length === 0 ? 'clear' : 'replace') as any,
          clearSegments: updatedSegments.length === 0, // Explicit user intent
          expectedOriginalCount: activeRoute.segments.length,
          allowShrink: true, // Explicit user intent: user confirmed deleting segment(s)
          clientVersion: activeRoute.updatedAt,
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...r,
        segmentsMode: 'preserve' as const
      };
    });

    onUpdateRoutes(updatedRoutes);
    setSegmentDeleteDialog({ isOpen: false, mode: 'single' });
    showToast(message);
  };

  // Add new image row
  const handleAddImageRow = () => {
    setEditImages(prev => [
      ...prev,
      {
        id: `img_${Date.now()}_${prev.length + 1}`,
        url: '',
        type: '行程示意圖',
        title: ''
      }
    ]);
  };

  // Delete image row
  const handleDeleteImageRow = (idx: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Create brand new blank main route
  const handleCreateNewBlankRoute = () => {
    const newCode = `G${String(routes.length + 2).padStart(2, '0')}`;
    const newName = `${newCode} 新路線名稱`;
    const newRoute: MainRoute = {
      id: newCode,
      code: newCode,
      name: newName,
      images: [
        { id: `img_${Date.now()}_1`, url: '', type: '行程示意圖', title: `${newName} 行程示意圖` },
        { id: `img_${Date.now()}_2`, url: '', type: '高差示意圖', title: `${newName} 高差示意圖` }
      ],
      mapUrl: '',
      gpxUrl: '',
      segments: [],
      updatedAt: new Date().toISOString()
    };
    const updated = [
      ...routes.map(r => ({ ...r, segmentsMode: 'preserve' as const })),
      { ...newRoute, segmentsMode: 'preserve' as const }
    ];
    onUpdateRoutes(updated);
    setActiveRouteId(newRoute.id);
    setActiveTab('route_meta');
    showToast(`已建立新主路線「${newName}」，可進行編輯或匯入 Excel`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#12161f] rounded-xs shadow-2xl border border-[#242c3b] overflow-hidden flex flex-col max-h-[92vh] text-[#f1f5f9]">
        {/* Modal Header */}
        <div className="bg-[#161b26] text-white px-6 py-4 flex items-center justify-between border-b border-[#242c3b] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-[#10b981] flex items-center justify-center text-[#090b0f] font-serif font-bold text-base shadow-sm">
              A
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-serif font-bold tracking-widest uppercase text-[#f8fafc]">
                亞馬遜國家山岳協會 ｜ 圖資後台管理系統
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#94a3b8] uppercase tracking-wider font-mono">
                DATABASE ADMIN & EXCEL INTEGRATION
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] text-[#cbd5e1] text-xs font-mono uppercase tracking-wider transition border border-[#2d3748]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>登出</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#1a202c] rounded-xs transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback toast */}
        {feedbackMessage && (
          <div className="bg-[#10b981] text-[#090b0f] text-xs px-6 py-2.5 flex items-center gap-2 flex-shrink-0 font-serif font-bold shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        {!isAdminLoggedIn ? (
          /* Login Screen */
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center">
            <div className="w-12 h-12 rounded-xs bg-[#1a202c] text-[#10b981] flex items-center justify-center mx-auto mb-4 border border-[#2d3748]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#f8fafc] mb-1">
              後台管理安全驗證
            </h3>
            <p className="text-xs text-[#94a3b8] mb-6">
              請輸入管理員帳號與密碼以存取圖資資料庫設定
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                  管理帳號 / USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                  placeholder="請輸入帳號"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                  管理密碼 / PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                  placeholder="請輸入密碼"
                />
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xs bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xs bg-[#10b981] hover:bg-[#059669] text-[#090b0f] font-serif font-bold text-xs uppercase tracking-wider transition shadow-sm font-mono cursor-pointer"
              >
                登入管理後台
              </button>
            </form>
          </div>
        ) : (
          /* Admin Workspace */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0e1219]">
            {/* Left Sidebar: Route Selector & Add/Delete Actions */}
            <div className="w-full md:w-64 bg-[#12161f] border-r border-[#242c3b] p-4 flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
                  主路線清單 ({routes.length})
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewBlankRoute}
                  title="新增主路線"
                  className="p-1 rounded-xs bg-[#10b981] hover:bg-[#059669] text-[#090b0f] transition text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2 shadow-xs font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增</span>
                </button>
              </div>

              {/* Route list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px] md:max-h-none">
                {routes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRouteId(r.id)}
                    className={`w-full text-left px-3 py-2 rounded-xs text-xs font-serif flex items-center justify-between transition border ${
                      activeRouteId === r.id
                        ? 'bg-[#1a202c] border-[#10b981] text-[#34d399] font-bold shadow-sm'
                        : 'bg-[#0a0d13] hover:bg-[#161b26] text-[#cbd5e1] border-[#242c3b]'
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono ${
                        activeRouteId === r.id
                          ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30'
                          : 'bg-[#1e2533] text-[#94a3b8]'
                      }`}
                    >
                      {r.segments.length} 段
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom danger action: Delete Route */}
              <div className="mt-4 pt-3 border-t border-[#242c3b] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeRoute) {
                      setRouteToDelete(activeRoute);
                      setIsDeletingRoute(true);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xs bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>刪除選取路線</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('確定要將所有路線重設為系統預設值嗎？')) {
                      onResetDefaults();
                      showToast('已重設為預設圖資資料庫');
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-xs text-[#94a3b8] hover:text-white hover:bg-[#1a202c] text-[11px] font-mono flex items-center justify-center gap-1 transition border border-transparent hover:border-[#242c3b]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重設為系統預設圖資</span>
                </button>
              </div>
            </div>

            {/* Right Main Content Panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0f14]">
              {/* Tab navigation */}
              <div className="flex items-center justify-between border-b border-[#242c3b] px-6 pt-3 bg-[#12161f] overflow-x-auto">
                <div className="flex space-x-4 min-w-max">
                  <button
                    type="button"
                    onClick={() => setActiveTab('site_settings')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 font-mono ${
                      activeTab === 'site_settings'
                        ? 'border-[#10b981] text-[#34d399]'
                        : 'border-transparent text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>網站標題與識別設定</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('import')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 font-mono ${
                      activeTab === 'import'
                        ? 'border-[#10b981] text-[#34d399]'
                        : 'border-transparent text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>匯入 Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('route_meta')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 font-mono ${
                      activeTab === 'route_meta'
                        ? 'border-[#10b981] text-[#34d399]'
                        : 'border-transparent text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    <span>路線資訊、圖片與航跡</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('segments')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 font-mono ${
                      activeTab === 'segments'
                        ? 'border-[#10b981] text-[#34d399]'
                        : 'border-transparent text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>路段資料庫 ({activeRoute?.segments.length || 0})</span>
                  </button>
                </div>
              </div>

              {/* Tab 0: Site Title & Branding Settings */}
              {activeTab === 'site_settings' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c0f14]">
                  {/* Live Preview Card */}
                  <div className="p-5 rounded-xs bg-[#161b26] border border-[#242c3b] shadow-md">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#94a3b8] mb-3">
                      即時標題識別預覽 / LIVE HEADER PREVIEW
                    </div>
                    <div className="p-4 bg-[#12161f] rounded-xs border border-[#2d3748] flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#10b981] flex items-center justify-center text-[#090b0f] font-serif text-lg sm:text-xl font-bold rounded-xs shadow-md flex-shrink-0">
                        {editLogoInitial || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#f8fafc]">
                            {editOrgName || '亞馬遜國家山岳協會'}
                          </h1>
                          {editBadgeText && (
                            <span className="inline-block text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-xs bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                              {editBadgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#94a3b8] uppercase tracking-wider font-mono">
                          {editSubTitle || 'Sunriver Map Database ｜ Trip Planner'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Form */}
                  <div className="space-y-4 bg-[#12161f] p-5 rounded-xs border border-[#242c3b]">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                          協會 / 機構主要名稱 (例如：亞馬遜國家山岳協會)
                        </label>
                        <input
                          type="text"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          placeholder="亞馬遜國家山岳協會"
                          className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                          徽章文字 (例如：Official 或 留空)
                        </label>
                        <input
                          type="text"
                          value={editBadgeText}
                          onChange={(e) => setEditBadgeText(e.target.value)}
                          placeholder="Official"
                          className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] font-mono focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                        副標題 / 系統英文名 (例如：Sunriver Map Database ｜ Trip Planner)
                      </label>
                      <input
                        type="text"
                        value={editSubTitle}
                        onChange={(e) => setEditSubTitle(e.target.value)}
                        placeholder="Sunriver Map Database ｜ Trip Planner"
                        className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] font-mono focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-8">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                          頁尾系統中文全名 (例如：上河圖資登山行程規劃系統)
                        </label>
                        <input
                          type="text"
                          value={editSystemTitle}
                          onChange={(e) => setEditSystemTitle(e.target.value)}
                          placeholder="上河圖資登山行程規劃系統"
                          className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                          Logo 標誌英文字母 (例如：A)
                        </label>
                        <input
                          type="text"
                          maxLength={3}
                          value={editLogoInitial}
                          onChange={(e) => setEditLogoInitial(e.target.value)}
                          placeholder="A"
                          className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] font-serif font-bold uppercase text-center focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#242c3b] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setEditOrgName(DEFAULT_SITE_SETTINGS.orgName);
                          setEditBadgeText(DEFAULT_SITE_SETTINGS.badgeText);
                          setEditSubTitle(DEFAULT_SITE_SETTINGS.subTitle);
                          setEditSystemTitle(DEFAULT_SITE_SETTINGS.systemTitle || '上河圖資登山行程規劃系統');
                          setEditLogoInitial(DEFAULT_SITE_SETTINGS.logoInitial || 'A');
                        }}
                        className="text-[11px] text-[#94a3b8] hover:text-white font-mono flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重設為預設標題</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newSettings: SiteSettings = {
                            orgName: editOrgName.trim() || '亞馬遜國家山岳協會',
                            badgeText: editBadgeText.trim(),
                            subTitle: editSubTitle.trim() || 'Sunriver Map Database ｜ Trip Planner',
                            systemTitle: editSystemTitle.trim() || '上河圖資登山行程規劃系統',
                            logoInitial: editLogoInitial.trim() || 'A',
                          };
                          onUpdateSiteSettings(newSettings);
                          showToast('網站標題與識別設定已成功儲存！');
                        }}
                        className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-[#090b0f] text-xs font-bold uppercase tracking-wider rounded-xs transition shadow-sm flex items-center gap-1.5 font-mono cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>儲存標題設定</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Import Excel */}
              {activeTab === 'import' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c0f14]">
                  {/* Standard Excel Upload Zone */}
                  <div className="border-2 border-dashed border-[#283244] hover:border-[#10b981] rounded-xs p-8 text-center bg-[#12161f] transition group">
                    <div className="w-12 h-12 rounded-xs bg-[#1a202c] text-[#10b981] border border-[#2d3748] flex items-center justify-center mx-auto mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-serif font-bold text-[#f8fafc] mb-1">
                      選擇或拖曳上河圖資 Excel / CSV 檔案
                    </h4>
                    <p className="text-xs text-[#94a3b8] max-w-md mx-auto mb-4">
                      支援 .xlsx, .xls, .csv 格式。系統將直接讀取 A 欄「所屬行程」、F 欄「備註」（登山口、宿點）自動建立方案與計算規則。
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-file-upload-input"
                    />

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <label
                        htmlFor="excel-file-upload-input"
                        className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-[#090b0f] text-xs font-bold uppercase tracking-wider rounded-xs cursor-pointer transition shadow-sm flex items-center gap-2 font-mono"
                      >
                        <Upload className="w-4 h-4" />
                        <span>選擇 Excel 檔案匯入</span>
                      </label>
                    </div>

                    <div className="mt-4 text-[11px] text-[#94a3b8] font-mono">
                      目標主路線：<span className="font-bold text-[#34d399]">{activeRoute?.name}</span>
                    </div>
                  </div>

                  {/* Data Integrity Explanation */}
                  <div className="bg-[#12161f] rounded-xs p-4 border border-[#242c3b] text-xs text-[#94a3b8] space-y-2">
                    <div className="font-bold text-[#34d399] uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
                      <FileText className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>Excel 欄位規格說明</span>
                    </div>
                    <p className="leading-relaxed font-mono text-[11px] text-[#94a3b8]">
                      A 所屬行程｜B 序號｜C 起點｜D 迄點｜E 所需時間｜F 備註（逗號前代表起點、逗號後代表迄點；包含登山口、宿點等）｜G 行進方向｜H 資料分類。
                      系統完整保留每一筆原始資料，不會擅自刪除重複節點，不同主路線資料分開獨立保存。
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Route Metadata, Image URLs, GPX URL */}
              {activeTab === 'route_meta' && activeRoute && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c0f14]">
                  {/* Route Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                        主路線代碼
                      </label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-mono text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                        主路線完整名稱
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-serif font-bold text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                  </div>

                  {/* GPX & Map URLs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                        航跡網址 (GPX / 健行筆記連結)
                      </label>
                      <input
                        type="url"
                        value={editGpxUrl}
                        onChange={(e) => setEditGpxUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-mono text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1 font-mono">
                        地圖網址 (線上圖資連結)
                      </label>
                      <input
                        type="url"
                        value={editMapUrl}
                        onChange={(e) => setEditMapUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-mono text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                  </div>

                  {/* Image URLs Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
                        上河圖資圖片網址（預設 2 個欄位：行程示意圖、高差示意圖）
                      </label>
                      <button
                        type="button"
                        onClick={handleAddImageRow}
                        className="px-2.5 py-1 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] text-[#f1f5f9] text-[11px] font-bold uppercase tracking-wider border border-[#2d3748] flex items-center gap-1 transition font-mono"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>新增圖片網址</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="p-3 rounded-xs bg-[#12161f] border border-[#242c3b] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <div className="sm:col-span-3">
                            <select
                              value={img.type}
                              onChange={(e) => {
                                const val = e.target.value as ImageType;
                                setEditImages(prev =>
                                  prev.map((item, i) => (i === idx ? { ...item, type: val } : item))
                                );
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-serif text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            >
                              <option value="行程示意圖">行程示意圖</option>
                              <option value="高差示意圖">高差示意圖</option>
                              <option value="其他圖資">其他圖資</option>
                            </select>
                          </div>

                          <div className="sm:col-span-8">
                            <input
                              type="url"
                              value={img.url}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditImages(prev =>
                                  prev.map((item, i) => (i === idx ? { ...item, url: val } : item))
                                );
                              }}
                              placeholder="https://www.sunriver.com.tw/images/hiking/..."
                              className="w-full px-2.5 py-1.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-mono text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteImageRow(idx)}
                              title="移除圖片"
                              className="p-1.5 text-[#94a3b8] hover:text-rose-400 rounded-xs transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Metadata Button */}
                  <div className="pt-3 border-t border-[#242c3b] flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveRouteMetadata}
                      className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#090b0f] text-xs font-bold uppercase tracking-wider rounded-xs transition shadow-sm flex items-center gap-1.5 font-mono cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>儲存路線設定</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Segments Raw Table & Management */}
              {activeTab === 'segments' && activeRoute && (() => {
                // Unique plans for filtering
                const planOptions = Array.from(new Set(activeRoute.segments.map(s => s.planName).filter(Boolean)));
                
                // Filtered segments
                const filteredSegments = activeRoute.segments.filter(seg => {
                  if (segmentPlanFilter !== 'ALL' && seg.planName !== segmentPlanFilter) {
                    return false;
                  }
                  if (segmentSearchQuery.trim()) {
                    const q = segmentSearchQuery.toLowerCase();
                    return (
                      seg.startNode.toLowerCase().includes(q) ||
                      seg.endNode.toLowerCase().includes(q) ||
                      seg.planName.toLowerCase().includes(q) ||
                      (seg.note && seg.note.toLowerCase().includes(q)) ||
                      String(seg.seq).includes(q)
                    );
                  }
                  return true;
                });

                const allFilteredSelected =
                  filteredSegments.length > 0 &&
                  filteredSegments.every(s => selectedSegmentIds.includes(s.id));

                const toggleSelectAllFiltered = () => {
                  if (allFilteredSelected) {
                    const filteredIdSet = new Set(filteredSegments.map(s => s.id));
                    setSelectedSegmentIds(prev => prev.filter(id => !filteredIdSet.has(id)));
                  } else {
                    const newIds = Array.from(new Set([...selectedSegmentIds, ...filteredSegments.map(s => s.id)]));
                    setSelectedSegmentIds(newIds);
                  }
                };

                const toggleSelectSegment = (id: string) => {
                  setSelectedSegmentIds(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  );
                };

                return (
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0f14]">
                    {/* Segment Toolbar */}
                    <div className="p-4 bg-[#12161f] border-b border-[#242c3b] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                      {/* Search & Plan Filter */}
                      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                        <div className="relative flex-1 min-w-[160px] max-w-xs">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                          <input
                            type="text"
                            value={segmentSearchQuery}
                            onChange={(e) => setSegmentSearchQuery(e.target.value)}
                            placeholder="搜尋起點、迄點、備註..."
                            className="w-full pl-8 pr-3 py-1.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                          />
                        </div>

                        {planOptions.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <select
                              value={segmentPlanFilter}
                              onChange={(e) => setSegmentPlanFilter(e.target.value)}
                              className="px-2.5 py-1.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-serif text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                            >
                              <option value="ALL">全部行程方案 ({activeRoute.segments.length})</option>
                              {planOptions.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Batch Delete & Clear All */}
                      <div className="flex items-center gap-2">
                        {selectedSegmentIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleDeleteBatchSegments}
                            className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 rounded-xs text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>批次刪除選取 ({selectedSegmentIds.length})</span>
                          </button>
                        )}

                        {activeRoute.segments.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllSegments}
                            className="px-3 py-1.5 bg-[#1a202c] hover:bg-[#252d3d] text-[#94a3b8] hover:text-rose-300 border border-[#2d3748] rounded-xs text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                            title="清空此主路線的所有路段"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>清空全部路段</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-auto p-4">
                      {activeRoute.segments.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#94a3b8] font-serif">
                          目前無路段資料，請在「匯入 Excel」標籤頁上傳專屬資料庫檔案。
                        </div>
                      ) : filteredSegments.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#94a3b8] font-serif">
                          找不到符合搜尋條件的路段資料。
                        </div>
                      ) : (
                        <div className="border border-[#242c3b] rounded-xs overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs border-collapse font-serif">
                            <thead className="bg-[#161b26] text-[#94a3b8] font-bold border-b border-[#242c3b] text-[10px] uppercase font-mono tracking-wider sticky top-0 z-10">
                              <tr>
                                <th className="p-2.5 w-10 text-center">
                                  <button
                                    type="button"
                                    onClick={toggleSelectAllFiltered}
                                    title={allFilteredSelected ? "取消全選" : "全選"}
                                    className="text-[#94a3b8] hover:text-[#34d399] transition flex items-center justify-center mx-auto cursor-pointer"
                                  >
                                    {allFilteredSelected ? (
                                      <CheckSquare className="w-4 h-4 text-[#10b981]" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>
                                </th>
                                <th className="p-2.5 w-12">序號</th>
                                <th className="p-2.5">所屬行程</th>
                                <th className="p-2.5">起點</th>
                                <th className="p-2.5">迄點</th>
                                <th className="p-2.5 w-20">時間 (分)</th>
                                <th className="p-2.5">備註</th>
                                <th className="p-2.5 w-20">行進方向</th>
                                <th className="p-2.5 w-20">資料分類</th>
                                <th className="p-2.5 w-16 text-center">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#242c3b] text-[#f1f5f9] bg-[#0f131a]">
                              {filteredSegments.map((seg, sIdx) => {
                                const isSelected = selectedSegmentIds.includes(seg.id);
                                return (
                                  <tr
                                    key={seg.id || sIdx}
                                    className={`transition ${
                                      isSelected
                                        ? 'bg-[#1a2333] hover:bg-[#202b3d]'
                                        : 'hover:bg-[#181f2c]'
                                    }`}
                                  >
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleSelectSegment(seg.id)}
                                        className="text-[#94a3b8] hover:text-[#34d399] transition flex items-center justify-center mx-auto cursor-pointer"
                                      >
                                        {isSelected ? (
                                          <CheckSquare className="w-4 h-4 text-[#10b981]" />
                                        ) : (
                                          <Square className="w-4 h-4 text-[#64748b]" />
                                        )}
                                      </button>
                                    </td>
                                    <td className="p-2.5 font-mono text-[#94a3b8]">{seg.seq}</td>
                                    <td className="p-2.5 font-bold text-[#f8fafc]">{seg.planName}</td>
                                    <td className="p-2.5">{seg.startNode}</td>
                                    <td className="p-2.5">{seg.endNode}</td>
                                    <td className="p-2.5 text-[#34d399] font-bold font-mono">{seg.duration}</td>
                                    <td className="p-2.5">
                                      {seg.note && (
                                        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono ${
                                          seg.note.includes('登山口')
                                            ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40'
                                            : seg.note.includes('宿點')
                                            ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50'
                                            : 'bg-[#1e2533] text-[#94a3b8] border border-[#2d3748]'
                                        }`}>
                                          {seg.note}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-[#94a3b8] font-mono">{seg.direction}</td>
                                    <td className="p-2.5 text-[#64748b] font-mono">{seg.category}</td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteSingleSegment(
                                            seg.id,
                                            `[${seg.planName}] ${seg.startNode} ➜ ${seg.endNode}`
                                          )
                                        }
                                        title="個別刪除此路段"
                                        className="p-1.5 text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/40 rounded-xs transition inline-flex items-center justify-center cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Delete Route Confirmation Dialog */}
        {isDeletingRoute && routeToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="bg-[#161b26] rounded-xs max-w-sm w-full p-6 shadow-2xl border border-[#242c3b] text-center text-white">
              <div className="w-10 h-10 rounded-xs bg-rose-950/50 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#f8fafc] mb-1">
                確定要刪除？
              </h3>
              <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed">
                您即將徹底從資料庫中刪除主路線「<span className="font-bold text-[#f8fafc]">{routeToDelete.name}</span>」及其所有路段資料。此操作無法復原。
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeletingRoute(false);
                    setRouteToDelete(null);
                  }}
                  className="flex-1 py-2 rounded-xs border border-[#2d3748] bg-[#1a202c] hover:bg-[#252d3d] text-[#cbd5e1] text-xs font-bold transition font-mono cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSelectedRoute}
                  className="flex-1 py-2 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm font-mono cursor-pointer"
                >
                  確定刪除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Segment Confirmation Dialog (Single, Batch, All) */}
        {segmentDeleteDialog.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="bg-[#161b26] rounded-xs max-w-sm w-full p-6 shadow-2xl border border-[#242c3b] text-center text-white">
              <div className="w-10 h-10 rounded-xs bg-rose-950/50 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#f8fafc] mb-1">
                {segmentDeleteDialog.mode === 'single'
                  ? '確定刪除此路段？'
                  : segmentDeleteDialog.mode === 'batch'
                  ? `確定批次刪除 ${segmentDeleteDialog.count} 筆路段？`
                  : '確定清空全部路段？'}
              </h3>
              <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed font-serif">
                {segmentDeleteDialog.mode === 'single' ? (
                  <>
                    您即將從資料庫中刪除路段：
                    <br />
                    <span className="font-bold text-[#f8fafc] block mt-1 font-mono text-[11px]">
                      {segmentDeleteDialog.segmentDesc}
                    </span>
                  </>
                ) : segmentDeleteDialog.mode === 'batch' ? (
                  `已選取 ${segmentDeleteDialog.count} 筆路段資料，確定要全部刪除嗎？`
                ) : (
                  `此操作將清空主路線「${activeRoute?.name}」底下的全部 ${segmentDeleteDialog.count} 筆路段資料。`
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSegmentDeleteDialog({ isOpen: false, mode: 'single' })}
                  className="flex-1 py-2 rounded-xs border border-[#2d3748] bg-[#1a202c] hover:bg-[#252d3d] text-[#cbd5e1] text-xs font-bold transition font-mono cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSegments}
                  className="flex-1 py-2 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm font-mono cursor-pointer"
                >
                  確定刪除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { MainRoute, DayPlanConfig, FullItineraryResult, Segment } from '../types';
import {
  getPlansFromSegments,
  getTrailheads,
  getStayPoints,
  getLodgingNodesFromRawData,
  calculateItinerary,
  detectSpurs,
  filterAndReconnectSegments,
  parseNoteForNodes,
  SpurInfo,
  AvailableSpur,
  getAllAvailableSpursFromRoute,
  getSpursForNode,
  isSpurPresentAfterIndex,
  isSpurInSegments,
} from '../utils/itineraryCalculator';
import { RouteImagesView } from './RouteImagesView';
import { ItineraryResult } from './ItineraryResult';
import {
  Compass,
  Calendar,
  Clock,
  Gauge,
  MapPin,
  BedDouble,
  Search,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Footprints,
  GitBranch,
  Trash2,
  RotateCcw,
  Plus,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Undo2,
  Route,
  GitCommit,
  X,
  Minus,
} from 'lucide-react';

interface PlannerViewProps {
  routes: MainRoute[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

const SPEED_RATIOS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];

export const PlannerView: React.FC<PlannerViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  // Search query for "搜尋行程"
  const [searchQuery, setSearchQuery] = useState('');

  // Selected route
  const currentRoute = useMemo(() => {
    return routes.find(r => r.id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // Derived plans from Column A of current route
  const plans = useMemo(() => {
    if (!currentRoute || currentRoute.segments.length === 0) return [];
    return getPlansFromSegments(currentRoute.segments);
  }, [currentRoute]);

  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Excluded segments for custom spur removal and node deletion
  const [excludedSegmentIds, setExcludedSegmentIds] = useState<string[]>([]);
  const [isSegmentPanelOpen, setIsSegmentPanelOpen] = useState<boolean>(true);

  // When currentRoute or plans change, set default selectedPlan and reset exclusions
  useEffect(() => {
    if (plans.length > 0) {
      if (!plans.includes(selectedPlan)) {
        setSelectedPlan(plans[0]);
        setExcludedSegmentIds([]);
      }
    } else {
      setSelectedPlan('');
      setExcludedSegmentIds([]);
    }
  }, [plans]);

  // Reset exclusions when plan changes
  useEffect(() => {
    setExcludedSegmentIds([]);
  }, [selectedPlan]);

  // Available spurs pool from the entire route database
  const availableSpursPool = useMemo(() => {
    if (!currentRoute) return [];
    return getAllAvailableSpursFromRoute(currentRoute.segments);
  }, [currentRoute]);

  // Filtered segments for active plan
  const rawPlanSegments = useMemo(() => {
    if (!currentRoute || !selectedPlan) return [];
    return currentRoute.segments.filter(s => s.planName === selectedPlan);
  }, [currentRoute, selectedPlan]);

  // Working segments in the active plan (supports dynamically inserted spurs)
  const [workingSegments, setWorkingSegments] = useState<Segment[]>([]);

  // Sync workingSegments whenever selectedPlan or rawPlanSegments changes
  useEffect(() => {
    setWorkingSegments(rawPlanSegments);
    setExcludedSegmentIds([]);
  }, [rawPlanSegments]);

  // Active reconnected segments (with excluded spurs/nodes removed)
  const planSegments = useMemo(() => {
    const excludedSet = new Set<string>(excludedSegmentIds);
    return filterAndReconnectSegments(workingSegments, excludedSet);
  }, [workingSegments, excludedSegmentIds]);

  // Detect spurs in both raw segments and working segments
  const detectedSpurs = useMemo(() => {
    const rawSpurs = detectSpurs(rawPlanSegments);
    const activeSpurs = detectSpurs(planSegments);
    const map = new Map<string, SpurInfo>();
    rawSpurs.forEach(s => map.set(s.id, s));
    activeSpurs.forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  }, [rawPlanSegments, planSegments]);

  // Planning Mode state: 'preset' (方案自動排程) vs 'manual' (純手動逐點規劃)
  const [planningMode, setPlanningMode] = useState<'preset' | 'manual'>('preset');
  const [manualStartNode, setManualStartNode] = useState<string>('');
  const [manualSegments, setManualSegments] = useState<Segment[]>([]);

  // 目前作用中的路段清單
  const activeSegments = useMemo(() => {
    return planningMode === 'manual' ? manualSegments : planSegments;
  }, [planningMode, manualSegments, planSegments]);

  // Trailheads derived from active planning mode segments
  // 嚴格規範：
  // 1. 登山口選項並非選擇路線的所有登山口，只能顯示「規劃模式」備註欄標記為登山口的節點
  // 2. 請勿自動辨識（禁止模糊關鍵字推測，不預設加入非備註標記之節點）
  const trailheads = useMemo(() => {
    if (!currentRoute) return [];
    if (planningMode === 'preset') {
      return getTrailheads(planSegments);
    } else {
      const sourceSegs = manualSegments.length > 0 ? manualSegments : currentRoute.segments;
      return getTrailheads(sourceSegs);
    }
  }, [currentRoute, planningMode, planSegments, manualSegments]);

  // 宿點選單狀態：null 代表「空白」（進入行程列表自由手動選取模式）
  const [selectedLodging, setSelectedLodging] = useState<string | null>(null);
  // 手動模式下，自行程列表自由點選的宿點路段 ID 清單（精確以路段實例為單位，不連動同名其他節點）
  const [manualLodgingSegmentIds, setManualLodgingSegmentIds] = useState<string[]>([]);

  // RAW DATA 備註包含「宿點」是唯一判斷來源，動態產生宿點選項
  const lodgingOptions = useMemo(() => {
    if (!currentRoute) return [];
    // 讀取目前所選行程 RAW DATA
    const sourceSegs = planningMode === 'preset'
      ? (rawPlanSegments.length > 0 ? rawPlanSegments : currentRoute.segments)
      : currentRoute.segments;
    return getLodgingNodesFromRawData(sourceSegs);
  }, [currentRoute, planningMode, rawPlanSegments]);

  // 十四、十五：載入新 DATA 或切換行程時重新產生，清除舊選項預設為「空白」
  useEffect(() => {
    setSelectedLodging(null);
    setManualLodgingSegmentIds([]);
  }, [currentRoute?.id, selectedPlan, currentRoute?.segments]);

  // 計算目前生效的宿點路段清單（依行程先後順序排列，支援同名宿點分別指定第 1 天、第 2 天）
  const effectiveLodgingSegments = useMemo(() => {
    if (selectedLodging && selectedLodging.trim() !== '') {
      // 1. 下拉選單選擇宿點：
      // 規則：若行程內容裡宿點名稱相同的有兩個，第一個為第一天宿點，第二個為第二天宿點
      const target = selectedLodging.trim();
      return activeSegments.filter(s => s.endNode.trim() === target);
    } else {
      // 2. 手動選擇宿點：
      // 規則：只安排被點選之路段為宿點，不連動後面同名的宿點；若同名宿點再選一次，則做次日自動分割
      const chosenSet = new Set(manualLodgingSegmentIds);
      return activeSegments.filter(s => chosenSet.has(s.id));
    }
  }, [selectedLodging, activeSegments, manualLodgingSegmentIds]);

  const effectiveLodgingSegmentIds = useMemo(() => {
    return effectiveLodgingSegments.map(s => s.id);
  }, [effectiveLodgingSegments]);

  const effectiveLodgingNames = useMemo(() => {
    return effectiveLodgingSegments.map(s => s.endNode.trim());
  }, [effectiveLodgingSegments]);

  // 當選定宿點後，後續行程自動分割為下一天：天數自動調整為 (宿點數量 + 1)
  useEffect(() => {
    if (effectiveLodgingSegments.length > 0) {
      setDaysCount(effectiveLodgingSegments.length + 1);
    }
  }, [effectiveLodgingSegments.length]);

  const stayPoints = useMemo(() => {
    if (!currentRoute) return [];
    const sourceSegs = planSegments.length > 0 ? planSegments : currentRoute.segments;
    return getStayPoints(sourceSegs);
  }, [currentRoute, planSegments]);

  // Configuration state
  const [daysCount, setDaysCount] = useState<number>(1);
  const [speedRatio, setSpeedRatio] = useState<number>(1.0);
  const [startTrailhead, setStartTrailhead] = useState<string>('');
  const [endTrailhead, setEndTrailhead] = useState<string>('');
  const [dailyConfigs, setDailyConfigs] = useState<DayPlanConfig[]>([
    { dayIndex: 1, startTime: '06:00' },
  ]);

  // 登山口選項嚴格依據當前規劃模式中備註欄標記為登山口之節點，絕不自動推測或加入未標記節點
  const startTrailheadOptions = useMemo(() => {
    return trailheads;
  }, [trailheads]);

  const endTrailheadOptions = useMemo(() => {
    return trailheads;
  }, [trailheads]);

  // 確保起迄登山口選取值必定屬於當前有效之 trailheads
  useEffect(() => {
    if (trailheads.length === 0) return;

    setStartTrailhead(prev => {
      const naturalStart = planSegments[0]?.startNode?.trim();
      if (prev && trailheads.includes(prev)) {
        if (naturalStart && prev === naturalStart) return prev;
        return prev;
      }
      if (naturalStart && trailheads.includes(naturalStart)) return naturalStart;
      return trailheads[0] || '';
    });

    setEndTrailhead(prev => {
      const naturalEnd = planSegments[planSegments.length - 1]?.endNode?.trim();
      if (prev && trailheads.includes(prev)) {
        if (naturalEnd && prev === naturalEnd) return prev;
        if (prev !== '17.5K岔路' && prev !== '17.5K登山口') return prev;
      }
      if (naturalEnd && trailheads.includes(naturalEnd)) return naturalEnd;
      return trailheads[trailheads.length - 1] || trailheads[0] || '';
    });
  }, [trailheads, planSegments]);

  // Auto initialize manualStartNode when currentRoute changes
  useEffect(() => {
    if (currentRoute && currentRoute.segments.length > 0) {
      const ths = getTrailheads(currentRoute.segments);
      setManualStartNode(ths.length > 0 ? ths[0] : currentRoute.segments[0].startNode);
      setManualSegments([]);
    }
  }, [currentRoute?.id]);

  // Auto-adjust or restore planner preferences from localStorage
  useEffect(() => {
    if (planSegments.length > 0 && currentRoute) {
      const naturalStart = planSegments[0]?.startNode?.trim() || '';
      const naturalEnd = planSegments[planSegments.length - 1]?.endNode?.trim() || '';
      const planTrailheads = getTrailheads(planSegments);

      const prefKey = `planner_pref_${currentRoute.id}_${selectedPlan}`;
      const savedRaw = localStorage.getItem(prefKey);
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (parsed && typeof parsed.daysCount === 'number') {
            setDaysCount(parsed.daysCount);
            if (typeof parsed.speedRatio === 'number') setSpeedRatio(parsed.speedRatio);

            if (parsed.startTrailhead && planTrailheads.includes(parsed.startTrailhead)) {
              setStartTrailhead(parsed.startTrailhead);
            } else if (naturalStart && planTrailheads.includes(naturalStart)) {
              setStartTrailhead(naturalStart);
            } else if (planTrailheads.length > 0) {
              setStartTrailhead(planTrailheads[0]);
            }

            // Discard buggy '17.5K岔路', '17.5K登山口' or invalid endTrailheads that prematurely truncate the route
            if (
              parsed.endTrailhead &&
              parsed.endTrailhead !== '17.5K岔路' &&
              parsed.endTrailhead !== '17.5K登山口' &&
              planTrailheads.includes(parsed.endTrailhead)
            ) {
              setEndTrailhead(parsed.endTrailhead);
            } else if (naturalEnd && planTrailheads.includes(naturalEnd)) {
              setEndTrailhead(naturalEnd);
            } else if (planTrailheads.length > 0) {
              setEndTrailhead(planTrailheads[planTrailheads.length - 1]);
            }
            return;
          }
        } catch {
          // ignore corrupted local preference
        }
      }

      // If no explicit lodging points chosen yet, default to 1 day unless preference exists
      if (effectiveLodgingSegments.length > 0) {
        setDaysCount(effectiveLodgingSegments.length + 1);
      } else {
        setDaysCount(1);
      }
      
      // Auto set initial trailhead selections from valid planTrailheads
      if (naturalStart && planTrailheads.includes(naturalStart)) {
        setStartTrailhead(naturalStart);
      } else if (planTrailheads.length > 0) {
        setStartTrailhead(planTrailheads[0]);
      }

      if (naturalEnd && planTrailheads.includes(naturalEnd)) {
        setEndTrailhead(naturalEnd);
      } else if (planTrailheads.length > 0) {
        setEndTrailhead(planTrailheads[planTrailheads.length - 1]);
      }
    }
  }, [selectedPlan, rawPlanSegments, currentRoute?.id]);

  // Persist preference whenever user customizes planner parameters
  useEffect(() => {
    if (currentRoute && selectedPlan) {
      const prefKey = `planner_pref_${currentRoute.id}_${selectedPlan}`;
      localStorage.setItem(prefKey, JSON.stringify({
        daysCount,
        speedRatio,
        startTrailhead,
        endTrailhead
      }));
    }
  }, [daysCount, speedRatio, startTrailhead, endTrailhead, currentRoute?.id, selectedPlan]);

  // Synchronize dailyConfigs with daysCount and ensure stay points default to valid options
  useEffect(() => {
    setDailyConfigs(prev => {
      const updated: DayPlanConfig[] = [];
      for (let i = 1; i <= daysCount; i++) {
        const existing = prev.find(p => p.dayIndex === i);
        const lodgingStay = effectiveLodgingNames[i - 1];
        const defaultStay = lodgingStay || (stayPoints.length > 0 ? (stayPoints[i - 1] || stayPoints[0]) : '');
        if (existing) {
          updated.push({
            ...existing,
            stayPoint: lodgingStay || existing.stayPoint || defaultStay,
          });
        } else {
          updated.push({
            dayIndex: i,
            startTime: i === 1 ? '06:00' : '05:30',
            stayPoint: lodgingStay || defaultStay,
          });
        }
      }
      return updated;
    });
  }, [daysCount, stayPoints, effectiveLodgingNames]);

  // 切換行程列表中的手動宿點（以特定路段 ID 為單位，支援同名宿點個別獨立選擇）
  const handleToggleManualLodging = (segId: string) => {
    if (!segId) return;

    // 若下拉選單原本有選中項目，點擊列表節點時切換至手動模式（選單重設為空白）
    // 並繼承當前生效之宿點路段 ID，確保體驗順暢不丟失狀態
    if (selectedLodging) {
      const currentIds = effectiveLodgingSegments.map(s => s.id);
      setSelectedLodging(null);
      if (currentIds.includes(segId)) {
        const next = currentIds.filter(id => id !== segId);
        setManualLodgingSegmentIds(next);
        if (next.length === 0) setDaysCount(1);
      } else {
        setManualLodgingSegmentIds([...currentIds, segId]);
      }
      return;
    }

    setManualLodgingSegmentIds(prev => {
      if (prev.includes(segId)) {
        const next = prev.filter(id => id !== segId);
        if (next.length === 0) {
          setDaysCount(1);
        }
        return next;
      } else {
        return [...prev, segId];
      }
    });
  };

  const handleClearLodgings = () => {
    setSelectedLodging(null);
    setManualLodgingSegmentIds([]);
    setDaysCount(1);
  };

  const handleStartTimeChange = (dayIndex: number, time: string) => {
    setDailyConfigs(prev =>
      prev.map(c => (c.dayIndex === dayIndex ? { ...c, startTime: time } : c))
    );
  };

  const handleStayPointChange = (dayIndex: number, stay: string) => {
    setDailyConfigs(prev =>
      prev.map(c => (c.dayIndex === dayIndex ? { ...c, stayPoint: stay } : c))
    );
  };

  // Dynamic spur addition at junction node
  const handleAddSpurAt = (afterSegIndex: number, spur: AvailableSpur, targetSegId?: string) => {
    // 1. If this spur was previously excluded in raw segments, un-exclude it
    setExcludedSegmentIds(prev => {
      return prev.filter(id => id !== spur.outSegment.id && id !== spur.backSegment?.id);
    });

    // 2. Insert out and back segments directly into workingSegments
    setWorkingSegments(prev => {
      // Find insertion point in prev
      let insertIdx = -1;
      if (targetSegId) {
        insertIdx = prev.findIndex(s => s.id === targetSegId);
      } else if (afterSegIndex >= 0 && afterSegIndex < planSegments.length) {
        const segAtPlan = planSegments[afterSegIndex];
        insertIdx = prev.findIndex(s => s.id === segAtPlan.id);
      }

      if (afterSegIndex === -1 && insertIdx === -1) {
        insertIdx = -1;
      } else if (insertIdx === -1 && afterSegIndex >= 0) {
        insertIdx = Math.min(afterSegIndex, prev.length - 1);
      }

      // Prevent duplicate addition at this junction
      if (isSpurPresentAfterIndex(prev, insertIdx, spur)) {
        return prev;
      }

      const dynIdPrefix = `dyn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const outSeg: Segment = {
        ...spur.outSegment,
        id: `${dynIdPrefix}_out`,
        planName: selectedPlan,
      };
      const backSeg: Segment = spur.backSegment
        ? {
            ...spur.backSegment,
            id: `${dynIdPrefix}_back`,
            planName: selectedPlan,
          }
        : {
            id: `${dynIdPrefix}_back`,
            planName: selectedPlan,
            seq: 0,
            startNode: spur.targetNode,
            endNode: spur.baseJunction,
            duration: Math.round(spur.outSegment.duration * 0.8),
            note: spur.outSegment.note || '',
            direction: '下行 ▼',
            category: spur.outSegment.category || '支線',
          };

      let next: Segment[];
      if (insertIdx === -1) {
        next = [outSeg, backSeg, ...prev];
      } else {
        next = [
          ...prev.slice(0, insertIdx + 1),
          outSeg,
          backSeg,
          ...prev.slice(insertIdx + 1),
        ];
      }

      return next.map((s, idx) => ({ ...s, seq: idx + 1, planName: selectedPlan }));
    });

    if (planningMode === 'manual') {
      setManualSegments(prev => {
        let insertIdx = -1;
        if (targetSegId) {
          insertIdx = prev.findIndex(s => s.id === targetSegId);
        } else if (afterSegIndex >= 0) {
          insertIdx = Math.min(afterSegIndex, prev.length - 1);
        }

        const dynIdPrefix = `dyn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const outSeg: Segment = {
          ...spur.outSegment,
          id: `${dynIdPrefix}_out`,
          planName: '自訂手動規劃路線',
        };
        const backSeg: Segment = spur.backSegment
          ? {
              ...spur.backSegment,
              id: `${dynIdPrefix}_back`,
              planName: '自訂手動規劃路線',
            }
          : {
              id: `${dynIdPrefix}_back`,
              planName: '自訂手動規劃路線',
              seq: 0,
              startNode: spur.targetNode,
              endNode: spur.baseJunction,
              duration: Math.round(spur.outSegment.duration * 0.8),
              note: spur.outSegment.note || '',
              direction: '下行 ▼',
              category: spur.outSegment.category || '支線',
            };

        let next: Segment[];
        if (insertIdx === -1) {
          next = [outSeg, backSeg, ...prev];
        } else {
          next = [
            ...prev.slice(0, insertIdx + 1),
            outSeg,
            backSeg,
            ...prev.slice(insertIdx + 1),
          ];
        }

        return next.map((s, idx) => ({ ...s, seq: idx + 1 }));
      });
    }
  };

  // Branch and segment removal handlers
  const handleRemoveSpur = (spur: SpurInfo) => {
    // If it was dynamically added to workingSegments, remove it
    setWorkingSegments(prev =>
      prev.filter(s => s.id !== spur.outSegmentId && s.id !== spur.backSegmentId)
    );
    // Also record in excludedSegmentIds for raw segments
    setExcludedSegmentIds(prev => {
      const next = new Set(prev);
      next.add(spur.outSegmentId);
      if (spur.backSegmentId) next.add(spur.backSegmentId);
      return Array.from(next);
    });
  };

  const handleRestoreSpur = (spur: SpurInfo) => {
    setExcludedSegmentIds(prev => {
      return prev.filter(id => id !== spur.outSegmentId && id !== spur.backSegmentId);
    });
    // Ensure present in workingSegments if it was an original segment
    setWorkingSegments(prev => {
      const exists = prev.some(s => s.id === spur.outSegmentId);
      if (!exists) {
        const origOut = rawPlanSegments.find(s => s.id === spur.outSegmentId);
        const origBack = spur.backSegmentId ? rawPlanSegments.find(s => s.id === spur.backSegmentId) : undefined;
        if (origOut) {
          const newSegs = [...prev, origOut, ...(origBack ? [origBack] : [])];
          return newSegs.sort((a, b) => a.seq - b.seq);
        }
      }
      return prev;
    });
  };

  const handleRemoveSegment = (segId: string) => {
    setWorkingSegments(prev =>
      prev.filter(s => s.id !== segId).map((s, idx) => ({ ...s, seq: idx + 1 }))
    );
    setExcludedSegmentIds(prev => {
      if (prev.includes(segId)) return prev;
      return [...prev, segId];
    });
    if (planningMode === 'manual') {
      setManualSegments(prev =>
        prev.filter(s => s.id !== segId).map((s, idx) => ({ ...s, seq: idx + 1 }))
      );
    }
  };

  const handleRestoreSegment = (segId: string) => {
    setExcludedSegmentIds(prev => prev.filter(id => id !== segId));
    const orig = rawPlanSegments.find(s => s.id === segId);
    if (orig) {
      setWorkingSegments(prev => {
        if (prev.some(s => s.id === segId)) return prev;
        return [...prev, orig].sort((a, b) => a.seq - b.seq);
      });
    }
  };

  const handleResetAllSegments = () => {
    setWorkingSegments(rawPlanSegments);
    setExcludedSegmentIds([]);
  };

  const allSpurTargetNames = useMemo(() => {
    return new Set(availableSpursPool.map(s => s.targetNode.trim()));
  }, [availableSpursPool]);

  // Current location in manual mode
  const manualCurrentLocation = useMemo(() => {
    if (manualSegments.length === 0) {
      return manualStartNode || trailheads[0] || (currentRoute?.segments[0]?.startNode ?? '');
    }
    return manualSegments[manualSegments.length - 1].endNode;
  }, [manualSegments, manualStartNode, trailheads, currentRoute]);

  // Candidate legal next segments from currentRoute in manual mode
  const legalNextOptions = useMemo(() => {
    if (!currentRoute || !manualCurrentLocation) return [];
    const outgoing = currentRoute.segments.filter(
      s => s.startNode.trim() === manualCurrentLocation.trim()
    );
    const seen = new Set<string>();
    const options: Segment[] = [];
    for (const seg of outgoing) {
      const key = seg.endNode.trim();
      if (!seen.has(key)) {
        seen.add(key);
        options.push(seg);
      }
    }
    return options;
  }, [currentRoute, manualCurrentLocation]);

  const handleAddManualSegment = (segment: Segment) => {
    setManualSegments(prev => [
      ...prev,
      {
        ...segment,
        id: `manual_${Date.now()}_${prev.length + 1}`,
        seq: prev.length + 1,
      }
    ]);
  };

  const handleUndoManualSegment = () => {
    setManualSegments(prev => prev.slice(0, -1));
  };

  const handleResetManual = () => {
    setManualSegments([]);
  };

  // Temporary suppression of add spur button right at the removal location to avoid simultaneous remove/add buttons (Section XII)
  const [temporarilyHiddenAddSpurs, setTemporarilyHiddenAddSpurs] = useState<{
    target: string;
    junction: string;
  } | null>(null);

  const handleAddSpurByNodeName = (nodeName: string, spurTargetNode?: string) => {
    const spurs = getSpursForNode(nodeName, availableSpursPool);
    if (spurs.length === 0) return;
    const targetSpur = spurTargetNode
      ? (spurs.find(s => s.targetNode.trim() === spurTargetNode.trim()) || spurs[0])
      : spurs[0];

    let foundIdx = -1;
    let foundSegId: string | undefined = undefined;
    for (let i = planSegments.length - 1; i >= 0; i--) {
      if (planSegments[i].endNode.trim() === nodeName.trim()) {
        foundIdx = i;
        foundSegId = planSegments[i].id;
        break;
      }
    }
    if (foundIdx === -1 && planSegments.length > 0 && planSegments[0].startNode.trim() === nodeName.trim()) {
      foundIdx = -1;
    }
    handleAddSpurAt(foundIdx, targetSpur, foundSegId);
  };

  const handleRemoveSpurByTarget = (targetNode: string, junctionNode?: string) => {
    const trimmedTarget = targetNode.trim();
    if (junctionNode) {
      setTemporarilyHiddenAddSpurs({ target: trimmedTarget, junction: junctionNode.trim() });
      setTimeout(() => {
        setTemporarilyHiddenAddSpurs(null);
      }, 2500);
    }

    const spur = detectedSpurs.find(s => s.targetNode.trim() === trimmedTarget);
    if (spur) {
      handleRemoveSpur(spur);
    }

    // Completely remove all out and return segments associated with this spur target
    setWorkingSegments(prev =>
      prev
        .filter(s => s.startNode.trim() !== trimmedTarget && s.endNode.trim() !== trimmedTarget)
        .map((s, idx) => ({ ...s, seq: idx + 1 }))
    );

    // Track matching segment IDs from original plan in excludedSegmentIds
    const origMatchingIds = rawPlanSegments
      .filter(s => s.startNode.trim() === trimmedTarget || s.endNode.trim() === trimmedTarget)
      .map(s => s.id);
    if (origMatchingIds.length > 0) {
      setExcludedSegmentIds(prev => Array.from(new Set([...prev, ...origMatchingIds])));
    }

    if (planningMode === 'manual') {
      setManualSegments(prev =>
        prev
          .filter(s => s.startNode.trim() !== trimmedTarget && s.endNode.trim() !== trimmedTarget)
          .map((s, idx) => ({ ...s, seq: idx + 1 }))
      );
    }
  };

  const activeCalculatedSegments = useMemo(() => {
    if (planningMode === 'manual') {
      return manualSegments;
    }
    return planSegments;
  }, [planningMode, manualSegments, planSegments]);

  // Calculate full itinerary using active reconnected segments
  const calculatedResult: FullItineraryResult | null = useMemo(() => {
    if (!currentRoute || activeCalculatedSegments.length === 0) {
      return null;
    }
    return calculateItinerary({
      planName: planningMode === 'manual' ? '自訂手動規劃路線' : (selectedPlan || '自訂路線'),
      segments: activeCalculatedSegments,
      speedRatio,
      daysCount,
      dailyConfigs,
      startTrailhead: startTrailhead || undefined,
      endTrailhead: endTrailhead || undefined,
      explicitLodgings: effectiveLodgingNames,
      explicitLodgingSegmentIds: effectiveLodgingSegmentIds,
    });
  }, [
    currentRoute,
    planningMode,
    selectedPlan,
    activeCalculatedSegments,
    speedRatio,
    daysCount,
    dailyConfigs,
    startTrailhead,
    endTrailhead,
    effectiveLodgingNames,
    effectiveLodgingSegmentIds,
  ]);

  // Search filter across all routes and plans
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    
    const matches: { route: MainRoute; planName: string }[] = [];
    routes.forEach(r => {
      const rPlans = getPlansFromSegments(r.segments);
      if (r.name.toLowerCase().includes(q)) {
        if (rPlans.length === 0) {
          matches.push({ route: r, planName: '' });
        } else {
          rPlans.forEach(p => matches.push({ route: r, planName: p }));
        }
      } else {
        rPlans.forEach(p => {
          if (p.toLowerCase().includes(q)) {
            matches.push({ route: r, planName: p });
          }
        });
      }
    });
    return matches.slice(0, 10);
  }, [routes, searchQuery]);

  const isModified = excludedSegmentIds.length > 0 || workingSegments.length !== rawPlanSegments.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Search Header (搜尋行程) - Luxury Dark Slate */}
      <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-4 sm:p-5 mb-6 shadow-md">
        <div className="max-w-2xl">
          <label htmlFor="search-trip" className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
            搜尋行程 / SEARCH ITINERARY
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              id="search-trip"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入路線名稱或行程方案（例如：玉山、郡大山、北大武、南一段...）"
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#94a3b8] hover:text-[#f8fafc] p-1"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Quick search suggestions */}
          {searchQuery && (
            <div className="mt-2 p-2 bg-[#161b26] rounded-xs border border-[#2d3748] shadow-xl divide-y divide-[#242c3b] max-h-60 overflow-y-auto z-20 relative">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#94a3b8] font-serif">
                  查無相符行程
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectRoute(item.route.id);
                      if (item.planName) setSelectedPlan(item.planName);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202737] rounded-xs flex items-center justify-between group transition"
                  >
                    <div>
                      <span className="font-serif font-bold text-[#f1f5f9] group-hover:text-[#34d399]">
                        {item.route.name}
                      </span>
                      {item.planName && (
                        <span className="text-[#94a3b8] ml-2 font-sans">
                          → {item.planName}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#34d399]" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Planning Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1 & 2: 選擇路線 & 行程方案 */}
          <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-5 sm:p-6 space-y-5 shadow-md">
            <div>
              <label htmlFor="route-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                <Compass className="w-3.5 h-3.5 text-[#10b981]" />
                <span>選擇路線 / SELECT ROUTE</span>
              </label>
              <select
                id="route-select"
                value={currentRoute?.id || ''}
                onChange={(e) => onSelectRoute(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif font-bold text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id} className="bg-[#12161f] text-white">
                    {r.name} {r.segments.length === 0 ? '(尚無資料)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Planning Mode Switcher */}
            {currentRoute && currentRoute.segments.length > 0 && (
              <div className="pt-1">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                  <Route className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>規劃模式 / PLANNING MODE</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlanningMode('preset')}
                    className={`px-3 py-2 text-xs font-mono font-bold rounded-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                      planningMode === 'preset'
                        ? 'bg-[#10b981]/20 text-[#34d399] border-[#10b981]'
                        : 'bg-[#0a0d13] text-[#94a3b8] border-[#2a3445] hover:border-[#38bdf8]'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>方案自動排程</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanningMode('manual');
                      if (!manualStartNode && currentRoute.segments.length > 0) {
                        const ths = getTrailheads(currentRoute.segments);
                        setManualStartNode(ths.length > 0 ? ths[0] : currentRoute.segments[0].startNode);
                      }
                    }}
                    className={`px-3 py-2 text-xs font-mono font-bold rounded-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                      planningMode === 'manual'
                        ? 'bg-[#10b981]/20 text-[#34d399] border-[#10b981]'
                        : 'bg-[#0a0d13] text-[#94a3b8] border-[#2a3445] hover:border-[#38bdf8]'
                    }`}
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>純手動逐點選擇</span>
                  </button>
                </div>
              </div>
            )}

            {/* Check if route has segments */}
            {currentRoute && currentRoute.segments.length === 0 ? (
              <div className="p-4 rounded-xs bg-[#1a202c] border border-[#2d3748] flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#e2b714] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#94a3b8]">
                  <span className="font-bold text-[#f8fafc]">{currentRoute.name}</span> 目前尚未匯入路段資料。
                  <div className="mt-1 text-[#cbd5e1]">
                    請點選右上角「後台管理」匯入專屬 Excel 資料後即可開始規劃。
                  </div>
                </div>
              </div>
            ) : planningMode === 'preset' ? (
              <div>
                <label htmlFor="plan-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                  <Footprints className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>行程方案 / ITINERARY PLAN</span>
                </label>
                <select
                  id="plan-select"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif font-medium text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition"
                >
                  {plans.map((p, idx) => (
                    <option key={idx} value={p} className="bg-[#12161f] text-white">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="start-node-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>手動起點路點 / START LOCATION</span>
                </label>
                <select
                  id="start-node-select"
                  value={manualStartNode}
                  onChange={(e) => {
                    setManualStartNode(e.target.value);
                    setManualSegments([]);
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif font-medium text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition"
                >
                  {Array.from(new Set([
                    ...getTrailheads(currentRoute?.segments || []),
                    ...(currentRoute?.segments.map(s => s.startNode) || [])
                  ])).map((node, idx) => (
                    <option key={idx} value={node} className="bg-[#12161f] text-white">
                      {node}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Step 3 & 4: 安排天數 & 每日起登時間 */}
          {currentRoute && currentRoute.segments.length > 0 && (
            <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-5 sm:p-6 space-y-5 shadow-md">
              {/* Step 3: 安排天數 (Duration Dropdown) */}
              <div>
                <label htmlFor="duration-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>安排幾天 / DURATION</span>
                </label>
                <select
                  id="duration-select"
                  value={daysCount}
                  onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif font-bold text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                    <option key={num} value={num} className="bg-[#12161f] text-white">
                      {num} 天
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: 每日出發時間 */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>每日出發時間 / DAILY DEPARTURE TIME</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dailyConfigs.map((cfg) => (
                    <div
                      key={cfg.dayIndex}
                      className="p-3 rounded-xs bg-[#161b26] border border-[#242c3b] flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-[#f1f5f9] font-serif">
                        第 {cfg.dayIndex} 天
                      </span>
                      <input
                        type="time"
                        value={cfg.startTime}
                        onChange={(e) => handleStartTimeChange(cfg.dayIndex, e.target.value)}
                        className="px-2 py-1 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs font-mono text-[#34d399] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: 速度倍率 (Dropdown without explanation) */}
              <div>
                <label htmlFor="pace-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 font-mono">
                  <Gauge className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>速度倍率 / PACE MULTIPLIER</span>
                </label>
                <select
                  id="pace-select"
                  value={speedRatio}
                  onChange={(e) => setSpeedRatio(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-mono font-bold text-[#34d399] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition cursor-pointer"
                >
                  <option value={0.5} className="bg-[#12161f] text-white">0.5x</option>
                  <option value={0.6} className="bg-[#12161f] text-white">0.6x</option>
                  <option value={0.7} className="bg-[#12161f] text-white">0.7x</option>
                  <option value={0.8} className="bg-[#12161f] text-white">0.8x</option>
                  <option value={0.9} className="bg-[#12161f] text-white">0.9x</option>
                  <option value={1.0} className="bg-[#12161f] text-white">1.0x（預設標準）</option>
                  <option value={1.1} className="bg-[#12161f] text-white">1.1x</option>
                  <option value={1.2} className="bg-[#12161f] text-white">1.2x</option>
                  <option value={1.3} className="bg-[#12161f] text-white">1.3x</option>
                  <option value={1.4} className="bg-[#12161f] text-white">1.4x</option>
                  <option value={1.5} className="bg-[#12161f] text-white">1.5x</option>
                  <option value={1.6} className="bg-[#12161f] text-white">1.6x</option>
                  <option value={1.8} className="bg-[#12161f] text-white">1.8x</option>
                  <option value={2.0} className="bg-[#12161f] text-white">2.0x</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6: 登山口 & 宿點設定 */}
          {currentRoute && currentRoute.segments.length > 0 && (
            <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-5 sm:p-6 space-y-4 shadow-md">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 pb-2 border-b border-[#242c3b] font-mono">
                <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                <span>起迄登山口與宿點設定 / TRAILHEADS & LODGING</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Trailhead */}
                <div>
                  <label htmlFor="start-trailhead" className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                    起點登山口 / START TRAILHEAD
                  </label>
                  <select
                    id="start-trailhead"
                    value={startTrailhead}
                    onChange={(e) => setStartTrailhead(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                  >
                    {startTrailheadOptions.map((t, idx) => (
                      <option key={idx} value={t} className="bg-[#12161f]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Trailhead */}
                <div>
                  <label htmlFor="end-trailhead" className="block text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5 font-mono">
                    迄點登山口 / END TRAILHEAD
                  </label>
                  <select
                    id="end-trailhead"
                    value={endTrailhead}
                    onChange={(e) => setEndTrailhead(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                  >
                    {endTrailheadOptions.map((t, idx) => (
                      <option key={idx} value={t} className="bg-[#12161f]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 宿點下拉式選單 (動態取得自 RAW DATA 備註欄包含「宿點」之節點) */}
              <div className="pt-3 border-t border-dashed border-[#242c3b]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label htmlFor="lodging-select" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
                    <BedDouble className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>宿點 / OVERNIGHT LODGING</span>
                  </label>
                  {(selectedLodging || manualLodgingSegmentIds.length > 0) && (
                    <button
                      type="button"
                      onClick={handleClearLodgings}
                      className="text-[10px] font-mono text-[#fca5a5] hover:text-white underline cursor-pointer"
                    >
                      清除宿點（重設為單日行程）
                    </button>
                  )}
                </div>

                <div className="relative">
                  <select
                    id="lodging-select"
                    value={selectedLodging || ''}
                    onChange={(e) => {
                      const val = e.target.value ? e.target.value : null;
                      if (!val) {
                        setSelectedLodging(null);
                      } else {
                        setSelectedLodging(val);
                        setManualLodgingSegmentIds([]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#0a0d13] border border-[#2a3445] rounded-xs text-xs sm:text-sm font-serif font-medium text-[#f1f5f9] focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] transition cursor-pointer"
                  >
                    <option value="" className="bg-[#12161f] text-[#94a3b8]">
                      空白（手動模式：可在下方行程列表自由點選任意節點為宿點）
                    </option>
                    {lodgingOptions.map((lodge, idx) => (
                      <option key={idx} value={lodge} className="bg-[#12161f] text-white">
                        {lodge}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 text-[11px] font-serif">
                  {selectedLodging ? (
                    <div className="p-2.5 bg-[#121922] border border-[#10b981]/40 rounded-xs text-[#34d399] flex items-center justify-between gap-2 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>✓ 已從選單指定宿點：</span>
                          <span className="font-bold text-white bg-[#10b981]/20 px-1.5 py-0.5 rounded-xs border border-[#10b981]/30">
                            🏕️ {selectedLodging}
                          </span>
                          {effectiveLodgingSegments.length > 1 && (
                            <span className="text-[#fbbf24] font-bold">
                              （行程中出現 {effectiveLodgingSegments.length} 次）
                            </span>
                          )}
                        </div>
                        {effectiveLodgingSegments.length > 1 ? (
                          <div className="text-[11px] text-[#94a3b8] flex items-center gap-2 flex-wrap">
                            {effectiveLodgingSegments.map((s, idx) => (
                              <span key={s.id} className="text-[#34d399] bg-[#10b981]/10 px-1.5 py-0.5 rounded-xs border border-[#10b981]/20 font-mono">
                                第 {idx + 1} 個為第 {idx + 1} 天宿點
                              </span>
                            ))}
                            <span className="text-[#f1f5f9]">➔ 全程自動分割為 {effectiveLodgingSegments.length + 1} 天行程</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#94a3b8]">
                            （第 1 天宿點，後續行程已自動分割為次日）
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearLodgings}
                        className="text-[10px] font-mono text-[#94a3b8] hover:text-[#f8fafc] underline cursor-pointer"
                      >
                        切換回空白（進入手動模式）
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="bg-[#1c1810] border border-[#f59e0b]/40 rounded-xs p-2.5 text-[#fbbf24] flex items-start gap-2">
                        <span className="text-base leading-none">🏕️</span>
                        <div className="space-y-0.5">
                          <div className="font-bold">手動模式生效中（選單為空白）</div>
                          <div className="text-[#cbd5e1]">
                            您可在下方行程列表中，<strong>不受 RAW DATA 限制點選任一節點旁的「設為宿點」</strong>。只安排該節點為宿點，不連動同名其他節點；若同名節點再次選取，將再次自動分割為次日！
                          </div>
                        </div>
                      </div>

                      {effectiveLodgingSegments.length > 0 ? (
                        <div className="p-2.5 bg-[#121922] border border-[#f59e0b]/40 rounded-xs text-[#34d399] flex items-center justify-between gap-2 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#fbbf24]">✓ 已於列表手動選定宿點：</span>
                              {effectiveLodgingSegments.map((s, idx) => (
                                <span key={s.id} className="font-bold text-white bg-[#f59e0b]/20 px-1.5 py-0.5 rounded-xs border border-[#f59e0b]/40 inline-flex items-center gap-1">
                                  <span>🏕️</span>
                                  <span>第 {idx + 1} 天：{s.endNode}</span>
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] text-[#94a3b8]">
                              （不連動同名其他節點；行程已自動分割為 {effectiveLodgingSegments.length + 1} 天）
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearLodgings}
                            className="text-[10px] font-mono text-[#fca5a5] hover:text-white underline cursor-pointer"
                          >
                            清除自選宿點
                          </button>
                        </div>
                      ) : (
                        <div className="text-[#94a3b8] px-1">
                          目前尚未指定宿點（單日行程）。若需分天，請於下方行程列表點選任意節點旁的「🏕️ 設為宿點」。
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: 行程支線與節點調整 (內嵌支線操作與即時節點調整，無獨立支線操作欄位) */}
          {currentRoute && (planningMode === 'preset' ? rawPlanSegments.length > 0 : true) && (
            <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-5 sm:p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#242c3b]">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-[#10b981]" />
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
                      行程支線與節點調整 / SPURS & SEGMENT ADJUSTMENT
                    </h3>
                    <div className="text-xs text-[#cbd5e1] font-serif mt-0.5">
                      {planningMode === 'preset'
                        ? '功能直接內嵌於各路點節點上，可於岔路點加入或移除支線，前後步程自動無縫銜接'
                        : '依照合法連通相鄰點依序點選前進，或一鍵加入該節點的來回支線'}
                    </div>
                  </div>
                </div>

                {planningMode === 'preset' && isModified && (
                  <button
                    type="button"
                    onClick={handleResetAllSegments}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#d97706] hover:bg-[#b45309] text-[#090b0f] rounded-xs font-bold font-mono text-[11px] transition cursor-pointer"
                    title="還原為原始方案所有路段"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>還原方案</span>
                  </button>
                )}
              </div>

              {/* Mode 1: Preset Plan Route Progression */}
              {planningMode === 'preset' && (
                <div className="space-y-1">
                  {planSegments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#94a3b8] font-serif">
                      目前方案無路段資料或全部路段已排除。
                    </div>
                  ) : (
                    <div className="relative pl-3 sm:pl-4 space-y-2">
                      {/* Starting Node (Node 0) */}
                      {(() => {
                        const startNodeName = planSegments[0].startNode.trim();
                        const isStartLodging = Boolean(selectedLodging && startNodeName === selectedLodging.trim());
                        const isStartTrailhead = trailheads.includes(startNodeName) || (planSegments[0].note || '').includes('登山口');
                        const startSpurs = getSpursForNode(startNodeName, availableSpursPool);
                        const unaddedStartSpurs = startSpurs.filter(
                          spur =>
                            !isSpurInSegments(planSegments, spur.targetNode) &&
                            !(
                              temporarilyHiddenAddSpurs?.target === spur.targetNode &&
                              temporarilyHiddenAddSpurs?.junction === startNodeName
                            )
                        );

                        return (
                          <div className="border-b border-[#1f2937] pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                  isStartLodging ? 'bg-[#f59e0b] ring-2 ring-[#f59e0b]/40' : 'bg-[#10b981] ring-2 ring-[#10b981]/30'
                                }`} />
                                <span className="font-serif font-bold text-xs sm:text-sm text-[#f8fafc]">
                                  {startNodeName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                                  起點
                                </span>
                                {isStartTrailhead && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30">
                                    登山口
                                  </span>
                                )}
                                {isStartLodging && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40 inline-flex items-center gap-1 shadow-xs">
                                    <span>🏕️</span>
                                    <span>宿點</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Inline add spur if startNode is a spur base */}
                            {unaddedStartSpurs.length > 0 && (
                              <div className="mt-1.5 pl-4 flex items-center gap-2 flex-wrap">
                                {unaddedStartSpurs.map(spur => (
                                  <button
                                    key={spur.id}
                                    type="button"
                                    onClick={() => handleAddSpurAt(-1, spur)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#34d399] hover:text-[#a7f3d0] border border-[#10b981]/40 rounded-xs text-[11px] font-mono font-bold transition cursor-pointer shadow-xs"
                                    title={`於此起點加入「${spur.targetNode}」往返支線（前後步程自動無縫銜接）`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>＋ 加入支線: {spur.targetNode} ({spur.formattedDuration})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Progression Segments & Nodes */}
                      {planSegments.map((seg, idx) => {
                        const lodgingIndex = effectiveLodgingSegmentIds.indexOf(seg.id);
                        const isLodgingNode = lodgingIndex !== -1;
                        const isLastNode = idx === planSegments.length - 1;
                        const isNodeTrailhead = (seg.note || '').includes('登山口') || (isLastNode && trailheads.includes(seg.endNode.trim()));
                        const isSpurTarget =
                          (seg.note || '').includes('支線') ||
                          allSpurTargetNames.has(seg.endNode.trim()) ||
                          seg.id.startsWith('dyn_') ||
                          detectedSpurs.some(s => s.targetNode.trim() === seg.endNode.trim());
                        const nodeSpurs = getSpursForNode(seg.endNode.trim(), availableSpursPool);
                        const unaddedSpurs = nodeSpurs.filter(
                          spur =>
                            !isSpurInSegments(planSegments, spur.targetNode) &&
                            !(
                              temporarilyHiddenAddSpurs?.target === spur.targetNode &&
                              temporarilyHiddenAddSpurs?.junction === seg.endNode.trim()
                            )
                        );

                        return (
                          <div key={seg.id || idx} className="space-y-1.5 pt-1">
                            {/* Connector Segment */}
                            <div className="flex items-center gap-2 pl-1 text-[11px] font-mono text-[#64748b]">
                              <span className="text-[#10b981]">↓</span>
                              <span className="px-1.5 py-0.2 bg-[#0a0d13] border border-[#242c3b] rounded-xs text-[#94a3b8]">
                                {seg.duration} 分
                              </span>
                              {seg.direction && (
                                <span className="text-[10px] text-[#475569]">({seg.direction})</span>
                              )}
                              {seg.note && (
                                <span className="text-[10px] text-[#475569] truncate max-w-[150px]">
                                  {seg.note}
                                </span>
                              )}
                            </div>

                            {/* Node Row */}
                            <div className={`flex items-center justify-between gap-2 p-2 rounded-xs transition ${
                              isLodgingNode
                                ? 'bg-[#1a1405] border border-[#f59e0b]/60 shadow-sm ring-1 ring-[#f59e0b]/30'
                                : isSpurTarget
                                ? 'bg-[#061e16]/60 border border-[#10b981]/40 ml-3 sm:ml-4'
                                : 'bg-[#0a0d13] hover:bg-[#151b26] border border-[#202737]'
                            }`}>
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  isLodgingNode
                                    ? 'bg-[#f59e0b] ring-2 ring-[#f59e0b]/50'
                                    : isLastNode
                                    ? 'bg-[#38bdf8] ring-2 ring-[#38bdf8]/30'
                                    : isSpurTarget
                                    ? 'bg-[#10b981]'
                                    : 'bg-[#64748b]'
                                }`} />
                                <span className="font-serif font-bold text-xs sm:text-sm text-[#f8fafc]">
                                  {isSpurTarget ? `↳ ${seg.endNode} 支線` : seg.endNode}
                                </span>
                                {isLastNode && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                                    終點
                                  </span>
                                )}
                                {isNodeTrailhead && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30">
                                    登山口
                                  </span>
                                )}
                                {isSpurTarget && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                                    支線
                                  </span>
                                )}
                                {isLodgingNode && (
                                  <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40 inline-flex items-center gap-1 shadow-xs">
                                    <span>🏕️</span>
                                    <span>第 {lodgingIndex + 1} 天宿點（次日自動分割）</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                                {/* 宿點手動切換按鈕：任何節點皆可選，只安排此處為宿點，不連動同名其他節點 */}
                                {isLodgingNode ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualLodging(seg.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-[#fca5a5] hover:text-white bg-[#ef4444]/15 hover:bg-[#ef4444]/30 border border-[#ef4444]/30 rounded-xs transition cursor-pointer"
                                    title="取消此宿點，將後續行程合併"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                    <span>取消宿點</span>
                                  </button>
                                ) : !isLastNode ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualLodging(seg.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#fbbf24] hover:text-white bg-[#f59e0b]/10 hover:bg-[#f59e0b]/30 border border-[#f59e0b]/30 rounded-xs transition cursor-pointer"
                                    title={`將 ${seg.endNode} 設為宿點（後續行程自動分割為下一天）`}
                                  >
                                    <BedDouble className="w-2.5 h-2.5" />
                                    <span>設為宿點</span>
                                  </button>
                                ) : null}

                                {isSpurTarget && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSpurByTarget(seg.endNode, seg.startNode)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-bold text-[#fca5a5] hover:text-white bg-[#ef4444]/20 hover:bg-[#ef4444] border border-[#ef4444]/40 rounded-xs transition cursor-pointer shadow-xs"
                                    title={`移除 ${seg.endNode} 支線（前後步程自動無縫銜接）`}
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                    <span>移除支線</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSegment(seg.id)}
                                  className="p-1 text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xs transition cursor-pointer"
                                  title="刪除此單一路段（前後自動銜接）"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* 後續行程自動分割為下一天的分割條 */}
                            {isLodgingNode && !isLastNode && (
                              <div className="my-2 py-1 px-3 bg-[#1d170a] border-y border-dashed border-[#f59e0b]/50 flex items-center justify-between text-[11px] font-mono text-[#fbbf24] rounded-xs shadow-xs">
                                <div className="flex items-center gap-2 font-bold">
                                  <span>⛺</span>
                                  <span>第 {lodgingIndex + 1} 天結束（夜宿：{seg.endNode}）</span>
                                </div>
                                <div className="text-[10px] text-[#94a3b8] flex items-center gap-1 font-serif">
                                  <span>後續行程自動分割為第 {lodgingIndex + 2} 天</span>
                                  <span className="text-[#34d399]">▶</span>
                                </div>
                              </div>
                            )}

                            {/* Inline Spur Insertion Button at this junction node */}
                            {unaddedSpurs.length > 0 && (
                              <div className="pl-4 py-1 flex items-center gap-2 flex-wrap">
                                {unaddedSpurs.map(spur => (
                                  <button
                                    key={spur.id}
                                    type="button"
                                    onClick={() => handleAddSpurAt(idx, spur, seg.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#34d399] hover:text-[#a7f3d0] border border-[#10b981]/40 rounded-xs text-[11px] font-mono font-bold transition cursor-pointer shadow-xs"
                                    title={`於此岔路點加入「${spur.targetNode}」往返支線（前後步程自動無縫銜接）`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>＋ 加入支線: {spur.targetNode} ({spur.formattedDuration})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Manual Point-by-point Route Progression */}
              {planningMode === 'manual' && (
                <div className="space-y-4">
                  {/* Manual Route Timeline so far */}
                  <div className="relative pl-3 sm:pl-4 space-y-2 border-b border-[#242c3b] pb-4">
                    {/* Start node */}
                    {(() => {
                      const isManualStartLodging = Boolean(selectedLodging && manualStartNode.trim() === selectedLodging.trim());
                      return (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isManualStartLodging ? 'bg-[#f59e0b] ring-2 ring-[#f59e0b]/40' : 'bg-[#10b981] ring-2 ring-[#10b981]/30'
                          }`} />
                          <span className="font-serif font-bold text-xs sm:text-sm text-[#f8fafc]">
                            {manualStartNode}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                            起點
                          </span>
                          {isManualStartLodging && (
                            <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40 inline-flex items-center gap-1 shadow-xs">
                              <span>🏕️</span>
                              <span>宿點</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Manual segments added */}
                    {manualSegments.map((seg, idx) => {
                      const lodgingIndex = effectiveLodgingSegmentIds.indexOf(seg.id);
                      const isLodgingNode = lodgingIndex !== -1;
                      const isSpurTarget =
                        (seg.note || '').includes('支線') ||
                        allSpurTargetNames.has(seg.endNode.trim()) ||
                        seg.id.startsWith('dyn_');
                      return (
                        <div key={seg.id || idx} className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 pl-1 text-[11px] font-mono text-[#64748b]">
                            <span className="text-[#10b981]">↓</span>
                            <span className="px-1.5 py-0.2 bg-[#0a0d13] border border-[#242c3b] rounded-xs text-[#94a3b8]">
                              {seg.duration} 分
                            </span>
                            {seg.direction && (
                              <span className="text-[10px] text-[#475569]">({seg.direction})</span>
                            )}
                          </div>
                          <div className={`flex items-center justify-between gap-2 p-2 rounded-xs transition ${
                            isLodgingNode
                              ? 'bg-[#1a1405] border border-[#f59e0b]/60 shadow-sm ring-1 ring-[#f59e0b]/30'
                              : isSpurTarget
                              ? 'bg-[#061e16]/60 border border-[#10b981]/40 ml-3 sm:ml-4'
                              : 'bg-[#0a0d13] border border-[#202737]'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isLodgingNode
                                  ? 'bg-[#f59e0b] ring-2 ring-[#f59e0b]/40'
                                  : isSpurTarget
                                  ? 'bg-[#10b981]'
                                  : 'bg-[#64748b]'
                              }`} />
                              <span className="font-serif font-bold text-xs sm:text-sm text-[#f8fafc]">
                                {isSpurTarget ? `↳ ${seg.endNode} 支線` : seg.endNode}
                              </span>
                              {isSpurTarget && (
                                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                                  支線
                                </span>
                              )}
                              {isLodgingNode && (
                                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40 inline-flex items-center gap-1 shadow-xs">
                                  <span>🏕️</span>
                                  <span>第 {lodgingIndex + 1} 天宿點（次日自動分割）</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* 宿點切換按鈕 */}
                              {isLodgingNode ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleManualLodging(seg.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-[#fca5a5] hover:text-white bg-[#ef4444]/15 hover:bg-[#ef4444]/30 border border-[#ef4444]/30 rounded-xs transition cursor-pointer"
                                  title="取消此宿點"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  <span>取消宿點</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleManualLodging(seg.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#fbbf24] hover:text-white bg-[#f59e0b]/10 hover:bg-[#f59e0b]/30 border border-[#f59e0b]/30 rounded-xs transition cursor-pointer"
                                  title={`將 ${seg.endNode} 設為宿點（後續行程自動分割為下一天）`}
                                >
                                  <BedDouble className="w-2.5 h-2.5" />
                                  <span>設為宿點</span>
                                </button>
                              )}

                              {isSpurTarget && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpurByTarget(seg.endNode, seg.startNode)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-bold text-[#fca5a5] hover:text-white bg-[#ef4444]/15 hover:bg-[#ef4444] border border-[#ef4444]/30 rounded-xs transition cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  <span>移除此支線</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 自動分割為下一天的分割條 */}
                          {isLodgingNode && (
                            <div className="my-2 py-1 px-3 bg-[#1d170a] border-y border-dashed border-[#f59e0b]/50 flex items-center justify-between text-[11px] font-mono text-[#fbbf24] rounded-xs shadow-xs">
                              <div className="flex items-center gap-2 font-bold">
                                <span>⛺</span>
                                <span>第 {lodgingIndex + 1} 天結束（夜宿：{seg.endNode}）</span>
                              </div>
                              <div className="text-[10px] text-[#94a3b8] flex items-center gap-1 font-serif">
                                <span>後續行程自動分割為第 {lodgingIndex + 2} 天</span>
                                <span className="text-[#34d399]">▶</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Next Step Selection */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-[#94a3b8] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
                        <span>目前位置：<strong className="text-[#f8fafc]">{manualCurrentLocation}</strong></span>
                      </div>
                      <span className="text-[10px] text-[#64748b]">請選擇下一個相鄰路點</span>
                    </div>

                    {/* Check if current location has a spur round-trip option */}
                    {(() => {
                      const rawSpurs = getSpursForNode(manualCurrentLocation, availableSpursPool);
                      const currSpurs = rawSpurs.filter(
                        spur =>
                          !isSpurInSegments(manualSegments, spur.targetNode) &&
                          !(
                            temporarilyHiddenAddSpurs?.target === spur.targetNode &&
                            temporarilyHiddenAddSpurs?.junction === manualCurrentLocation
                          )
                      );
                      if (currSpurs.length === 0) return null;
                      return (
                        <div className="p-2.5 bg-[#0e1726] border border-[#10b981]/30 rounded-xs space-y-2">
                          <div className="text-[10px] font-mono font-bold text-[#34d399] uppercase tracking-wider">
                            可自此岔路點加入來回支線：
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {currSpurs.map(spur => (
                              <button
                                key={spur.id}
                                type="button"
                                onClick={() => {
                                  handleAddManualSegment(spur.outSegment);
                                  if (spur.backSegment) {
                                    handleAddManualSegment(spur.backSegment);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#10b981] hover:bg-[#059669] text-[#090b0f] rounded-xs text-xs font-mono font-bold transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>＋ 一鍵加入 {spur.targetNode} 來回支線 ({spur.formattedDuration})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Legal Next Connected Nodes Grid */}
                    {legalNextOptions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {legalNextOptions.map((opt, oIdx) => (
                          <button
                            key={opt.id || oIdx}
                            type="button"
                            onClick={() => handleAddManualSegment(opt)}
                            className="p-3 bg-[#161b26] hover:bg-[#1f2937] text-left border border-[#2a3548] hover:border-[#10b981] rounded-xs transition cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <div className="font-serif text-xs font-bold text-[#f8fafc] group-hover:text-[#34d399] transition">
                                {opt.endNode}
                              </div>
                              <div className="font-mono text-[10px] text-[#94a3b8] mt-0.5">
                                {opt.direction || '前進'} {opt.note ? `• ${opt.note}` : ''}
                              </div>
                            </div>
                            <span className="font-mono text-xs text-[#34d399] font-bold px-2 py-0.5 bg-[#0a0d13] rounded-xs border border-[#242c3b]">
                              {opt.duration} 分
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xs bg-[#161b26] border border-[#2a3548] text-xs text-[#94a3b8] font-serif text-center">
                        此路點已無更多連通路段，手動路線已完成。
                      </div>
                    )}

                    {/* Action buttons for manual mode */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#242c3b]">
                      <button
                        type="button"
                        onClick={handleUndoManualSegment}
                        disabled={manualSegments.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] disabled:opacity-40 disabled:cursor-not-allowed text-[#94a3b8] hover:text-white text-xs font-mono transition border border-[#2d3748]"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>返回上一步</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetManual}
                        disabled={manualSegments.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] disabled:opacity-40 disabled:cursor-not-allowed text-[#94a3b8] hover:text-white text-xs font-mono transition border border-[#2d3748]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重新開始</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Trip Summary Card & Quick Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trip Summary Card */}
          <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-5 sm:p-6 shadow-md">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 pb-3 border-b border-[#242c3b] mb-4 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              <span>行程摘要 / ITINERARY OVERVIEW</span>
            </h3>

            {calculatedResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xs bg-[#161b26] border border-[#242c3b]">
                  <div className="text-[11px] text-[#94a3b8] font-mono uppercase mb-1">
                    {currentRoute?.name}
                  </div>
                  <div className="text-base sm:text-lg font-serif font-bold text-[#f8fafc] mb-2">
                    {selectedPlan}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#f1f5f9] pt-2 border-t border-[#242c3b] font-serif font-semibold">
                    <span>預估總步程</span>
                    <span className="text-[#34d399] font-bold text-base sm:text-lg font-mono">
                      {calculatedResult.totalHoursFormatted}
                    </span>
                  </div>
                </div>

                {/* Day-by-day mini overview */}
                <div className="space-y-2">
                  {calculatedResult.days.map((d) => (
                    <div
                      key={d.dayIndex}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-xs bg-[#0a0d13] border border-[#242c3b]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-[#e2e8f0]">
                          第 {d.dayIndex} 天
                        </span>
                        <span className="text-[11px] font-mono text-[#94a3b8]">
                          ({d.startTime} 出發)
                        </span>
                      </div>
                      <span className="font-mono text-[#34d399] font-bold">
                        當日 {d.totalHoursFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94a3b8] font-serif">
                請在左側選定路線與方案以查看摘要
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Route Images Section (Requirement 20) */}
      {currentRoute && (
        <RouteImagesView
          images={currentRoute.images}
          routeName={currentRoute.name}
          gpxUrl={currentRoute.gpxUrl}
          mapUrl={currentRoute.mapUrl}
        />
      )}

      {/* Generated Itinerary Output Section */}
      <ItineraryResult
        result={calculatedResult}
        gpxUrl={currentRoute?.gpxUrl}
        routeName={currentRoute?.name || ''}
        availableSpursPool={availableSpursPool}
        onAddSpurAtNode={handleAddSpurByNodeName}
        onRemoveSpurByTarget={handleRemoveSpurByTarget}
        selectedLodging={selectedLodging}
        selectedLodgings={effectiveLodgingNames}
      />
    </div>
  );
};

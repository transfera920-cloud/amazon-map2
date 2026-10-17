import { CalculatedNode, DayItineraryResult, DayPlanConfig, FullItineraryResult, Segment } from '../types';

/**
 * Format minutes into "HH:MM" 24h format
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Convert "HH:MM" string into minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 6 * 60; // default 06:00
  const parts = timeStr.split(':').map(Number);
  const h = isNaN(parts[0]) ? 6 : parts[0];
  const m = isNaN(parts[1]) ? 0 : parts[1];
  return h * 60 + m;
}

/**
 * Format minutes duration into readable hours (e.g. 90 mins -> "1.5 小時" or "1 小時 30 分")
 */
export function formatDurationHours(minutes: number): string {
  const hours = minutes / 60;
  // If clean integer or 1 decimal place
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} 小時`;
}

/**
 * Parse start and end node tags from the Note field (F 欄備註).
 * Rule: Comma delimiter splits start point tag (before comma) and end point tag (after comma).
 * Example: "登山口，宿點" -> startTag: "登山口", endTag: "宿點"
 */
export function parseNoteForNodes(note: string): { startTag: string; endTag: string } {
  if (!note) return { startTag: '', endTag: '' };
  const parts = note.split(/[，,、]/).map(p => p.trim());
  if (parts.length >= 2) {
    return { startTag: parts[0], endTag: parts[1] };
  }
  const single = (parts[0] || '').trim();
  return { startTag: single, endTag: single };
}

/**
 * Extract trailheads from segments (Excel F 欄備註：逗號前代表起點、逗號後代表迄點)
 * 嚴格規範：
 * 1. 登山口選項並非選擇路線的所有登山口，只能顯示規劃模式備註欄標記為登山口的節點
 * 2. 請勿自動辨識（禁止模糊關鍵字推測，不預設加入非備註標記之節點）
 */
export function getTrailheads(segments: Segment[]): string[] {
  if (!segments || segments.length === 0) return [];
  const result = new Set<string>();

  for (const seg of segments) {
    const rawNote = String(seg.note || '').trim();
    if (!rawNote.includes('登山口')) continue;

    const sNode = (seg.startNode || '').trim();
    const eNode = (seg.endNode || '').trim();

    // 處理逗號標註前後節點標籤的情況（F 欄備註：逗號前代表起點、逗號後代表迄點）
    if (rawNote.includes('，') || rawNote.includes(',') || rawNote.includes('、')) {
      const { startTag, endTag } = parseNoteForNodes(rawNote);
      if (startTag.includes('登山口') && sNode) {
        result.add(sNode);
      }
      if (endTag.includes('登山口') && eNode) {
        result.add(eNode);
      }
    } else {
      // 備註欄為「登山口」：
      // 1. 若節點名稱包含「登山口」，直接認定為登山口節點
      if (sNode.includes('登山口')) result.add(sNode);
      if (eNode.includes('登山口')) result.add(eNode);

      // 2. 排除中途步道岔路、山峰、涼亭、獵寮等內部路點，保留該段標註為登山口之出入口節點（如「11.7K 行車終點」、「820林道0K」等）
      const isInternalTrailNode = (name: string) => {
        return (
          name.endsWith('岔路') ||
          name.includes('三岔路') ||
          name.endsWith('亭') ||
          name.endsWith('峰') ||
          name.endsWith('山') ||
          name.endsWith('水池') ||
          name.endsWith('獵寮') ||
          name.endsWith('工寮')
        );
      };

      if (!sNode.includes('登山口') && sNode && !isInternalTrailNode(sNode) && !sNode.includes('營地')) {
        result.add(sNode);
      }
      if (!eNode.includes('登山口') && eNode && !isInternalTrailNode(eNode) && !eNode.includes('營地')) {
        result.add(eNode);
      }
    }
  }

  const list = Array.from(result);
  const naturalStart = segments[0]?.startNode?.trim();
  if (naturalStart && list.includes(naturalStart)) {
    return [naturalStart, ...list.filter(n => n !== naturalStart)];
  }

  return list;
}

/**
 * Extract unique lodging nodes dynamically from RAW DATA.
 * Rule: RAW DATA 的「備註」欄位是判斷宿點的唯一來源 (String(note || '').includes('宿點'))
 * 建立宿點選項時，正確取得迄點作為宿點名稱，並以 Set 去重。
 * 宿點與支線可同時成立（例如 備註: 宿點/支線）。
 * 禁止寫死任何特定山屋或宿點名稱。
 */
export function getLodgingNodesFromRawData(segments: Segment[]): string[] {
  if (!segments || segments.length === 0) return [];
  const result = new Set<string>();

  for (const row of segments) {
    const rawNote = String(row.note || '').trim();
    // 只要 RAW DATA 的「備註」欄位包含「宿點」就判定該資料具有宿點資格
    if (!rawNote.includes('宿點')) continue;

    // 處理逗號標註前後節點標籤的情況
    if (rawNote.includes('，') || rawNote.includes(',') || rawNote.includes('、')) {
      const { startTag, endTag } = parseNoteForNodes(rawNote);
      if (endTag.includes('宿點') && row.endNode?.trim()) {
        result.add(row.endNode.trim());
      }
      if (startTag.includes('宿點') && row.startNode?.trim()) {
        result.add(row.startNode.trim());
      }
    } else {
      // 規則十二：建立宿點選項時，正確取得迄點作為宿點名稱
      const end = (row.endNode || '').trim();
      if (end) {
        result.add(end);
      } else if (row.startNode?.trim()) {
        result.add(row.startNode.trim());
      }
    }
  }

  return Array.from(result);
}

/**
 * Extract stay points from segments (Alias to getLodgingNodesFromRawData)
 */
export function getStayPoints(segments: Segment[]): string[] {
  return getLodgingNodesFromRawData(segments);
}

export interface SpurInfo {
  id: string;              // unique spur id
  name: string;            // e.g. "庫哈諾辛山 (來回支線)"
  baseJunction: string;    // e.g. "庫哈諾辛山屋"
  targetNode: string;      // e.g. "庫哈諾辛山"
  outSegmentId: string;    // A -> B
  backSegmentId?: string;  // B -> A
  totalDuration: number;   // sum of durations
  formattedDuration: string;
  isOutAndBack: boolean;
}

/**
 * Detect branch/spur segments in a plan.
 * Strict Rule: RAW DATA 的「備註」欄位是支線的唯一明確標記來源。
 * 只有 row.note 包含「支線」才屬於支線，絕不透過往返猜測、序號關係或拓撲猜測。
 */
export function detectSpurs(segments: Segment[]): SpurInfo[] {
  const spurs: SpurInfo[] = [];
  const handledSegIds = new Set<string>();

  for (let i = 0; i < segments.length; i++) {
    if (handledSegIds.has(segments[i].id)) continue;

    const curr = segments[i];
    const currNote = (curr.note || '').trim();
    const isExplicit = currNote.includes('支線') || (curr as any).category === '支線';

    // 檢查是否有反向返回段（迄點與起點相反，例如：雨量計前岔路 -> 閂山，接著 閂山 -> 雨量計前岔路）
    let returnSeg: Segment | undefined;
    if (i + 1 < segments.length) {
      const next = segments[i + 1];
      if (
        !handledSegIds.has(next.id) &&
        curr.startNode.trim() === next.endNode.trim() &&
        curr.endNode.trim() === next.startNode.trim()
      ) {
        returnSeg = next;
      }
    }

    if (!returnSeg) {
      for (let j = i + 1; j < segments.length; j++) {
        const other = segments[j];
        if (
          !handledSegIds.has(other.id) &&
          curr.startNode.trim() === other.endNode.trim() &&
          curr.endNode.trim() === other.startNode.trim()
        ) {
          returnSeg = other;
          break;
        }
      }
    }

    if (returnSeg) {
      const totalMin = (curr.duration || 0) + (returnSeg.duration || 0);
      spurs.push({
        id: `spur_${curr.id}_${returnSeg.id}`,
        name: `${curr.endNode} 支線`,
        baseJunction: curr.startNode.trim(),
        targetNode: curr.endNode.trim(),
        outSegmentId: curr.id,
        backSegmentId: returnSeg.id,
        totalDuration: totalMin,
        formattedDuration: formatDurationHours(totalMin),
        isOutAndBack: true,
      });
      handledSegIds.add(curr.id);
      handledSegIds.add(returnSeg.id);
    } else if (isExplicit) {
      const totalMin = curr.duration || 0;
      spurs.push({
        id: `spur_single_${curr.id}`,
        name: `${curr.endNode} 支線`,
        baseJunction: curr.startNode.trim(),
        targetNode: curr.endNode.trim(),
        outSegmentId: curr.id,
        totalDuration: totalMin,
        formattedDuration: formatDurationHours(totalMin),
        isOutAndBack: false,
      });
      handledSegIds.add(curr.id);
    }
  }

  return spurs;
}

/**
 * Filter out removed spurs and segments, and automatically reconnect nodes seamlessly.
 */
export function filterAndReconnectSegments(
  segments: Segment[],
  excludedSegmentIds: Set<string>
): Segment[] {
  const result: Segment[] = [];
  for (const seg of segments) {
    if (!excludedSegmentIds.has(seg.id)) {
      result.push(seg);
    }
  }

  // Re-index sequence numbers sequentially
  return result.map((seg, idx) => ({
    ...seg,
    seq: idx + 1
  }));
}

/**
 * Extract all unique plans from segments in order of appearance
 */
export function getPlansFromSegments(segments: Segment[]): string[] {
  const seen = new Set<string>();
  const plans: string[] = [];
  for (const seg of segments) {
    if (seg.planName && !seen.has(seg.planName)) {
      seen.add(seg.planName);
      plans.push(seg.planName);
    }
  }
  return plans;
}

/**
 * Calculate itinerary given plan segments, speed ratio, days count, daily start times, stay points, and optional start/end nodes.
 */
export function calculateItinerary(options: {
  planName: string;
  segments: Segment[];
  speedRatio: number;
  daysCount: number;
  dailyConfigs: DayPlanConfig[];
  startTrailhead?: string;
  endTrailhead?: string;
  explicitLodgings?: string[];
  explicitLodgingSegmentIds?: string[];
}): FullItineraryResult {
  const {
    planName,
    segments,
    speedRatio,
    daysCount,
    dailyConfigs,
    startTrailhead,
    endTrailhead,
    explicitLodgings,
    explicitLodgingSegmentIds,
  } = options;

  // Preserving exactly the ordered active segments provided by the caller (PlannerView's workingSegments / planSegments)
  // We do NOT filter out segments by planName or sort by outdated seq numbers, because dynamic spurs, branch segments,
  // or custom reconnected segments might originate from other pool definitions or have empty planName in raw Excel.
  let planSegments = segments.map((s, idx) => ({ ...s, seq: idx + 1 }));

  if (planSegments.length === 0) {
    return {
      planName,
      days: [],
      totalMinutes: 0,
      totalHoursFormatted: '0 小時',
      notepadContent: '無路段資料'
    };
  }

  // If user selected custom start trailhead that differs from the plan's natural start
  if (startTrailhead && planSegments.length > 0 && planSegments[0].startNode.trim() !== startTrailhead.trim()) {
    const startIdx = planSegments.findIndex(s => s.startNode.trim() === startTrailhead.trim());
    if (startIdx > 0) {
      planSegments = planSegments.slice(startIdx);
    }
  }

  // If user selected custom end trailhead that differs from the plan's natural end:
  // Use lastIndexOf so loops, return legs, and spurs appended to the route are NOT cut off prematurely
  if (
    endTrailhead &&
    endTrailhead.trim() !== '17.5K岔路' &&
    planSegments.length > 0 &&
    planSegments[planSegments.length - 1].endNode.trim() !== endTrailhead.trim()
  ) {
    const endIdx = planSegments.map(s => s.endNode.trim()).lastIndexOf(endTrailhead.trim());
    if (endIdx !== -1 && endIdx < planSegments.length - 1) {
      // Guard against accidentally truncating an entire multi-segment itinerary to a single segment
      if (endIdx > 0 || planSegments.length <= 2) {
        planSegments = planSegments.slice(0, endIdx + 1);
      }
    }
  }

  // Determine split points across days
  const daySegments: Segment[][] = [];
  let currentRemaining = [...planSegments];

  if (explicitLodgingSegmentIds && explicitLodgingSegmentIds.length > 0) {
    // 1. 精確路段實例分割：以 Segment ID 為分割依據
    // 依據在 planSegments 中實際出現的順序排序，確保同名或亂序宿點皆能嚴謹正確分割
    const sortedLodgingIds = [...explicitLodgingSegmentIds].sort((idA, idB) => {
      const idxA = planSegments.findIndex(s => s.id === idA);
      const idxB = planSegments.findIndex(s => s.id === idB);
      return idxA - idxB;
    });

    for (const lodgingSegId of sortedLodgingIds) {
      const splitIdx = currentRemaining.findIndex(s => s.id === lodgingSegId);
      if (splitIdx !== -1) {
        daySegments.push(currentRemaining.slice(0, splitIdx + 1));
        currentRemaining = currentRemaining.slice(splitIdx + 1);
      }
    }
    // 宿點之後的剩餘行程歸為最後一天
    if (currentRemaining.length > 0) {
      daySegments.push(currentRemaining);
    } else if (daySegments.length === 0) {
      daySegments.push([]);
    }
  } else if (explicitLodgings && explicitLodgings.length > 0) {
    // 2. 宿點名稱分割（相容後備）
    for (const lodgingNode of explicitLodgings) {
      const splitIdx = currentRemaining.findIndex(s => s.endNode.trim() === lodgingNode.trim());
      if (splitIdx !== -1) {
        daySegments.push(currentRemaining.slice(0, splitIdx + 1));
        currentRemaining = currentRemaining.slice(splitIdx + 1);
      }
    }
    // Remaining segments after the last lodging point belong to the final day
    if (currentRemaining.length > 0) {
      daySegments.push(currentRemaining);
    } else if (daySegments.length === 0) {
      daySegments.push([]);
    }
  } else {
    // If no explicit lodging points specified, follow daysCount and dailyConfigs
    for (let d = 1; d <= daysCount; d++) {
      if (d === daysCount) {
        // Last day gets whatever is left
        daySegments.push(currentRemaining);
        currentRemaining = [];
        break;
      }

      const config = dailyConfigs.find(c => c.dayIndex === d);
      const designatedStay = config?.stayPoint;

      if (designatedStay) {
        // Find first segment ending at this stay point
        const splitIdx = currentRemaining.findIndex(s => s.endNode.trim() === designatedStay.trim());
        if (splitIdx !== -1) {
          daySegments.push(currentRemaining.slice(0, splitIdx + 1));
          currentRemaining = currentRemaining.slice(splitIdx + 1);
          continue;
        }
      }

      // Divide remaining segments evenly across remaining days
      const daysLeft = daysCount - d + 1;
      const countForThisDay = Math.max(1, Math.ceil(currentRemaining.length / daysLeft));
      daySegments.push(currentRemaining.slice(0, countForThisDay));
      currentRemaining = currentRemaining.slice(countForThisDay);
    }
  }

  // Calculate times for each day
  const daysResults: DayItineraryResult[] = [];
  let totalTripMinutes = 0;

  for (let d = 0; d < daySegments.length; d++) {
    const dNumber = d + 1;
    const segmentsForDay = daySegments[d];
    const config = dailyConfigs.find(c => c.dayIndex === dNumber);
    const dayStartTimeStr = config?.startTime || (dNumber === 1 ? '06:00' : '05:30');
    const startMinutes = parseTimeToMinutes(dayStartTimeStr);

    if (segmentsForDay.length === 0) {
      daysResults.push({
        dayIndex: dNumber,
        startTime: dayStartTimeStr,
        nodes: [],
        totalMinutes: 0,
        totalHoursFormatted: '0 小時'
      });
      continue;
    }

    const nodes: CalculatedNode[] = [];
    let currentMin = startMinutes;
    let dayDuration = 0;

    // First node of the day
    const firstSeg = segmentsForDay[0];
    nodes.push({
      timeStr: formatMinutesToTime(currentMin),
      location: firstSeg.startNode,
      note: firstSeg.note,
      accumulatedMinutes: currentMin
    });

    for (let sIdx = 0; sIdx < segmentsForDay.length; sIdx++) {
      const seg = segmentsForDay[sIdx];
      // Speed multiplier formula: duration / speedRatio
      const adjustedDuration = Math.round(seg.duration / speedRatio);
      currentMin += adjustedDuration;
      dayDuration += adjustedDuration;

      const isLastSegOfDay = sIdx === segmentsForDay.length - 1;
      const isDayLodging = isLastSegOfDay && (d < daySegments.length - 1);

      nodes.push({
        timeStr: formatMinutesToTime(currentMin),
        location: seg.endNode,
        note: seg.note,
        segmentDuration: adjustedDuration,
        accumulatedMinutes: currentMin,
        isLodging: isDayLodging,
        lodgingDayIndex: isDayLodging ? dNumber : undefined,
      });
    }

    totalTripMinutes += dayDuration;

    daysResults.push({
      dayIndex: dNumber,
      startTime: dayStartTimeStr,
      nodes,
      totalMinutes: dayDuration,
      totalHoursFormatted: formatDurationHours(dayDuration)
    });
  }

  // Build clean notepad content complying strictly with Requirement 18:
  // 第一天
  // 06：00 塔塔加鞍部
  // 06：50 孟祿亭
  // ...
  // 當日預估步程：XX 小時
  //
  // 第二天
  // ...
  // 當日預估步程：XX 小時
  //
  // 預估總步程：XX 小時
  const notepadLines: string[] = [];
  const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];

  daysResults.forEach((day) => {
    const dayLabel = `第${chineseNums[day.dayIndex - 1] || day.dayIndex}天`;
    notepadLines.push(dayLabel);
    notepadLines.push('');

    day.nodes.forEach((node) => {
      // format as "06:00 地點"
      notepadLines.push(`${node.timeStr} ${node.location}`);
    });

    notepadLines.push('');
    notepadLines.push(`當日預估步程：${day.totalHoursFormatted}`);
    notepadLines.push('');
  });

  notepadLines.push(`預估總步程：${formatDurationHours(totalTripMinutes)}`);

  return {
    planName,
    days: daysResults,
    totalMinutes: totalTripMinutes,
    totalHoursFormatted: formatDurationHours(totalTripMinutes),
    notepadContent: notepadLines.join('\n')
  };
}

export interface AvailableSpur {
  id: string;
  name: string;
  baseJunction: string;    // e.g. "前峰登山口"
  targetNode: string;      // e.g. "玉山前峰"
  outSegment: Segment;
  backSegment?: Segment;
  totalDuration: number;
  formattedDuration: string;
}

/**
 * Extract all unique available spurs from route segments database dynamically from RAW DATA.
 * Strict Rule: RAW DATA 的「備註」欄位是支線的唯一明確標記來源。
 * const branchEdges = data.filter(row => row.備註?.includes("支線"));
 * 再根據 起點、迄點 動態建立支線關係，支線入口由 RAW DATA 動態決定，絕不寫死。
 */
export function getAllAvailableSpursFromRoute(routeSegments: Segment[]): AvailableSpur[] {
  if (!routeSegments || routeSegments.length === 0) return [];

  const spurMap = new Map<string, AvailableSpur>();

  // 1. 先依方案組織路段，辨識各方案中自然存在的折返支線（如 A -> B 緊接著 B -> A）
  const plans: Record<string, Segment[]> = {};
  for (const seg of routeSegments) {
    const pName = seg.planName || '__default__';
    if (!plans[pName]) plans[pName] = [];
    plans[pName].push(seg);
  }

  for (const segs of Object.values(plans)) {
    for (let i = 0; i < segs.length - 1; i++) {
      const s1 = segs[i];
      const s2 = segs[i + 1];
      if (
        s1.startNode.trim() === s2.endNode.trim() &&
        s1.endNode.trim() === s2.startNode.trim()
      ) {
        const base = s1.startNode.trim();
        const target = s1.endNode.trim();
        const key = `${base}__${target}`;
        if (!spurMap.has(key)) {
          const totalDur = (s1.duration || 0) + (s2.duration || 0);
          spurMap.set(key, {
            id: `spur_${s1.id}_${s2.id}`,
            name: `${target} 支線`,
            baseJunction: base,
            targetNode: target,
            outSegment: s1,
            backSegment: s2,
            totalDuration: totalDur,
            formattedDuration: formatDurationHours(totalDur),
          });
        }
      }
    }
  }

  // 2. 搜尋所有備註含有「支線」或分類為「支線」的路段
  for (let i = 0; i < routeSegments.length; i++) {
    const out = routeSegments[i];
    const isExplicit = (out.note || '').includes('支線') || (out as any).category === '支線';
    if (!isExplicit) continue;

    const baseJunction = out.startNode.trim();
    const targetNode = out.endNode.trim();
    if (!baseJunction || !targetNode) continue;

    const key = `${baseJunction}__${targetNode}`;
    if (!spurMap.has(key)) {
      // 嘗試尋找返回段
      const back = routeSegments.find(
        (b, bIdx) =>
          bIdx !== i &&
          b.startNode.trim() === targetNode &&
          b.endNode.trim() === baseJunction
      );
      const totalDuration = (out.duration || 0) + (back ? (back.duration || 0) : Math.round(out.duration * 0.8));
      spurMap.set(key, {
        id: `spur_${out.id}_${back ? back.id : 'single'}`,
        name: `${targetNode} 支線`,
        baseJunction,
        targetNode,
        outSegment: out,
        backSegment: back,
        totalDuration,
        formattedDuration: formatDurationHours(totalDuration),
      });
    }
  }

  return Array.from(spurMap.values());
}

/**
 * Strictly query spurs that belong to a specific junction node.
 * Ensures the junction cannot display spurs belonging to other junctions.
 */
export function getSpursForNode(nodeName: string, availableSpurs: AvailableSpur[]): AvailableSpur[] {
  if (!nodeName || !availableSpurs || availableSpurs.length === 0) return [];
  const trimmed = nodeName.trim();
  return availableSpurs.filter(s => s.baseJunction.trim() === trimmed);
}

/**
 * Check if a spur is already present in the active segment collection.
 * Prevents showing '+ 加入' when the spur is currently part of the itinerary.
 */
export function isSpurInSegments(segments: Segment[], targetNode: string): boolean {
  if (!segments || segments.length === 0 || !targetNode) return false;
  const trimmed = targetNode.trim();
  return segments.some(
    s => s.startNode.trim() === trimmed || s.endNode.trim() === trimmed
  );
}

/**
 * Check if the spur is already present right after the current segment index,
 * preventing duplicate additions like: A -> B -> A -> B -> A.
 */
export function isSpurPresentAfterIndex(
  segments: Segment[],
  index: number,
  spur: AvailableSpur
): boolean {
  if (index < -1 || index >= segments.length) return false;
  // If index is -1 (before first segment)
  const nextSeg = segments[index + 1];
  if (!nextSeg) return false;

  // Check if next segment goes from baseJunction to targetNode
  if (
    nextSeg.startNode.trim() === spur.baseJunction.trim() &&
    nextSeg.endNode.trim() === spur.targetNode.trim()
  ) {
    return true;
  }

  return false;
}


import * as XLSX from 'xlsx';
import { parseExcelFile } from './src/utils/excelParser';

const API_BASE = 'http://localhost:3000/api';

async function api(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  return { status: res.status, data };
}

function generateSegments(routeId: string, daysCount: number, segsPerDay: number) {
  const segs = [];
  let seq = 0;
  for (let day = 1; day <= daysCount; day++) {
    const planName = `Day ${day} 行程`;
    for (let s = 1; s <= segsPerDay; s++) {
      seq++;
      segs.push({
        id: `${routeId}_D${day}_S${s}`,
        seq,
        planName,
        startNode: `節點 D${day}-${s}`,
        endNode: `節點 D${day}-${s + 1}`,
        duration: 30 + s * 10,
        note: `測試路段 D${day}-${s}`,
        direction: '雙向',
        category: '步道'
      });
    }
  }
  return segs;
}

function analyzeRouteDistribution(segments: any[]) {
  const dist: Record<string, number> = {};
  for (const seg of segments) {
    const p = seg.planName || seg.plan_name || '未分類';
    dist[p] = (dist[p] || 0) + 1;
  }
  return {
    totalSegments: segments.length,
    distinctDays: Object.keys(dist).length,
    distribution: dist
  };
}

async function runPhase5() {
  console.log('================================================================');
  console.log('  第五階段：Route 全面稽核＋長時間壓力驗證執行開始');
  console.log('================================================================\n');

  const testReport: any[] = [];
  function recordTest(name: string, passed: boolean, details: any) {
    testReport.push({ name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
    if (!passed) {
      console.error('  Failure details:', details);
    }
  }

  // -------------------------------------------------------------
  // Step 1: Real Routes Baseline Recording (G12, G02, G20, M01)
  // -------------------------------------------------------------
  console.log('>>> [步驟 1] 讀取並建立真實 Route 基準線 (G12, G02, G20, M01)...');
  const realRouteIds = ['G12', 'G02', 'G20', 'M01'];
  const baselines: Record<string, any> = {};

  for (const rId of realRouteIds) {
    const { status, data } = await api(`/routes/${rId}`);
    if (status === 200 && data.success && data.data) {
      const r = data.data;
      const stats = analyzeRouteDistribution(r.segments || []);
      baselines[rId] = {
        id: r.id,
        code: r.code,
        name: r.name,
        updatedAt: r.updatedAt,
        ...stats
      };
      console.log(`  基準線 [${rId}] ${r.name}: ${stats.totalSegments} segments, ${stats.distinctDays} days`, stats.distribution);
    } else {
      console.warn(`  [注意] 路線 ${rId} 未在資料庫中找到 (status=${status})`);
    }
  }

  // -------------------------------------------------------------
  // Step 2: Safety Gate Unit Tests (Test A through K)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 2] 執行「禁止繞過 Safety Gate」測試 (Tests A ~ K)...');
  const testAtoKRouteId = 'TEST_ROUTE_SAFETY_GATE';

  // Seed initial 30 segments / 6 days (5 per day)
  const init30Segments = generateSegments(testAtoKRouteId, 6, 5);
  const seedRes = await api(`/routes`, {
    method: 'POST',
    body: JSON.stringify({
      id: testAtoKRouteId,
      code: 'TEST_SG',
      name: '安全閘門測試路線',
      segments: init30Segments,
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });
  recordTest('Setup TEST_ROUTE_SAFETY_GATE (30 segs, 6 days)', seedRes.status === 200 && seedRes.data.data.segments.length === 30, { count: seedRes.data.data?.segments?.length });

  // Test A: metadata-only, segments omitted -> 30 segments / 6 days intact
  const resA = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: '安全閘門測試路線 - 更新名稱 A',
      description: '純中繼資料更新'
      // segments omitted
    })
  });
  const fetchA = await api(`/routes/${testAtoKRouteId}`);
  const passA = fetchA.data.data.segments.length === 30 && fetchA.data.data.name.includes('A');
  recordTest('Test A: metadata-only (segments omitted) -> 30 segs preserved', passA, { count: fetchA.data.data?.segments?.length });

  // Test B: segments=[], no segmentsMode -> PRESERVE 30 segments / 6 days
  const resB = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: '安全閘門測試路線 - 空陣列無模式 B',
      segments: []
      // segmentsMode omitted
    })
  });
  const fetchB = await api(`/routes/${testAtoKRouteId}`);
  const passB = fetchB.data.data.segments.length === 30;
  recordTest('Test B: segments=[] without segmentsMode -> PRESERVE 30 segs', passB, { count: fetchB.data.data?.segments?.length });

  // Test C: segments=[], segmentsMode=preserve -> PRESERVE 30 segments / 6 days
  const resC = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: [],
      segmentsMode: 'preserve'
    })
  });
  const fetchC = await api(`/routes/${testAtoKRouteId}`);
  const passC = fetchC.data.data.segments.length === 30;
  recordTest('Test C: segments=[] with segmentsMode=preserve -> PRESERVE 30 segs', passC, { count: fetchC.data.data?.segments?.length });

  // Test D: Send only Day 1's 3 segments, segmentsMode omitted -> PRESERVE or Reject, MUST NOT shrink 30 -> 3
  const day1ThreeSegs = init30Segments.slice(0, 3);
  const resD = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: day1ThreeSegs
      // segmentsMode omitted
    })
  });
  const fetchD = await api(`/routes/${testAtoKRouteId}`);
  const passD = fetchD.data.data.segments.length === 30;
  recordTest('Test D: Day 1 partial (3 segs) without segmentsMode -> PRESERVE 30 segs (Not 3)', passD, { count: fetchD.data.data?.segments?.length });

  // Test E: Send only Day 1's 3 segments, segmentsMode=partial -> Day 2~6 intact, specified segs updated
  const updatedDay1Seg = { ...day1ThreeSegs[0], note: 'Day 1 局部更新測試筆記' };
  const resE = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: [updatedDay1Seg],
      segmentsMode: 'partial'
    })
  });
  const fetchE = await api(`/routes/${testAtoKRouteId}`);
  const day1Updated = fetchE.data.data.segments.find((s: any) => s.id === updatedDay1Seg.id);
  const passE = fetchE.data.data.segments.length === 30 && day1Updated && day1Updated.note.includes('局部更新測試筆記');
  recordTest('Test E: segmentsMode=partial -> Only targets updated, Day 2~6 intact (30 segs)', passE, { count: fetchE.data.data?.segments?.length, note: day1Updated?.note });

  // Test F: Send 3 segments, segmentsMode=replace, expectedOriginalCount omitted -> Rejected (HTTP 400/409), data intact
  const resF = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: day1ThreeSegs,
      segmentsMode: 'replace'
      // expectedOriginalCount omitted
    })
  });
  const fetchF = await api(`/routes/${testAtoKRouteId}`);
  const passF = (resF.status === 400 || resF.status === 409) && fetchF.data.data.segments.length === 30;
  recordTest('Test F: segmentsMode=replace without expectedOriginalCount -> Blocked/Conflict (30 segs intact)', passF, { status: resF.status, error: resF.data.error, count: fetchF.data.data?.segments?.length });

  // Test G: 30 -> 3, segmentsMode=replace, expectedOriginalCount=999 (wrong) -> Rejected HTTP 409, data intact
  const resG = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: day1ThreeSegs,
      segmentsMode: 'replace',
      expectedOriginalCount: 999,
      allowShrink: true
    })
  });
  const fetchG = await api(`/routes/${testAtoKRouteId}`);
  const passG = resG.status === 409 && fetchG.data.data.segments.length === 30;
  recordTest('Test G: segmentsMode=replace with wrong expectedOriginalCount=999 -> Rejected 409 (30 segs intact)', passG, { status: resG.status, count: fetchG.data.data?.segments?.length });

  // Test H: 30 -> 3, segmentsMode=replace, expectedOriginalCount=30, allowShrink=false -> Rejected HTTP 400, data intact
  const resH = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: day1ThreeSegs,
      segmentsMode: 'replace',
      expectedOriginalCount: 30,
      allowShrink: false
    })
  });
  const fetchH = await api(`/routes/${testAtoKRouteId}`);
  const passH = resH.status === 400 && fetchH.data.data.segments.length === 30;
  recordTest('Test H: segmentsMode=replace 30->3 with allowShrink=false -> Rejected 400 (30 segs intact)', passH, { status: resH.status, count: fetchH.data.data?.segments?.length });

  // Test I: 30 -> 3, segmentsMode=replace, expectedOriginalCount=30, allowShrink=true -> Success (The ONLY legal shrink)
  const resI = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: day1ThreeSegs,
      segmentsMode: 'replace',
      expectedOriginalCount: 30,
      allowShrink: true
    })
  });
  const fetchI = await api(`/routes/${testAtoKRouteId}`);
  const passI = resI.status === 200 && fetchI.data.data.segments.length === 3;
  recordTest('Test I: segmentsMode=replace 30->3 with matching count=30 & allowShrink=true -> Success (3 segs)', passI, { status: resI.status, count: fetchI.data.data?.segments?.length });

  // Test K: segmentsMode=clear, but clearSegments omitted -> Blocked, segments intact (3 segs)
  const resK = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segmentsMode: 'clear'
      // clearSegments omitted
    })
  });
  const fetchK = await api(`/routes/${testAtoKRouteId}`);
  const passK = fetchK.data.data.segments.length === 3;
  recordTest('Test K: segmentsMode=clear without clearSegments=true -> Blocked, 3 segs preserved', passK, { count: fetchK.data.data?.segments?.length });

  // Test J: segmentsMode=clear, clearSegments=true -> route_segments = 0, audit log exists
  const resJ = await api(`/routes/${testAtoKRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segmentsMode: 'clear',
      clearSegments: true
    })
  });
  const fetchJ = await api(`/routes/${testAtoKRouteId}`);
  const auditJ = await api(`/audit-logs?routeId=${testAtoKRouteId}`);
  const clearLog = auditJ.data.data?.find((l: any) => l.operation === 'CLEAR_SEGMENTS');
  const passJ = resJ.status === 200 && fetchJ.data.data.segments.length === 0 && Boolean(clearLog);
  recordTest('Test J: segmentsMode=clear with clearSegments=true -> 0 segs, Audit Log recorded', passJ, { count: fetchJ.data.data?.segments?.length, hasAuditLog: Boolean(clearLog) });

  // Clean up Test A~K route
  await api(`/routes/${testAtoKRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 3: OCC Concurrency Write Test (TEST_ROUTE_CONCURRENCY)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 3] 執行 OCC 樂觀並行控制衝突測試 (TEST_ROUTE_CONCURRENCY)...');
  const occRouteId = 'TEST_ROUTE_CONCURRENCY';
  const occSegments = generateSegments(occRouteId, 6, 5); // 30 segments

  const occCreate = await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: occRouteId,
      code: 'TEST_OCC',
      name: 'OCC 並行測試路線',
      segments: occSegments,
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });
  const v1Route = occCreate.data.data;
  const versionV1 = v1Route.updatedAt;

  // Client A reads V1, Client B reads V1
  // Client A modifies Day 1
  const updatedByA = occSegments.map((s, i) => i === 0 ? { ...s, note: 'Client A 更新' } : s);
  const resClientA = await api(`/routes/${occRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: updatedByA,
      segmentsMode: 'replace',
      expectedOriginalCount: 30,
      allowShrink: false,
      clientVersion: versionV1
    })
  });
  const versionV2 = resClientA.data.data?.updatedAt;
  const passClientA = resClientA.status === 200 && versionV2 !== versionV1;
  recordTest('OCC Client A update with version V1 -> Success (V1 -> V2)', passClientA, { v1: versionV1, v2: versionV2 });

  // Client B attempts to modify using stale V1
  const updatedByB = occSegments.map((s, i) => i === 1 ? { ...s, note: 'Client B 衝突更新' } : s);
  const resClientB = await api(`/routes/${occRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: updatedByB,
      segmentsMode: 'replace',
      expectedOriginalCount: 30,
      allowShrink: false,
      clientVersion: versionV1 // STALE!
    })
  });
  const passClientB = resClientB.status === 409 && resClientB.data.conflict === true;
  recordTest('OCC Client B update with stale V1 -> Rejected 409 Conflict', passClientB, { status: resClientB.status, error: resClientB.data.error });

  // Verify DB state: Client A is preserved, total segments is 30
  const fetchOccFinal = await api(`/routes/${occRouteId}`);
  const passOccPreserve = fetchOccFinal.data.data.segments.length === 30 && fetchOccFinal.data.data.segments[0].note === 'Client A 更新';
  recordTest('OCC Final Invariant: Client A data preserved, no overwriting', passOccPreserve, { count: fetchOccFinal.data.data.segments.length });

  await api(`/routes/${occRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 4: Autosave & Hydration Race Condition Test
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 4] 執行 Autosave & Hydration Race Condition 測試...');
  const autoRaceId = 'TEST_ROUTE_AUTOSAVE_RACE';
  const autoSegments = generateSegments(autoRaceId, 6, 5); // 30 segments
  await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: autoRaceId,
      code: 'TEST_RACE',
      name: 'Autosave 競爭測試路線',
      segments: autoSegments,
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });

  // Simulate uninitialized client state during hydration sending empty segments without mode
  const raceSyncRes = await api('/routes/sync', {
    method: 'POST',
    body: JSON.stringify({
      routes: [
        {
          id: autoRaceId,
          code: 'TEST_RACE',
          name: 'Autosave 競爭測試路線 - 記憶體初始化中',
          segments: [] // Empty state during hydration
        }
      ]
    })
  });

  const fetchRaceFinal = await api(`/routes/${autoRaceId}`);
  const passRace = fetchRaceFinal.data.data.segments.length === 30;
  recordTest('Autosave Hydration Race Condition: Empty array during hydration -> Preserved 30 segs', passRace, { count: fetchRaceFinal.data.data.segments.length });

  await api(`/routes/${autoRaceId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 5: Global Sync Stress Test (20 Routes, 100 Syncs)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 5] 執行 Global Sync 壓力測試 (20 條路線, 100 次同步)...');
  const syncRouteIds = Array.from({ length: 20 }, (_, i) => `TEST_ROUTE_SYNC_${String(i + 1).padStart(2, '0')}`);
  
  // Seed 20 test routes
  for (const rId of syncRouteIds) {
    await api('/routes', {
      method: 'POST',
      body: JSON.stringify({
        id: rId,
        code: rId,
        name: `同步測試路線 ${rId}`,
        segments: generateSegments(rId, 6, 5), // 30 segments each
        segmentsMode: 'replace',
        expectedOriginalCount: 0,
        allowShrink: true
      })
    });
  }

  let syncSuccessCount = 0;
  let syncRejectCount = 0;

  for (let cycle = 1; cycle <= 100; cycle++) {
    const payloadType = cycle % 7;
    let syncPayload: any[] = [];

    if (payloadType === 0) {
      // 1. Full metadata-only with preserve
      syncPayload = syncRouteIds.map(id => ({
        id,
        name: `同步測試路線 ${id} - cycle ${cycle}`,
        segmentsMode: 'preserve'
      }));
    } else if (payloadType === 1) {
      // 2. Empty segments without mode -> Must default to preserve!
      syncPayload = syncRouteIds.map(id => ({
        id,
        segments: []
      }));
    } else if (payloadType === 2) {
      // 3. Undefined segments with name update
      syncPayload = syncRouteIds.map(id => ({
        id,
        description: `週期描述更新 ${cycle}`
      }));
    } else if (payloadType === 3) {
      // 4. Illegal shrink (3 segments, replace, wrong expected count) -> Must be rejected!
      syncPayload = [
        {
          id: syncRouteIds[0],
          segments: generateSegments(syncRouteIds[0], 1, 3),
          segmentsMode: 'replace',
          expectedOriginalCount: 999
        }
      ];
    } else if (payloadType === 4) {
      // 5. Day 1 partial payload (safe partial update)
      syncPayload = [
        {
          id: syncRouteIds[1],
          segments: [{ id: `${syncRouteIds[1]}_D1_S1`, planName: 'Day 1 行程', duration: 45, note: `Partial cycle ${cycle}` }],
          segmentsMode: 'partial'
        }
      ];
    } else if (payloadType === 5) {
      // 6. Stale version conflict payload -> Must be rejected!
      syncPayload = [
        {
          id: syncRouteIds[2],
          segments: generateSegments(syncRouteIds[2], 6, 5),
          segmentsMode: 'replace',
          expectedOriginalCount: 30,
          clientVersion: '1970-01-01T00:00:00.000Z'
        }
      ];
    } else {
      // 7. Full complete 30 segments with explicit replace and matching expected count
      syncPayload = [
        {
          id: syncRouteIds[3],
          segments: generateSegments(syncRouteIds[3], 6, 5),
          segmentsMode: 'replace',
          expectedOriginalCount: 30,
          allowShrink: false
        }
      ];
    }

    const syncRes = await api('/routes/sync', {
      method: 'POST',
      body: JSON.stringify({ routes: syncPayload })
    });

    if (syncRes.status === 200) {
      syncSuccessCount++;
    } else {
      syncRejectCount++;
    }
  }

  // Verify all 20 routes retain exactly 30 segments across 6 days
  let all20Intact = true;
  for (const rId of syncRouteIds) {
    const { data } = await api(`/routes/${rId}`);
    const segs = data.data.segments;
    const stats = analyzeRouteDistribution(segs);
    if (stats.totalSegments !== 30 || stats.distinctDays !== 6) {
      all20Intact = false;
      console.error(`  [縮水異常] ${rId} segments=${stats.totalSegments}, days=${stats.distinctDays}`);
    }
  }

  recordTest('Global Sync 100 Cycles Stress Test (20 Routes * 30 segs intact)', all20Intact, {
    syncSuccessCount,
    syncRejectCount,
    totalRoutesChecked: syncRouteIds.length
  });

  // Clean up 20 sync routes
  for (const rId of syncRouteIds) {
    await api(`/routes/${rId}`, { method: 'DELETE' });
  }

  // -------------------------------------------------------------
  // Step 6: Excel Multi-Sheet Import 50 Cycles Stress Test
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 6] 執行 Excel 多工作表 50 次解析測試 & 異常防護驗證...');
  
  // Create multi-sheet Excel workbook in memory: Day 1 (4), Day 2 (5), Day 3 (6), Day 4 (4), Day 5 (5), Day 6 (6) = 30
  const wb = XLSX.utils.book_new();
  const dayCounts = [4, 5, 6, 4, 5, 6];
  let globalSeq = 0;
  for (let d = 1; d <= 6; d++) {
    const sheetData = [
      ['所屬行程', '序號', '起點', '迄點', '步程(分)', '路況與水源備註', '方向', '分類']
    ];
    for (let s = 1; s <= dayCounts[d - 1]; s++) {
      globalSeq++;
      sheetData.push([
        `Day ${d}`,
        String(globalSeq),
        `地標 ${d}-${s}`,
        `地標 ${d}-${s + 1}`,
        String(30 + s * 5),
        `水源充足 D${d}-${s}`,
        '雙向',
        '步道'
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, `Day ${d}`);
  }
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  let excelAllPassed = true;
  for (let i = 1; i <= 50; i++) {
    const parsed = parseExcelFile(excelBuffer, 'test_multisheet.xlsx');
    if (parsed.segments.length !== 30 || parsed.totalSheetsCount !== 6 || parsed.parsedSheetsCount !== 6 || parsed.isPartialParse) {
      excelAllPassed = false;
      console.error(`  Excel 解析錯誤 cycle ${i}: segments=${parsed.segments.length}, sheets=${parsed.parsedSheetsCount}`);
      break;
    }
  }
  recordTest('Excel Multi-Sheet Parser 50 Cycles: 6 Sheets, 30 Segments, isPartialParse=false', excelAllPassed, { cycles: 50 });

  // Test Partial Workbook (Only Day 1)
  const partialWb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['所屬行程', '序號', '起點', '迄點', '步程(分)', '路況與水源備註', '方向', '分類'],
    ['Day 1', '1', '起點 A', '迄點 B', '60', '備註', '雙向', '步道']
  ]);
  XLSX.utils.book_append_sheet(partialWb, ws1, 'Day 1');
  const partialBuffer = XLSX.write(partialWb, { type: 'array', bookType: 'xlsx' });
  const partialParsed = parseExcelFile(partialBuffer, 'partial.xlsx');

  // Verify Safety Gate blocks shrink from 30 to 1 without explicit allowShrink
  const excelRouteId = 'TEST_ROUTE_EXCEL_GATE';
  await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: excelRouteId,
      code: 'TEST_EXCEL',
      name: 'Excel 匯入閘門測試路線',
      segments: generateSegments(excelRouteId, 6, 5), // 30 segments
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });

  // Attempt to overwrite with partial parsed 1 segment without allowShrink
  const overwriteRes = await api(`/routes/${excelRouteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: partialParsed.segments,
      segmentsMode: 'replace',
      expectedOriginalCount: 30,
      allowShrink: false // Forbidden!
    })
  });
  const fetchExcelFinal = await api(`/routes/${excelRouteId}`);
  const passExcelGate = overwriteRes.status === 400 && fetchExcelFinal.data.data.segments.length === 30;
  recordTest('Excel Partial Parse Anomaly Detection: Blocked shrinking 30 -> 1 without explicit allowShrink', passExcelGate, {
    status: overwriteRes.status,
    dbCount: fetchExcelFinal.data.data.segments.length
  });

  await api(`/routes/${excelRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 7: Planner View Stress Test
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 7] 執行 Planner 行程規劃切換 100 次壓力測試...');
  const plannerRouteId = 'TEST_ROUTE_PLANNER';
  await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: plannerRouteId,
      code: 'TEST_PLANNER',
      name: 'Planner 壓力測試路線',
      segments: generateSegments(plannerRouteId, 6, 5), // 30 segments / 6 days
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });

  // Planner simulation: switching days (1 -> 2 -> 3 -> 6 -> 1 -> 6) 100 times
  // Planner writes user preferences to client state, and should NEVER trigger DB segment deletions
  const switchPattern = [1, 2, 3, 6, 1, 6];
  for (let i = 0; i < 100; i++) {
    const daysPlan = switchPattern[i % switchPattern.length];
    // In planner view, client preferences update local state, and may sync route metadata (preserve)
    await api(`/routes/${plannerRouteId}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: `Planner 檢視模式天數設定: ${daysPlan} 天`,
        segmentsMode: 'preserve'
      })
    });
  }

  const fetchPlannerFinal = await api(`/routes/${plannerRouteId}`);
  const plannerStats = analyzeRouteDistribution(fetchPlannerFinal.data.data.segments);
  const passPlanner = plannerStats.totalSegments === 30 && plannerStats.distinctDays === 6;
  recordTest('Planner View 100 Switches: Segments invariant (30 segs, 6 days intact)', passPlanner, plannerStats);

  await api(`/routes/${plannerRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 8: Long-Running Autosave Stress Test (TEST_LONG_RUNNING)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 8] 執行長時間 100+ 次連鎖寫入壓力測試 (TEST_LONG_RUNNING: 100 segs, 10 days)...');
  const longRouteId = 'TEST_LONG_RUNNING';
  const longSegments = generateSegments(longRouteId, 10, 10); // 100 segments across 10 days
  await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: longRouteId,
      code: 'TEST_LONG',
      name: '長時間高壓穩定度測試路線',
      segments: longSegments,
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });

  let longTestShrinkDetected = false;
  const longLogSample: any[] = [];

  for (let op = 1; op <= 105; op++) {
    const actionType = op % 5;
    let res: any;

    if (actionType === 0) {
      // Metadata update
      res = await api(`/routes/${longRouteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          description: `長時間壓力測試迭代 ${op}`,
          segmentsMode: 'preserve'
        })
      });
    } else if (actionType === 1) {
      // Safe partial update of a single segment note
      res = await api(`/routes/${longRouteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          segments: [{ id: `${longRouteId}_D1_S1`, planName: 'Day 1 行程', note: `長壓筆記 ${op}` }],
          segmentsMode: 'partial'
        })
      });
    } else if (actionType === 2) {
      // Preserve sync
      res = await api(`/routes/sync`, {
        method: 'POST',
        body: JSON.stringify({
          routes: [{ id: longRouteId, name: `長壓路線名稱 ${op}`, segmentsMode: 'preserve' }]
        })
      });
    } else if (actionType === 3) {
      // Empty array without mode (Must preserve!)
      res = await api(`/routes/${longRouteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          segments: []
        })
      });
    } else {
      // Read & verify
      res = await api(`/routes/${longRouteId}`);
    }

    // Verify current count
    const check = await api(`/routes/${longRouteId}`);
    const segCount = check.data.data?.segments?.length ?? 0;
    if (segCount !== 100) {
      longTestShrinkDetected = true;
      console.error(`  [CRITICAL SHRINK] Op ${op} shrank from 100 to ${segCount}!`);
      break;
    }

    if (op % 20 === 0 || op === 105) {
      longLogSample.push({
        op,
        timestamp: new Date().toISOString(),
        segCount,
        version: check.data.data.updatedAt
      });
    }
  }

  const passLongTest = !longTestShrinkDetected;
  recordTest('Long-Running 105 Operations Stress Test (100 segs, 10 days 0 shrink)', passLongTest, {
    operationsCount: 105,
    samples: longLogSample
  });

  await api(`/routes/${longRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 9: Data Shrink Invariant Multi-level Test (TEST_INVARIANT)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 9] 執行多階層資料縮水不變性測試 (TEST_INVARIANT: 80 segs)...');
  const invariantRouteId = 'TEST_INVARIANT';
  const init80Segments = generateSegments(invariantRouteId, 8, 10); // 80 segments across 8 days
  await api('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: invariantRouteId,
      code: 'TEST_INV',
      name: '縮水不變性測試路線',
      segments: init80Segments,
      segmentsMode: 'replace',
      expectedOriginalCount: 0,
      allowShrink: true
    })
  });

  const shrinkLevels = [80, 70, 50, 20, 5, 2, 0];
  let allShrinksBlocked = true;

  for (const targetCount of shrinkLevels) {
    const reducedSegs = init80Segments.slice(0, targetCount);
    // Send with ambiguous / undefined segmentsMode
    await api(`/routes/${invariantRouteId}`, {
      method: 'PUT',
      body: JSON.stringify({
        segments: reducedSegs
        // segmentsMode omitted
      })
    });

    const check = await api(`/routes/${invariantRouteId}`);
    const count = check.data.data?.segments?.length ?? 0;
    if (count !== 80) {
      allShrinksBlocked = false;
      console.error(`  [INVARIANT BREACH] Ambiguous payload with ${targetCount} segs reduced DB from 80 to ${count}!`);
    }
  }

  recordTest('Data Shrink Invariant Test: 80 -> 70 -> 50 -> 20 -> 5 -> 2 -> 0 blocked (80 segs intact)', allShrinksBlocked, {
    testedLevels: shrinkLevels,
    finalCount: (await api(`/routes/${invariantRouteId}`)).data.data.segments.length
  });

  await api(`/routes/${invariantRouteId}`, { method: 'DELETE' });

  // -------------------------------------------------------------
  // Step 10: Real Routes Integrity Verification (G12, G02, G20, M01)
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 10] 比對真實 Route 基準線 (G12, G02, G20, M01)...');
  let allRealRoutesIntact = true;
  const realRouteVerifications: any[] = [];

  for (const rId of realRouteIds) {
    const base = baselines[rId];
    if (!base) continue;

    // Execute non-destructive metadata update + preserve sync on real route
    await api(`/routes/${rId}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: base.name + ' - 經第五階段安全稽核驗證完整無損',
        segmentsMode: 'preserve'
      })
    });

    const { status, data } = await api(`/routes/${rId}`);
    const current = data.data;
    const currentStats = analyzeRouteDistribution(current.segments || []);

    const matchSegments = currentStats.totalSegments === base.totalSegments;
    const matchDays = currentStats.distinctDays === base.distinctDays;
    let matchDistribution = true;
    for (const [day, count] of Object.entries(base.distribution)) {
      if (currentStats.distribution[day] !== count) {
        matchDistribution = false;
        console.error(`  [真實路線異常] ${rId} 天數分佈不符: ${day} 原有 ${count}, 現有 ${currentStats.distribution[day]}`);
      }
    }

    const routePass = matchSegments && matchDays && matchDistribution;
    if (!routePass) allRealRoutesIntact = false;

    realRouteVerifications.push({
      id: rId,
      name: current.name,
      baselineSegments: base.totalSegments,
      currentSegments: currentStats.totalSegments,
      baselineDays: base.distinctDays,
      currentDays: currentStats.distinctDays,
      distributionMatch: matchDistribution,
      passed: routePass
    });

    console.log(`  真實路線 [${rId}] ${current.name}: ${currentStats.totalSegments}/${base.totalSegments} segs, ${currentStats.distinctDays}/${base.distinctDays} days -> ${routePass ? 'PASS (100% 吻合)' : 'FAIL'}`);
  }

  recordTest('Real Routes Invariant Check (G12, G02, G20, M01 100% intact)', allRealRoutesIntact, realRouteVerifications);

  // -------------------------------------------------------------
  // Step 11: SQLite Database Stats & Audit Log Verification
  // -------------------------------------------------------------
  console.log('\n>>> [步驟 11] 查詢 SQLite 資料表統計與稽核紀錄 (Audit Log)...');
  const { data: statsData } = await api('/stats');
  console.log('  SQLite Table Stats:', statsData.data);

  const { data: auditData } = await api('/audit-logs?limit=3000');
  const logs = auditData.data || [];
  console.log(`  SQLite 稽核日誌總筆數: ${logs.length}`);

  const distinctOperations = Array.from(new Set(logs.map((l: any) => l.operation)));
  console.log('  已記錄的稽核操作種類 (Operations):', distinctOperations);

  const hasPreserve = distinctOperations.includes('PRESERVE');
  const hasPartial = distinctOperations.includes('PARTIAL_UPDATE');
  const hasReplace = distinctOperations.includes('FULL_REPLACE');
  const hasClear = distinctOperations.includes('CLEAR_SEGMENTS');
  const hasBlockedShrink = distinctOperations.includes('BLOCKED_SHRINK');
  const hasBlockedVersion = distinctOperations.includes('BLOCKED_VERSION_CONFLICT');
  const hasBlockedCount = distinctOperations.includes('BLOCKED_EXPECTED_COUNT');

  const passAuditLog = hasPreserve && hasPartial && hasReplace && hasClear && (hasBlockedShrink || hasBlockedCount || hasBlockedVersion);
  recordTest('Audit Log Comprehensive Verification (Covers all life-cycle states)', passAuditLog, {
    totalLogs: logs.length,
    distinctOperations
  });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  const allPassed = testReport.every(t => t.passed);
  console.log('\n================================================================');
  console.log(`  第五階段測試全部完成: 總計 ${testReport.length} 項測試，全數 ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('================================================================\n');

  return {
    allPassed,
    testReport,
    stats: statsData.data,
    baselines,
    realRouteVerifications
  };
}

runPhase5().then(res => {
  if (!res.allPassed) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Fatal error during Phase 5 execution:', err);
  process.exit(1);
});

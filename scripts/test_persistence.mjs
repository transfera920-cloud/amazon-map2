// Comprehensive persistence test suite
const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runTests() {
  console.log('=== STARTING ROUTE PERSISTENCE VERIFICATION SUITE ===\n');

  // 1. Initial routes fetch
  const allRoutesInitial = (await request('/routes')).data;
  console.log(`[INFO] Loaded ${allRoutesInitial.length} routes from DB.`);

  // Test A: Existing G-series route (e.g. G02)
  console.log('\n--- Test A: Existing G-series route (G02) ---');
  const g02Before = (await request('/routes/G02')).data;
  console.log(`G02 before: segments=${g02Before.segments.length}, images=${g02Before.images.length}`);
  if (g02Before.segments.length === 0) throw new Error('G02 should have segments initially!');

  // Partial update metadata without segments
  const g02Updated = (await request('/routes/G02', {
    method: 'PUT',
    body: JSON.stringify({ name: 'G02 玉山群峰 (測試更新名稱)' })
  })).data;
  console.log(`G02 after metadata update: name="${g02Updated.name}", segments=${g02Updated.segments.length}`);
  if (g02Updated.segments.length !== g02Before.segments.length) {
    throw new Error(`FAIL: G02 segments count changed from ${g02Before.segments.length} to ${g02Updated.segments.length}`);
  }
  // Revert name back
  await request('/routes/G02', {
    method: 'PUT',
    body: JSON.stringify({ name: g02Before.name })
  });
  console.log('Test A: PASS - Segments retained during partial metadata update.');

  // Test B: G12 (Known problematic case)
  console.log('\n--- Test B: G12 Persistence ---');
  // Add test segments to G12
  const g12TestSegments = [
    {
      id: 'g12_test_seg_1',
      planName: 'G12 能高安東軍六日標準行程',
      seq: 1,
      startNode: '屯原登山口',
      endNode: '雲海保線所',
      duration: 120,
      note: '步道寬敞',
      direction: '上行 ▲',
      category: '林道'
    },
    {
      id: 'g12_test_seg_2',
      planName: 'G12 能高安東軍六日標準行程',
      seq: 2,
      startNode: '雲海保線所',
      endNode: '天池山莊',
      duration: 180,
      note: '宿點',
      direction: '上行 ▲',
      category: '高山步道'
    }
  ];

  await request('/routes/G12', {
    method: 'PUT',
    body: JSON.stringify({
      segments: g12TestSegments
    })
  });
  const g12WithSegs = (await request('/routes/G12')).data;
  console.log(`G12 after inserting test segments: segments=${g12WithSegs.segments.length}`);
  if (g12WithSegs.segments.length !== 2) throw new Error('G12 test segments insertion failed');

  // Trigger sync of all routes with empty segments on other routes or partial payload
  const routesToSync = (await request('/routes')).data.map(r => ({
    ...r,
    // simulate partial or empty payload without clearSegments
    segments: r.id === 'G12' ? [] : r.segments
  }));
  console.log('Simulating full sync where G12 payload mistakenly has segments: [] (without clearSegments flag)');
  await request('/routes/sync', {
    method: 'POST',
    body: JSON.stringify({ routes: routesToSync })
  });

  const g12AfterSync = (await request('/routes/G12')).data;
  console.log(`G12 after sync with segments=[]: segments=${g12AfterSync.segments.length}`);
  if (g12AfterSync.segments.length !== 2) {
    throw new Error(`FAIL: G12 segments were deleted by empty array sync! Expected 2, got ${g12AfterSync.segments.length}`);
  }
  console.log('Test B: PASS - G12 segments preserved when empty array is synced without clearSegments flag.');

  // Test C: M01 Custom Route
  console.log('\n--- Test C: M01 Custom Route ---');
  const m01Route = {
    id: 'M01',
    code: 'M01',
    name: 'M01 自訂測試路線',
    mapUrl: 'https://example.com/map/m01',
    gpxUrl: 'https://example.com/gpx/m01.gpx',
    images: [
      { id: 'm01_img_1', type: '行程示意圖', title: 'M01示意圖', url: 'https://example.com/m01.jpg' }
    ],
    segments: [
      {
        id: 'm01_seg_1',
        planName: 'M01主線',
        seq: 1,
        startNode: '點A',
        endNode: '點B',
        duration: 90,
        note: '登山口',
        direction: '上行 ▲',
        category: '步道'
      }
    ]
  };
  await request('/routes', {
    method: 'POST',
    body: JSON.stringify(m01Route)
  });
  const m01Fetched = (await request('/routes/M01')).data;
  console.log(`M01 fetched: id=${m01Fetched.id}, name="${m01Fetched.name}", segments=${m01Fetched.segments.length}`);
  if (m01Fetched.id !== 'M01' || m01Fetched.segments.length !== 1) {
    throw new Error('FAIL: M01 route could not be saved or retrieved');
  }
  console.log('Test C: PASS - M01 custom route created and verified.');

  // Test D: Newly added custom route with dynamic ID R_xxxxx
  console.log('\n--- Test D: New custom route R_xxxxx ---');
  const rCustomId = `R_${Date.now()}`;
  const rCustomRoute = {
    id: rCustomId,
    code: 'R99',
    name: 'R99 動態新增自訂路線',
    segments: [
      {
        id: `${rCustomId}_seg_1`,
        planName: 'R99方案',
        seq: 1,
        startNode: '入口',
        endNode: '營地',
        duration: 150,
        note: '',
        direction: '',
        category: ''
      }
    ]
  };
  await request('/routes', {
    method: 'POST',
    body: JSON.stringify(rCustomRoute)
  });
  const rFetched = (await request(`/routes/${rCustomId}`)).data;
  if (!rFetched || rFetched.segments.length !== 1) {
    throw new Error('FAIL: R_xxxxx route could not be saved or retrieved');
  }
  console.log(`Test D: PASS - ${rCustomId} created and verified.`);

  // Test E: Route with segments=[] does not clear other routes
  console.log('\n--- Test E: Route with segments=[] does not impact other routes ---');
  const blankRouteId = `R_blank_${Date.now()}`;
  await request('/routes', {
    method: 'POST',
    body: JSON.stringify({
      id: blankRouteId,
      code: 'RBLANK',
      name: '無路段測試路線',
      segments: []
    })
  });
  const g02AfterBlank = (await request('/routes/G02')).data;
  const g12AfterBlank = (await request('/routes/G12')).data;
  if (g02AfterBlank.segments.length !== g02Before.segments.length || g12AfterBlank.segments.length !== 2) {
    throw new Error('FAIL: Creating a blank route corrupted other routes!');
  }
  console.log('Test E: PASS - Blank route does not impact other routes.');

  // Test F: Explicit Clear (clearSegments: true)
  console.log('\n--- Test F: Explicit Clear with clearSegments: true ---');
  await request(`/routes/${rCustomId}`, {
    method: 'PUT',
    body: JSON.stringify({
      segments: [],
      clearSegments: true
    })
  });
  const rCleared = (await request(`/routes/${rCustomId}`)).data;
  console.log(`R route after explicit clear: segments=${rCleared.segments.length}, name="${rCleared.name}"`);
  if (rCleared.segments.length !== 0) {
    throw new Error('FAIL: Explicit clear did not clear segments');
  }
  if (!rCleared.name) {
    throw new Error('FAIL: Explicit clear corrupted route metadata');
  }
  console.log('Test F: PASS - Explicit clear safely cleared segments while retaining route metadata.');

  // Test G: Multi-Route Coexistence & Sync
  console.log('\n--- Test G: Multi-Route Coexistence & Full Sync ---');
  const allRoutesBeforeSync = (await request('/routes')).data;
  console.log(`Total routes before sync: ${allRoutesBeforeSync.length}`);
  const syncedAll = (await request('/routes/sync', {
    method: 'POST',
    body: JSON.stringify({ routes: allRoutesBeforeSync })
  })).data;
  console.log(`Total routes after sync: ${syncedAll.length}`);

  const hasG02 = syncedAll.find(r => r.id === 'G02')?.segments.length > 0;
  const hasG12 = syncedAll.find(r => r.id === 'G12')?.segments.length === 2;
  const hasM01 = syncedAll.find(r => r.id === 'M01')?.segments.length === 1;
  const hasRCustom = syncedAll.some(r => r.id === rCustomId);

  if (!hasG02 || !hasG12 || !hasM01 || !hasRCustom) {
    throw new Error(`FAIL: Coexistence check failed! hasG02=${hasG02}, hasG12=${hasG12}, hasM01=${hasM01}, hasRCustom=${hasRCustom}`);
  }
  console.log('Test G: PASS - All routes coexisted and preserved across full batch sync.');

  // Cleanup test routes
  await request(`/routes/${rCustomId}`, { method: 'DELETE' });
  await request(`/routes/${blankRouteId}`, { method: 'DELETE' });
  console.log('Cleaned up ephemeral test routes.');

  console.log('\n=== ALL PERSISTENCE TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

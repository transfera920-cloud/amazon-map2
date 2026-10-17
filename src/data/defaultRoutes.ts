import { MainRoute, Segment } from '../types';

export const G02_CSV_DATA = `所屬行程,序號,起點,迄點,所需時間,備註,行進方向,資料分類
行程 1：塔塔加 → 玉山主峰 → 塔塔加,1,塔塔加鞍部,孟祿亭,40,,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,2,孟祿亭,前峰登山口,35,登山口,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,3,前峰登山口,西峰下觀景台,40,山峰,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,4,西峰下觀景台,大峭壁,40,,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,5,大峭壁,排雲山莊,50,宿點,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,6,排雲山莊,主南岔路,30,,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,7,主南岔路,主北岔路,90,,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,8,主北岔路,玉山主峰,25,山峰,上行 ▲,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,9,玉山主峰,主北岔路,15,,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,10,主北岔路,主南岔路,50,,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,11,主南岔路,排雲山莊,45,宿點,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,12,排雲山莊,大峭壁,70,,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,13,大峭壁,西峰下觀景台,50,山峰,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,14,西峰下觀景台,前峰登山口,50,登山口,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,15,前峰登山口,孟祿亭,40,,下行 ▼,行程規劃節點
行程 1：塔塔加 → 玉山主峰 → 塔塔加,16,孟祿亭,塔塔加鞍部,50,登山口,下行 ▼,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,1,塔塔加鞍部,孟祿亭,40,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,2,孟祿亭,前峰登山口,35,登山口,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,3,前峰登山口,西峰下觀景台,40,山峰,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,4,西峰下觀景台,大峭壁,40,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,5,大峭壁,排雲山莊,50,宿點,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,6,排雲山莊,主南岔路,30,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,7,主南岔路,主北岔路,90,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,8,主北岔路,玉山主峰,25,山峰,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,9,玉山主峰,主北岔路,15,,下行 ▼,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,10,主北岔路,風口,10,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,11,風口,荖濃溪營地,80,宿點,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,12,荖濃溪營地,八通關草原,130,,上行 ▲,行程規劃節點
行程 2：塔塔加 → 玉山主峰 → 八通關登山口,13,八通關草原,八通關登山口,80,登山口,上行 ▲,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,1,八通關登山口,八通關草原,80,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,2,八通關草原,荖濃溪營地,200,宿點,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,3,荖濃溪營地,風口,120,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,4,風口,主北岔路,20,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,5,主北岔路,玉山主峰,25,山峰,上行 ▲,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,6,玉山主峰,主北岔路,15,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,7,主北岔路,主南岔路,50,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,8,主南岔路,排雲山莊,45,宿點,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,9,排雲山莊,大峭壁,70,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,10,大峭壁,西峰下觀景台,50,山峰,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,11,西峰下觀景台,前峰登山口,50,登山口,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,12,前峰登山口,孟祿亭,40,,下行 ▼,行程規劃節點
行程 3：八通關登山口 → 玉山主峰 → 塔塔加,13,孟祿亭,塔塔加鞍部,50,登山口,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,1,塔塔加鞍部,孟祿亭,40,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,2,孟祿亭,前峰登山口,35,登山口,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,3,前峰登山口,西峰下觀景台,40,山峰,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,4,西峰下觀景台,大峭壁,40,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,5,大峭壁,排雲山莊,50,宿點,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,6,排雲山莊,主南岔路,30,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,7,主南岔路,圓峰山屋,70,宿點,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,8,圓峰山屋,三叉路口,25,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,9,三叉路口,四岔路口,30,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,10,四岔路口,鹿山,180,山峰,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,11,鹿山,四岔路口,280,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,12,四岔路口,三叉路口,20,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,13,三叉路口,2K三岔路口,180,,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,14,2K三岔路口,南玉山,80,山峰,上行 ▲,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,15,南玉山,2K三岔路口,70,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,16,2K三岔路口,三叉路口,155,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,17,三叉路口,圓峰山屋,30,宿點,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,18,圓峰山屋,主南岔路,90,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,19,主南岔路,排雲山莊,45,宿點,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,20,排雲山莊,大峭壁,70,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,21,大峭壁,西峰下觀景台,50,山峰,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,22,西峰下觀景台,前峰登山口,50,登山口,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,23,前峰登山口,孟祿亭,40,,下行 ▼,行程規劃節點
行程 4：塔塔加 → 圓峰 → 鹿山 → 南玉山 → 塔塔加,24,孟祿亭,塔塔加鞍部,50,登山口,下行 ▼,行程規劃節點
【圖資未走訪路段】,1,前峰登山口,玉山前峰,75,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,2,玉山前峰,前峰登山口,45,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,3,排雲山莊,玉山西峰,90,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,4,玉山西峰,排雲山莊,70,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,5,玉山主峰,玉山東峰,80,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,6,玉山東峰,玉山主峰,90,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,7,主北岔路,玉山北峰,25,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,8,玉山北峰,主北岔路,25,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,9,四岔路口,玉山南峰,5,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,10,玉山南峰,四岔路口,5,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,11,四岔路口,東小南山,60,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,12,東小南山,四岔路口,40,,下行 ▼,圖資未走訪路段
【圖資未走訪路段】,13,2K三岔路口,玉山小南山,10,,上行 ▲,圖資未走訪路段
【圖資未走訪路段】,14,玉山小南山,2K三岔路口,5,,下行 ▼,圖資未走訪路段`;

export function parseCSVToSegments(csv: string): Segment[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const segments: Segment[] = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling potential quotes
    const cols = line.split(',').map(s => s.trim());
    if (cols.length < 5) continue;

    const planName = cols[0] || '';
    const seq = parseInt(cols[1], 10) || i;
    const startNode = cols[2] || '';
    const endNode = cols[3] || '';
    const duration = parseInt(cols[4], 10) || 0;
    const note = cols[5] || '';
    const direction = cols[6] || '';
    const category = cols[7] || '';

    segments.push({
      id: `seg_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      planName,
      seq,
      startNode,
      endNode,
      duration,
      note,
      direction,
      category
    });
  }

  return segments;
}

export const G19_SOUTH_SECTION_ONE_CSV = `所屬行程,序號,起點,迄點,所需時間,備註,行進方向,資料分類
南一段全線縱走,1,進涇橋登山口,庫哈諾辛山屋,150,登山口,上行 ▲,行程規劃節點
南一段全線縱走,2,庫哈諾辛山屋,庫哈諾辛山,80,山峰,上行 ▲,行程規劃節點
南一段全線縱走,3,庫哈諾辛山,庫哈諾辛山屋,50,宿點,下行 ▼,行程規劃節點
南一段全線縱走,4,庫哈諾辛山屋,關山,210,山峰,上行 ▲,行程規劃節點
南一段全線縱走,5,關山,2920鞍部營地,90,宿點,下行 ▼,行程規劃節點
南一段全線縱走,6,2920鞍部營地,海諾南山,120,山峰,上行 ▲,行程規劃節點
南一段全線縱走,7,海諾南山,小關山北峰,160,,上行 ▲,行程規劃節點
南一段全線縱走,8,小關山北峰,小關山,90,山峰,上行 ▲,行程規劃節點
南一段全線縱走,9,小關山,雲水池營地,110,宿點,下行 ▼,行程規劃節點
南一段全線縱走,10,雲水池營地,馬西巴秀山,70,山峰,上行 ▲,行程規劃節點
南一段全線縱走,11,馬西巴秀山,三叉峰營地,180,宿點,上行 ▲,行程規劃節點
南一段全線縱走,12,三叉峰營地,卑南主山,40,山峰,上行 ▲,行程規劃節點
南一段全線縱走,13,卑南主山,三叉峰營地,35,宿點,下行 ▼,行程規劃節點
南一段全線縱走,14,三叉峰營地,石山工作站,240,宿點,下行 ▼,行程規劃節點
南一段全線縱走,15,石山工作站,藤枝林道登山口,180,登山口,下行 ▼,行程規劃節點`;

export const G03_SAMPLE_CSV = `所屬行程,序號,起點,迄點,所需時間,備註,行進方向,資料分類
行程 1：郡大山單攻,1,郡大林道32K登山口,望鄉山,35,登山口,上行 ▲,行程規劃節點
行程 1：郡大山單攻,2,望鄉山,郡大山北峰,80,山峰,上行 ▲,行程規劃節點
行程 1：郡大山單攻,3,郡大山北峰,郡大山,40,山峰,上行 ▲,行程規劃節點
行程 1：郡大山單攻,4,郡大山,郡大山北峰,30,,下行 ▼,行程規劃節點
行程 1：郡大山單攻,5,郡大山北峰,望鄉山,60,山峰,下行 ▼,行程規劃節點
行程 1：郡大山單攻,6,望鄉山,郡大林道32K登山口,25,登山口,下行 ▼,行程規劃節點
行程 2：西巒大山單攻,1,人倫林道登山口,第一獵寮,150,登山口,上行 ▲,行程規劃節點
行程 2：西巒大山單攻,2,第一獵寮,第二瞭望台,130,宿點,上行 ▲,行程規劃節點
行程 2：西巒大山單攻,3,第二瞭望台,西巒大山,100,山峰,上行 ▲,行程規劃節點
行程 2：西巒大山單攻,4,西巒大山,第二瞭望台,70,,下行 ▼,行程規劃節點
行程 2：西巒大山單攻,5,第二瞭望台,第一獵寮,100,宿點,下行 ▼,行程規劃節點
行程 2：西巒大山單攻,6,第一獵寮,人倫林道登山口,120,登山口,下行 ▼,行程規劃節點`;

export const G20_SAMPLE_CSV = `所屬行程,序號,起點,迄點,所需時間,備註,行進方向,資料分類
北大武山,1,新登山口,舊登山口,70,登山口,上行 ▲,行程規劃節點
北大武山,2,舊登山口,喜多麗斷崖,160,山峰,上行 ▲,行程規劃節點
北大武山,3,喜多麗斷崖,檜谷山莊,15,宿點,下行 ▼,行程規劃節點
北大武山,4,檜谷山莊,大武祠,180,宿點,上行 ▲,行程規劃節點
北大武山,5,大武祠,北大武山,60,山峰,上行 ▲,行程規劃節點
北大武山,6,北大武山,大武祠,45,,下行 ▼,行程規劃節點
北大武山,7,大武祠,檜谷山莊,120,宿點,下行 ▼,行程規劃節點
北大武山,8,檜谷山莊,喜多麗斷崖,20,,上行 ▲,行程規劃節點
北大武山,9,喜多麗斷崖,舊登山口,120,,下行 ▼,行程規劃節點
北大武山,10,舊登山口,新登山口,50,登山口,下行 ▼,行程規劃節點
檜谷山莊,1,新登山口,舊登山口,70,登山口,上行 ▲,行程規劃節點
檜谷山莊,2,舊登山口,喜多麗斷崖,160,山峰,上行 ▲,行程規劃節點
檜谷山莊,3,喜多麗斷崖,檜谷山莊,15,宿點,下行 ▼,行程規劃節點
檜谷山莊,4,檜谷山莊,喜多麗斷崖,20,,上行 ▲,行程規劃節點
檜谷山莊,5,喜多麗斷崖,舊登山口,120,,下行 ▼,行程規劃節點
檜谷山莊,6,舊登山口,新登山口,50,登山口,下行 ▼,行程規劃節點`;

export const DEFAULT_MAIN_ROUTES: MainRoute[] = [
  {
    id: "G02",
    code: "G02",
    name: "G02 玉山群峰",
    images: [
      { id: "g02_img_1", url: "https://www.sunriver.com.tw/images/hiking/G02_hiking.jpg", type: "行程示意圖", title: "G02 玉山群峰 行程示意圖" },
      { id: "g02_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG02-2.jpg", type: "高差示意圖", title: "G02 玉山群峰 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "https://hiking.biji.co/index.php?q=trail&act=gpx_detail&id=22731",
    segments: parseCSVToSegments(G02_CSV_DATA),
    updatedAt: new Date().toISOString()
  },
  {
    id: "G03",
    code: "G03",
    name: "G03 郡大山 西巒大山",
    images: [
      { id: "g03_img_1", url: "https://www.sunriver.com.tw/images/hiking/G03_hiking.jpg", type: "行程示意圖", title: "G03 郡大山 西巒大山 行程示意圖" },
      { id: "g03_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG03-1.jpg", type: "高差示意圖", title: "G03 郡大山 西巒大山 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "https://hiking.biji.co/index.php?q=trail&act=gpx_detail&id=22732",
    segments: parseCSVToSegments(G03_SAMPLE_CSV),
    updatedAt: new Date().toISOString()
  },
  {
    id: "G04",
    code: "G04",
    name: "G04 大霸.聖稜.四秀",
    images: [
      { id: "g04_img_1", url: "https://www.sunriver.com.tw/images/hiking/G04_hiking.jpg", type: "行程示意圖", title: "G04 大霸.聖稜.四秀 行程示意圖" },
      { id: "g04_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG04.jpg", type: "高差示意圖", title: "G04 大霸.聖稜.四秀 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G05",
    code: "G05",
    name: "G05 雪山西.南稜",
    images: [
      { id: "g05_img_1", url: "https://www.sunriver.com.tw/images/hiking/G05_hiking.jpg", type: "行程示意圖", title: "G05 雪山西.南稜 行程示意圖" },
      { id: "g05_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG05-3.jpg", type: "高差示意圖", title: "G05 雪山西.南稜 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G06",
    code: "G06",
    name: "G06 白姑大山",
    images: [
      { id: "g06_img_1", url: "https://www.sunriver.com.tw/images/hiking/G06_hiking.jpg", type: "行程示意圖", title: "G06 白姑大山 行程示意圖" },
      { id: "g06_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG06.jpg", type: "高差示意圖", title: "G06 白姑大山 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G07",
    code: "G07",
    name: "G07 北一段",
    images: [
      { id: "g07_img_1", url: "https://www.sunriver.com.tw/images/hiking/G07_hiking_new.jpg", type: "行程示意圖", title: "G07 北一段 行程示意圖" },
      { id: "g07_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG07.jpg", type: "高差示意圖", title: "G07 北一段 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G08",
    code: "G08",
    name: "G08 畢祿羊頭.北二段",
    images: [
      { id: "g08_img_1", url: "https://www.sunriver.com.tw/images/hiking/G08_hiking.jpg", type: "行程示意圖", title: "G08 畢祿羊頭.北二段 行程示意圖" },
      { id: "g08_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG08-1.jpg", type: "高差示意圖", title: "G08 畢祿羊頭.北二段 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [
  {
    "id": "seg_1788666899299_0_1_4n7lc",
    "seq": 1,
    "planName": "畢祿山",
    "startNode": "820林道0K",
    "endNode": "8.4K登山口營地",
    "duration": 200,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_2_esd7x",
    "seq": 2,
    "planName": "畢祿山",
    "startNode": "8.4K登山口營地",
    "endNode": "拉繩垂直岩壁",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_3_u8kno",
    "seq": 3,
    "planName": "畢祿山",
    "startNode": "拉繩垂直岩壁",
    "endNode": "主稜三岔路口",
    "duration": 90,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_4_a1324",
    "seq": 4,
    "planName": "畢祿山",
    "startNode": "主稜三岔路口",
    "endNode": "畢祿山",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_5_378zl",
    "seq": 5,
    "planName": "畢祿山",
    "startNode": "畢祿山",
    "endNode": "主稜三岔路口",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_6_btwqv",
    "seq": 6,
    "planName": "畢祿山",
    "startNode": "主稜三岔路口",
    "endNode": "拉繩垂直岩壁",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_7_tqjsb",
    "seq": 7,
    "planName": "畢祿山",
    "startNode": "拉繩垂直岩壁",
    "endNode": "8.4K登山口營地",
    "duration": 80,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_8_d8qaz",
    "seq": 8,
    "planName": "畢祿山",
    "startNode": "8.4K登山口營地",
    "endNode": "820林道0K",
    "duration": 230,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_9_zhima",
    "seq": 9,
    "planName": "羊頭山",
    "startNode": "羊頭山登山口",
    "endNode": "三岔路口",
    "duration": 350,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_10_y0fa2",
    "seq": 10,
    "planName": "羊頭山",
    "startNode": "三岔路口",
    "endNode": "羊頭山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_11_ez0ly",
    "seq": 11,
    "planName": "羊頭山",
    "startNode": "羊頭山",
    "endNode": "三岔路口",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_12_teq3c",
    "seq": 12,
    "planName": "羊頭山",
    "startNode": "三岔路口",
    "endNode": "羊頭山登山口",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_13_6ia2l",
    "seq": 13,
    "planName": "畢羊縱走",
    "startNode": "820林道0K",
    "endNode": "8.4K登山口營地",
    "duration": 200,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_14_xpbn6",
    "seq": 14,
    "planName": "畢羊縱走",
    "startNode": "8.4K登山口營地",
    "endNode": "拉繩垂直岩壁",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_15_33puu",
    "seq": 15,
    "planName": "畢羊縱走",
    "startNode": "拉繩垂直岩壁",
    "endNode": "主稜三岔路口",
    "duration": 90,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_16_8a23p",
    "seq": 16,
    "planName": "畢羊縱走",
    "startNode": "主稜三岔路口",
    "endNode": "畢祿山",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_17_wbd2h",
    "seq": 17,
    "planName": "畢羊縱走",
    "startNode": "畢祿山",
    "endNode": "主稜三岔路口",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_18_qvvdo",
    "seq": 18,
    "planName": "畢羊縱走",
    "startNode": "主稜三岔路口",
    "endNode": "第一峰",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_19_yez4u",
    "seq": 19,
    "planName": "畢羊縱走",
    "startNode": "第一峰",
    "endNode": "鋸山",
    "duration": 105,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_20_p11tk",
    "seq": 20,
    "planName": "畢羊縱走",
    "startNode": "鋸山",
    "endNode": "鋸東山屋",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_21_p6dku",
    "seq": 21,
    "planName": "畢羊縱走",
    "startNode": "鋸東山屋",
    "endNode": "鋸山東峰",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_22_vql13",
    "seq": 22,
    "planName": "畢羊縱走",
    "startNode": "鋸山東峰",
    "endNode": "三岔路口",
    "duration": 25,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_23_a9wwu",
    "seq": 23,
    "planName": "畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_24_547hb",
    "seq": 24,
    "planName": "畢羊縱走",
    "startNode": "羊頭山",
    "endNode": "三岔路口",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_25_i2v2h",
    "seq": 25,
    "planName": "畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山登山口",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_26_3f86x",
    "seq": 26,
    "planName": "羊畢縱走",
    "startNode": "羊頭山登山口",
    "endNode": "三岔路口",
    "duration": 350,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_27_vxklw",
    "seq": 27,
    "planName": "羊畢縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_28_s2jdt",
    "seq": 28,
    "planName": "羊畢縱走",
    "startNode": "羊頭山",
    "endNode": "三岔路口",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_29_39sym",
    "seq": 29,
    "planName": "羊畢縱走",
    "startNode": "三岔路口",
    "endNode": "鋸山東峰",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_30_lfle7",
    "seq": 30,
    "planName": "羊畢縱走",
    "startNode": "鋸山東峰",
    "endNode": "鋸東山屋",
    "duration": 40,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_31_mgi6i",
    "seq": 31,
    "planName": "羊畢縱走",
    "startNode": "鋸東山屋",
    "endNode": "鋸山",
    "duration": 180,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_32_rbvq8",
    "seq": 32,
    "planName": "羊畢縱走",
    "startNode": "鋸山",
    "endNode": "第一峰",
    "duration": 120,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_33_kubab",
    "seq": 33,
    "planName": "羊畢縱走",
    "startNode": "第一峰",
    "endNode": "主稜三岔路口",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_34_7abyf",
    "seq": 34,
    "planName": "羊畢縱走",
    "startNode": "主稜三岔路口",
    "endNode": "畢祿山",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_35_nuhrk",
    "seq": 35,
    "planName": "羊畢縱走",
    "startNode": "畢祿山",
    "endNode": "主稜三岔路口",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_36_k34b3",
    "seq": 36,
    "planName": "羊畢縱走",
    "startNode": "主稜三岔路口",
    "endNode": "拉繩垂直岩壁",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_37_9z5ah",
    "seq": 37,
    "planName": "羊畢縱走",
    "startNode": "拉繩垂直岩壁",
    "endNode": "8.4K登山口營地",
    "duration": 80,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_38_4dgq6",
    "seq": 38,
    "planName": "羊畢縱走",
    "startNode": "8.4K登山口營地",
    "endNode": "820林道0K",
    "duration": 230,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_39_i2hg5",
    "seq": 39,
    "planName": "羊畢羊縱走",
    "startNode": "羊頭山登山口",
    "endNode": "三岔路口",
    "duration": 350,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_40_cmle7",
    "seq": 40,
    "planName": "羊畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_41_6q62e",
    "seq": 41,
    "planName": "羊畢羊縱走",
    "startNode": "羊頭山",
    "endNode": "三岔路口",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_42_fqyac",
    "seq": 42,
    "planName": "羊畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "鋸山東峰",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_43_cfyoz",
    "seq": 43,
    "planName": "羊畢羊縱走",
    "startNode": "鋸山東峰",
    "endNode": "鋸東山屋",
    "duration": 40,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_44_xbl1k",
    "seq": 44,
    "planName": "羊畢羊縱走",
    "startNode": "鋸東山屋",
    "endNode": "鋸山",
    "duration": 180,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_45_k8k7l",
    "seq": 45,
    "planName": "羊畢羊縱走",
    "startNode": "鋸山",
    "endNode": "第一峰",
    "duration": 120,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_46_4dsks",
    "seq": 46,
    "planName": "羊畢羊縱走",
    "startNode": "第一峰",
    "endNode": "主稜三岔路口",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_47_v66zh",
    "seq": 47,
    "planName": "羊畢羊縱走",
    "startNode": "主稜三岔路口",
    "endNode": "畢祿山",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_48_zuwp7",
    "seq": 48,
    "planName": "羊畢羊縱走",
    "startNode": "畢祿山",
    "endNode": "主稜三岔路口",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_49_emdze",
    "seq": 49,
    "planName": "羊畢羊縱走",
    "startNode": "畢祿山",
    "endNode": "主稜三岔路口",
    "duration": 10,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_50_6wzql",
    "seq": 50,
    "planName": "羊畢羊縱走",
    "startNode": "主稜三岔路口",
    "endNode": "第一峰",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_51_i3ehf",
    "seq": 51,
    "planName": "羊畢羊縱走",
    "startNode": "第一峰",
    "endNode": "鋸山",
    "duration": 105,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_52_3x556",
    "seq": 52,
    "planName": "羊畢羊縱走",
    "startNode": "鋸山",
    "endNode": "鋸東山屋",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_53_vi5oa",
    "seq": 53,
    "planName": "羊畢羊縱走",
    "startNode": "鋸東山屋",
    "endNode": "鋸山東峰",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_54_hboka",
    "seq": 54,
    "planName": "羊畢羊縱走",
    "startNode": "鋸山東峰",
    "endNode": "三岔路口",
    "duration": 25,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_55_bxumq",
    "seq": 55,
    "planName": "羊畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_56_5nh9y",
    "seq": 56,
    "planName": "羊畢羊縱走",
    "startNode": "羊頭山",
    "endNode": "三岔路口",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_57_uf0dg",
    "seq": 57,
    "planName": "羊畢羊縱走",
    "startNode": "三岔路口",
    "endNode": "羊頭山登山口",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_58_h26e9",
    "seq": 58,
    "planName": "無明甘藷",
    "startNode": "11.7K 行車終點",
    "endNode": "17.5K岔路",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_59_c81uj",
    "seq": 59,
    "planName": "無明甘藷",
    "startNode": "17.5K登山口",
    "endNode": "耳無溪合流點",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_60_d4p2h",
    "seq": 60,
    "planName": "無明甘藷",
    "startNode": "耳無溪合流點",
    "endNode": "遠多志山",
    "duration": 240,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_61_jrts9",
    "seq": 61,
    "planName": "無明甘藷",
    "startNode": "遠多志山",
    "endNode": "甘薯南峰",
    "duration": 90,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_62_m11j9",
    "seq": 62,
    "planName": "無明甘藷",
    "startNode": "甘薯南峰",
    "endNode": "甘薯峰",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_63_eyc02",
    "seq": 63,
    "planName": "無明甘藷",
    "startNode": "甘薯峰",
    "endNode": "甘薯南峰",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_64_wmxf3",
    "seq": 64,
    "planName": "無明甘藷",
    "startNode": "甘薯南峰",
    "endNode": "鞍部",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_65_7gxm7",
    "seq": 65,
    "planName": "無明甘藷",
    "startNode": "鞍部",
    "endNode": "鬼門關峰",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_66_ybphw",
    "seq": 66,
    "planName": "無明甘藷",
    "startNode": "鬼門關峰",
    "endNode": "無明水池",
    "duration": 15,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_67_a8pwn",
    "seq": 67,
    "planName": "無明甘藷",
    "startNode": "無明水池",
    "endNode": "無明山",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899299_0_68_7w6hx",
    "seq": 68,
    "planName": "無明甘藷",
    "startNode": "無明山",
    "endNode": "無明水池",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_69_eklo4",
    "seq": 69,
    "planName": "無明甘藷",
    "startNode": "無明水池",
    "endNode": "鬼門關峰",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_70_i35pa",
    "seq": 70,
    "planName": "無明甘藷",
    "startNode": "鬼門關峰",
    "endNode": "鞍部",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_71_kgp0j",
    "seq": 71,
    "planName": "無明甘藷",
    "startNode": "鞍部",
    "endNode": "甘薯南峰",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_72_ij7g6",
    "seq": 72,
    "planName": "無明甘藷",
    "startNode": "甘薯南峰",
    "endNode": "遠多志山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_73_e6rdc",
    "seq": 73,
    "planName": "無明甘藷",
    "startNode": "遠多志山",
    "endNode": "耳無溪合流點",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_74_dkdc3",
    "seq": 74,
    "planName": "無明甘藷",
    "startNode": "耳無溪合流點",
    "endNode": "17.5K登山口",
    "duration": 160,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_75_25u8v",
    "seq": 75,
    "planName": "無明甘藷",
    "startNode": "17.5K登山口",
    "endNode": "11.7K 行車終點",
    "duration": 140,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_76_9m310",
    "seq": 76,
    "planName": "閂山鈴鳴",
    "startNode": "11.7K 行車終點",
    "endNode": "17.5K岔路",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_77_o45rd",
    "seq": 77,
    "planName": "閂山鈴鳴",
    "startNode": "17.5K岔路",
    "endNode": "23.2K登山口",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_78_542cm",
    "seq": 78,
    "planName": "閂山鈴鳴",
    "startNode": "23.2K登山口",
    "endNode": "雨量計前岔路",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_79_6wsa5",
    "seq": 79,
    "planName": "閂山鈴鳴",
    "startNode": "雨量計前岔路",
    "endNode": "閂山",
    "duration": 80,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_80_qurp4",
    "seq": 80,
    "planName": "閂山鈴鳴",
    "startNode": "閂山",
    "endNode": "雨量計前岔路",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_81_1ci1r",
    "seq": 81,
    "planName": "閂山鈴鳴",
    "startNode": "雨量計前岔路",
    "endNode": "23.2K登山口",
    "duration": 15,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_82_bk1hy",
    "seq": 82,
    "planName": "閂山鈴鳴",
    "startNode": "23.2K登山口",
    "endNode": "25K工寮",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_83_o7n2a",
    "seq": 83,
    "planName": "閂山鈴鳴",
    "startNode": "25K工寮",
    "endNode": "27.5K登山口",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_84_qvrkv",
    "seq": 84,
    "planName": "閂山鈴鳴",
    "startNode": "27.5K登山口",
    "endNode": "人待山岔路",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_85_383pz",
    "seq": 85,
    "planName": "閂山鈴鳴",
    "startNode": "人待山岔路",
    "endNode": "鈴鳴山",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_86_3qnyu",
    "seq": 86,
    "planName": "閂山鈴鳴",
    "startNode": "鈴鳴山",
    "endNode": "人待山岔路",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_87_netbt",
    "seq": 87,
    "planName": "閂山鈴鳴",
    "startNode": "人待山岔路",
    "endNode": "27.5K登山口",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_88_mgfpq",
    "seq": 88,
    "planName": "閂山鈴鳴",
    "startNode": "27.5K登山口",
    "endNode": "25K工寮",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_89_r88fp",
    "seq": 89,
    "planName": "閂山鈴鳴",
    "startNode": "25K工寮",
    "endNode": "23.2K登山口",
    "duration": 40,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_90_hmtv9",
    "seq": 90,
    "planName": "閂山鈴鳴",
    "startNode": "23.2K登山口",
    "endNode": "17.5K岔路",
    "duration": 120,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_91_dpjv8",
    "seq": 91,
    "planName": "閂山鈴鳴",
    "startNode": "17.5K岔路",
    "endNode": "11.7K 行車終點",
    "duration": 140,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_92_jh369",
    "seq": 92,
    "planName": "北二段O 順時針",
    "startNode": "11.7K 行車終點",
    "endNode": "17.5K岔路",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_93_3xthf",
    "seq": 93,
    "planName": "北二段O 順時針",
    "startNode": "17.5K登山口",
    "endNode": "耳無溪合流點",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_94_0825b",
    "seq": 94,
    "planName": "北二段O 順時針",
    "startNode": "耳無溪合流點",
    "endNode": "遠多志山",
    "duration": 240,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_95_9oc0h",
    "seq": 95,
    "planName": "北二段O 順時針",
    "startNode": "遠多志山",
    "endNode": "甘薯南峰",
    "duration": 90,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_96_045ll",
    "seq": 96,
    "planName": "北二段O 順時針",
    "startNode": "甘薯南峰",
    "endNode": "甘薯峰",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_97_41z4a",
    "seq": 97,
    "planName": "北二段O 順時針",
    "startNode": "甘薯峰",
    "endNode": "甘薯南峰",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_98_jl83p",
    "seq": 98,
    "planName": "北二段O 順時針",
    "startNode": "甘薯南峰",
    "endNode": "鞍部",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_99_2utrq",
    "seq": 99,
    "planName": "北二段O 順時針",
    "startNode": "鞍部",
    "endNode": "鬼門關峰",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_100_bsy9k",
    "seq": 100,
    "planName": "北二段O 順時針",
    "startNode": "鬼門關峰",
    "endNode": "無明水池",
    "duration": 15,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_101_d3nd0",
    "seq": 101,
    "planName": "北二段O 順時針",
    "startNode": "無明水池",
    "endNode": "無明山",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_102_14p89",
    "seq": 102,
    "planName": "北二段O 順時針",
    "startNode": "無明山",
    "endNode": "無明山西峰",
    "duration": 200,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_103_lgn5v",
    "seq": 103,
    "planName": "北二段O 順時針",
    "startNode": "無明山西峰",
    "endNode": "東鞍營地",
    "duration": 290,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_104_g6j0m",
    "seq": 104,
    "planName": "北二段O 順時針",
    "startNode": "東鞍營地",
    "endNode": "鈴鳴山",
    "duration": 30,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_105_gfmd1",
    "seq": 105,
    "planName": "北二段O 順時針",
    "startNode": "鈴鳴山",
    "endNode": "人待山岔路",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_106_70a2e",
    "seq": 106,
    "planName": "北二段O 順時針",
    "startNode": "人待山岔路",
    "endNode": "27.5K登山口",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_107_086yj",
    "seq": 107,
    "planName": "北二段O 順時針",
    "startNode": "27.5K登山口",
    "endNode": "25K工寮",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_108_mmntr",
    "seq": 108,
    "planName": "北二段O 順時針",
    "startNode": "25K工寮",
    "endNode": "23.2K登山口",
    "duration": 40,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_109_i4fd4",
    "seq": 109,
    "planName": "北二段O 順時針",
    "startNode": "23.2K登山口",
    "endNode": "雨量計前岔路",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_110_5467g",
    "seq": 110,
    "planName": "北二段O 順時針",
    "startNode": "雨量計前岔路",
    "endNode": "閂山",
    "duration": 80,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_111_e2z6z",
    "seq": 111,
    "planName": "北二段O 順時針",
    "startNode": "閂山",
    "endNode": "雨量計前岔路",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_112_ji5p4",
    "seq": 112,
    "planName": "北二段O 順時針",
    "startNode": "雨量計前岔路",
    "endNode": "23.2K登山口",
    "duration": 15,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_113_i7sjq",
    "seq": 113,
    "planName": "北二段O 順時針",
    "startNode": "23.2K登山口",
    "endNode": "17.5K岔路",
    "duration": 120,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_114_5eyq8",
    "seq": 114,
    "planName": "北二段O 順時針",
    "startNode": "17.5K岔路",
    "endNode": "11.7K 行車終點",
    "duration": 140,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_115_jjwwx",
    "seq": 115,
    "planName": "北二段O 逆時針",
    "startNode": "11.7K 行車終點",
    "endNode": "17.5K岔路",
    "duration": 180,
    "note": "登山口",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_116_35fzd",
    "seq": 116,
    "planName": "北二段O 逆時針",
    "startNode": "17.5K岔路",
    "endNode": "23.2K登山口",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_117_iya75",
    "seq": 117,
    "planName": "北二段O 逆時針",
    "startNode": "23.2K登山口",
    "endNode": "雨量計前岔路",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_118_5v62a",
    "seq": 118,
    "planName": "北二段O 逆時針",
    "startNode": "雨量計前岔路",
    "endNode": "閂山",
    "duration": 80,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_119_wj9nw",
    "seq": 119,
    "planName": "北二段O 逆時針",
    "startNode": "閂山",
    "endNode": "雨量計前岔路",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_120_nm1hc",
    "seq": 120,
    "planName": "北二段O 逆時針",
    "startNode": "雨量計前岔路",
    "endNode": "23.2K登山口",
    "duration": 15,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_121_w56wf",
    "seq": 121,
    "planName": "北二段O 逆時針",
    "startNode": "23.2K登山口",
    "endNode": "25K工寮",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_122_gcwjb",
    "seq": 122,
    "planName": "北二段O 逆時針",
    "startNode": "25K工寮",
    "endNode": "27.5K登山口",
    "duration": 110,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_123_7ysnc",
    "seq": 123,
    "planName": "北二段O 逆時針",
    "startNode": "27.5K登山口",
    "endNode": "人待山岔路",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_124_cd68r",
    "seq": 124,
    "planName": "北二段O 逆時針",
    "startNode": "人待山岔路",
    "endNode": "鈴鳴山",
    "duration": 60,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_125_f58gw",
    "seq": 125,
    "planName": "北二段O 逆時針",
    "startNode": "鈴鳴山",
    "endNode": "東鞍營地",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_126_svo8u",
    "seq": 126,
    "planName": "北二段O 逆時針",
    "startNode": "東鞍營地",
    "endNode": "無明山西峰",
    "duration": 270,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_127_v3k1e",
    "seq": 127,
    "planName": "北二段O 逆時針",
    "startNode": "無明山西峰",
    "endNode": "無明山",
    "duration": 220,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_128_qh5cu",
    "seq": 128,
    "planName": "北二段O 逆時針",
    "startNode": "無明山",
    "endNode": "無明水池",
    "duration": 45,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_129_q66fu",
    "seq": 129,
    "planName": "北二段O 逆時針",
    "startNode": "無明水池",
    "endNode": "鬼門關峰",
    "duration": 20,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_130_z5i7o",
    "seq": 130,
    "planName": "北二段O 逆時針",
    "startNode": "鬼門關峰",
    "endNode": "鞍部",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_131_2o65a",
    "seq": 131,
    "planName": "北二段O 逆時針",
    "startNode": "鞍部",
    "endNode": "甘薯南峰",
    "duration": 70,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_132_o0ryx",
    "seq": 132,
    "planName": "北二段O 逆時針",
    "startNode": "甘薯南峰",
    "endNode": "遠多志山",
    "duration": 50,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_133_qaux4",
    "seq": 133,
    "planName": "北二段O 逆時針",
    "startNode": "遠多志山",
    "endNode": "耳無溪合流點",
    "duration": 140,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_134_secms",
    "seq": 134,
    "planName": "北二段O 逆時針",
    "startNode": "耳無溪合流點",
    "endNode": "17.5K登山口",
    "duration": 160,
    "note": "",
    "direction": "",
    "category": ""
  },
  {
    "id": "seg_1788666899300_0_135_lxh97",
    "seq": 135,
    "planName": "北二段O 逆時針",
    "startNode": "17.5K登山口",
    "endNode": "11.7K 行車終點",
    "duration": 140,
    "note": "登山口",
    "direction": "",
    "category": ""
  }
],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G09",
    code: "G09",
    name: "G09 合歡.奇萊",
    images: [
      { id: "g09_img_1", url: "https://www.sunriver.com.tw/images/hiking/G09_hiking_new.jpg", type: "行程示意圖", title: "G09 合歡.奇萊 行程示意圖" },
      { id: "g09_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG09-2.jpg", type: "高差示意圖", title: "G09 合歡.奇萊 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G10",
    code: "G10",
    name: "G10 太魯閣山列",
    images: [
      { id: "g10_img_1", url: "https://www.sunriver.com.tw/images/hiking/G10_hiking.jpg", type: "行程示意圖", title: "G10 太魯閣山列 行程示意圖" },
      { id: "g10_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG10.jpg", type: "高差示意圖", title: "G10 太魯閣山列 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G11",
    code: "G11",
    name: "G11 能高越嶺",
    images: [
      { id: "g11_img_1", url: "https://www.sunriver.com.tw/images/hiking/G11_hiking.jpg", type: "行程示意圖", title: "G11 能高越嶺 行程示意圖" },
      { id: "g11_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG11.jpg", type: "高差示意圖", title: "G11 能高越嶺 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G12",
    code: "G12",
    name: "G12 能高安東軍",
    images: [
      { id: "g12_img_1", url: "https://www.sunriver.com.tw/images/hiking/G12_hiking.jpg", type: "行程示意圖", title: "G12 能高安東軍 行程示意圖" },
      { id: "g12_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG12.jpg", type: "高差示意圖", title: "G12 能高安東軍 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G13",
    code: "G13",
    name: "G13 干卓萬群峰",
    images: [
      { id: "g13_img_1", url: "https://www.sunriver.com.tw/images/hiking/G13_hiking.jpg", type: "行程示意圖", title: "G13 干卓萬群峰 行程示意圖" },
      { id: "g13_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG13.jpg", type: "高差示意圖", title: "G13 干卓萬群峰 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G14",
    code: "G14",
    name: "G14 七彩湖‧六順山",
    images: [
      { id: "g14_img_1", url: "https://www.sunriver.com.tw/images/hiking/G14_hiking.jpg", type: "行程示意圖", title: "G14 七彩湖‧六順山 行程示意圖" },
      { id: "g14_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG14.jpg", type: "高差示意圖", title: "G14 七彩湖‧六順山 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G15",
    code: "G15",
    name: "G15 丹大山.東郡",
    images: [
      { id: "g15_img_1", url: "https://www.sunriver.com.tw/images/hiking/G15_hiking.jpg", type: "行程示意圖", title: "G15 丹大山.東郡 行程示意圖" },
      { id: "g15_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG15.jpg", type: "高差示意圖", title: "G15 丹大山.東郡 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G16",
    code: "G16",
    name: "G16 馬博拉斯橫斷縱走",
    images: [
      { id: "g16_img_1", url: "https://www.sunriver.com.tw/images/hiking/G16_hiking.jpg", type: "行程示意圖", title: "G16 馬博拉斯橫斷縱走 行程示意圖" },
      { id: "g16_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG16.jpg", type: "高差示意圖", title: "G16 馬博拉斯橫斷縱走 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G17",
    code: "G17",
    name: "G17 南二段縱走",
    images: [
      { id: "g17_img_1", url: "https://www.sunriver.com.tw/images/hiking/G17_hiking.jpg", type: "行程示意圖", title: "G17 南二段縱走 行程示意圖" },
      { id: "g17_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG17.jpg", type: "高差示意圖", title: "G17 南二段縱走 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G18",
    code: "G18",
    name: "G18 新康橫斷縱走",
    images: [
      { id: "g18_img_1", url: "https://www.sunriver.com.tw/images/hiking/G18_hiking.jpg", type: "行程示意圖", title: "G18 新康橫斷縱走 行程示意圖" },
      { id: "g18_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG18.jpg", type: "高差示意圖", title: "G18 新康橫斷縱走 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "",
    segments: [],
    updatedAt: new Date().toISOString()
  },
  {
    id: "G19",
    code: "G19",
    name: "G19 南一段縱走",
    images: [
      { id: "g19_img_1", url: "https://www.sunriver.com.tw/images/hiking/G19_hiking.jpg", type: "行程示意圖", title: "G19 南一段縱走 行程示意圖" },
      { id: "g19_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG19.jpg", type: "高差示意圖", title: "G19 南一段縱走 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "https://hiking.biji.co/index.php?q=trail&act=gpx_detail&id=22739",
    segments: [], // Initially empty as requested in section 30!
    updatedAt: new Date().toISOString()
  },
  {
    id: "G20",
    code: "G20",
    name: "G20 北大武山",
    images: [
      { id: "g20_img_1", url: "https://www.sunriver.com.tw/images/hiking/G20_hiking.jpg", type: "行程示意圖", title: "G20 北大武山 行程示意圖" },
      { id: "g20_img_2", url: "https://www.sunriver.com.tw/images/hiking/xG20.jpg", type: "高差示意圖", title: "G20 北大武山 高差示意圖" }
    ],
    mapUrl: "",
    gpxUrl: "https://hiking.biji.co/index.php?q=trail&act=gpx_detail&id=22740",
    segments: parseCSVToSegments(G20_SAMPLE_CSV),
    updatedAt: new Date().toISOString()
  }
];

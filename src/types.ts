export interface Segment {
  id: string;
  planName: string;      // A 所屬行程
  seq: number;            // B 序號
  startNode: string;      // C 起點
  endNode: string;        // D 迄點
  duration: number;       // E 所需時間 (分鐘)
  note: string;           // F 備註 ('登山口', '宿點', '山峰', etc.)
  direction: string;      // G 行進方向 ('上行 ▲', '下行 ▼')
  category: string;       // H 資料分類
}

export type ImageType = '行程示意圖' | '高差示意圖' | '其他圖資';

export type SegmentsUpdateMode = 'preserve' | 'partial' | 'replace' | 'clear';

export interface RouteImage {
  id: string;
  url: string;
  type: ImageType;
  title?: string;
}

export interface MainRoute {
  id: string;             // Route unique identifier
  code: string;           // Route code
  name: string;           // Route name
  images: RouteImage[];
  mapUrl?: string;
  gpxUrl?: string;        // 航跡網址
  description?: string;
  sortOrder?: number;
  createdAt?: string;
  segments: Segment[];
  updatedAt?: string;
  segmentsMode?: SegmentsUpdateMode; // 明確指定路段更新語意: preserve | partial | replace | clear
  clearSegments?: boolean;           // 明確旗標：是否使用者真正要求清空所有路段 (僅在 clear 模式有效)
  clearImages?: boolean;             // 明確旗標：是否使用者真正要求清空所有圖片
  expectedOriginalCount?: number;    // 客戶端預期資料庫目前既有路段筆數，用於防止競態與覆蓋
  allowShrink?: boolean;             // 是否允許路段大幅縮減 (縮水防護雙重確認)
  clientVersion?: string;            // 樂觀鎖版本標記 (與 updatedAt 比對)
  forceOverwrite?: boolean;          // 明確旗標：後台手動載入 Excel 或管理員操作，必須永久權威覆寫
}

export interface SaveRoutePayload extends Partial<MainRoute> {
  id: string;
  segmentsMode?: SegmentsUpdateMode;
  expectedOriginalCount?: number;
  allowShrink?: boolean;
  clientVersion?: string;
  forceOverwrite?: boolean;
}

export interface DayPlanConfig {
  dayIndex: number;       // 1-based (Day 1, Day 2...)
  startTime: string;      // "06:00"
  stayPoint?: string;     // 今晚住哪裡 ('宿點')
}

export interface CalculatedNode {
  timeStr: string;        // "06:00"
  location: string;       // "塔塔加鞍部"
  note?: string;          // "登山口", "宿點", etc.
  segmentDuration?: number; // Minutes spent on incoming segment
  accumulatedMinutes: number;
  isLodging?: boolean;
  lodgingDayIndex?: number;
}

export interface DayItineraryResult {
  dayIndex: number;
  startTime: string;
  nodes: CalculatedNode[];
  totalMinutes: number;
  totalHoursFormatted: string; // e.g. "8.5"
}

export interface FullItineraryResult {
  planName: string;
  days: DayItineraryResult[];
  totalMinutes: number;
  totalHoursFormatted: string; // e.g. "17.5"
  notepadContent: string;
}

export type RouteSegment = Segment;

export interface SiteSettings {
  orgName: string;        // e.g. "亞馬遜國家山岳協會"
  badgeText: string;      // e.g. "Official" or "OFFICIAL"
  subTitle: string;       // e.g. "Sunriver Map Database ｜ Trip Planner"
  systemTitle?: string;   // e.g. "上河圖資登山行程規劃系統"
  logoInitial?: string;   // e.g. "A"
  updatedAt?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  orgName: '亞馬遜國家山岳協會',
  badgeText: 'Official',
  subTitle: 'Sunriver Map Database ｜ Trip Planner',
  systemTitle: '上河圖資登山行程規劃系統',
  logoInitial: 'A',
};


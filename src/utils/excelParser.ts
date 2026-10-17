import * as XLSX from 'xlsx';
import { Segment } from '../types';

export interface ParseResult {
  segments: Segment[];
  suggestedRouteName?: string;
  suggestedRouteCode?: string;
  totalSheetsCount?: number;
  parsedSheetsCount?: number;
  sheetNames?: string[];
  isPartialParse?: boolean;
  error?: string;
}

export function parseExcelFile(fileData: ArrayBuffer | string, fileName?: string): ParseResult {
  try {
    let workbook: XLSX.WorkBook;
    
    if (typeof fileData === 'string') {
      workbook = XLSX.read(fileData, { type: 'string' });
    } else {
      workbook = XLSX.read(fileData, { type: 'array' });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { segments: [], error: 'Excel 檔案內沒有工作表' };
    }

    const allSegments: Segment[] = [];
    let detectedRoutePrefix = '';
    let parsedSheetsCount = 0;
    const totalSheetsCount = workbook.SheetNames.length;
    let hasFailedSheet = false;

    for (let sIdx = 0; sIdx < workbook.SheetNames.length; sIdx++) {
      const sheetName = workbook.SheetNames[sIdx];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1, defval: '' });
      if (rows.length === 0) continue;

      // Determine header row or column indices
      let headerRowIndex = -1;
      let colPlan = 0;
      let colSeq = 1;
      let colStart = 2;
      let colEnd = 3;
      let colDuration = 4;
      let colNote = 5;
      let colDirection = 6;
      let colCategory = 7;

      // Scan first 10 rows to locate header names if available
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const strRow = row.map(c => String(c).trim());

        const planIdx = strRow.findIndex(c => c.includes('所屬行程') || c.includes('行程方案'));
        const startIdx = strRow.findIndex(c => c.includes('起點'));
        const endIdx = strRow.findIndex(c => c.includes('迄點') || c.includes('終點'));
        const durIdx = strRow.findIndex(c => c.includes('時間') || c.includes('所需時間') || c.includes('步程'));

        if (planIdx !== -1 || (startIdx !== -1 && endIdx !== -1)) {
          headerRowIndex = r;
          if (planIdx !== -1) colPlan = planIdx;
          const seqIdx = strRow.findIndex(c => c.includes('序號'));
          if (seqIdx !== -1) colSeq = seqIdx;
          if (startIdx !== -1) colStart = startIdx;
          if (endIdx !== -1) colEnd = endIdx;
          if (durIdx !== -1) colDuration = durIdx;
          const noteIdx = strRow.findIndex(c => c.includes('備註'));
          if (noteIdx !== -1) colNote = noteIdx;
          const dirIdx = strRow.findIndex(c => c.includes('行進方向') || c.includes('方向'));
          if (dirIdx !== -1) colDirection = dirIdx;
          const catIdx = strRow.findIndex(c => c.includes('資料分類') || c.includes('分類'));
          if (catIdx !== -1) colCategory = catIdx;
          break;
        }
      }

      // If headerRowIndex was not explicitly found but rows exist, check if row 0 could be data or header
      if (headerRowIndex === -1 && rows.length > 0) {
        // If row 0 contains text and row 1 has numeric duration, treat row 0 as header
        headerRowIndex = 0;
      }

      let sheetValidSegments = 0;

      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let planName = String(row[colPlan] ?? '').trim();
        // If planName is empty but sheetName has day/plan context, supply sheetName as planName
        if (!planName) {
          planName = sheetName;
        }

        const rawSeq = row[colSeq];
        const seq = typeof rawSeq === 'number' ? rawSeq : parseInt(String(rawSeq), 10) || (allSegments.length + 1);
        const startNode = String(row[colStart] ?? '').trim();
        const endNode = String(row[colEnd] ?? '').trim();
        
        const rawDuration = row[colDuration];
        let duration = 0;
        if (typeof rawDuration === 'number') {
          duration = Math.round(rawDuration);
        } else {
          duration = parseInt(String(rawDuration).replace(/[^0-9]/g, ''), 10) || 0;
        }

        const note = String(row[colNote] ?? '').trim();
        const direction = String(row[colDirection] ?? '').trim();
        const category = String(row[colCategory] ?? '').trim();

        // Preserve row if start/end nodes or planName exist
        if (!startNode && !endNode && !planName) continue;

        if (!detectedRoutePrefix && planName) {
          const match = planName.match(/^(G\d+)/i);
          if (match) {
            detectedRoutePrefix = match[1].toUpperCase();
          }
        }

        allSegments.push({
          id: `seg_${Date.now()}_${sIdx}_${r}_${Math.random().toString(36).substring(2, 7)}`,
          planName,
          seq,
          startNode,
          endNode,
          duration,
          note,
          direction,
          category
        });
        sheetValidSegments++;
      }

      if (sheetValidSegments > 0) {
        parsedSheetsCount++;
      } else if (rows.length > 2) {
        // Sheet has rows but 0 valid segments -> potential failed parse
        hasFailedSheet = true;
      }
    }

    if (allSegments.length === 0) {
      return {
        segments: [],
        totalSheetsCount,
        parsedSheetsCount: 0,
        error: '所有工作表均未找到有效的路段資料'
      };
    }

    // Try to guess route name/code from filename if not detected from planName
    let suggestedRouteCode = detectedRoutePrefix;
    let suggestedRouteName = '';

    if (fileName) {
      const cleanFile = fileName.replace(/\.[^/.]+$/, '');
      const codeMatch = cleanFile.match(/(G\d+)/i);
      if (codeMatch && !suggestedRouteCode) {
        suggestedRouteCode = codeMatch[1].toUpperCase();
      }
      suggestedRouteName = cleanFile;
    }

    if (!suggestedRouteName && suggestedRouteCode) {
      suggestedRouteName = `${suggestedRouteCode} 自訂主路線`;
    }

    return {
      segments: allSegments,
      suggestedRouteName,
      suggestedRouteCode,
      totalSheetsCount,
      parsedSheetsCount,
      sheetNames: workbook.SheetNames,
      isPartialParse: hasFailedSheet || (totalSheetsCount > 1 && parsedSheetsCount < totalSheetsCount)
    };
  } catch (err) {
    return {
      segments: [],
      error: err instanceof Error ? err.message : '解析 Excel 檔案失敗'
    };
  }
}

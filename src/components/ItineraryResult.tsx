import React, { useState, useMemo } from 'react';
import { FullItineraryResult } from '../types';
import { Download, Copy, Check, Calendar, Navigation, Plus, Trash2 } from 'lucide-react';
import { getEffectiveGpxUrl } from '../utils/urlHelper';
import { AvailableSpur, getSpursForNode } from '../utils/itineraryCalculator';

interface ItineraryResultProps {
  result: FullItineraryResult | null;
  gpxUrl?: string;
  routeName: string;
  availableSpursPool?: AvailableSpur[];
  onAddSpurAtNode?: (nodeName: string, spurTargetNode?: string) => void;
  onRemoveSpurByTarget?: (targetNode: string) => void;
  selectedLodging?: string | null;
  selectedLodgings?: string[];
}

const CHINESE_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];

export const ItineraryResult: React.FC<ItineraryResultProps> = ({
  result,
  gpxUrl,
  routeName,
  availableSpursPool = [],
  onAddSpurAtNode,
  onRemoveSpurByTarget,
  selectedLodging,
  selectedLodgings,
}) => {
  const [copied, setCopied] = useState(false);
  const effectiveGpx = getEffectiveGpxUrl(gpxUrl, routeName);

  const lodgingSet = useMemo(() => {
    if (selectedLodgings && selectedLodgings.length > 0) {
      return new Set(selectedLodgings.map(s => s.trim()));
    }
    if (selectedLodging && typeof selectedLodging === 'string' && selectedLodging.trim()) {
      return new Set([selectedLodging.trim()]);
    }
    return new Set<string>();
  }, [selectedLodgings, selectedLodging]);

  const allSpurTargets = useMemo(() => {
    return new Set(availableSpursPool.map(s => s.targetNode.trim()));
  }, [availableSpursPool]);

  const presentSpurTargets = useMemo(() => {
    if (!result) return new Set<string>();
    const set = new Set<string>();
    for (const day of result.days) {
      for (const node of day.nodes) {
        if (allSpurTargets.has(node.location.trim())) {
          set.add(node.location.trim());
        }
      }
    }
    return set;
  }, [result, allSpurTargets]);

  if (!result || result.days.length === 0) {
    return (
      <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-8 text-center shadow-md">
        <div className="w-10 h-10 rounded-xs bg-[#1a202c] border border-[#2d3748] flex items-center justify-center mx-auto mb-3 text-[#10b981]">
          <Calendar className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-serif font-bold text-[#f1f5f9] mb-1">尚未產生行程預覽</h4>
        <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
          請在上方選擇路線與方案後，系統將依據上河標準步程資料庫自動計算時間與各日規劃。
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.notepadContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([result.notepadContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${routeName}_${result.planName}_行程規劃.txt`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#12161f] rounded-xs border border-[#242c3b] shadow-md overflow-hidden mb-10">
      {/* Top Action Header */}
      <div className="bg-[#161b26] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#242c3b]">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
            最終行程成果 / FINAL ITINERARY
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#f8fafc] tracking-tight truncate">
            {result.planName}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {effectiveGpx && (
            <a
              href={effectiveGpx}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] text-[#34d399] text-[11px] font-bold uppercase tracking-wider border border-[#2d3748] transition font-mono cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#10b981]" />
              <span>開啟航跡</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopy}
            id="copy-itinerary-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] text-[#f1f5f9] text-[11px] font-bold uppercase tracking-wider border border-[#334155] transition font-mono cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
            <span>{copied ? '已複製' : '複製行程'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            id="download-notepad-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-[#10b981] hover:bg-[#059669] text-[#090b0f] text-[11px] font-bold uppercase tracking-wider transition shadow-sm font-mono cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載記事本</span>
          </button>
        </div>
      </div>

      {/* Main Manuscript Layout */}
      <div className="p-3.5 sm:p-10 bg-[#0c0f14]">
        <div className="max-w-2xl mx-auto bg-[#141923] rounded-xs border border-[#283244] p-4 sm:p-8 sm:p-10 shadow-lg text-[#f1f5f9] break-words">
          {result.days.map((day, dIdx) => {
            const dayName = `第${CHINESE_NUMS[day.dayIndex - 1] || day.dayIndex}天`;
            return (
              <div key={day.dayIndex} className="mb-8 last:mb-0">
                <h4 className="text-sm font-serif font-bold mb-4 border-b-2 border-[#10b981] pb-1 inline-block text-[#f8fafc]">
                  {dayName}
                </h4>

                <div className="space-y-1 text-[13px] sm:text-sm font-serif">
                  {day.nodes.map((node, nIdx) => {
                    const nodeLoc = node.location.trim();
                    const isSpurTarget = allSpurTargets.has(nodeLoc);
                    const nodeSpurs = getSpursForNode(nodeLoc, availableSpursPool);
                    const unaddedSpurs = nodeSpurs.filter(sp => !presentSpurTargets.has(sp.targetNode.trim()));
                    const isDayLodging = Boolean(node.isLodging || (nIdx === day.nodes.length - 1 && dIdx < result.days.length - 1));

                    return (
                      <React.Fragment key={nIdx}>
                        {nIdx > 0 && (
                          <div className="flex items-center pl-4 py-0.5 text-[#475569]">
                            <span className="text-xs font-mono select-none">↓</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3.5 group">
                          <span className="font-mono text-xs text-[#34d399] font-semibold w-12 flex-shrink-0">
                            {node.timeStr}
                          </span>
                          <span className="text-[#f1f5f9] font-medium group-hover:text-white transition">
                            {node.location}
                          </span>

                          {/* If this node is the lodging point for this day */}
                          {isDayLodging && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/40 shadow-xs">
                              <span>🏕️</span>
                              <span>第 {node.lodgingDayIndex || day.dayIndex} 天宿點（次日自動分割）</span>
                            </span>
                          )}

                          {/* If this node is a spur target, inline action to remove this spur */}
                          {isSpurTarget && onRemoveSpurByTarget && (
                            <button
                              type="button"
                              onClick={() => onRemoveSpurByTarget(nodeLoc)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#fca5a5] hover:text-white bg-[#ef4444]/15 hover:bg-[#ef4444]/30 border border-[#ef4444]/30 rounded-xs transition cursor-pointer"
                              title={`移除 ${nodeLoc} 支線（前後自動銜接）`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>移除此支線</span>
                            </button>
                          )}

                          {/* If this node has available spurs, inline action to add spur */}
                          {unaddedSpurs.length > 0 && onAddSpurAtNode && (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              {unaddedSpurs.map((spur) => (
                                <button
                                  key={spur.id}
                                  type="button"
                                  onClick={() => onAddSpurAtNode(nodeLoc, spur.targetNode)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#34d399] border border-[#10b981]/40 rounded-xs text-[10px] font-mono font-bold transition cursor-pointer"
                                  title={`在此處加入支線：${spur.targetNode} (${spur.formattedDuration})`}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>＋ {spur.targetNode}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 text-[11px] font-mono italic text-[#94a3b8] border-t border-dashed border-[#283244]">
                  當日預估步程：<span className="text-[#34d399] font-bold">{day.totalHoursFormatted}</span>
                </div>
              </div>
            );
          })}

          {/* Grand Total Summary */}
          <div className="mt-8 pt-6 border-t-2 border-[#283244] flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
              預估總步程 / TOTAL TIME
            </span>
            <span className="text-base sm:text-lg font-serif font-bold text-[#34d399]">
              {result.totalHoursFormatted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

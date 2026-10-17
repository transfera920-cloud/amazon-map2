import React, { useState } from 'react';
import { RouteImage } from '../types';
import { ImageModal } from './ImageModal';
import { Maximize2, Map, Compass, Navigation, Eye } from 'lucide-react';
import { formatExternalUrl, getEffectiveGpxUrl } from '../utils/urlHelper';

interface RouteImagesViewProps {
  images: RouteImage[];
  routeName: string;
  gpxUrl?: string;
  mapUrl?: string;
}

export const RouteImagesView: React.FC<RouteImagesViewProps> = ({
  images,
  routeName,
  gpxUrl,
  mapUrl,
}) => {
  const [selectedImage, setSelectedImage] = useState<RouteImage | null>(null);

  const effectiveGpx = getEffectiveGpxUrl(gpxUrl, routeName);
  const formattedMapUrl = formatExternalUrl(mapUrl);

  return (
    <div className="bg-[#12161f] rounded-xs border border-[#242c3b] p-4 sm:p-6 mb-6 shadow-md">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#242c3b]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-[#1a202c] text-[#10b981] border border-[#2d3748]">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] font-mono">
              路線圖資與航跡 / MAPS & GPX TRACKS
            </h3>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-2">
          {effectiveGpx && (
            <a
              href={effectiveGpx}
              target="_blank"
              rel="noopener noreferrer"
              id="open-gpx-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-[#10b981] hover:bg-[#059669] text-[#090b0f] text-[11px] font-bold uppercase tracking-wider transition shadow-sm font-mono cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>開啟航跡</span>
            </a>
          )}

          {formattedMapUrl && (
            <a
              href={formattedMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="open-map-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-[#1a202c] hover:bg-[#252d3d] text-[#f1f5f9] border border-[#334155] text-[11px] font-bold uppercase tracking-wider transition font-mono cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#10b981]" />
              <span>路線地圖</span>
            </a>
          )}
        </div>
      </div>

      {images.length === 0 ? (
        <div className="py-8 text-center bg-[#0a0d13] rounded-xs border border-dashed border-[#242c3b] text-[#94a3b8] font-serif text-xs">
          目前路線尚無設定圖資圖片網址，可在管理後台新增。
        </div>
      ) : (
        <div className={`grid gap-5 ${images.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((img, idx) => {
            const displayType = (img.type as string) === '高叉示意圖' ? '高差示意圖' : (img.type || '行程示意圖');
            return (
              <div
                key={img.id || idx}
                className="flex flex-col bg-[#0a0d13] rounded-xs border border-[#242c3b] overflow-hidden hover:border-[#10b981]/60 transition shadow-sm group"
              >
                {/* Dedicated Top Toolbar: completely outside and above the image, never blocking graphics */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#161b26] border-b border-[#242c3b]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-bold uppercase tracking-wider bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-mono whitespace-nowrap">
                      {displayType}
                    </span>
                    <span className="text-xs font-serif font-medium text-[#e2e8f0] truncate">
                      {img.title || `${routeName} ${displayType}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedImage({ ...img, type: displayType })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-[#1a202c] hover:bg-[#10b981] hover:text-[#090b0f] text-[#cbd5e1] border border-[#2d3748] text-[11px] font-mono font-medium transition cursor-pointer flex-shrink-0"
                    title="按原比例全螢幕放大檢視"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>放大檢視</span>
                  </button>
                </div>

                {/* Completely unobstructed image container */}
                <div
                  className="w-full flex-1 flex items-center justify-center p-3 min-h-[240px] max-h-[440px] bg-[#07090d] cursor-zoom-in relative"
                  onClick={() => setSelectedImage({ ...img, type: displayType })}
                >
                  <img
                    src={img.url}
                    alt={img.title || `${routeName} ${displayType}`}
                    referrerPolicy="no-referrer"
                    className="max-h-[400px] w-auto max-w-full object-contain transition duration-200 group-hover:brightness-105"
                    loading="lazy"
                  />
                </div>

                {/* Bottom caption bar */}
                <div className="px-3.5 py-2 bg-[#12161f] border-t border-[#242c3b] flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                  <span className="flex items-center gap-1 text-[#64748b]">
                    <Eye className="w-3.5 h-3.5 text-[#10b981]" />
                    點擊圖片可進入高清無遮擋縮放畫布
                  </span>
                  <span className="text-[#64748b]">
                    {displayType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.title || `${routeName} - ${selectedImage.type}`}
        />
      )}
    </div>
  );
};

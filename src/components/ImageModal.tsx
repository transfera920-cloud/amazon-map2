import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.6));
  const handleResetZoom = () => setZoom(1);

  const cleanTitle = (title || '上河圖資示意圖').replace('高叉示意圖', '高差示意圖');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-6xl h-[92vh] bg-[#0d1117] rounded-xs border border-[#242c3b] shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b26] border-b border-[#242c3b]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981] flex-shrink-0"></span>
            <h3 className="text-xs sm:text-sm font-serif font-bold text-[#f1f5f9] truncate max-w-md">
              {cleanTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center bg-[#0a0d13] rounded-xs p-1 text-slate-200 border border-[#2a3445]">
              <button
                type="button"
                onClick={handleZoomOut}
                title="縮小"
                className="p-1.5 hover:bg-[#1a202c] rounded-xs text-[#94a3b8] hover:text-white transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] px-2 font-mono text-[#34d399] font-bold">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="放大"
                className="p-1.5 hover:bg-[#1a202c] rounded-xs text-[#94a3b8] hover:text-white transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="重設大小"
                className="p-1.5 hover:bg-[#1a202c] rounded-xs text-[#94a3b8] hover:text-white transition ml-1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#1a202c] rounded-xs transition border border-transparent hover:border-[#2a3445]"
              title="在新分頁開啟原始圖片"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#202737] rounded-xs transition"
              title="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Image Area */}
        <div className="flex-1 overflow-auto bg-[#05070a] flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt={cleanTitle}
            referrerPolicy="no-referrer"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-full max-w-full object-contain transition-transform duration-150"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.alt = '圖片暫時無法載入，請確認網址或網路連線';
            }}
          />
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Lock, Compass, Mountain, BookOpen } from 'lucide-react';
import { SiteSettings } from '../types';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  activeRouteName?: string;
  siteSettings: SiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAdmin,
  isAdminLoggedIn,
  activeRouteName,
  siteSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#12161f]/95 backdrop-blur-md border-b border-[#242b38] text-[#f1f5f9] transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Editorial Brand Emblem & Title */}
          <a
            href="https://amazon-hike.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 sm:gap-4 group hover:opacity-90 transition-opacity"
            title="前往 亞馬遜國家山岳協會 (https://amazon-hike.com/)"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#10b981] group-hover:bg-[#059669] transition-colors flex items-center justify-center text-[#090b0f] font-serif text-lg sm:text-xl font-bold rounded-xs shadow-md flex-shrink-0">
              {siteSettings.logoInitial || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#f8fafc] group-hover:text-[#34d399] transition-colors">
                  {siteSettings.orgName || '亞馬遜國家山岳協會'}
                </h1>
                {siteSettings.badgeText && (
                  <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-xs bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                    {siteSettings.badgeText}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#94a3b8] uppercase tracking-wider font-mono">
                {siteSettings.subTitle || 'Sunriver Map Database ｜ Trip Planner'}
              </p>
            </div>
          </a>

          {/* Right actions: Route indicator & Admin Access */}
          <div className="flex items-center gap-3 sm:gap-4">
            {activeRouteName && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#1a202c] border border-[#2d3748] rounded-xs text-xs text-[#34d399] font-serif">
                <Compass className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="max-w-[180px] truncate font-medium text-[#e2e8f0]">{activeRouteName}</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] mr-1">
              <span className="text-[#34d399] border-b-2 border-[#10b981] pb-1 cursor-default">行程規劃</span>
            </div>

            <button
              type="button"
              id="admin-panel-btn"
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xs ${
                isAdminLoggedIn
                  ? 'bg-[#10b981] hover:bg-[#059669] text-[#090b0f] font-mono shadow-md'
                  : 'bg-[#1a202c] hover:bg-[#252d3d] text-[#f1f5f9] border border-[#334155] hover:border-[#10b981]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-current" />
              <span>{isAdminLoggedIn ? '後台管理 (已登入)' : '後台管理'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


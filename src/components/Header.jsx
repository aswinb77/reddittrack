import React from 'react';
import { Plus, RefreshCw, Sliders, Database, Sparkles } from 'lucide-react';

export default function Header({
  onOpenTrackModal,
  onSyncAll,
  isSyncing,
  onOpenSettings,
  onResetDemo,
  postsCount,
}) {
  return (
    <header className="border-b border-[#1E1E22] bg-[#0A0A0C]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand identity - CRED minimalist neo-brutalist typography */}
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-white text-black flex items-center justify-center font-black tracking-tighter text-sm font-mono select-none">
            RT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-[0.2em] uppercase">
                REDDIT·TRACK
              </span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 bg-[#18181B] border border-[#2B2B30] text-[#A1A1AA] uppercase">
                INTELLIGENCE
              </span>
            </div>
            <p className="text-[10px] tracking-widest text-[#71717A] uppercase mt-0.5 font-mono">
              Multi-Account Karma Optimization Engine
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onSyncAll}
            disabled={isSyncing || postsCount === 0}
            title="Refresh live Reddit statistics"
            className="flex items-center space-x-2 px-3 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B2B30] bg-[#121215] text-[#D4D4D8] hover:border-white hover:text-white transition-all disabled:opacity-40 disabled:hover:border-[#2B2B30]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'SYNCING...' : 'SYNC STATS'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Reddit API & Storage Settings"
            className="p-2 border border-[#2B2B30] bg-[#121215] text-[#A1A1AA] hover:border-white hover:text-white transition-all"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={onResetDemo}
            title="Load sample benchmark data"
            className="hidden md:flex items-center space-x-1 px-3 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B2B30] bg-[#121215] text-[#A1A1AA] hover:border-white hover:text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SAMPLE DATA</span>
          </button>

          {/* Primary CTA - CRED Signature stark monochrome contrast */}
          <button
            onClick={onOpenTrackModal}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase bg-white text-black hover:bg-neutral-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>TRACK POST</span>
          </button>
        </div>

      </div>
    </header>
  );
}


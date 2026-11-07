import React from 'react';
import { computeCrosspostMetrics, formatNumber } from '../utils/analytics';
import { GitBranch, ArrowRight, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

export default function CrosspostMatrix({ posts }) {
  const crossposts = computeCrosspostMetrics(posts);

  if (crossposts.length === 0) {
    return null;
  }

  return (
    <div className="border border-[#1E1E22] bg-[#0C0C0E]">
      <div className="p-4 sm:p-5 border-b border-[#1E1E22] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-white" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white font-mono">
            CROSSPOST MULTIPLIER MATRIX
          </h2>
        </div>
        <p className="text-[11px] font-mono text-[#71717A]">
          Direct comparison: Original Subreddit vs Crossposted Destination
        </p>
      </div>

      <div className="divide-y divide-[#1E1E22]">
        {crossposts.map((xp) => {
          return (
            <div key={xp.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#111114] transition-colors">
              
              {/* Left: Title & Accounts */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center space-x-2 text-[10px] font-mono tracking-wider">
                  <span className="text-[#A1A1AA] uppercase">{xp.accountTag}</span>
                  <span className="text-[#52525B]">•</span>
                  <span className="text-[#71717A]">CROSSPOST TRACKER</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                  {xp.title}
                </h3>
              </div>

              {/* Middle: Visual Pathway (Original Sub ➔ Crosspost Sub) */}
              <div className="flex items-center space-x-3 sm:space-x-5 py-2 px-3 bg-[#08080A] border border-[#1E1E22]">
                
                {/* Original */}
                <div className="text-left font-mono">
                  <div className="text-[9px] tracking-widest text-[#71717A] uppercase">ORIGINAL</div>
                  <div className="text-xs font-bold text-[#D4D4D8]">{xp.originalSub}</div>
                  <div className="text-xs font-semibold text-white">
                    {formatNumber(xp.originalScore)} <span className="text-[10px] text-[#71717A]">ups</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#71717A] shrink-0" />

                {/* Crosspost */}
                <div className="text-left font-mono">
                  <div className="text-[9px] tracking-widest text-[#71717A] uppercase">CROSSPOST</div>
                  <div className="text-xs font-bold text-white">{xp.crosspostSub}</div>
                  <div className="text-xs font-semibold text-white">
                    {formatNumber(xp.crosspostScore)} <span className="text-[10px] text-[#71717A]">ups</span>
                  </div>
                </div>

              </div>

              {/* Right: Multiplier badge */}
              <div className="flex items-center space-x-3">
                <div className="text-right font-mono">
                  <div className="text-[9px] tracking-widest text-[#71717A] uppercase">
                    YIELD RETENTION
                  </div>
                  <div className={`text-base font-black flex items-center space-x-1 justify-end ${
                    xp.outperformed ? 'text-emerald-400' : 'text-[#D4D4D8]'
                  }`}>
                    {xp.outperformed ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#71717A]" />
                    )}
                    <span>{xp.multiplier}%</span>
                  </div>
                </div>

                {xp.permalink && (
                  <a
                    href={xp.permalink}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on Reddit"
                    className="p-2 border border-[#2B2B30] text-[#A1A1AA] hover:text-white hover:border-white transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}


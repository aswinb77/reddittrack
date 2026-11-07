import React from 'react';
import { computeSubredditMetrics, formatNumber } from '../utils/analytics';
import { Target, ArrowUpRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function SubredditConcentration({ posts, selectedSub, onSelectSub }) {
  const metrics = computeSubredditMetrics(posts);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="border border-[#1E1E22] bg-[#0C0C0E]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#1E1E22] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-white" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white font-mono">
            SUBREDDIT CONCENTRATION MATRIX
          </h2>
        </div>
        <p className="text-[11px] font-mono text-[#71717A]">
          Calculates where to concentrate effort based on karma yield per post
        </p>
      </div>

      {/* Grid list of subreddits */}
      <div className="divide-y divide-[#1E1E22]">
        {metrics.map((sub, idx) => {
          const isSelected = selectedSub && selectedSub.toLowerCase() === sub.name.toLowerCase();

          return (
            <div
              key={sub.name}
              onClick={() => onSelectSub(isSelected ? null : sub.name)}
              className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors cursor-pointer ${
                isSelected ? 'bg-[#18181C] border-l-2 border-white' : 'hover:bg-[#111114]'
              }`}
            >
              {/* Left: Rank & Subreddit Name */}
              <div className="flex items-start sm:items-center space-x-3 min-w-[240px]">
                <span className="text-xs font-mono font-bold text-[#52525B] w-6">
                  #{idx + 1}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide font-mono hover:underline">
                      {sub.displayName}
                    </span>
                    {sub.crossposts > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[#2B2B30] text-[#A1A1AA]">
                        {sub.crossposts} CROSSPOST{sub.crossposts > 1 ? 'S' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-[#71717A] mt-0.5">
                    {sub.totalPosts} {sub.totalPosts === 1 ? 'post' : 'posts'} • Top: {formatNumber(sub.topScore)} upvotes
                  </div>
                </div>
              </div>

              {/* Middle: Performance Metric Pillars */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 text-left sm:text-right">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                    TOTAL KARMA
                  </div>
                  <div className="text-base font-bold text-white font-mono">
                    {formatNumber(sub.totalKarma)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                    AVG / POST
                  </div>
                  <div className="text-base font-bold text-white font-mono">
                    {formatNumber(sub.avgScore)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                    DISCUSSIONS
                  </div>
                  <div className="text-base font-bold text-white font-mono">
                    {formatNumber(sub.totalComments)}
                  </div>
                </div>
              </div>

              {/* Right: Recommendation Badge in CRED minimalist style */}
              <div className="flex items-center justify-between md:justify-end space-x-3 min-w-[170px]">
                {sub.tier === 'high' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>PRIMARY FOCUS</span>
                  </span>
                )}
                {sub.tier === 'medium' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold border border-[#3E3E47] text-[#D4D4D8] bg-[#18181C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span>PROMISING</span>
                  </span>
                )}
                {sub.tier === 'low' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold border border-rose-500/30 text-rose-400 bg-rose-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>DE-PRIORITIZE</span>
                  </span>
                )}
                {sub.tier === 'neutral' && (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-mono tracking-wider font-semibold border border-[#2B2B30] text-[#71717A]">
                    <span>EXPLORE</span>
                  </span>
                )}

                <button
                  type="button"
                  className="text-xs font-mono text-[#A1A1AA] hover:text-white"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer Insight Box */}
      <div className="p-4 bg-[#09090B] border-t border-[#1E1E22] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold">[ACTIONABLE ADVICE]</span>
          <span>
            {metrics[0] ? (
              <>Concentrate high-effort posts on <strong className="text-white">{metrics[0].displayName}</strong> (averaging {formatNumber(metrics[0].avgScore)} upvotes).</>
            ) : null}
          </span>
        </div>
        {selectedSub && (
          <button
            onClick={() => onSelectSub(null)}
            className="text-xs underline text-white hover:text-neutral-300"
          >
            Clear Sub Filter
          </button>
        )}
      </div>
    </div>
  );
}


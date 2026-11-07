import React from 'react';
import { computeAccountMetrics, formatNumber } from '../utils/analytics';
import { Users, Award, ExternalLink, ChevronRight } from 'lucide-react';

export default function AccountComparison({ posts, selectedAccount, onSelectAccount }) {
  const accounts = computeAccountMetrics(posts);

  if (accounts.length === 0) return null;

  return (
    <div className="border border-[#1E1E22] bg-[#0C0C0E]">
      <div className="p-4 sm:p-5 border-b border-[#1E1E22] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-white" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white font-mono">
            ACCOUNT PERFORMANCE MATRIX
          </h2>
        </div>
        <p className="text-[11px] font-mono text-[#71717A]">
          Compare engagement, alpha subreddits, and efficiency across your accounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1E1E22]">
        {accounts.map((acc, index) => {
          const isSelected = selectedAccount === acc.name;

          return (
            <div
              key={acc.name}
              onClick={() => onSelectAccount(isSelected ? null : acc.name)}
              className={`p-5 bg-[#0C0C0E] transition-all cursor-pointer flex flex-col justify-between ${
                isSelected ? 'ring-1 ring-white bg-[#141418]' : 'hover:bg-[#111114]'
              }`}
            >
              <div>
                {/* Account Tag / Label */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                    ACCOUNT #{index + 1}
                  </span>
                  {index === 0 && (
                    <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 border border-white/20 bg-white/10 text-white font-semibold">
                      HIGHEST KARMA
                    </span>
                  )}
                </div>

                <div className="text-base font-bold text-white font-mono tracking-tight truncate" title={acc.name}>
                  {acc.name}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#1E1E22] py-3">
                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                      TOTAL KARMA
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {formatNumber(acc.totalKarma)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase">
                      AVG / POST
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {formatNumber(acc.avgKarma)}
                    </div>
                  </div>
                </div>

                {/* Subreddit Affinity */}
                <div className="mt-3 text-xs font-mono">
                  <div className="text-[10px] tracking-widest text-[#71717A] uppercase mb-1">
                    PRIMARY SUBREDDIT
                  </div>
                  <span className="text-white font-semibold bg-[#18181B] px-2 py-0.5 border border-[#2B2B30]">
                    {acc.bestSubreddit}
                  </span>
                </div>

                {/* Top Post snippet */}
                {acc.topPost && (
                  <div className="mt-3 p-2.5 bg-[#08080A] border border-[#1E1E22] text-[11px] font-mono">
                    <div className="text-[9px] tracking-widest text-[#71717A] uppercase mb-1">
                      TOP POST ({formatNumber(acc.topPost.score)} UPVOTES)
                    </div>
                    <p className="text-white line-clamp-1">
                      {acc.topPost.title}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E1E22] flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                <span>{acc.totalPosts} {acc.totalPosts === 1 ? 'post' : 'posts'} tracked</span>
                <span className="text-white flex items-center space-x-1 group">
                  <span>{isSelected ? 'Viewing' : 'Filter by this'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


import React from 'react';
import { formatNumber } from '../utils/analytics';
import { ArrowUpRight, TrendingUp, Layers, Users, Zap } from 'lucide-react';

export default function StatSummaryMatrix({ posts }) {
  const totalKarma = posts.reduce((sum, p) => sum + (p.score || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.numComments || 0), 0);
  const totalPosts = posts.length;
  const avgKarma = totalPosts > 0 ? Math.round(totalKarma / totalPosts) : 0;

  // Subreddit counts
  const subreddits = new Set(posts.map(p => (p.subreddit || '').toLowerCase()));
  const accounts = new Set(posts.map(p => p.accountTag || p.author));

  // Find alpha subreddit
  const subKarmaMap = {};
  posts.forEach(p => {
    const s = p.subredditPrefixed || `r/${p.subreddit}`;
    subKarmaMap[s] = (subKarmaMap[s] || 0) + (p.score || 0);
  });
  let alphaSub = '—';
  let maxSubKarma = 0;
  for (const [sub, k] of Object.entries(subKarmaMap)) {
    if (k > maxSubKarma) {
      maxSubKarma = k;
      alphaSub = sub;
    }
  }

  // Crosspost ratio
  const crosspostCount = posts.filter(p => p.isCrosspost).length;
  const crosspostRate = totalPosts > 0 ? Math.round((crosspostCount / totalPosts) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E1E22] border border-[#1E1E22] p-px">
      
      {/* Box 1: Total Karma */}
      <div className="bg-[#0C0C0E] p-5 sm:p-6 transition-all hover:bg-[#111114]">
        <div className="flex items-center justify-between text-[#71717A] mb-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
            TOTAL KARMA ACCUMULATED
          </span>
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
          {formatNumber(totalKarma)}
        </div>
        <div className="mt-2 flex items-center space-x-2 text-[11px] text-[#A1A1AA] font-mono">
          <span className="text-white font-semibold">{totalComments.toLocaleString()}</span>
          <span>total comments across {totalPosts} posts</span>
        </div>
      </div>

      {/* Box 2: Average Karma / Efficiency */}
      <div className="bg-[#0C0C0E] p-5 sm:p-6 transition-all hover:bg-[#111114]">
        <div className="flex items-center justify-between text-[#71717A] mb-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
            AVG KARMA / POST
          </span>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
          {formatNumber(avgKarma)}
        </div>
        <div className="mt-2 flex items-center space-x-2 text-[11px] text-[#A1A1AA] font-mono">
          <span>{crosspostCount} crossposts ({crosspostRate}% of total)</span>
        </div>
      </div>

      {/* Box 3: Alpha Subreddit */}
      <div className="bg-[#0C0C0E] p-5 sm:p-6 transition-all hover:bg-[#111114]">
        <div className="flex items-center justify-between text-[#71717A] mb-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
            TOP PERFORMING SUBREDDIT
          </span>
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono truncate" title={alphaSub}>
          {alphaSub}
        </div>
        <div className="mt-2 flex items-center space-x-2 text-[11px] text-[#A1A1AA] font-mono">
          <span className="text-white font-semibold">{formatNumber(maxSubKarma)}</span>
          <span>upvotes from this subreddit</span>
        </div>
      </div>

      {/* Box 4: Active Accounts & Coverage */}
      <div className="bg-[#0C0C0E] p-5 sm:p-6 transition-all hover:bg-[#111114]">
        <div className="flex items-center justify-between text-[#71717A] mb-3">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-semibold">
            TRACKED ACCOUNTS & SUBS
          </span>
          <Users className="w-4 h-4 text-white" />
        </div>
        <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
          {accounts.size} <span className="text-lg font-normal text-[#52525B]">ACC</span>
        </div>
        <div className="mt-2 flex items-center space-x-2 text-[11px] text-[#A1A1AA] font-mono">
          <span>Active in {subreddits.size} unique subreddits</span>
        </div>
      </div>

    </div>
  );
}


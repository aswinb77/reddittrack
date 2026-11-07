import React, { useState } from 'react';
import { formatNumber, formatDate, getRelativeTime } from '../utils/analytics';
import { ArrowUp, MessageSquare, ThumbsUp, Calendar, ExternalLink, Edit2, Trash2, GitBranch, ArrowRight } from 'lucide-react';

export default function PostCard({ post, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCrosspost = Boolean(post.isCrosspost && post.crosspostParent);
  const parent = post.crosspostParent;

  return (
    <div className="border border-[#1E1E22] bg-[#0C0C0E] hover:border-[#383840] transition-all p-5 flex flex-col justify-between group">
      
      {/* Top Header: Subreddit, Account & Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subreddit badge */}
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#18181C] border border-[#2B2B30] text-white">
              {post.subredditPrefixed || `r/${post.subreddit}`}
            </span>

            {/* Account badge */}
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 border border-[#222226] text-[#A1A1AA] uppercase">
              {post.accountTag || `u/${post.author}`}
            </span>

            {/* Crosspost indicator tag */}
            {post.isCrosspost && (
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 border border-[#3E3E47] bg-[#141416] text-[#E4E4E7] flex items-center space-x-1">
                <GitBranch className="w-3 h-3" />
                <span>CROSSPOST</span>
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(post)}
              title="Edit metrics or account"
              className="p-1.5 text-[#71717A] hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {confirmDelete ? (
              <div className="flex items-center space-x-1 bg-red-950/40 border border-red-500/30 px-1 py-0.5">
                <button
                  onClick={() => onDelete(post.id)}
                  className="text-[10px] font-mono text-red-400 font-bold hover:underline px-1"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] font-mono text-[#A1A1AA] hover:text-white px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Remove from tracking"
                className="p-1.5 text-[#71717A] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <a
              href={post.permalink || post.originalUrl}
              target="_blank"
              rel="noreferrer"
              title="Open on Reddit"
              className="p-1.5 text-[#71717A] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Crosspost Origin Banner if applicable */}
        {isCrosspost && parent && (
          <div className="mb-3 px-3 py-2 bg-[#08080A] border-l-2 border-[#52525B] text-[11px] font-mono text-[#A1A1AA] flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span>Origin:</span>
              <span className="text-white font-semibold">r/{parent.subreddit}</span>
              <span>({formatNumber(parent.score)} ups)</span>
              <ArrowRight className="w-3 h-3 text-[#52525B]" />
              <span className="text-white font-semibold">r/{post.subreddit}</span>
            </div>
            {parent.score > 0 && (
              <span className={`text-[10px] font-bold ${
                post.score > parent.score ? 'text-emerald-400' : 'text-[#71717A]'
              }`}>
                {((post.score / parent.score) * 100).toFixed(0)}% yield
              </span>
            )}
          </div>
        )}

        {/* Post Title */}
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2 hover:text-neutral-200">
          <a href={post.permalink || post.originalUrl} target="_blank" rel="noreferrer">
            {post.title}
          </a>
        </h3>

        {/* User Notes */}
        {post.notes && (
          <p className="mt-2 text-xs text-[#A1A1AA] font-mono bg-[#09090B] p-2 border border-[#18181B] italic">
            "{post.notes}"
          </p>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="mt-5 pt-4 border-t border-[#1E1E22] flex items-center justify-between">
        
        {/* Left: Big Score & Ratio */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-white font-mono font-black text-xl tracking-tight">
            <ArrowUp className="w-5 h-5 text-white stroke-[2.5]" />
            <span>{formatNumber(post.score)}</span>
          </div>

          {post.upvoteRatio !== null && (
            <div className="text-[11px] font-mono text-[#71717A] flex items-center space-x-1">
              <ThumbsUp className="w-3 h-3 text-[#71717A]" />
              <span className="text-[#A1A1AA]">{post.upvoteRatio}%</span>
            </div>
          )}

          <div className="text-[11px] font-mono text-[#71717A] flex items-center space-x-1">
            <MessageSquare className="w-3 h-3 text-[#71717A]" />
            <span className="text-[#A1A1AA]">{formatNumber(post.numComments)}</span>
          </div>
        </div>

        {/* Right: Date Posted */}
        <div className="text-right text-[11px] font-mono text-[#71717A]">
          <div className="text-[#A1A1AA]">{formatDate(post.createdAt || post.createdUtc)}</div>
          <div className="text-[10px]">{getRelativeTime(post.createdAt || post.createdUtc)}</div>
        </div>

      </div>

    </div>
  );
}


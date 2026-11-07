import React, { useState, useEffect } from 'react';
import { X, Save, GitBranch, ArrowRight } from 'lucide-react';

export default function EditPostModal({ isOpen, onClose, post, onSave }) {
  const [title, setTitle] = useState('');
  const [accountTag, setAccountTag] = useState('');
  const [score, setScore] = useState(0);
  const [numComments, setNumComments] = useState(0);
  const [upvoteRatio, setUpvoteRatio] = useState(95);
  const [subreddit, setSubreddit] = useState('');
  const [notes, setNotes] = useState('');
  const [isCrosspost, setIsCrosspost] = useState(false);
  const [parentSub, setParentSub] = useState('');
  const [parentScore, setParentScore] = useState(0);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setAccountTag(post.accountTag || '');
      setScore(post.score || 0);
      setNumComments(post.numComments || 0);
      setUpvoteRatio(post.upvoteRatio !== null && post.upvoteRatio !== undefined ? post.upvoteRatio : 95);
      setSubreddit(post.subreddit || '');
      setNotes(post.notes || '');
      setIsCrosspost(Boolean(post.isCrosspost));
      if (post.crosspostParent) {
        setParentSub(post.crosspostParent.subreddit || '');
        setParentScore(post.crosspostParent.score || 0);
      } else {
        setParentSub('');
        setParentScore(0);
      }
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(post.id, {
      title,
      accountTag,
      score: parseInt(score, 10) || 0,
      ups: parseInt(score, 10) || 0,
      numComments: parseInt(numComments, 10) || 0,
      upvoteRatio: parseInt(upvoteRatio, 10) || 95,
      subreddit: subreddit.replace(/^r\//, ''),
      subredditPrefixed: subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`,
      notes,
      isCrosspost,
      crosspostParent: isCrosspost ? {
        subreddit: parentSub.replace(/^r\//, ''),
        score: parseInt(parentScore, 10) || 0,
        title: post.crosspostParent?.title || title,
        permalink: post.crosspostParent?.permalink || '',
      } : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0C0C0E] border border-[#2B2B30] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        <div className="p-5 border-b border-[#1E1E22] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-white"></span>
            <h3 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">
              EDIT POST METRICS
            </h3>
          </div>
          <button onClick={onClose} className="text-[#71717A] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
              TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                SUBREDDIT
              </label>
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                required
                className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                ACCOUNT ALIAS
              </label>
              <input
                type="text"
                value={accountTag}
                onChange={(e) => setAccountTag(e.target.value)}
                required
                className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                UPVOTES
              </label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                COMMENTS
              </label>
              <input
                type="number"
                value={numComments}
                onChange={(e) => setNumComments(e.target.value)}
                className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                RATIO %
              </label>
              <input
                type="number"
                value={upvoteRatio}
                onChange={(e) => setUpvoteRatio(e.target.value)}
                className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {/* Crosspost settings */}
          <div className="p-3 bg-[#08080A] border border-[#1E1E22]">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCrosspost}
                onChange={(e) => setIsCrosspost(e.target.checked)}
                className="w-4 h-4 rounded-none bg-black border-[#333] accent-white"
              />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                FLAG AS CROSSPOST
              </span>
            </label>

            {isCrosspost && (
              <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-[#1E1E22]">
                <div>
                  <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                    ORIGINAL SUBREDDIT
                  </label>
                  <input
                    type="text"
                    value={parentSub}
                    onChange={(e) => setParentSub(e.target.value)}
                    placeholder="reactjs"
                    className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                    ORIGINAL UPVOTES
                  </label>
                  <input
                    type="number"
                    value={parentScore}
                    onChange={(e) => setParentScore(e.target.value)}
                    placeholder="1840"
                    className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
              NOTES & STRATEGY INSIGHT
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#1E1E22] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-mono font-bold tracking-[0.15em] uppercase bg-white text-black hover:bg-neutral-200 transition-all"
            >
              UPDATE METRICS
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}


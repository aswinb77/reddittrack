import React, { useState } from 'react';
import { X, Plus, Layers, GitBranch, AlertCircle, Check } from 'lucide-react';

export default function TrackPostModal({ isOpen, onClose, onAddPosts, existingAccounts, existingSubs }) {
  const [mode, setMode] = useState('url'); // 'url' or 'manual'
  const [urlInput, setUrlInput] = useState('');
  const [accountTag, setAccountTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualSub, setManualSub] = useState('');
  const [manualScore, setManualScore] = useState('');
  const [manualComments, setManualComments] = useState('');
  const [manualRatio, setManualRatio] = useState('95');
  const [isCrosspost, setIsCrosspost] = useState(false);
  const [parentSub, setParentSub] = useState('');
  const [parentScore, setParentScore] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please enter at least one Reddit post link.');
        }

        await onAddPosts({
          url: urlInput.trim(),
          accountTag: accountTag.trim(),
          notes: notes.trim(),
        });
      } else {
        if (!manualTitle.trim() || !manualSub.trim()) {
          throw new Error('Title and Subreddit are required for manual post creation.');
        }

        const manualData = {
          title: manualTitle.trim(),
          subreddit: manualSub.trim(),
          score: parseInt(manualScore || 0, 10),
          numComments: parseInt(manualComments || 0, 10),
          upvoteRatio: parseInt(manualRatio || 95, 10),
          accountTag: accountTag.trim() || 'My Account',
          isCrosspost,
          crosspostParent: isCrosspost && parentSub ? {
            subreddit: parentSub.replace(/^r\//, '').trim(),
            score: parseInt(parentScore || 0, 10),
            title: `Original post in r/${parentSub.replace(/^r\//, '').trim()}`,
          } : null,
          notes: notes.trim(),
        };

        await onAddPosts({ manualData });
      }

      // Reset and close
      setUrlInput('');
      setAccountTag('');
      setNotes('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to track post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0C0C0E] border border-[#2B2B30] w-full max-w-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E1E22] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-white"></span>
            <h3 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">
              TRACK NEW REDDIT POST
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle: Auto Ingestion vs Manual */}
        <div className="grid grid-cols-2 p-1 bg-[#08080A] border-b border-[#1E1E22]">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`py-2 text-[11px] font-mono tracking-wider uppercase font-semibold transition-all ${
              mode === 'url' ? 'bg-[#18181C] text-white border border-[#2B2B30]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            AUTO CRAWL (LINK / BATCH)
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`py-2 text-[11px] font-mono tracking-wider uppercase font-semibold transition-all ${
              mode === 'manual' ? 'bg-[#18181C] text-white border border-[#2B2B30]' : 'text-[#71717A] hover:text-white'
            }`}
          >
            MANUAL ENTRY / OFFLINE
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mx-5 mt-4 bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {mode === 'url' ? (
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                REDDIT POST URL(S) *
              </label>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.reddit.com/r/reactjs/comments/1ch3z8c/react_19_beta/&#10;https://redd.it/1dp8901&#10;(Paste multiple URLs separated by newlines)"
                rows={4}
                required
                className="w-full bg-[#08080A] border border-[#222226] text-white p-3 text-xs font-mono focus:border-white focus:outline-none placeholder:text-[#52525B]"
              />
              <p className="text-[10px] font-mono text-[#71717A] mt-1">
                Supports standard posts, /s/ share links, and crosspost permalinks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                  POST TITLE *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. How we scaled our serverless backend to 10M requests"
                  required
                  className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                    SUBREDDIT *
                  </label>
                  <input
                    type="text"
                    value={manualSub}
                    onChange={(e) => setManualSub(e.target.value)}
                    placeholder="e.g. webdev or r/webdev"
                    required
                    className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                    UPVOTES (SCORE)
                  </label>
                  <input
                    type="number"
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    placeholder="e.g. 840"
                    className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                    COMMENTS COUNT
                  </label>
                  <input
                    type="number"
                    value={manualComments}
                    onChange={(e) => setManualComments(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
                    UPVOTE RATIO (%)
                  </label>
                  <input
                    type="number"
                    value={manualRatio}
                    onChange={(e) => setManualRatio(e.target.value)}
                    placeholder="e.g. 96"
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
                    THIS POST IS A CROSSPOST
                  </span>
                </label>

                {isCrosspost && (
                  <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-[#1E1E22]">
                    <div>
                      <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                        ORIGIN SUBREDDIT
                      </label>
                      <input
                        type="text"
                        value={parentSub}
                        onChange={(e) => setParentSub(e.target.value)}
                        placeholder="e.g. r/reactjs"
                        className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                        ORIGIN UPVOTES
                      </label>
                      <input
                        type="number"
                        value={parentScore}
                        onChange={(e) => setParentScore(e.target.value)}
                        placeholder="e.g. 1840"
                        className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Tagging */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
              POSTING ACCOUNT ALIAS / TAG
            </label>
            <input
              type="text"
              value={accountTag}
              onChange={(e) => setAccountTag(e.target.value)}
              placeholder="e.g. Main Dev Account, Growth Alt, Tech Handle"
              className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
            />
            {existingAccounts && existingAccounts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-mono text-[#71717A]">Quick pick:</span>
                {existingAccounts.map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setAccountTag(acc)}
                    className="text-[10px] font-mono px-2 py-0.5 bg-[#141416] border border-[#222226] text-[#A1A1AA] hover:text-white hover:border-[#444]"
                  >
                    {acc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Personal Strategy Notes */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1.5 font-semibold">
              STRATEGY NOTES / TAKEAWAYS (OPTIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. High comments, great discussion on server actions"
              className="w-full bg-[#08080A] border border-[#222226] text-white p-2.5 text-xs font-mono focus:border-white focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-mono font-bold tracking-[0.15em] uppercase bg-white text-black hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'INGESTING...' : 'SAVE & TRACK'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}


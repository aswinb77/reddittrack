import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUp,
  RefreshCw,
  Plus,
  ExternalLink,
  Trash2,
  GitBranch,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

// Deterministic vibrant colors for subreddits matching the screenshots
const SUBREDDIT_COLORS = [
  { bg: 'bg-[#FF4500]', hex: '#FF4500', name: 'orange' },
  { bg: 'bg-[#2563EB]', hex: '#2563EB', name: 'blue' },
  { bg: 'bg-[#10B981]', hex: '#10B981', name: 'green' },
  { bg: 'bg-[#8B5CF6]', hex: '#8B5CF6', name: 'purple' },
  { bg: 'bg-[#EC4899]', hex: '#EC4899', name: 'pink' },
  { bg: 'bg-[#06B6D4]', hex: '#06B6D4', name: 'cyan' },
];

function getSubColor(subName) {
  const clean = (subName || '').toLowerCase().replace(/^r\//, '');
  if (clean === 'natureisfuckingcute') return SUBREDDIT_COLORS[0]; // Orange
  if (clean === 'reptiles') return SUBREDDIT_COLORS[1]; // Blue
  if (clean === 'appliedbiology') return SUBREDDIT_COLORS[2]; // Green
  
  // Hash for any other subreddit
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % SUBREDDIT_COLORS.length;
  return SUBREDDIT_COLORS[idx];
}

function getAvatarColor(letter) {
  const l = (letter || 'A').toUpperCase();
  if (['N', 'M', 'O'].includes(l)) return 'bg-[#1E3A8A] text-[#93C5FD]'; // Blue
  if (['R', 'S', 'T'].includes(l)) return 'bg-[#064E3B] text-[#6EE7B7]'; // Green
  if (['A', 'B', 'C'].includes(l)) return 'bg-[#581C87] text-[#D8B4FE]'; // Purple
  if (['F', 'E', 'D'].includes(l)) return 'bg-[#7C2D12] text-[#FDBA74]'; // Amber
  return 'bg-[#1F2937] text-[#E5E7EB]';
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Ingestion bar state
  const [inputUrl, setInputUrl] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('Northdraw');
  const [newAccountInput, setNewAccountInput] = useState('');
  const [isCrosspostInput, setIsCrosspostInput] = useState(false);
  const [inputScore, setInputScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showIngestionModal, setShowIngestionModal] = useState(false);

  // Filters
  const [activeAccountFilter, setActiveAccountFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'crossposts', 'originals'
  const [sortBy, setSortBy] = useState('score_desc'); // 'score_desc', 'newest'

  // Selected tile for preview
  const [selectedTilePostId, setSelectedTilePostId] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Accounts with counts
  const accountsData = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      const acc = (p.accountTag || p.author || 'Main Account').trim();
      counts[acc] = (counts[acc] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [posts]);

  const accountsList = useMemo(() => {
    return accountsData.map((a) => a.name);
  }, [accountsData]);

  // Set default account selection
  useEffect(() => {
    if (accountsList.length > 0 && !accountsList.includes(selectedAccount)) {
      setSelectedAccount(accountsList[0]);
    }
  }, [accountsList]);

  // Handle adding new post
  const handleTrackPost = async (e) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    const accountToUse = selectedAccount === '__NEW__'
      ? (newAccountInput.trim() || 'Northdraw')
      : (selectedAccount || 'Northdraw');

    setIsSubmitting(true);
    showToast(`Fetching post details from Reddit...`, 'info');

    try {
      const payload = {
        url: inputUrl.trim(),
        accountTag: accountToUse,
        initialScore: inputScore.trim() !== '' ? parseInt(inputScore, 10) : undefined,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 409 || data.alreadyExists) {
          showToast(data.error || 'Post already exists in your Karma Map!', 'error');
          return;
        }
        throw new Error(data.error || 'Failed to fetch Reddit post');
      }

      // If user toggled crosspost
      if (isCrosspostInput && data.results && data.results.length > 0) {
        const added = data.results[0];
        await fetch(`/api/posts/${added.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isCrosspost: true,
            crosspostParent: {
              subreddit: 'original',
              score: 0,
              title: added.title,
            },
          }),
        });
      }

      await fetchPosts();
      setInputUrl('');
      setInputScore('');
      setIsCrosspostInput(false);
      setShowIngestionModal(false);
      if (selectedAccount === '__NEW__') {
        setSelectedAccount(accountToUse);
        setNewAccountInput('');
      }
      showToast('Post added to Karma Map!', 'success');
    } catch (err) {
      showToast(err.message || 'Error tracking post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-sync all posts
  const handleSyncAll = async () => {
    setIsSyncing(true);
    showToast('Syncing all posts with live Reddit scores...', 'info');
    try {
      const res = await fetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: [] }),
      });
      const data = await res.json();
      if (data.success && data.allPosts) {
        setPosts(data.allPosts);
        showToast(`Refreshed ${data.syncedCount ?? data.allPosts.length} posts with latest scores!`, 'success');
      } else {
        throw new Error(data.error || 'Failed to sync stats');
      }
    } catch (err) {
      showToast(err.message || 'Failed to sync latest stats', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete post
  const handleDeletePost = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('Post removed', 'info');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  // Filtered posts based on account & type
  const accountFilteredPosts = useMemo(() => {
    if (activeAccountFilter === 'ALL') return posts;
    return posts.filter(
      (p) => (p.accountTag || p.author || '').toLowerCase() === activeAccountFilter.toLowerCase()
    );
  }, [posts, activeAccountFilter]);

  const filteredPosts = useMemo(() => {
    return accountFilteredPosts.filter((p) => {
      if (typeFilter === 'crossposts' && !p.isCrosspost) return false;
      if (typeFilter === 'originals' && p.isCrosspost) return false;
      return true;
    });
  }, [accountFilteredPosts, typeFilter]);

  // Ranked posts
  const rankedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'newest') {
        const tA = a.createdUtc ? a.createdUtc * 1000 : new Date(a.createdAt).getTime();
        const tB = b.createdUtc ? b.createdUtc * 1000 : new Date(b.createdAt).getTime();
        return tB - tA;
      }
      return 0;
    });
  }, [filteredPosts, sortBy]);

  // Highest score post across all posts (for "Top post" badge)
  const topScore = useMemo(() => {
    if (posts.length === 0) return 0;
    return Math.max(...posts.map((p) => p.score || 0));
  }, [posts]);

  // Analytics for the Hero Headline
  const heroAnalytics = useMemo(() => {
    if (posts.length === 0) return null;

    let totalKarma = 0;
    let crosspostKarma = 0;
    let crosspostCount = 0;
    let originalKarma = 0;
    let originalCount = 0;
    const subKarmaMap = {};

    posts.forEach((p) => {
      const score = p.score || 0;
      totalKarma += score;
      const sub = (p.subreddit || 'general').toLowerCase();
      const dispSub = p.subredditPrefixed || `r/${p.subreddit}`;

      if (!subKarmaMap[sub]) {
        subKarmaMap[sub] = { name: dispSub, clean: sub, score: 0, count: 0, xpScore: 0, xpCount: 0 };
      }
      subKarmaMap[sub].score += score;
      subKarmaMap[sub].count += 1;

      if (p.isCrosspost) {
        crosspostKarma += score;
        crosspostCount += 1;
        subKarmaMap[sub].xpScore += score;
        subKarmaMap[sub].xpCount += 1;
      } else {
        originalKarma += score;
        originalCount += 1;
      }
    });

    // Best subreddit calculation
    const subsList = Object.values(subKarmaMap);
    subsList.sort((a, b) => b.score - a.score);
    const bestSub = subsList[0]?.name || 'r/NatureIsFuckingCute';

    const avgCrosspost = crosspostCount > 0 ? Math.round(crosspostKarma / crosspostCount) : 0;
    const avgOriginal = originalCount > 0 ? Math.round(originalKarma / originalCount) : 0;
    const multiplier = avgOriginal > 0 && avgCrosspost > 0
      ? (avgCrosspost / avgOriginal).toFixed(1)
      : '5.7';

    return {
      bestSub,
      multiplier,
      avgCrosspost: avgCrosspost || 440,
      avgOriginal: avgOriginal || 77,
      totalKarma,
    };
  }, [posts]);

  // Subreddit columns for the Tilemap
  const subredditColumns = useMemo(() => {
    const map = {};
    accountFilteredPosts.forEach((p) => {
      const sub = (p.subreddit || 'general').toLowerCase();
      const dispSub = p.subredditPrefixed || `r/${p.subreddit}`;
      if (!map[sub]) {
        map[sub] = {
          name: dispSub,
          clean: sub,
          color: getSubColor(sub),
          totalScore: 0,
          posts: [],
        };
      }
      map[sub].totalScore += p.score || 0;
      map[sub].posts.push(p);
    });

    return Object.values(map)
      .map((col) => ({
        ...col,
        posts: col.posts.sort((a, b) => (b.score || 0) - (a.score || 0)),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [accountFilteredPosts]);

  // Current selected tile post for preview
  const activeTilePost = useMemo(() => {
    if (selectedTilePostId) {
      const found = posts.find((p) => p.id === selectedTilePostId);
      if (found) return found;
    }
    // Default to highest upvoted post
    if (rankedPosts.length > 0) {
      return rankedPosts[0];
    }
    return null;
  }, [posts, rankedPosts, selectedTilePostId]);

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] font-sans selection:bg-white selection:text-black">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#16181F] border border-[#2B303C] text-white px-4 py-2.5 text-xs font-medium rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="border-b border-[#14161F] bg-[#0A0B0E]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-[#FF4500] rounded-lg flex items-center justify-center text-white font-black text-sm select-none shadow-sm">
              ↑
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              Karma Map
            </span>
          </div>

          {/* Account Filter Pills + Sync + Track Post button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center bg-[#13151C] p-1 rounded-full border border-[#1E222D]">
              <button
                onClick={() => setActiveAccountFilter('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  activeAccountFilter === 'ALL'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#8F94A6] hover:text-white'
                }`}
              >
                All accounts
              </button>
              {accountsList.map((acc) => (
                <button
                  key={acc}
                  onClick={() => setActiveAccountFilter(acc)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-all ${
                    activeAccountFilter.toLowerCase() === acc.toLowerCase()
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8F94A6] hover:text-white'
                  }`}
                >
                  {acc}
                </button>
              ))}
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                title="Sync all stats"
                className="p-1.5 text-[#8F94A6] hover:text-white rounded-full transition-colors ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`} />
              </button>
            </div>

            {/* + Track post Button */}
            <button
              onClick={() => {
                setShowIngestionModal(!showIngestionModal);
                // Also focus input on page
                const el = document.getElementById('main-url-input');
                if (el) el.focus();
              }}
              className="bg-[#FF4500] hover:bg-[#E03D00] text-white font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <span>+ Track post</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* INGESTION BAR (Matches Screenshot 3) */}
        <div className="bg-[#12141A] border border-[#1F232D] rounded-full p-1.5 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
          
          {/* URL Input */}
          <div className="flex-1 w-full pl-3 pr-2">
            <input
              id="main-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrackPost()}
              placeholder="Paste a Reddit link or mobile share link"
              className="w-full bg-transparent text-sm text-white placeholder-[#5A6072] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end pr-1">
            
            {/* Account Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="bg-[#1C1F28] hover:bg-[#252936] text-white text-xs font-medium px-3.5 py-2 rounded-full flex items-center space-x-1.5 border border-[#2B303E] transition-colors"
              >
                <span className="capitalize">{selectedAccount === '__NEW__' ? (newAccountInput || 'New account') : selectedAccount}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8F94A6]" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#181A22] border border-[#282D3B] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in">
                  <div className="text-[10px] text-[#6E7487] font-semibold px-2.5 py-1 uppercase tracking-wider">
                    Select Account
                  </div>
                  {accountsList.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => {
                        setSelectedAccount(acc);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between ${
                        selectedAccount === acc
                          ? 'bg-white text-black font-semibold'
                          : 'text-[#D1D5DB] hover:bg-[#222530]'
                      }`}
                    >
                      <span className="capitalize">{acc}</span>
                      {selectedAccount === acc && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccount('__NEW__');
                      setShowAccountDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl text-[#FF4500] hover:bg-[#222530] font-semibold mt-1 flex items-center space-x-1"
                  >
                    <span>+ Add New Account</span>
                  </button>
                </div>
              )}
            </div>

            {selectedAccount === '__NEW__' && (
              <input
                type="text"
                value={newAccountInput}
                onChange={(e) => setNewAccountInput(e.target.value)}
                placeholder="Account name"
                className="bg-[#1C1F28] text-white text-xs px-3 py-1.5 rounded-full border border-[#FF4500] w-28 focus:outline-none"
              />
            )}

            {/* Crosspost Toggle */}
            <label className="flex items-center space-x-1.5 cursor-pointer select-none text-xs text-[#8F94A6] hover:text-white px-2">
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                isCrosspostInput ? 'border-white bg-white' : 'border-[#4B5263] bg-transparent'
              }`}>
                {isCrosspostInput && <span className="w-1.5 h-1.5 rounded-full bg-black"></span>}
              </span>
              <input
                type="checkbox"
                checked={isCrosspostInput}
                onChange={(e) => setIsCrosspostInput(e.target.checked)}
                className="hidden"
              />
              <span>Crosspost</span>
            </label>

            {/* Optional Score input */}
            <input
              type="number"
              value={inputScore}
              onChange={(e) => setInputScore(e.target.value)}
              placeholder="Upvotes (a^"
              className="bg-[#1C1F28] text-white text-xs px-3 py-1.5 rounded-full border border-[#2B303E] w-28 focus:outline-none placeholder-[#5A6072]"
            />

            {/* Track Post Button */}
            <button
              onClick={handleTrackPost}
              disabled={isSubmitting || !inputUrl.trim()}
              className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all disabled:opacity-40 whitespace-nowrap active:scale-95"
            >
              {isSubmitting ? 'Tracking...' : 'Track post'}
            </button>

          </div>
        </div>

        {/* HERO RECOMMENDATION HEADLINE */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Post in {heroAnalytics ? heroAnalytics.bestSub : 'r/NatureIsFuckingCute'} next.
          </h1>
          <p className="text-xs sm:text-sm text-[#8F94A6]">
            Crossposts earn <strong className="text-white font-bold">{heroAnalytics ? heroAnalytics.multiplier : '5.7'}×</strong> more upvotes than originals ({heroAnalytics ? heroAnalytics.avgCrosspost : 440} vs {heroAnalytics ? heroAnalytics.avgOriginal : 77} on average). Total so far: <strong className="text-white font-bold">{(heroAnalytics ? heroAnalytics.totalKarma : 1032).toLocaleString()} upvotes</strong>.
          </p>
        </div>

        {/* TILE MAP CONTROLS ROW */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#6E7487]">
            Every tile is a post. Bigger tile, more upvotes.
          </div>

          {/* Filter tabs: All, Crossposts, Originals */}
          <div className="flex items-center bg-[#13151C] p-1 rounded-full border border-[#1E222D]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#8F94A6] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('crossposts')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                typeFilter === 'crossposts'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#8F94A6] hover:text-white'
              }`}
            >
              Crossposts
            </button>
            <button
              onClick={() => setTypeFilter('originals')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                typeFilter === 'originals'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#8F94A6] hover:text-white'
              }`}
            >
              Originals
            </button>
          </div>
        </div>

        {/* THE KARMA MAP (TREEMAP COLUMNS) */}
        {subredditColumns.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[380px]">
              {subredditColumns.map((col) => {
                const totalColScore = col.posts.reduce((sum, p) => sum + (p.score || 0), 0) || 1;

                return (
                  <div key={col.clean} className="flex flex-col space-y-2">
                    
                    {/* Subreddit Column Header */}
                    <div className="flex items-center justify-between text-xs px-1 text-white">
                      <span className="font-semibold truncate max-w-[180px]">{col.name}</span>
                      <span className="text-[#8F94A6] font-mono">{col.totalScore}</span>
                    </div>

                    {/* Column Tiles Container */}
                    <div className="flex-1 flex flex-col gap-2">
                      {col.posts.map((post) => {
                        const isDimmed =
                          (typeFilter === 'crossposts' && !post.isCrosspost) ||
                          (typeFilter === 'originals' && post.isCrosspost);
                        const isSelected = activeTilePost && activeTilePost.id === post.id;
                        // Proportional height in column
                        const ratio = Math.max(0.2, (post.score || 0) / totalColScore);
                        const flexGrow = Math.round(ratio * 10);

                        return (
                          <div
                            key={post.id}
                            onClick={() => setSelectedTilePostId(post.id)}
                            style={{ flex: flexGrow, minHeight: '120px' }}
                            className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all relative overflow-hidden select-none ${
                              isDimmed
                                ? 'bg-[#181A20] opacity-30 text-[#4B5263]'
                                : col.color.bg + ' text-white hover:brightness-105'
                            } ${
                              isSelected
                                ? 'border-2 border-white ring-2 ring-white/20'
                                : 'border border-transparent'
                            }`}
                          >
                            {/* Top row: Upvote score & Crosspost badge */}
                            <div className="flex items-start justify-between">
                              <span className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-sans">
                                {(post.score || 0).toLocaleString()}
                              </span>
                              
                              {post.isCrosspost && !isDimmed && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                                  Crosspost
                                </span>
                              )}
                            </div>

                            {/* Bottom row: Title */}
                            <div className="text-xs font-semibold line-clamp-2 mt-4 leading-snug">
                              {post.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* SELECTED TILE POST PREVIEW CARD (Matches bottom of Screenshot 2 & 3) */}
            {activeTilePost && (
              <div className="bg-[#12141A] border border-[#1E222D] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                <div className="flex items-center space-x-3">
                  {/* Vertical orange bar */}
                  <div className="w-1.5 h-10 bg-[#FF4500] rounded-full shrink-0"></div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {activeTilePost.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-[#8F94A6] mt-0.5">
                      <span>{activeTilePost.subredditPrefixed || `r/${activeTilePost.subreddit}`}</span>
                      <span>by {activeTilePost.accountTag || `u/${activeTilePost.author}`}</span>
                      {activeTilePost.isCrosspost && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#064E3B] text-[#34D399] border border-[#059669]/30">
                          Crosspost
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pl-4 sm:pl-0">
                  <div className="flex items-center space-x-1.5 text-white">
                    <span className="text-[#FF4500] font-black text-xl leading-none">↑</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
                      {(activeTilePost.score || 0).toLocaleString()}
                    </span>
                  </div>

                  <a
                    href={activeTilePost.permalink || activeTilePost.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#1C1F28] hover:bg-[#252936] text-white text-xs font-semibold px-3.5 py-2 rounded-full border border-[#2B303E] flex items-center space-x-1 transition-colors"
                  >
                    <span>Open on Reddit</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8F94A6]" />
                  </a>

                  <button
                    onClick={(e) => handleDeletePost(activeTilePost.id, e)}
                    title="Delete post"
                    className="p-2 text-[#6E7487] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-[#1E222D] bg-[#12141A] rounded-2xl space-y-2">
            <div className="text-sm font-bold text-white">No posts tracked yet</div>
            <p className="text-xs text-[#8F94A6]">Paste a Reddit link in the input bar above to populate your Karma Map.</p>
          </div>
        )}

        {/* ALL POSTS LIST VIEW (Matches Screenshot 1) */}
        <div className="space-y-3 pt-6 border-t border-[#14161F]">
          
          {/* Header Row: "All posts • 4", Tabs & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>All posts</span>
              <span className="text-[#6E7487]">•</span>
              <span className="text-[#8F94A6]">{rankedPosts.length}</span>
            </h2>

            <div className="flex items-center space-x-2">
              {/* Filter tabs */}
              <div className="flex items-center bg-[#13151C] p-1 rounded-full border border-[#1E222D]">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    typeFilter === 'all'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8F94A6] hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('crossposts')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    typeFilter === 'crossposts'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8F94A6] hover:text-white'
                  }`}
                >
                  Crossposts
                </button>
                <button
                  onClick={() => setTypeFilter('originals')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    typeFilter === 'originals'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-[#8F94A6] hover:text-white'
                  }`}
                >
                  Originals
                </button>
              </div>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#13151C] text-xs font-medium text-white px-3 py-1.5 rounded-full border border-[#1E222D] focus:outline-none cursor-pointer"
                >
                  <option value="score_desc" className="bg-[#12141A]">Most upvotes</option>
                  <option value="newest" className="bg-[#12141A]">Newest first</option>
                </select>
              </div>
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2">
            {rankedPosts.map((post) => {
              const firstLetter = (post.subreddit || 'N')[0].toUpperCase();
              const avatarCls = getAvatarColor(firstLetter);
              const isTopPost = post.score === topScore && topScore > 0;

              return (
                <div
                  key={post.id}
                  className="bg-[#0E1015] border border-[#1A1D26] hover:border-[#282D3B] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  
                  {/* Left: Avatar + Title + Subtitle + Badges */}
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarCls}`}>
                      {firstLetter}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate hover:underline">
                        <a href={post.permalink || post.originalUrl} target="_blank" rel="noreferrer">
                          {post.title}
                        </a>
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8F94A6]">
                        <span>{post.subredditPrefixed || `r/${post.subreddit}`}</span>
                        <span>by {post.accountTag || `u/${post.author}`}</span>

                        {post.isCrosspost && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#064E3B] text-[#34D399] border border-[#059669]/30">
                            Crosspost
                          </span>
                        )}

                        {isTopPost && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#78350F]/40 text-[#F59E0B] border border-[#B45309]/30">
                            Top post
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Upvotes + Open Icon */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center space-x-1.5 text-white">
                      <span className="text-[#FF4500] font-black text-lg">↑</span>
                      <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                        {(post.score || 0).toLocaleString()}
                      </span>
                    </div>

                    <a
                      href={post.permalink || post.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open on Reddit"
                      className="p-1.5 text-[#8F94A6] hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={(e) => handleDeletePost(post.id, e)}
                      title="Delete"
                      className="p-1.5 text-[#6E7487] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </main>

    </div>
  );
}

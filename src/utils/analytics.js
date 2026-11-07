/**
 * Analytics and Data Aggregation Utilities
 */

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString();
}

export function formatDate(dateStringOrTimestamp) {
  if (!dateStringOrTimestamp) return '—';
  const date = typeof dateStringOrTimestamp === 'number'
    ? new Date(dateStringOrTimestamp * 1000)
    : new Date(dateStringOrTimestamp);
  
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getRelativeTime(dateStringOrTimestamp) {
  if (!dateStringOrTimestamp) return '';
  const date = typeof dateStringOrTimestamp === 'number'
    ? new Date(dateStringOrTimestamp * 1000)
    : new Date(dateStringOrTimestamp);

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

/**
 * Computes analytics across all accounts
 */
export function computeAccountMetrics(posts) {
  const map = {};

  posts.forEach((post) => {
    const acc = post.accountTag || `u/${post.author}` || 'Default';
    if (!map[acc]) {
      map[acc] = {
        name: acc,
        totalPosts: 0,
        totalKarma: 0,
        totalComments: 0,
        subreddits: {},
        topPost: null,
      };
    }

    map[acc].totalPosts += 1;
    map[acc].totalKarma += post.score || 0;
    map[acc].totalComments += post.numComments || 0;

    const sub = post.subreddit || 'general';
    map[acc].subreddits[sub] = (map[acc].subreddits[sub] || 0) + (post.score || 0);

    if (!map[acc].topPost || (post.score || 0) > (map[acc].topPost.score || 0)) {
      map[acc].topPost = post;
    }
  });

  return Object.values(map).map((acc) => {
    // Find best subreddit for this account
    let bestSub = '—';
    let maxKarma = -1;
    for (const [sub, karma] of Object.entries(acc.subreddits)) {
      if (karma > maxKarma) {
        maxKarma = karma;
        bestSub = `r/${sub}`;
      }
    }

    return {
      ...acc,
      avgKarma: acc.totalPosts > 0 ? Math.round(acc.totalKarma / acc.totalPosts) : 0,
      bestSubreddit: bestSub,
    };
  }).sort((a, b) => b.totalKarma - a.totalKarma);
}

/**
 * Computes subreddit leaderboard & concentration recommendations
 */
export function computeSubredditMetrics(posts) {
  const map = {};

  posts.forEach((post) => {
    const sub = (post.subreddit || 'general').toLowerCase();
    if (!map[sub]) {
      map[sub] = {
        name: sub,
        displayName: post.subredditPrefixed || `r/${sub}`,
        totalPosts: 0,
        totalKarma: 0,
        totalComments: 0,
        originalPosts: 0,
        crossposts: 0,
        topScore: 0,
        posts: [],
      };
    }

    map[sub].totalPosts += 1;
    map[sub].totalKarma += post.score || 0;
    map[sub].totalComments += post.numComments || 0;
    if (post.isCrosspost) {
      map[sub].crossposts += 1;
    } else {
      map[sub].originalPosts += 1;
    }

    if ((post.score || 0) > map[sub].topScore) {
      map[sub].topScore = post.score || 0;
    }

    map[sub].posts.push(post);
  });

  const overallAvg = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.score || 0), 0) / posts.length
    : 0;

  return Object.values(map).map((sub) => {
    const avgScore = sub.totalPosts > 0 ? Math.round(sub.totalKarma / sub.totalPosts) : 0;
    
    // Concentration Recommendation:
    // High Focus: avg score significantly above overall average
    let recommendation = 'EXPLORE';
    let tier = 'neutral';

    if (sub.totalPosts >= 2 && avgScore >= overallAvg * 1.25) {
      recommendation = 'PRIMARY FOCUS';
      tier = 'high';
    } else if (avgScore >= overallAvg) {
      recommendation = 'PROMISING';
      tier = 'medium';
    } else if (sub.totalPosts >= 2 && avgScore < overallAvg * 0.5) {
      recommendation = 'DE-PRIORITIZE';
      tier = 'low';
    }

    return {
      ...sub,
      avgScore,
      recommendation,
      tier,
    };
  }).sort((a, b) => b.totalKarma - a.totalKarma);
}

/**
 * Computes crosspost specific insights
 */
export function computeCrosspostMetrics(posts) {
  const crossposts = posts.filter((p) => p.isCrosspost && p.crosspostParent);

  return crossposts.map((xp) => {
    const parentScore = xp.crosspostParent.score || 0;
    const currentScore = xp.score || 0;
    const diff = currentScore - parentScore;
    const multiplier = parentScore > 0 ? ((currentScore / parentScore) * 100).toFixed(0) : 'N/A';

    return {
      id: xp.id,
      title: xp.title,
      accountTag: xp.accountTag,
      crosspostSub: xp.subredditPrefixed || `r/${xp.subreddit}`,
      originalSub: xp.crosspostParent.subreddit ? `r/${xp.crosspostParent.subreddit}` : 'Original',
      crosspostScore: currentScore,
      originalScore: parentScore,
      diff,
      multiplier,
      outperformed: currentScore > parentScore,
      permalink: xp.permalink,
      originalPermalink: xp.crosspostParent.permalink,
    };
  });
}


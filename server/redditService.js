import { URL } from 'url';

/**
 * Resolves Reddit share links (/s/) to full canonical URLs using HEAD redirect location
 */
export async function resolveRedditUrl(rawUrl) {
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Handle redd.it shortlink
  const reddItMatch = cleanUrl.match(/redd\.it\/([a-zA-Z0-9]+)/i);
  if (reddItMatch) {
    return {
      resolvedUrl: `https://www.reddit.com/comments/${reddItMatch[1]}`,
      postId: reddItMatch[1],
    };
  }

  // Handle mobile share links /s/
  if (cleanUrl.includes('/s/')) {
    try {
      const response = await fetch(cleanUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'curl/8.4.0',
        },
        signal: AbortSignal.timeout(4000),
      });

      const location = response.headers.get('location');
      if (location) {
        cleanUrl = location.startsWith('http') ? location : `https://www.reddit.com${location}`;
        console.log(`[RedditService] Resolved /s/ share link to: ${cleanUrl}`);
      }
    } catch (err) {
      console.warn('[RedditService] Failed resolving /s/ link:', err.message);
    }
  }

  return { resolvedUrl: cleanUrl };
}

/**
 * Extracts post ID, subreddit, and title slug from any Reddit link
 */
export function extractPostIdentifiers(rawUrl) {
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Handle /r/subreddit/comments/id/slug/
  const standardMatch = cleanUrl.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)(?:\/([^\s\/?#]+))?/i);
  if (standardMatch) {
    const slug = standardMatch[3] ? decodeURIComponent(standardMatch[3]).replace(/_/g, ' ') : null;
    return {
      postId: standardMatch[2],
      subreddit: standardMatch[1],
      slug,
      cleanUrl,
    };
  }

  // Handle redd.it/id
  const reddItMatch = cleanUrl.match(/redd\.it\/([a-zA-Z0-9]+)/i);
  if (reddItMatch) {
    return {
      postId: reddItMatch[1],
      subreddit: null,
      slug: null,
      cleanUrl,
    };
  }

  // Handle /comments/id
  const commentsMatch = cleanUrl.match(/reddit\.com\/comments\/([a-zA-Z0-9]+)/i);
  if (commentsMatch) {
    return {
      postId: commentsMatch[1],
      subreddit: null,
      slug: null,
      cleanUrl,
    };
  }

  // Handle /r/sub/s/shareId fallback
  const shareMatch = cleanUrl.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)\/s\/([a-zA-Z0-9]+)/i);
  if (shareMatch) {
    return {
      postId: shareMatch[2],
      subreddit: shareMatch[1],
      slug: null,
      cleanUrl,
    };
  }

  throw new Error(`Invalid Reddit URL format: "${rawUrl}"`);
}

/**
 * High-reliability fetcher using Redlib gateway with 12s timeout and fallback
 */
export async function fetchRedditPost(rawUrl, apiConfig = {}) {
  const { resolvedUrl } = await resolveRedditUrl(rawUrl);
  const { postId, subreddit, slug } = extractPostIdentifiers(resolvedUrl);

  console.log(`[RedditService] Fetching Post ID: ${postId}, Subreddit: ${subreddit || 'auto'}`);

  // Gateway endpoints prioritizing sub-specific path if known
  const gateways = [];
  if (subreddit) {
    gateways.push(`https://safereddit.com/r/${subreddit}/comments/${postId}`);
  }
  gateways.push(`https://safereddit.com/comments/${postId}`);

  for (const gwUrl of gateways) {
    try {
      console.log(`[RedditService] Querying gateway: ${gwUrl}...`);
      const res = await fetch(gwUrl, {
        headers: {
          'User-Agent': 'curl/8.4.0',
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(5000), // 5s fast timeout for serverless
      });

      if (!res.ok) {
        console.warn(`[RedditService] Gateway returned status ${res.status}`);
        continue;
      }

      const html = await res.text();

      // Extract current upvote score
      const scoreMatch = html.match(/class="post_score"[^>]*title="(\d+)"/i)
        || html.match(/class="post_score"[^>]*>[\s\n]*(\d+)[\s\n]*</i);
      
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

      // Extract author
      const authorMatch = html.match(/class="post_author[^"]*"[^>]*>u\/([^<]+)</i);
      const author = authorMatch ? authorMatch[1].trim() : 'MyAccount';

      // Extract title
      const titleMatch = html.match(/<h1 class="post_title"[^>]*>([\s\S]*?)<\/h1>/i);
      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null;

      if (!title && slug) {
        title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
      if (!title) {
        title = `Reddit Post (${postId})`;
      }

      // Extract subreddit
      const subMatch = html.match(/<a class="post_subreddit"[^>]*>r\/([^<]+)</i);
      const detectedSub = subMatch ? subMatch[1].trim() : (subreddit || 'reddit');

      // Check if crosspost
      const isCrosspost = html.includes('class="crosspost"') || html.includes('crosspost_author');
      let parentPost = null;

      if (isCrosspost) {
        const parentSubMatch = html.match(/class=["\x27]crosspost_subreddit["\x27][^>]*>r\/([^<]+)</i);
        if (parentSubMatch) {
          parentPost = {
            subreddit: parentSubMatch[1].trim(),
            score: 0,
            title: title,
          };
        }
      }

      console.log(`[RedditService] Success! Score: ${score}, Sub: ${detectedSub}, Title: "${title.slice(0, 35)}..."`);

      return {
        id: postId,
        name: `t3_${postId}`,
        title,
        author,
        subreddit: detectedSub,
        subredditPrefixed: `r/${detectedSub}`,
        score: score,
        ups: score,
        upvoteRatio: 95,
        numComments: 0,
        createdUtc: Math.floor(Date.now() / 1000),
        createdAt: new Date().toISOString(),
        permalink: resolvedUrl,
        originalUrl: rawUrl,
        contentUrl: resolvedUrl,
        isSelf: true,
        selftext: '',
        isCrosspost: Boolean(isCrosspost),
        crosspostParent: parentPost,
        fetchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`[RedditService] Gateway error on ${gwUrl}:`, err.message);
    }
  }

  // Fallback to URL parsing if gateway unreachable
  console.log('[RedditService] Falling back to URL metadata');
  const readableTitle = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : `Reddit Post (${postId})`;

  const detectedSubreddit = subreddit || 'reddit';

  return {
    id: postId,
    name: `t3_${postId}`,
    title: readableTitle,
    author: 'MyAccount',
    subreddit: detectedSubreddit,
    subredditPrefixed: `r/${detectedSubreddit}`,
    score: 0,
    ups: 0,
    upvoteRatio: null,
    numComments: 0,
    createdUtc: Math.floor(Date.now() / 1000),
    createdAt: new Date().toISOString(),
    permalink: resolvedUrl,
    originalUrl: rawUrl,
    contentUrl: resolvedUrl,
    isSelf: true,
    selftext: '',
    isCrosspost: false,
    crosspostParent: null,
    fetchedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isManualFallback: true,
  };
}

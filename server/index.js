import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchRedditPost, extractPostIdentifiers } from './redditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readPosts() {
  try {
    const raw = fs.readFileSync(POSTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Error reading posts:', err);
    return [];
  }
}

function writePosts(posts) {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error writing posts:', err);
    return false;
  }
}

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { clientId: '', clientSecret: '' };
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Config endpoints
app.get('/api/config', (req, res) => {
  const cfg = readConfig();
  res.json({
    hasCredentials: Boolean(cfg.clientId && cfg.clientSecret),
    clientId: cfg.clientId ? `${cfg.clientId.slice(0, 4)}••••` : '',
  });
});

app.post('/api/config', (req, res) => {
  const { clientId, clientSecret } = req.body;
  writeConfig({ clientId: clientId || '', clientSecret: clientSecret || '' });
  res.json({ success: true });
});

// GET all posts
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  res.json({ success: true, count: posts.length, posts });
});

// POST track a new post or batch of posts
app.post('/api/posts', async (req, res) => {
  try {
    const { url, urls, accountTag, notes, manualData, initialScore } = req.body;
    const cfg = readConfig();

    // If direct manual creation (when user inputs full card or modifies fallback)
    if (manualData && manualData.title) {
      const existingPosts = readPosts();
      const id = manualData.id || `custom_${Date.now()}`;
      const newPost = {
        id,
        name: `t3_${id}`,
        title: manualData.title,
        author: manualData.author || 'Anonymous',
        accountTag: manualData.accountTag || accountTag || `u/${manualData.author || 'Me'}`,
        subreddit: manualData.subreddit ? manualData.subreddit.replace(/^r\//, '') : 'general',
        subredditPrefixed: manualData.subreddit ? (manualData.subreddit.startsWith('r/') ? manualData.subreddit : `r/${manualData.subreddit}`) : 'r/general',
        score: parseInt(manualData.score || 0, 10),
        ups: parseInt(manualData.score || 0, 10),
        upvoteRatio: manualData.upvoteRatio ? parseInt(manualData.upvoteRatio, 10) : 95,
        numComments: parseInt(manualData.numComments || 0, 10),
        createdUtc: manualData.createdUtc || Math.floor(Date.now() / 1000),
        createdAt: manualData.createdAt || new Date().toISOString(),
        permalink: manualData.permalink || manualData.originalUrl || '',
        originalUrl: manualData.originalUrl || manualData.permalink || '',
        contentUrl: manualData.contentUrl || manualData.permalink || '',
        isSelf: true,
        selftext: manualData.selftext || '',
        isCrosspost: Boolean(manualData.isCrosspost),
        crosspostParent: manualData.crosspostParent || null,
        notes: notes || manualData.notes || '',
        trackedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      const existingIdx = existingPosts.findIndex(p => p.id === id);
      if (existingIdx >= 0) {
        return res.status(409).json({
          success: false,
          alreadyExists: true,
          error: `Post already exists: "${newPost.title}" is already tracked.`,
        });
      }
      existingPosts.unshift(newPost);
      writePosts(existingPosts);
      return res.json({ success: true, added: 1, results: [newPost], allPosts: existingPosts });
    }

    let urlList = [];
    if (Array.isArray(urls)) {
      urlList = urls.map(u => u.trim()).filter(Boolean);
    } else if (typeof url === 'string') {
      urlList = url
        .split(/[\n,]+/)
        .map(u => u.trim())
        .filter(u => u.length > 5);
    }

    if (urlList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid Reddit URLs provided.' });
    }

    const existingPosts = readPosts();
    const results = [];
    const errors = [];

    for (const singleUrl of urlList) {
      try {
        console.log(`[Crawler] Ingesting ${singleUrl}...`);
        const postData = await fetchRedditPost(singleUrl, cfg);

        postData.accountTag = (accountTag && accountTag.trim()) || `u/${postData.author}`;
        postData.notes = notes || '';
        postData.trackedAt = new Date().toISOString();

        if (initialScore !== undefined && initialScore !== null && initialScore !== '') {
          const parsedInit = parseInt(initialScore, 10);
          if (!isNaN(parsedInit)) {
            postData.score = parsedInit;
            postData.ups = parsedInit;
          }
        }

        const existingIndex = existingPosts.findIndex(p => p.id === postData.id);
        if (existingIndex >= 0) {
          if (urlList.length === 1) {
            return res.status(409).json({
              success: false,
              alreadyExists: true,
              error: `Post already exists: "${postData.title}" is already tracked in your Karma Map.`,
            });
          }
          errors.push({ url: singleUrl, error: `Already exists: "${postData.title}"` });
          continue;
        }

        existingPosts.unshift(postData);
        results.push({ ...postData, updated: false });

        if (urlList.length > 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err) {
        console.error(`[Crawler] Failed for ${singleUrl}:`, err.message);
        errors.push({ url: singleUrl, error: err.message });
      }
    }

    writePosts(existingPosts);

    res.json({
      success: true,
      added: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
      allPosts: existingPosts,
    });
  } catch (err) {
    console.error('[API] /api/posts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update post (modify accountTag, score, upvoteRatio, numComments, notes, etc.)
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  // Update allowed fields
  const allowed = [
    'title', 'accountTag', 'notes', 'score', 'ups', 'upvoteRatio',
    'numComments', 'subreddit', 'subredditPrefixed', 'isCrosspost', 'crosspostParent'
  ];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'score' || key === 'ups' || key === 'numComments' || key === 'upvoteRatio') {
        posts[index][key] = parseInt(updates[key], 10) || 0;
      } else {
        posts[index][key] = updates[key];
      }
    }
  }

  posts[index].lastUpdated = new Date().toISOString();
  writePosts(posts);
  res.json({ success: true, post: posts[index] });
});

// DELETE a post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const filtered = posts.filter(p => p.id !== id);

  if (filtered.length === posts.length) {
    return res.status(404).json({ success: false, error: 'Post not found' });
  }

  writePosts(filtered);
  res.json({ success: true, count: filtered.length });
});

// POST clear all posts
app.post('/api/posts/clear', (req, res) => {
  writePosts([]);
  res.json({ success: true, count: 0 });
});

// POST re-sync / refresh
app.post('/api/posts/sync', async (req, res) => {
  try {
    const { postIds } = req.body;
    const posts = readPosts();
    const cfg = readConfig();
    const targetPosts = Array.isArray(postIds) && postIds.length > 0
      ? posts.filter(p => postIds.includes(p.id))
      : posts;

    const updated = [];
    const errors = [];

    // Sync all posts in parallel for instant responsiveness
    await Promise.all(
      targetPosts.map(async (post) => {
        try {
          const fresh = await fetchRedditPost(post.permalink || post.originalUrl, cfg);
          if (!fresh.isManualFallback) {
            post.score = fresh.score;
            post.ups = fresh.ups;
            post.upvoteRatio = fresh.upvoteRatio;
            post.numComments = fresh.numComments;
            if (fresh.crosspostParent) {
              post.crosspostParent = fresh.crosspostParent;
            }
          }
          post.lastUpdated = new Date().toISOString();
          updated.push(post.id);
        } catch (err) {
          errors.push({ id: post.id, error: err.message });
        }
      })
    );

    writePosts(posts);
    res.json({
      success: true,
      syncedCount: updated.length,
      errors: errors.length > 0 ? errors : undefined,
      allPosts: posts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve client static files if production build exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[RedditTrack] Server active on http://localhost:${PORT}`);
});


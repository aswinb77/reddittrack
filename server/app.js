import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fetchRedditPost } from './redditService.js';
import {
  getAllPosts,
  getPostById,
  addPost,
  updatePost,
  deletePost,
  clearAllPosts,
  getDatabaseStatus,
  isSupabaseConfigured,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const router = express.Router();

// Diagnostic Health check
router.get('/health', async (req, res) => {
  const dbStatus = await getDatabaseStatus();
  res.json({
    status: 'ok',
    database: dbStatus,
    time: new Date().toISOString(),
  });
});

// GET all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json({ success: true, count: posts.length, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST track a new post or batch of posts
router.post('/posts', async (req, res) => {
  try {
    const { url, urls, accountTag, notes, manualData, initialScore } = req.body;

    // Manual creation
    if (manualData && manualData.title) {
      const id = manualData.id || `custom_${Date.now()}`;
      const existing = await getPostById(id);
      if (existing) {
        return res.status(409).json({
          success: false,
          alreadyExists: true,
          error: `Post already exists: "${manualData.title}" is already tracked.`,
        });
      }

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

      const saved = await addPost(newPost);
      const allPosts = await getAllPosts();
      return res.json({ success: true, added: 1, results: [saved], allPosts });
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

    const results = [];
    const errors = [];

    for (const singleUrl of urlList) {
      try {
        console.log(`[Crawler] Ingesting ${singleUrl}...`);
        const postData = await fetchRedditPost(singleUrl);

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

        // Check if duplicate
        const existing = await getPostById(postData.id);
        if (existing) {
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

        const saved = await addPost(postData);
        results.push(saved);

        if (urlList.length > 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err) {
        console.error(`[Crawler] Failed for ${singleUrl}:`, err.message);
        errors.push({ url: singleUrl, error: err.message });
      }
    }

    const allPosts = await getAllPosts();
    res.json({
      success: results.length > 0,
      added: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
      allPosts,
    });
  } catch (err) {
    console.error('[API] /api/posts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update post
router.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updatePost(id, updates);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a post
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePost(id);
    const allPosts = await getAllPosts();
    res.json({ success: true, count: allPosts.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST clear all posts
router.post('/posts/clear', async (req, res) => {
  try {
    await clearAllPosts();
    res.json({ success: true, count: 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST re-sync / refresh
router.post('/posts/sync', async (req, res) => {
  try {
    const { postIds } = req.body;
    const posts = await getAllPosts();
    const targetPosts = Array.isArray(postIds) && postIds.length > 0
      ? posts.filter(p => postIds.includes(p.id))
      : posts;

    const updated = [];
    const errors = [];

    // Parallel fetch for rapid sync (capped at 5s timeout each)
    await Promise.all(
      targetPosts.map(async (post) => {
        try {
          const fresh = await fetchRedditPost(post.permalink || post.originalUrl);
          if (!fresh.isManualFallback) {
            const updates = {
              score: fresh.score,
              ups: fresh.ups,
              upvoteRatio: fresh.upvoteRatio,
              numComments: fresh.numComments,
            };
            if (fresh.crosspostParent) {
              updates.crosspostParent = fresh.crosspostParent;
            }
            await updatePost(post.id, updates);
          }
          updated.push(post.id);
        } catch (err) {
          errors.push({ id: post.id, error: err.message });
        }
      })
    );

    const refreshedPosts = await getAllPosts();
    res.json({
      success: true,
      syncedCount: updated.length,
      errors: errors.length > 0 ? errors : undefined,
      allPosts: refreshedPosts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount router on BOTH '/api' and '/' for complete Vercel serverless compatibility
app.use('/api', router);
app.use('/', router);

// Serve client static files when running locally
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/posts') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

export default app;

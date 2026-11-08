import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Supabase Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Database] Supabase client initialized connected to cloud database');
} else {
  console.log('[Database] Using local data/posts.json storage (Supabase env vars not set)');
}

// Ensure local data directory exists if running locally
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
} catch (e) {
  // Ignored in serverless environments where local filesystem might be read-only
}

// Convert Supabase database row to frontend model
export function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || `t3_${row.id}`,
    title: row.title,
    author: row.author || 'Anonymous',
    accountTag: row.account_tag || row.accountTag || `u/${row.author || 'Me'}`,
    subreddit: row.subreddit,
    subredditPrefixed: row.subreddit_prefixed || row.subredditPrefixed || `r/${row.subreddit}`,
    score: parseInt(row.score || 0, 10),
    ups: parseInt(row.ups || row.score || 0, 10),
    upvoteRatio: row.upvote_ratio || row.upvoteRatio || 95,
    numComments: parseInt(row.num_comments || row.numComments || 0, 10),
    createdUtc: row.created_utc || row.createdUtc,
    createdAt: row.created_at || row.createdAt,
    permalink: row.permalink,
    originalUrl: row.original_url || row.originalUrl || row.permalink,
    contentUrl: row.content_url || row.contentUrl || row.permalink,
    isSelf: row.is_self !== undefined ? Boolean(row.is_self) : Boolean(row.isSelf),
    selftext: row.selftext || '',
    isCrosspost: Boolean(row.is_crosspost !== undefined ? row.is_crosspost : row.isCrosspost),
    crosspostParent: row.crosspost_parent || row.crosspostParent || null,
    notes: row.notes || '',
    trackedAt: row.tracked_at || row.trackedAt,
    lastUpdated: row.last_updated || row.lastUpdated,
  };
}

// Convert frontend model to Supabase row
export function toDb(post) {
  return {
    id: post.id,
    name: post.name || `t3_${post.id}`,
    title: post.title,
    author: post.author || 'Anonymous',
    account_tag: post.accountTag || `u/${post.author || 'Me'}`,
    subreddit: post.subreddit,
    subreddit_prefixed: post.subredditPrefixed || `r/${post.subreddit}`,
    score: parseInt(post.score || 0, 10),
    ups: parseInt(post.ups || post.score || 0, 10),
    upvote_ratio: parseInt(post.upvoteRatio || 95, 10),
    num_comments: parseInt(post.numComments || 0, 10),
    created_utc: post.createdUtc || Math.floor(Date.now() / 1000),
    created_at: post.createdAt || new Date().toISOString(),
    permalink: post.permalink || post.originalUrl,
    original_url: post.originalUrl || post.permalink,
    content_url: post.contentUrl || post.permalink,
    is_self: Boolean(post.isSelf),
    selftext: post.selftext || '',
    is_crosspost: Boolean(post.isCrosspost),
    crosspost_parent: post.crosspostParent || null,
    notes: post.notes || '',
    tracked_at: post.trackedAt || new Date().toISOString(),
    last_updated: post.lastUpdated || new Date().toISOString(),
  };
}

// Local filesystem helpers
function readLocalPosts() {
  try {
    if (!fs.existsSync(POSTS_FILE)) return [];
    const raw = fs.readFileSync(POSTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Error reading local posts:', err);
    return [];
  }
}

function writeLocalPosts(posts) {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error writing local posts:', err);
    return false;
  }
}

// ==========================================
// UNIFIED DATABASE OPERATIONS
// ==========================================

export async function getAllPosts() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('score', { ascending: false });

      if (error) {
        console.error('[Supabase] getAllPosts error:', error.message);
        return readLocalPosts();
      }
      return (data || []).map(fromDb);
    } catch (err) {
      console.error('[Supabase] getAllPosts exception:', err.message);
      return readLocalPosts();
    }
  }
  return readLocalPosts();
}

export async function getPostById(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] getPostById error:', error.message);
        return readLocalPosts().find(p => p.id === id) || null;
      }
      return data ? fromDb(data) : null;
    } catch (err) {
      return readLocalPosts().find(p => p.id === id) || null;
    }
  }
  return readLocalPosts().find(p => p.id === id) || null;
}

export async function addPost(post) {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = toDb(post);
      const { data, error } = await supabase
        .from('posts')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return fromDb(data);
    } catch (err) {
      console.error('[Supabase] addPost error:', err.message);
      throw err;
    }
  }

  // Local fallback
  const posts = readLocalPosts();
  posts.unshift(post);
  writeLocalPosts(posts);
  return post;
}

export async function updatePost(id, updates) {
  if (isSupabaseConfigured && supabase) {
    try {
      // Map update fields
      const dbUpdates = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.accountTag !== undefined) dbUpdates.account_tag = updates.accountTag;
      if (updates.score !== undefined) {
        dbUpdates.score = parseInt(updates.score, 10);
        dbUpdates.ups = parseInt(updates.score, 10);
      }
      if (updates.ups !== undefined) dbUpdates.ups = parseInt(updates.ups, 10);
      if (updates.upvoteRatio !== undefined) dbUpdates.upvote_ratio = parseInt(updates.upvoteRatio, 10);
      if (updates.numComments !== undefined) dbUpdates.num_comments = parseInt(updates.numComments, 10);
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isCrosspost !== undefined) dbUpdates.is_crosspost = Boolean(updates.isCrosspost);
      if (updates.crosspostParent !== undefined) dbUpdates.crosspost_parent = updates.crosspostParent;
      dbUpdates.last_updated = new Date().toISOString();

      const { data, error } = await supabase
        .from('posts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return fromDb(data);
    } catch (err) {
      console.error('[Supabase] updatePost error:', err.message);
      throw err;
    }
  }

  // Local fallback
  const posts = readLocalPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  posts[idx] = { ...posts[idx], ...updates, lastUpdated: new Date().toISOString() };
  writeLocalPosts(posts);
  return posts[idx];
}

export async function deletePost(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    } catch (err) {
      console.error('[Supabase] deletePost error:', err.message);
      throw err;
    }
  }

  // Local fallback
  const posts = readLocalPosts();
  const filtered = posts.filter(p => p.id !== id);
  writeLocalPosts(filtered);
  return true;
}

export async function clearAllPosts() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .neq('id', '___nonexistent___');

      if (error) throw new Error(error.message);
      return true;
    } catch (err) {
      console.error('[Supabase] clearAllPosts error:', err.message);
      throw err;
    }
  }

  writeLocalPosts([]);
  return true;
}

export async function bulkUpsertPosts(posts) {
  if (isSupabaseConfigured && supabase) {
    try {
      const rows = posts.map(toDb);
      const { data, error } = await supabase
        .from('posts')
        .upsert(rows, { onConflict: 'id' })
        .select();

      if (error) throw new Error(error.message);
      return (data || []).map(fromDb);
    } catch (err) {
      console.error('[Supabase] bulkUpsertPosts error:', err.message);
      throw err;
    }
  }

  writeLocalPosts(posts);
  return posts;
}

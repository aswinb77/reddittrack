import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const CWD_POSTS_FILE = path.resolve(process.cwd(), 'data', 'posts.json');

// Supabase Environment Variables & Sanitization
function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  const dashMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashMatch) {
    return `https://${dashMatch[1]}.supabase.co`;
  }
  const supaMatch = url.match(/https?:\/\/([a-z0-9_-]+)\.supabase\.co/i);
  if (supaMatch) {
    return `https://${supaMatch[1]}.supabase.co`;
  }
  const bareRefMatch = url.match(/^(?:https?:\/\/)?([a-z0-9]{15,30})\/?$/i);
  if (bareRefMatch) {
    return `https://${bareRefMatch[1]}.supabase.co`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
export const supabaseKey = rawSupabaseKey.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log(`[Database] Supabase client initialized connecting to ${supabaseUrl}`);
} else {
  console.log('[Database] Using local data/posts.json storage (Supabase env vars not set)');
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

// Local filesystem helpers with multiple path checks
function readLocalPosts() {
  try {
    const targetFile = fs.existsSync(POSTS_FILE) ? POSTS_FILE : (fs.existsSync(CWD_POSTS_FILE) ? CWD_POSTS_FILE : null);
    if (!targetFile) return [];
    const raw = fs.readFileSync(targetFile, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Error reading local posts:', err);
    return [];
  }
}

function writeLocalPosts(posts) {
  try {
    const targetFile = fs.existsSync(DATA_DIR) ? POSTS_FILE : CWD_POSTS_FILE;
    fs.writeFileSync(targetFile, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error writing local posts (may be serverless):', err);
    return false;
  }
}

// Diagnostic helper
export async function getDatabaseStatus() {
  let hostname = null;
  try {
    hostname = supabaseUrl ? new URL(supabaseUrl).host : null;
  } catch (e) {
    hostname = supabaseUrl;
  }

  const status = {
    configured: isSupabaseConfigured,
    provider: isSupabaseConfigured ? 'supabase' : 'local-json',
    supabaseHost: hostname,
    supabaseUrl: supabaseUrl || null,
    hasKey: Boolean(supabaseKey),
    keyType: supabaseKey ? (supabaseKey.startsWith('sb_') ? 'modern_sb' : (supabaseKey.startsWith('ey') ? 'jwt' : 'custom')) : null,
    error: null,
    postsCount: 0,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' });

      if (error) {
        status.error = `${error.message}. (If table doesn't exist, please run supabase_schema.sql in Supabase SQL Editor!)`;
      } else {
        status.postsCount = count ?? (data ? data.length : 0);
      }
    } catch (e) {
      const cause = e.cause ? ` [cause: ${e.cause.code || ''} ${e.cause.message || ''}]` : '';
      status.error = `${e.message}${cause}`;
    }
  } else {
    status.postsCount = readLocalPosts().length;
  }

  return status;
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
        throw new Error(`Supabase query error: ${error.message}. Did you run supabase_schema.sql in Supabase SQL Editor?`);
      }
      return (data || []).map(fromDb);
    } catch (err) {
      console.error('[Supabase] getAllPosts exception:', err.message);
      throw err;
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
        console.warn('[Supabase] getPostById warning:', error.message);
        return null;
      }
      return data ? fromDb(data) : null;
    } catch (err) {
      return null;
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
        throw new Error(`Failed to save post to Supabase: ${error.message}`);
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
        .neq('id', '___none___');

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

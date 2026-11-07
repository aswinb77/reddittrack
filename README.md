# Karma Map // Reddit Post & Crosspost Intelligence

A personal Reddit tracking website with treemap visualization, account filtering, live upvote sync, and crosspost performance analysis.

---

## ⚡ Key Features

- **Karma Map Treemap**:
  - Columns grouped by subreddit, proportional tile heights scaled to upvote count.
  - Quick filter tabs: **All**, **Crossposts** (dims originals), and **Originals** (dims crossposts).
  - Selected post preview card with direct "Open on Reddit" link.

- **Multi-Account Intelligence**:
  - Filter posts by account (`Northdraw`, `Frnewton`, etc.) or view all accounts together.
  - Dropdown selector with easy `+ Add New Account` option.
  - Dynamic hero insight calculating your highest-yield subreddit and crosspost multiplier (e.g. *Crossposts earn 5.7× more upvotes than originals*).

- **Reliable Live Reddit Scraping & Sync**:
  - Ingest standard Reddit URLs, `redd.it` shortlinks, and mobile `/s/` share links.
  - Bypasses anti-bot rate limits using lightweight Redlib gateways (`safereddit.com`).
  - **Fast Parallel Sync**: Refreshes upvotes for all tracked posts simultaneously in ~2 seconds.
  - **Duplicate Detection**: Prevents adding the same post twice and alerts if already tracked.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Build frontend
npm run build

# 3. Start server
npm start
```
Access the application at `http://localhost:8080`.

---

## ☁️ Deployment Guide: Vercel vs Cloudflare vs Railway

### Would it work *just like this* on Vercel or Cloudflare?
**Short answer:** Not *out-of-the-box* without one change to how data is stored.

#### Why?
1. **Serverless Filesystem:** The app currently writes posts to local disk (`data/posts.json`). Vercel and Cloudflare Pages run serverless functions with **ephemeral, read-only filesystems**. Any posts added or synced would disappear once the serverless function spins down.
2. **Scraping from Datacenter IPs:** Cloudflare Workers and Vercel functions run in data centers whose IP ranges are often challenged by Reddit's Cloudflare Turnstile bot shields.

---

### How to deploy it:

#### Option 1: Render / Railway / Fly.io (Recommended — "Works Just Like This")
If you want it to run **without changing any code**:
1. Push this repository to GitHub.
2. In [Railway.app](https://railway.app) or [Render.com](https://render.com), click **New Web Service** and select this repo.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. That's it! It runs the Node.js Express server with persistent storage.

#### Option 2: Vercel (Frontend + Serverless DB)
To deploy to Vercel:
1. Store posts in **Browser LocalStorage** (for a 100% free personal dashboard without database setup) OR connect a free cloud key-value store like **Upstash Redis** or **Vercel KV / Supabase**.
2. Convert `/api/*` Express routes into Vercel Serverless Functions in `/api/*.js`.

#### Option 3: Cloudflare Pages
1. Build command: `npm run build`
2. Output directory: `dist`
3. Use **Cloudflare KV** or **Cloudflare D1** to store the posts instead of `data/posts.json`.

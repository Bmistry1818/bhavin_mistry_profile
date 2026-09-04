#!/usr/bin/env node

/**
 * Fetches latest blog posts from LinkedIn and Medium (robust to RSS/Atom variations)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../_data/blogs.json');
const CACHE_DIR = path.dirname(CACHE_FILE);

// Ensure _data directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generic HTTPS/HTTP request helper
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }); });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Basic HTML/XML entity decode (common cases)
 */
function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Parse RSS or Atom feed into items array
 * Supports:
 *  - RSS <item> ... </item>
 *  - Atom <entry> ... </entry>
 */
function parseFeed(xmlData) {
  if (!xmlData || typeof xmlData !== 'string') return [];

  const items = [];

  // Helper to extract first match group
  const firstMatch = (rx, src) => {
    const m = rx.exec(src);
    return m ? m[1].trim() : null;
  };

  // Normalize by removing newlines inside tags for simpler regex work
  const src = xmlData.replace(/\r?\n/g, ' ');

  // Try RSS <item>
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(src)) !== null) {
    const itemXml = match[1];

    const title = decodeEntities(firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, itemXml) || '');
    let link = firstMatch(/<link[^>]*>([\s\S]*?)<\/link>/i, itemXml) || null;
    // Some RSS use <guid> for canonical link
    if (!link) link = firstMatch(/<guid[^>]*>([\s\S]*?)<\/guid>/i, itemXml) || null;
    // enclosure/media url
    const image = firstMatch(/<enclosure[^>]*url="([^"]+)"[^>]*>/i, itemXml) ||
                  firstMatch(/<media:content[^>]*url="([^"]+)"[^>]*>/i, itemXml) || null;
    const summary = decodeEntities(firstMatch(/<description[^>]*>([\s\S]*?)<\/description>/i, itemXml) ||
                                   firstMatch(/<summary[^>]*>([\s\S]*?)<\/summary>/i, itemXml) || '');
    const pubDate = firstMatch(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, itemXml) || null;

    items.push({
      title,
      url: link ? link.trim() : null,
      description: summary ? summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
      pubDate,
      image
    });
  }

  // Try Atom <entry> (if no items found or in addition)
  const entryRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(src)) !== null) {
    const entryXml = match[1];

    const title = decodeEntities(firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, entryXml) || '');
    // Atom links are often <link rel="alternate" href="..." /> or <link href="..."/>
    let link = firstMatch(/<link[^>]*href="([^"]+)"[^>]*>/i, entryXml) || null;
    // Some feeds put link in <id> or <link> text
    if (!link) link = firstMatch(/<link[^>]*>([\s\S]*?)<\/link>/i, entryXml) || firstMatch(/<id[^>]*>([\s\S]*?)<\/id>/i, entryXml) || null;
    const summary = decodeEntities(firstMatch(/<summary[^>]*>([\s\S]*?)<\/summary>/i, entryXml) ||
                                   firstMatch(/<content[^>]*>([\s\S]*?)<\/content>/i, entryXml) || '');
    const pubDate = firstMatch(/<updated[^>]*>([\s\S]*?)<\/updated>/i, entryXml) ||
                    firstMatch(/<published[^>]*>([\s\S]*?)<\/published>/i, entryXml) || null;
    const image = firstMatch(/<media:content[^>]*url="([^"]+)"[^>]*>/i, entryXml) ||
                  firstMatch(/<enclosure[^>]*url="([^"]+)"[^>]*>/i, entryXml) || null;

    items.push({
      title,
      url: link ? link.trim() : null,
      description: summary ? summary.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
      pubDate,
      image
    });
  }

  // Remove duplicates and invalid entries (no title or url)
  const seen = new Set();
  const filtered = items
    .map((it) => {
      // Normalize URL/title
      const url = it.url ? it.url.replace(/\s+/g, '') : null;
      const title = it.title || '';
      return { ...it, url, title };
    })
    .filter((it) => it.title && it.url)
    .filter((it) => {
      const k = `${it.url}|${it.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  return filtered;
}

/**
 * Fetch LinkedIn articles via RSS-Bridge (or fallback)
 */
async function fetchLinkedInBlogs() {
  try {
    console.log('📱 Fetching LinkedIn articles via rss-bridge...');
    const rssUrl = 'https://rss-bridge.org/rss?action=display&bridge=LinkedIn&context=User&user=bhavin-mistry&limit=10&format=Atom';

    try {
      const { statusCode, body } = await makeRequest(rssUrl);
      if (!statusCode || statusCode >= 400) {
        throw new Error(`Bad response ${statusCode}`);
      }
      const items = parseFeed(body).slice(0, 6);
      const articles = items.map((item, idx) => ({
        id: `linkedin-${idx}-${Date.now()}`,
        title: item.title,
        description: item.description,
        url: item.url,
        source: 'LinkedIn',
        date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        image: item.image,
        type: 'article'
      }));

      console.log(`✅ Found ${articles.length} LinkedIn articles`);
      return articles;
    } catch (err) {
      console.warn('⚠️  rss-bridge fetch failed:', err.message);
      return [];
    }
  } catch (err) {
    console.error('❌ Error in fetchLinkedInBlogs:', err.message);
    return [];
  }
}

/**
 * Fetch Medium articles via public RSS feed
 */
async function fetchMediumBlogs() {
  try {
    console.log('📝 Fetching Medium articles...');
    const rssUrl = 'https://medium.com/feed/@bhavin_mistry';
    try {
      const { statusCode, body } = await makeRequest(rssUrl);
      if (!statusCode || statusCode >= 400) {
        throw new Error(`Bad response ${statusCode}`);
      }
      const items = parseFeed(body).slice(0, 6);
      const articles = items.map((item, idx) => ({
        id: `medium-${idx}-${Date.now()}`,
        title: item.title,
        description: item.description,
        url: item.url,
        source: 'Medium',
        date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        image: item.image,
        type: 'article'
      }));

      console.log(`✅ Found ${articles.length} Medium articles`);
      return articles;
    } catch (err) {
      console.warn('⚠️  Medium fetch failed:', err.message);
      return [];
    }
  } catch (err) {
    console.error('❌ Error in fetchMediumBlogs:', err.message);
    return [];
  }
}

/**
 * Fetch all blogs and combine
 */
async function fetchAllBlogs() {
  console.log('\n🔄 Starting blog feed update...\n');

  try {
    const [linkedIn, medium] = await Promise.all([fetchLinkedInBlogs(), fetchMediumBlogs()]);

    const allBlogs = [...linkedIn, ...medium]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12); // Keep latest 12 articles

    const output = {
      lastUpdated: new Date().toISOString(),
      totalCount: allBlogs.length,
      blogs: allBlogs
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(output, null, 2));

    console.log(`\n✅ Successfully fetched ${allBlogs.length} articles total`);
    console.log(`📁 Saved to ${CACHE_FILE}\n`);

    return output;
  } catch (err) {
    console.error('❌ Critical error:', err.message);

    const fallback = {
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
      blogs: [],
      error: err.message
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

// Run if called directly
if (require.main === module) {
  fetchAllBlogs().catch((err) => {
    console.error('Unhandled error:', err);
    // Write fallback to avoid leaving repo without the file
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
        blogs: [],
        error: err.message
      }, null, 2));
    } catch (e) {
      // ignore
    }
    process.exit(0); // exit 0 so workflow doesn't fail due to transient fetch errors
  });
}

module.exports = { fetchAllBlogs };

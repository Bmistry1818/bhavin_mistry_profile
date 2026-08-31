#!/usr/bin/env node

/**
 * Fetches latest blog posts from LinkedIn and Medium
 * Uses RSS feeds (no API keys required)
 * LinkedIn: https://www.linkedin.com/in/bhavin-mistry/recent-activity/articles/
 * Medium: https://medium.com/@bhavin_mistry
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
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Parse XML RSS feed (simple parser)
 */
function parseRSSFeed(xmlData) {
  const items = [];
  
  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlData)) !== null) {
    const itemXml = match[1];

    // Extract fields with regex
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(itemXml);
    const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemXml);
    const linkMatch = /<link[^>]*>([^<]+)<\/link>/i.exec(itemXml);
    const pubDateMatch = /<pubDate[^>]*>([^<]+)<\/pubDate>/i.exec(itemXml);
    const imageMatch = /<image[^>]*>([^<]+)<\/image>/i.exec(itemXml) || 
                       /<media:content[^>]*url="([^"]+)"[^>]*>/i.exec(itemXml) ||
                       /<enclosure[^>]*url="([^"]+)"[^>]*>/i.exec(itemXml);

    if (titleMatch && linkMatch) {
      let description = descMatch ? descMatch[1] : '';
      
      // Strip HTML tags from description
      description = description
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .substring(0, 200);

      items.push({
        title: titleMatch[1]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"'),
        description: description + '...',
        url: linkMatch[1],
        pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        image: imageMatch ? imageMatch[1] : null
      });
    }
  }

  return items;
}

/**
 * Fetch LinkedIn articles via RSS feed
 * Note: LinkedIn RSS is not officially provided, using RSS bridge or alternative approach
 * Alternative: Use Puppeteer to scrape, or use LinkedIn unofficial APIs
 */
async function fetchLinkedInBlogs() {
  try {
    console.log('📱 Fetching LinkedIn articles...');
    
    // LinkedIn doesn't provide an official RSS feed for individual profiles
    // We'll use an RSS bridge service: https://www.rss-bridge.org/
    // Or you can use a serverless function with Puppeteer
    
    // Option 1: Using RSS-Bridge (free, no auth)
    const rssUrl = 'https://rss-bridge.org/rss?action=display&bridge=LinkedIn&context=User&user=bhavin-mistry&limit=10&format=Atom';
    
    try {
      const xmlData = await makeRequest(rssUrl);
      const items = parseRSSFeed(xmlData);

      const articles = items.slice(0, 6).map((item, idx) => ({
        id: `linkedin-${idx}-${Date.now()}`,
        title: item.title,
        description: item.description,
        url: item.url,
        source: 'LinkedIn',
        date: new Date(item.pubDate).toISOString(),
        image: item.image,
        type: 'article'
      }));

      console.log(`✅ Found ${articles.length} LinkedIn articles`);
      return articles;
    } catch (err) {
      console.warn('⚠️  RSS-Bridge not available, attempting alternative method...');
      // Fallback: Return hardcoded or use alternative API
      return [];
    }

  } catch (err) {
    console.error('❌ Error fetching LinkedIn blogs:', err.message);
    return [];
  }
}

/**
 * Fetch Medium articles via public RSS feed
 * Medium profile RSS: https://medium.com/feed/@username
 */
async function fetchMediumBlogs() {
  try {
    console.log('📝 Fetching Medium articles...');
    
    const rssUrl = 'https://medium.com/feed/@bhavin_mistry';
    const xmlData = await makeRequest(rssUrl);
    const items = parseRSSFeed(xmlData);

    const articles = items.slice(0, 6).map((item, idx) => ({
      id: `medium-${idx}-${Date.now()}`,
      title: item.title,
      description: item.description,
      url: item.url,
      source: 'Medium',
      date: new Date(item.pubDate).toISOString(),
      image: item.image,
      type: 'article'
    }));

    console.log(`✅ Found ${articles.length} Medium articles`);
    return articles;

  } catch (err) {
    console.error('❌ Error fetching Medium blogs:', err.message);
    return [];
  }
}

/**
 * Fetch all blogs and combine
 */
async function fetchAllBlogs() {
  console.log('\n🔄 Starting blog feed update...\n');

  try {
    const [linkedIn, medium] = await Promise.all([
      fetchLinkedInBlogs(),
      fetchMediumBlogs()
    ]);

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
    
    // Fallback: save empty cache or return cached data
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
  fetchAllBlogs().catch(console.error);
}

module.exports = { fetchAllBlogs };

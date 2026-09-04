#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { xml2js } = require('xml-js');
const CACHE_FILE = path.join(__dirname, '../data/blogs.json');
const FEEDS = [
  { source: 'LinkedIn', url: 'https://rss-bridge.org/rss?action=display&bridge=LinkedIn&context=User&user=bhavin-mistry&limit=10&format=Atom' },
  { source: 'Medium', url: 'https://medium.com/feed/@bhavin_mistry' }
];
const array = value => value ? (Array.isArray(value) ? value : [value]) : [];
const text = value => typeof value === 'string' ? value : array(value?._text ?? value?._cdata).join('');

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function parseFeed(xml, source) {
  const doc = xml2js(xml, { compact: true, ignoreComment: true });
  const items = array(doc.rss?.channel?.item ?? doc.feed?.entry);
  const seen = new Set();
  return items.flatMap(item => {
    const title = text(item.title).trim();
    const links = array(item.link);
    const alternate = links.find(link => link._attributes?.rel === 'alternate') || links.find(link => !link._attributes?.rel);
    const url = safeUrl(alternate?._attributes?.href || text(alternate) || text(item.guid));
    const rawDate = text(item.pubDate || item.published || item.updated);
    const parsedDate = new Date(rawDate);
    if (!title || !url || seen.has(url) || Number.isNaN(parsedDate.getTime())) return [];
    seen.add(url);
    const summary = text(item.description || item.summary || item.content || item['content:encoded']).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return [{
      id: `${source.toLowerCase()}-${createHash('sha256').update(url).digest('hex').slice(0, 16)}`,
      title, description: summary.length > 200 ? `${summary.slice(0, 197)}…` : summary,
      url, source, date: parsedDate.toISOString(), image: null, type: 'article'
    }];
  });
}

async function fetchFeed(feed, request = fetch) {
  const started = Date.now();
  console.log(JSON.stringify({ source: feed.source, event: 'request', url: feed.url }));
  try {
    const response = await request(feed.url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
    const metadata = { source: feed.source, status: response.status, finalUrl: response.url || feed.url, contentType: response.headers?.get('content-type') || 'unknown' };
    console.log(JSON.stringify({ ...metadata, event: 'response' }));
    if (!response.ok) throw new Error(`HTTP ${response.status} (${metadata.contentType}) at ${metadata.finalUrl}`);
    const body = await response.text();
    if (/^\s*(?:<!doctype html|<html)/i.test(body)) throw new Error('Received an HTML page instead of RSS/Atom; the endpoint may be unavailable or blocking requests');
    let articles;
    try { articles = parseFeed(body, feed.source); }
    catch (error) { throw new Error(`Invalid RSS/Atom XML: ${error.message}`, { cause: error }); }
    if (!articles.length) throw new Error('Feed contained no valid articles; check entry titles, URLs and publication dates');
    console.log(JSON.stringify({ source: feed.source, event: 'success', articles: articles.length, elapsedMs: Date.now() - started }));
    return articles;
  } catch (error) {
    throw new Error(`${feed.source}: ${error.message}${error.cause?.code ? ` [${error.cause.code}]` : ''}`, { cause: error });
  }
}

async function fetchAllBlogs({ cacheFile = CACHE_FILE, feeds = FEEDS, request = fetch } = {}) {
  const previous = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { blogs: [] };
  const results = await Promise.allSettled(feeds.map(feed => fetchFeed(feed, request)));
  const failures = results.filter(result => result.status === 'rejected');
  const diagnostics = results.map((result, index) => ({ source: feeds[index].source, url: feeds[index].url,
    status: result.status, ...(result.status === 'fulfilled' ? { articles: result.value.length } : { error: result.reason.message }) }));
  if (process.env.BLOG_DIAGNOSTICS_FILE) {
    fs.mkdirSync(path.dirname(process.env.BLOG_DIAGNOSTICS_FILE), { recursive: true });
    fs.writeFileSync(process.env.BLOG_DIAGNOSTICS_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), sources: diagnostics }, null, 2));
  }
  failures.forEach(result => console.error(JSON.stringify({ event: 'source-failure', error: result.reason.message })));
  if (failures.length === feeds.length) throw new Error('All feeds failed; saved articles were preserved.');
  const merged = results.flatMap((result, index) => result.status === 'fulfilled'
    ? result.value
    : previous.blogs.filter(blog => blog.source === feeds[index].source));
  const unique = [...new Map(merged.map(blog => [blog.url, blog])).values()];
  const blogs = unique.sort((a, b) => new Date(b.date) - new Date(a.date) || a.url.localeCompare(b.url)).slice(0, 12);
  if (JSON.stringify(blogs) === JSON.stringify(previous.blogs)) {
    console.log('Articles unchanged; no update needed.');
    return { changed: false, failures: failures.length };
  }
  const output = { lastUpdated: new Date().toISOString(), totalCount: blogs.length, blogs };
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  const temporaryFile = `${cacheFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(output, null, 2)}\n`);
  fs.renameSync(temporaryFile, cacheFile);
  console.log(`Saved ${blogs.length} articles. ${failures.length} source(s) retained from cache.`);
  return { changed: true, failures: failures.length };
}

if (require.main === module) {
  fetchAllBlogs().then(result => {
    if (result.failures) console.warn('::warning::Some article sources failed; their cached articles were retained.');
  }).catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
}
module.exports = { parseFeed, fetchAllBlogs, fetchFeed, safeUrl };

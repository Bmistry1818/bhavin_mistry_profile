#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { xml2js } = require('xml-js');
const CACHE_FILE = path.join(__dirname, '../data/blogs.json');
const LINKEDIN_FILE = path.join(__dirname, '../data/linkedin-articles.json');
function configuredFeeds(env = process.env) {
  return [
    { source: 'Medium', url: 'https://medium.com/feed/@bhavin_mistry' },
    ...(env.LINKEDIN_RSS_URL ? [{ source: 'LinkedIn', url: env.LINKEDIN_RSS_URL }] : [])
  ];
}
const array = value => value ? (Array.isArray(value) ? value : [value]) : [];
const text = value => typeof value === 'string' ? value : array(value?._text ?? value?._cdata).join('');

function plainText(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()];
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }).replace(/\s+/g, ' ').trim();
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function canonicalUrl(value) {
  const safe = safeUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  for (const key of [...url.searchParams.keys()]) {
    if (key === 'source' || key === 'trackingId' || key.startsWith('utm_')) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.href;
}

function normalizeArticle(article) {
  const url = canonicalUrl(article.url);
  const title = plainText(article.title || '');
  const date = new Date(article.date);
  if (!url || !title || !['Medium', 'LinkedIn'].includes(article.source) || Number.isNaN(date.getTime())) return null;
  // Old placeholder entries pointed at the profile rather than a published article.
  if (article.source === 'LinkedIn' && !/^\/(pulse|posts|feed\/update)\//.test(new URL(url).pathname)) return null;
  const summary = plainText(article.description || '');
  return { id: `${article.source.toLowerCase()}-${createHash('sha256').update(url).digest('hex').slice(0, 16)}`,
    title, description: summary.length > 200 ? `${summary.slice(0, 197)}…` : summary,
    url, source: article.source, date: date.toISOString(), image: null, type: 'article' };
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
    const article = normalizeArticle({ title, description: text(item.description || item.summary || item.content || item['content:encoded']),
      url, source, date: parsedDate.toISOString() });
    return article ? [article] : [];
  });
}

async function fetchFeed(feed, request = fetch) {
  const started = Date.now();
  // Configured feeds can contain private provider tokens. Never log their URLs.
  console.log(JSON.stringify({ source: feed.source, event: 'request' }));
  try {
    if (!safeUrl(feed.url)) throw new Error('Invalid HTTP(S) feed URL');
    const response = await request(feed.url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
    const metadata = { source: feed.source, status: response.status, contentType: response.headers?.get('content-type') || 'unknown' };
    console.log(JSON.stringify({ ...metadata, event: 'response' }));
    if (!response.ok) throw new Error(`HTTP ${response.status} (${metadata.contentType})`);
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

async function fetchAllBlogs({ cacheFile = CACHE_FILE, feeds = configuredFeeds(), request = fetch, linkedinFile = LINKEDIN_FILE } = {}) {
  const previous = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { blogs: [] };
  const curated = linkedinFile && fs.existsSync(linkedinFile) ? JSON.parse(fs.readFileSync(linkedinFile, 'utf8')).articles : [];
  if (!Array.isArray(curated)) throw new Error('LinkedIn article index must contain an articles array.');
  const verified = curated.map(article => normalizeArticle({ ...article, source: 'LinkedIn' }));
  if (verified.some(article => !article)) throw new Error('LinkedIn article index contains an invalid title, article URL, or publication date.');
  const results = await Promise.allSettled(feeds.map(feed => fetchFeed(feed, request)));
  const failures = results.filter(result => result.status === 'rejected');
  const diagnostics = results.map((result, index) => ({ source: feeds[index].source,
    status: result.status, ...(result.status === 'fulfilled' ? { articles: result.value.length } : { error: result.reason.message }) }));
  if (!feeds.some(feed => feed.source === 'LinkedIn')) {
    diagnostics.push({ source: 'LinkedIn', status: 'manual', articles: verified.length,
      message: 'Using verified article index. Set LINKEDIN_RSS_URL for automatic discovery.' });
    console.warn('::warning::LinkedIn automatic discovery is not configured; using verified article links.');
  }
  if (process.env.BLOG_DIAGNOSTICS_FILE) {
    fs.mkdirSync(path.dirname(process.env.BLOG_DIAGNOSTICS_FILE), { recursive: true });
    fs.writeFileSync(process.env.BLOG_DIAGNOSTICS_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), sources: diagnostics }, null, 2));
  }
  failures.forEach(result => console.error(JSON.stringify({ event: 'source-failure', error: result.reason.message })));
  if (feeds.length && failures.length === feeds.length) throw new Error('All feeds failed; saved articles were preserved.');
  // Retain history beyond the RSS window and preserve either source during outages.
  const merged = [...verified, ...results.flatMap(result => result.status === 'fulfilled' ? result.value : []),
    ...previous.blogs.map(normalizeArticle).filter(Boolean)];
  // Prefer refreshed metadata over older cache entries with the same URL.
  const fresh = new Map();
  merged.forEach(blog => { if (!fresh.has(blog.url)) fresh.set(blog.url, blog); });
  const counts = {};
  const blogs = [...fresh.values()].sort((a, b) => new Date(b.date) - new Date(a.date) || a.url.localeCompare(b.url))
    .filter(blog => (counts[blog.source] = (counts[blog.source] || 0) + 1) <= 12);
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

async function restorePublishedCache({ cacheFile = CACHE_FILE, request = fetch } = {}) {
  const response = await request('https://raw.githubusercontent.com/Bmistry1818/bhavin_mistry_profile/gh-pages/data/blogs.json',
    { signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return false; // First deployment has no published cache yet.
  if (!response.ok) throw new Error(`Published article history unavailable: HTTP ${response.status}`);
  const published = await response.json();
  if (!Array.isArray(published.blogs) || published.blogs.some(article => !normalizeArticle(article)) ||
    Number.isNaN(new Date(published.lastUpdated).getTime())) throw new Error('Published article history is invalid.');
  const local = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  if (new Date(published.lastUpdated) <= new Date(local.lastUpdated || 0)) return false;
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, `${JSON.stringify(published, null, 2)}\n`);
  console.log('Restored article history from the previous deployment.');
  return true;
}

if (require.main === module) {
  (process.argv.includes('--restore-published') ? restorePublishedCache() : Promise.resolve()).then(() => fetchAllBlogs()).then(result => {
    if (result.failures) console.warn('::warning::Some article sources failed; their cached articles were retained.');
  }).catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
}
module.exports = { parseFeed, fetchAllBlogs, fetchFeed, safeUrl, canonicalUrl, normalizeArticle, configuredFeeds, restorePublishedCache };

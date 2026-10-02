const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseFeed, fetchAllBlogs, fetchFeed, safeUrl, configuredFeeds, canonicalUrl } = require('./fetch-blogs');
const rss = '<rss><channel><item><title><![CDATA[AI & delivery]]></title><link>https://example.com/article</link><description><![CDATA[<p>Useful insight</p>]]></description><pubDate>2026-08-30T00:00:00Z</pubDate></item></channel></rss>';
const response = body => ({ ok: true, text: async () => body });
test('failure diagnostics identify source and HTTP status', async () => {
  await assert.rejects(fetchFeed({ source: 'Medium', url: 'https://example.com/feed' }, async () => ({ ok: false, status: 403 })), /Medium: HTTP 403/);
});
test('HTML block pages produce an actionable feed error', async () => {
  await assert.rejects(fetchFeed({ source: 'LinkedIn', url: 'https://example.com/feed' }, async () => response('<!doctype html><html>Unavailable</html>')), /LinkedIn: Received an HTML page instead of RSS\/Atom/);
});
const cache = blogs => { const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'feed-test-')), 'blogs.json'); fs.writeFileSync(file, JSON.stringify({ lastUpdated: 'original', blogs })); return file; };
test('RSS preserves CDATA title and strips markup from summary', () => {
  const [article] = parseFeed(rss, 'Medium');
  assert.equal(article.title, 'AI & delivery');
  assert.equal(article.description, 'Useful insight');
  assert.deepEqual(parseFeed(rss, 'Medium'), parseFeed(rss, 'Medium'));
});
test('Atom chooses alternate link and rejects invalid dates', () => {
  const atom = '<feed><entry><title>Example</title><link rel="self" href="https://example.com/feed"/><link rel="alternate" href="https://example.com/article"/><published>2026-08-30</published></entry></feed>';
  assert.equal(parseFeed(atom, 'Medium')[0].url, 'https://example.com/article');
  assert.deepEqual(parseFeed(atom.replace('2026-08-30', 'bad-date'), 'Medium'), []);
  assert.equal(safeUrl('javascript:alert(1)'), null);
});
test('total outage leaves saved feed untouched', async () => {
  const file = cache([{ title: 'Saved', source: 'Medium' }]);
  const before = fs.readFileSync(file, 'utf8');
  await assert.rejects(fetchAllBlogs({ cacheFile: file, linkedinFile: null, feeds: [{ source: 'Medium', url: 'https://example.com' }], request: async () => { throw Error('offline'); } }), /preserved/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('unchanged feed does not rewrite timestamps', async () => {
  const file = cache(parseFeed(rss, 'Medium'));
  const before = fs.readFileSync(file, 'utf8');
  const result = await fetchAllBlogs({ cacheFile: file, linkedinFile: null, feeds: [{ source: 'Medium', url: 'https://example.com' }], request: async () => response(rss) });
  assert.equal(result.changed, false);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('partial outage retains articles from failed source', async () => {
  const file = cache([{ title: 'Saved LinkedIn', source: 'LinkedIn', url: 'https://www.linkedin.com/pulse/saved', date: '2026-08-29' }]);
  await fetchAllBlogs({ cacheFile: file, linkedinFile: null, feeds: [{ source: 'Medium', url: 'https://medium.com/feed/test' }, { source: 'LinkedIn', url: 'https://linkedin.com/feed/test' }], request: async url => { if (url.includes('linkedin')) throw Error('offline'); return response(rss); } });
  assert.equal(JSON.parse(fs.readFileSync(file)).blogs.length, 2);
});

test('Medium content:encoded provides an article summary', () => {
  const xml = rss.replace('<description>', '<content:encoded>').replace('</description>', '</content:encoded>');
  assert.equal(parseFeed(xml, 'Medium')[0].description, 'Useful insight');
});

test('LinkedIn automatic feed is opt-in and the dead RSS Bridge is not used', () => {
  assert.deepEqual(configuredFeeds({}).map(feed => feed.source), ['Medium']);
  assert.equal(configuredFeeds({ LINKEDIN_RSS_URL: 'https://feeds.example.com/linkedin' })[1].url, 'https://feeds.example.com/linkedin');
});

test('tracking parameters cannot duplicate cached articles', async () => {
  const file = cache(parseFeed(rss, 'Medium'));
  const tracked = rss.replace('https://example.com/article</link>', 'https://example.com/article?source=rss&amp;utm_source=medium</link>');
  const result = await fetchAllBlogs({ cacheFile: file, linkedinFile: null, feeds: [{ source: 'Medium', url: 'https://example.com/feed' }], request: async () => response(tracked) });
  assert.equal(result.changed, false);
  assert.equal(canonicalUrl('https://example.com/article?source=rss&keep=yes#top'), 'https://example.com/article?keep=yes');
});

test('fresh metadata replaces cache while retaining articles outside the RSS window', async () => {
  const file = cache([...parseFeed(rss, 'Medium'), { title: 'Older article', url: 'https://example.com/older', source: 'Medium', date: '2026-01-01' }]);
  await fetchAllBlogs({ cacheFile: file, linkedinFile: null, feeds: [{ source: 'Medium', url: 'https://example.com/feed' }], request: async () => response(rss.replace('Useful insight', 'Updated insight')) });
  const blogs = JSON.parse(fs.readFileSync(file)).blogs;
  assert.equal(blogs.length, 2);
  assert.equal(blogs[0].description, 'Updated insight');
});

test('verified LinkedIn entries survive Medium-only refreshes and profile placeholders are removed', async () => {
  const file = cache([{ title: 'Placeholder', url: 'https://www.linkedin.com/in/bhavin-mistry/recent-activity/articles/', source: 'LinkedIn', date: '2026-08-10' }]);
  const linkedinFile = path.join(path.dirname(file), 'linkedin.json');
  fs.writeFileSync(linkedinFile, JSON.stringify({ articles: [{ title: 'Verified', url: 'https://www.linkedin.com/pulse/verified', date: '2026-09-22' }] }));
  await fetchAllBlogs({ cacheFile: file, linkedinFile, feeds: [{ source: 'Medium', url: 'https://example.com/feed' }], request: async () => response(rss) });
  const blogs = JSON.parse(fs.readFileSync(file)).blogs;
  assert.equal(blogs.length, 2);
  assert.equal(blogs[0].title, 'Verified');
  assert.equal(blogs[0].source, 'LinkedIn');
});

test('published history is restored only when newer than the source cache', async () => {
  const { restorePublishedCache } = require('./fetch-blogs');
  const file = cache(parseFeed(rss, 'Medium'));
  const published = { lastUpdated: '2099-01-01T00:00:00.000Z', blogs: parseFeed(rss, 'Medium') };
  const request = async () => ({ status: 200, ok: true, json: async () => published });
  assert.equal(await restorePublishedCache({ cacheFile: file, request }), true);
  assert.equal(await restorePublishedCache({ cacheFile: file, request }), false);
  const before = fs.readFileSync(file, 'utf8');
  await assert.rejects(restorePublishedCache({ cacheFile: file, request: async () => ({ status: 200, ok: true, json: async () => ({ blogs: [] }) }) }), /invalid/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('encoded text becomes readable without retaining scripts', () => {
  const xml = rss.replace('Useful insight', '<script>danger()</script>Value &amp;amp; delivery &#39;today&#39;');
  assert.equal(parseFeed(xml, 'Medium')[0].description, "Value &amp; delivery 'today'");
});

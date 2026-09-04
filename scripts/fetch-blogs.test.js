const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseFeed, fetchAllBlogs, fetchFeed, safeUrl } = require('./fetch-blogs');
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
  await assert.rejects(fetchAllBlogs({ cacheFile: file, feeds: [{ source: 'Medium', url: 'https://example.com' }], request: async () => { throw Error('offline'); } }), /preserved/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('unchanged feed does not rewrite timestamps', async () => {
  const file = cache(parseFeed(rss, 'Medium'));
  const before = fs.readFileSync(file, 'utf8');
  const result = await fetchAllBlogs({ cacheFile: file, feeds: [{ source: 'Medium', url: 'https://example.com' }], request: async () => response(rss) });
  assert.equal(result.changed, false);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('partial outage retains articles from failed source', async () => {
  const file = cache([{ title: 'Saved LinkedIn', source: 'LinkedIn', url: 'https://linkedin.com/article', date: '2026-08-29' }]);
  await fetchAllBlogs({ cacheFile: file, feeds: [{ source: 'Medium', url: 'medium' }, { source: 'LinkedIn', url: 'linkedin' }], request: async url => { if (url === 'linkedin') throw Error('offline'); return response(rss); } });
  assert.equal(JSON.parse(fs.readFileSync(file)).blogs.length, 2);
});

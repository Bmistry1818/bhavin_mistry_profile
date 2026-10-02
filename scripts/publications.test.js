const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publicationGroups, renderPublicationCards } = require('./build-pages');
const post = { title: 'AI economics', source: 'Medium', url: 'https://medium.com/@bhavin_mistry/economics', date: '2026-09-25', description: 'Cost & value' };

test('cross-posted articles share a card with both source links', () => {
  const posts = [post, { ...post, source: 'LinkedIn', date: '2026-09-22', url: 'https://www.linkedin.com/pulse/economics' }];
  const groups = publicationGroups(posts);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].links.length, 2);
  const html = renderPublicationCards(posts, 6);
  assert.match(html, /Read on Medium/);
  assert.match(html, /Read on LinkedIn/);
});

test('external article text is escaped and unsafe URLs never become links', () => {
  const html = renderPublicationCards([{ ...post, title: 'AI & "value"', description: 'An &lt;img src=x onerror=alert(1)&gt; example' }, { ...post, url: 'javascript:alert(1)' }], 6);
  assert.match(html, /AI &amp; &quot;value&quot;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img|href="javascript:/);
});

test('newest publications appear first regardless of input order', () => {
  const posts = [post, { ...post, title: 'New article', url: 'https://medium.com/new', date: '2026-09-29' }];
  assert.equal(publicationGroups(posts)[0].title, 'New article');
  assert.match(renderPublicationCards(posts, 1), /New article/);
  assert.doesNotMatch(renderPublicationCards(posts, 1), /AI economics/);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { copyPublicSite, PUBLIC_FILES, PUBLIC_DIRS } = require('./publish-pages');

test('deployment copies public assets and excludes repository and private configuration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-site-test-'));
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'public-output-test-'));
  for (const name of PUBLIC_FILES) fs.writeFileSync(path.join(root, name), name === 'CNAME' ? 'bhavinmistry.com' : 'public');
  for (const name of [...PUBLIC_DIRS, '.git', '.aws', 'scripts', 'data']) fs.mkdirSync(path.join(root, name));
  fs.writeFileSync(path.join(root, 'data/blogs.json'), '{"blogs":[]}');
  fs.writeFileSync(path.join(root, 'data/private.json'), 'private');
  copyPublicSite(destination, root);
  assert.equal(fs.readFileSync(path.join(destination, 'CNAME'), 'utf8'), 'bhavinmistry.com');
  assert.ok(fs.existsSync(path.join(destination, 'data/blogs.json')));
  for (const name of ['.git', '.aws', 'scripts', 'data/private.json']) assert.equal(fs.existsSync(path.join(destination, name)), false);
});

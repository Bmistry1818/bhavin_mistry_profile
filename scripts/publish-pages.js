#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_FILES = ['index.html', '404.html', 'styles.css', 'script.js', 'favicon.ico', 'favicon.png',
  'favicon.svg', 'apple-touch-icon.png', 'CNAME', '.nojekyll', 'feed.xml', 'sitemap.xml', 'robots.txt', 'llms.txt'];
const PUBLIC_DIRS = ['about', 'ai-radar', 'architectures', 'enterprise-ai-engineering', 'frameworks',
  'insights', 'newsletter', 'privacy', 'research', 'tools'];

function copyPublicSite(destination, root = ROOT_DIR) {
  fs.mkdirSync(destination, { recursive: true });
  for (const item of [...PUBLIC_FILES, ...PUBLIC_DIRS]) {
    fs.cpSync(path.join(root, item), path.join(destination, item), { recursive: true });
  }
  fs.mkdirSync(path.join(destination, 'data'), { recursive: true });
  fs.copyFileSync(path.join(root, 'data/blogs.json'), path.join(destination, 'data/blogs.json'));
}

async function publishPages({ env = process.env, request = fetch } = {}) {
  const token = env.GITHUB_TOKEN;
  const repository = env.GITHUB_REPOSITORY;
  if (!token || repository !== 'Bmistry1818/bhavin_mistry_profile') throw new Error('An authenticated profile repository context is required.');
  const apiBase = `https://api.github.com/repos/${repository}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
  async function api(endpoint, method = 'GET', body) {
    const response = await request(`${apiBase}${endpoint}`, { method, headers,
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
    const data = await response.json();
    if (!response.ok) throw new Error(`GitHub Pages ${method} ${endpoint}: HTTP ${response.status}: ${data.message || 'request failed'}`);
    return data;
  }

  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'bhavin-pages-'));
  // The token only goes to GitHub, through child-process environment configuration.
  const gitEnv = { ...env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}` };
  function git(...args) {
    return execFileSync('git', args, { cwd: destination, env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  }
  git('init');
  git('remote', 'add', 'origin', `https://github.com/${repository}.git`);
  const existing = git('ls-remote', 'origin', 'refs/heads/gh-pages');
  if (existing) {
    git('fetch', '--depth=1', 'origin', 'gh-pages');
    git('checkout', '-b', 'gh-pages', 'FETCH_HEAD');
    // Only the generated, disposable deployment checkout is replaced.
    git('rm', '-r', '--ignore-unmatch', '.');
  } else {
    git('checkout', '--orphan', 'gh-pages');
  }
  copyPublicSite(destination);
  git('add', '-A');
  const changed = Boolean(git('diff', '--cached', '--name-only'));
  if (changed) {
    git('config', 'user.name', 'github-actions[bot]');
    git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
    git('commit', '-m', `Publish profile and refreshed articles (${(env.GITHUB_SHA || 'manual').slice(0, 7)})`);
    git('push', 'origin', 'HEAD:refs/heads/gh-pages');
  }
  const commit = git('rev-parse', 'HEAD');
  const pages = await api('/pages');
  const needsConfiguration = pages.source?.branch !== 'gh-pages' || pages.source?.path !== '/' || pages.build_type !== 'legacy';
  if (needsConfiguration) {
    if (!process.argv.includes('--configure')) throw new Error('Set the GitHub Pages publishing source to gh-pages / (root), then rerun this workflow.');
    await api('/pages', 'PUT', { build_type: 'legacy', source: { branch: 'gh-pages', path: '/' } });
  }
  if (!changed && !needsConfiguration) {
    const latest = await api('/pages/builds/latest');
    if (latest.commit === commit && latest.status === 'built') {
      console.log('Published site is already current; no deployment needed.');
      return { changed: false, commit };
    }
  }
  await api('/pages/builds', 'POST');
  console.log(`Requested GitHub Pages publication for ${commit.slice(0, 7)}.`);
  for (let attempt = 0; attempt < 30; attempt++) {
    const build = await api('/pages/builds/latest');
    if (build.commit === commit && build.status === 'built') {
      console.log(`Verified published site: https://bhavinmistry.com/ (${commit.slice(0, 7)}).`);
      return { changed, commit };
    }
    if (build.commit === commit && build.status === 'errored') throw new Error(`GitHub Pages build failed: ${build.error?.message || 'inspect the Pages build'}`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error('GitHub Pages publication did not complete within five minutes.');
}

if (require.main === module) publishPages().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { copyPublicSite, PUBLIC_FILES, PUBLIC_DIRS, publishPages };

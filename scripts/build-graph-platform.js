const fs = require('node:fs');
const path = require('node:path');

const SUITE = path.join(__dirname, '../graph-engineering');
const SKILLS = [
  { name: 'obsidian-zettelkasten-agent-memory', title: 'Architectural memory', number: '01', engine: 'memory.py', profile: 'memory', summary: 'Query past decisions, write atomic ADRs and build entity memory with traceable wikilinks.', outcome: 'Decisions stay inspectable instead of disappearing into chat history.', command: 'graph-engineering search --vault "$OBSIDIAN_VAULT_PATH" --query "gateway decision"' },
  { name: 'codebase-ast-to-obsidian-graph', title: 'Code becomes a graph', number: '02', engine: 'codegraph.py', profile: 'graph', summary: 'Turn Python ASTs and TypeScript syntax trees into linked module, class and function notes.', outcome: 'Make architecture navigable, with unresolved dependencies called out.', command: 'graph-engineering graph --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --allow-write' },
  { name: 'graph-rag-subgraph-pruner', title: 'Context with a boundary', number: '03', engine: 'pruner.py', profile: 'retrieval', summary: 'Retrieve a two-hop neighborhood, rank by graph communities and enforce an explicit byte budget.', outcome: 'Give agents relevant references without loading an entire vault.', command: 'graph-engineering prune --vault "$OBSIDIAN_VAULT_PATH" --seed ADRs/decision.md --max-bytes 12000 --markdown' },
  { name: 'automated-adr-and-rfc-governance', title: 'Governance in the loop', number: '04', engine: 'governance.py', profile: 'governance', summary: 'Check staged source against structured rules in accepted ADRs and draft proposed RFC exceptions.', outcome: 'Surface architectural drift before it becomes another accepted shortcut.', command: 'graph-engineering governance --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --mode staged' },
  { name: 'cross-sprint-context-serializer', title: 'A handoff, not a restart', number: '05', engine: 'handoff.py', profile: 'handoff', summary: 'Persist explicit summaries, execution trees, open tasks and Git metadata in local daily notes.', outcome: 'Switch harnesses with a validated state artifact and clear next actions.', command: 'graph-engineering save --repo "$GRAPH_REPO_ROOT" --vault "$OBSIDIAN_VAULT_PATH" --input-json examples/session-state.json --allow-write' }
];
const escape = text => String(text).replace(/[&<>"']/g, value => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[value]));

function sourceFiles(root = SUITE) {
  const files = [];
  const folders = ['src/graph_engineering', 'scripts', 'mcp-servers', '.claude/skills', '.agents/skills', 'configs', 'examples', 'schemas', 'tests', 'site'];
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink() || entry.name.startsWith('__') && entry.name !== '__init__.py') continue;
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) visit(name);
      else if (/\.(py|md|json|toml|yaml|css|js)$/.test(name)) files.push(name);
    }
  }
  folders.forEach(visit);
  files.push('pyproject.toml', 'requirements.lock', 'PORTFOLIO_README.md', '.mcp.json', '.codex/config.toml');
  return files.sort();
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Stored ZIP with fixed timestamps: deterministic, no build-time archive dependency.
function zipSources(files, root = SUITE) {
  const local = [], central = [];
  let offset = 0;
  for (const relative of files) {
    const name = Buffer.from('graph-engineering/' + relative);
    const data = fs.readFileSync(path.join(root, relative));
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(0x21, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8); record.writeUInt16LE(0x21, 14); record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(name.length, 28); record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += header.length + name.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

function sourceDocument(files, root = SUITE) {
  const languages = {'.py':'python','.js':'javascript','.css':'css','.toml':'toml','.json':'json','.yaml':'yaml','.md':'markdown','.lock':'text'};
  return '# Complete Graph Engineering Platform Source\n\nEvery distributable file is shown below, untruncated, with its relative path. Generated from the implementation, not manually copied.\n\n' + files.map(relative => {
    const body = fs.readFileSync(path.join(root, relative), 'utf8');
    const longest = Math.max(2, ...[...body.matchAll(/`+/g)].map(match => match[0].length));
    const fence = '`'.repeat(longest + 1);
    return `## graph-engineering/${relative}\n\n${fence}${languages[path.extname(relative)] || 'text'}\n${body.trimEnd()}\n${fence}\n`;
  }).join('\n');
}

function renderPlatform() {
  const demo = {nodes:[
    {id:'gateway',label:'Gateway ADR',kind:'Decision',body:'Accepted architecture boundary: route model traffic through a reviewed gateway.'},
    {id:'service',label:'Agent service',kind:'Module',body:'Owns request planning, explicit budgets and a gateway dependency.'},
    {id:'client',label:'Gateway client',kind:'Function',body:'Calls the approved endpoint and returns a typed result.'},
    {id:'tests',label:'Contract tests',kind:'Evidence',body:'Checks request contracts and rejection paths with deterministic fixtures.'},
    {id:'handoff',label:'Sprint handoff',kind:'Memory',body:'Lists open review tasks, branch and HEAD for the next session.'},
    {id:'billing',label:'Billing module',kind:'Module',body:'Separate billing implementation, not relevant to every gateway task.'},
    {id:'legacy',label:'Legacy migration',kind:'Decision',body:'Historical migration reference outside the gateway neighborhood.'}],
    edges:[['gateway','service'],['service','client'],['client','tests'],['service','handoff'],['billing','legacy']]};
  return `
  <link rel="stylesheet" href="/tools/graph-engineering/platform.css">
  <script defer src="/tools/graph-engineering/platform.js"></script>
  <section class="container graph-hero">
    <div class="graph-kicker"><span class="eyebrow">An engineering platform by Bhavin Mistry</span><span class="badge">Local-first · Python 3.11+</span></div>
    <h1>Engineering memory.<br><em>Built to survive the session.</em></h1>
    <p class="hero-lead">Five agent skills connecting code, architectural decisions and durable graph memory. One inspectable implementation, across Codex, Claude and MCP.</p>
    <div class="graph-actions"><a class="btn btn-primary" href="#installation">Install the toolkit →</a><a class="btn btn-secondary" href="/tools/graph-engineering/graph-engineering.zip" download>Download complete source ↓</a><a class="text-link" href="#graph-demo">Explore the graph</a></div>
    <dl class="graph-stats"><div><dt>05</dt><dd>Focused skills</dd></div><div><dt>05</dt><dd>Stdio MCP profiles</dd></div><div><dt>09</dt><dd>Discoverable tools</dd></div><div><dt>Local</dt><dd>Vault storage · no model API key</dd></div></dl>
  </section>
  <section class="container graph-principles"><div><span class="eyebrow">The operating idea</span><h2>Make decisions durable.<br>Make context deliberate.</h2></div><p>Agents should inherit the reasoning behind a system, not just its source files. This platform turns that principle into typed tools: navigable architecture, explicit governance rules and handoffs that can be verified against Git.</p></section>
  <section class="container graph-section" id="skills"><span class="eyebrow">From architecture to implementation</span><h2>Five skills. One connected workflow.</h2><div class="graph-skill-list">${SKILLS.map(skill => `
    <article class="graph-skill"><span class="graph-number">${skill.number}</span><div><span class="badge">${escape(skill.profile)} MCP</span><h3>${skill.title}</h3><p>${skill.summary}</p><p class="graph-outcome">${skill.outcome}</p><code class="graph-slug">${skill.name}</code>
      <details><summary>Inspect implementation & command</summary><pre><code>${escape(skill.command)}</code></pre><p class="graph-source-path">src/graph_engineering/${skill.engine}</p><pre class="graph-source"><code>${escape(fs.readFileSync(path.join(SUITE,'src/graph_engineering',skill.engine),'utf8'))}</code></pre></details>
    </div></article>`).join('')}</div></section>
  <section class="container graph-section" id="graph-demo"><span class="eyebrow">Interactive architecture fixture</span><h2>Relevant context, not the whole vault.</h2><p class="graph-intro">Choose a seed. The preview keeps its two-hop neighborhood and shows what was omitted. This browser demo uses a small fixture; it does not read your vault or call a model.</p>
    <div class="graph-demo-layout"><div class="graph-map" aria-label="Architecture graph"><svg viewBox="0 0 600 340" role="img" aria-label="Gateway decision linked to service, client, tests and handoff; billing and migration form a separate community"><g class="graph-edges"><path d="M110 75L300 130L470 75M300 130L300 265M470 75L500 185M100 260L160 320"/></g>${[[110,75],[300,130],[470,75],[500,185],[300,265],[100,260],[160,320]].map(([x,y],i)=>`<g data-graph-id="${demo.nodes[i].id}"><circle cx="${x}" cy="${y}" r="18"/><text x="${x}" y="${y-30}" text-anchor="middle">${demo.nodes[i].label}</text></g>`).join('')}</svg><div class="graph-seeds" aria-label="Choose retrieval seed">${demo.nodes.map(node=>`<button type="button" data-seed="${node.id}" aria-pressed="false">${node.label}</button>`).join('')}</div></div>
    <div class="graph-capsule"><span class="eyebrow">Two-hop capsule</span><div id="graph-demo-output" aria-live="polite"><p>Enable JavaScript to explore the fixture, or download the CLI to retrieve real graph context.</p></div></div></div>
    <script id="graph-demo-data" type="application/json">${JSON.stringify(demo).replace(/</g,'\\u003c')}</script>
  </section>
  <section class="container graph-section" id="installation"><span class="eyebrow">Native integrations</span><h2>Your harness. The same memory.</h2><p class="graph-intro">Extract the source bundle, create a Python environment and install the locked runtime before registering a host. Existing host settings and vaults are never modified by installation scripts.</p>
    <pre><code>python3.11 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
export OBSIDIAN_VAULT_PATH="/absolute/path/to/existing/vault"
export GRAPH_REPO_ROOT="/absolute/path/to/codebase"
export GRAPH_ALLOW_WRITE=0</code></pre>
    <div class="graph-install"><div role="tablist" aria-label="Choose agent harness">${['Codex','Claude','MCP'].map((label,index)=>`<button type="button" role="tab" id="install-${label.toLowerCase()}" aria-controls="panel-${label.toLowerCase()}" aria-selected="${index===0}">${label}</button>`).join('')}</div>
      <section role="tabpanel" id="panel-codex" aria-labelledby="install-codex"><h3>Codex CLI</h3><p>Launch from the activated toolkit folder. Project-scoped <code>.codex/config.toml</code> registers the MCP profiles; <code>.agents/skills</code> provides native skill discovery. Trust the project before enabling its configuration.</p><pre><code>codex mcp list
codex
# Invoke $obsidian-zettelkasten-agent-memory</code></pre><p>For another repository, merge the supplied MCP tables and copy the skill folders. See the README for unified-server registration and context injection.</p></section>
      <section role="tabpanel" id="panel-claude" aria-labelledby="install-claude"><h3>Claude Code / Desktop</h3><p>Claude Code uses the bundled <code>.claude/skills</code> and <code>.mcp.json</code>. Desktop uses MCP tools with absolute paths; it does not load Code's project skill folders.</p><pre><code>python scripts/render_mcp_config.py \\
  --vault "$OBSIDIAN_VAULT_PATH" --repo "$GRAPH_REPO_ROOT"</code></pre><p>Merge the printed server entries into your host settings, preserving existing entries. Rendering never writes settings or grants access.</p></section>
      <section role="tabpanel" id="panel-mcp" aria-labelledby="install-mcp"><h3>Generic stdio MCP</h3><p>Use the printed absolute-path manifest in a stdio-capable host. Tool discovery supplies typed input schemas. Adapt the wrapper to your host's configuration format.</p><pre><code>graph-memory-mcp --profile all \\
  --vault "$OBSIDIAN_VAULT_PATH" --repo "$GRAPH_REPO_ROOT"</code></pre><p>The server awaits JSON-RPC on stdin. Storage is local; a hosted agent may still receive returned excerpts.</p></section>
    </div>
  </section>
  <section class="container graph-section"><span class="eyebrow">Enterprise operating boundaries</span><h2>Designed for review.<br>Not for blind trust.</h2><div class="card-grid-3"><article class="card"><h3>Controlled mutations</h3><p>Read-only by default, fixed MCP roots, opt-in writes, file locking and atomic note replacement. Stale graph notes are retained for recovery.</p></article><article class="card"><h3>Honest guarantees</h3><p>Static relationships are not a runtime call graph. Explicit ADR rules are not compliance certification. Captured handoff fields are not hidden model memory.</p></article><article class="card"><h3>Measurable context</h3><p>Bounded retrieval returns source paths, omissions and byte counts. Token savings and retrieval quality must be measured on your own corpus.</p></article></div></section>
  <section class="container graph-download"><div><span class="eyebrow">Inspect before adopting</span><h2>Every file. No black box.</h2><p>Typed source, five native skill specs for each coding harness, MCP manifests, schemas, fixtures, tests and the portfolio README.</p></div><div class="graph-actions"><a class="btn btn-primary" href="/tools/graph-engineering/graph-engineering.zip" download>Download toolkit ↓</a><a class="btn btn-secondary" href="/tools/graph-engineering/SOURCE_FILES.md">Read every source file</a><a class="text-link" href="/tools/graph-engineering/PORTFOLIO_README.md">Architecture & operations README →</a></div></section>
  <section class="container graph-connect"><p>Building an AI engineering organization that needs durable architecture, reliable agents and accountable delivery?</p><a class="text-link" href="/about/#contact">Let's discuss the engineering system behind it →</a></section>`;
}

function buildPlatform(renderHtmlPage, rootDir) {
  const directory = path.join(rootDir, 'tools/graph-engineering');
  fs.mkdirSync(directory, {recursive:true});
  const files = sourceFiles();
  fs.writeFileSync(path.join(directory,'SOURCE_FILES.md'), sourceDocument(files));
  fs.writeFileSync(path.join(directory,'graph-engineering.zip'), zipSources(files));
  fs.copyFileSync(path.join(SUITE,'PORTFOLIO_README.md'),path.join(directory,'PORTFOLIO_README.md'));
  for (const asset of ['platform.css','platform.js']) fs.copyFileSync(path.join(SUITE,'site',asset),path.join(directory,asset));
  fs.writeFileSync(path.join(directory,'index.html'),renderHtmlPage({title:'Graph Engineering Platform | Bhavin Mistry', description:'Five local-first AI agent skills and MCP profiles connecting code graphs, Obsidian memory, architectural governance and cross-harness handoffs.',canonicalUrl:'https://bhavinmistry.com/tools/graph-engineering/',currentPath:'/tools/graph-engineering/',mainContent:renderPlatform()}));
  console.log('Generated: tools/graph-engineering/ (' + files.length + ' complete source files)');
}

module.exports = {buildPlatform, sourceFiles, sourceDocument, zipSources, crc32, SKILLS};

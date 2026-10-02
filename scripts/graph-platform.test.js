const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {sourceFiles,sourceDocument,zipSources,crc32,SKILLS} = require('./build-graph-platform');

test('source bundle contains all five skill specs for both harnesses and only distributable sources', () => {
  const files = sourceFiles();
  for (const skill of SKILLS) {
    assert(files.includes(`.claude/skills/${skill.name}/SKILL.md`));
    assert(files.includes(`.agents/skills/${skill.name}/SKILL.md`));
    assert(files.includes(`src/graph_engineering/${skill.engine}`));
  }
  assert(files.includes('requirements.lock'));
  assert(!files.some(file => file.includes('__pycache__') || file.includes('egg-info') || file.includes('.venv')));
});

test('complete source document contains every file untruncated and balanced dynamic fences', () => {
  const files = sourceFiles();
  const document = sourceDocument(files);
  for (const file of files) {
    assert(document.includes(`## graph-engineering/${file}`));
    assert(document.includes(fs.readFileSync(require('node:path').join(__dirname,'../graph-engineering',file),'utf8').trimEnd()));
  }
});

test('download archive has deterministic CRC-checked entries and no private state', () => {
  assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);
  const files = sourceFiles();
  const zip = zipSources(files);
  assert.deepEqual(zip,zipSources(files));
  let offset = 0, count = 0;
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const size = zip.readUInt32LE(offset+18), nameLength = zip.readUInt16LE(offset+26);
    const name = zip.subarray(offset+30,offset+30+nameLength).toString();
    const bytes = zip.subarray(offset+30+nameLength,offset+30+nameLength+size);
    assert.equal(crc32(bytes),zip.readUInt32LE(offset+14));
    assert(files.includes(name.slice('graph-engineering/'.length)));
    count++; offset += 30+nameLength+size;
  }
  assert.equal(count,files.length);
  assert.equal(zip.readUInt32LE(offset),0x02014b50);
});

test('showcase is discoverable from the homepage, tools, search and sitemap', () => {
  for (const file of ['index.html','tools/index.html','script.js','sitemap.xml']) {
    assert(fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8').includes('/tools/graph-engineering/'));
  }
  const html = fs.readFileSync(require('node:path').join(__dirname,'../tools/graph-engineering/index.html'),'utf8');
  assert.equal((html.match(/role="tab" /g)||[]).length,3);
  assert.equal((html.match(/role="tabpanel" /g)||[]).length,3);
  assert(html.includes('graph-engineering.zip'));
});

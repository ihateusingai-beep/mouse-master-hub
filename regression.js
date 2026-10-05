#!/usr/bin/env node
/** Structural gates for mouse-master-hub — no browser needed. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
let fails = 0;
function ok(msg) { console.log('OK  ' + msg); }
function bad(msg) { console.error('FAIL ' + msg); fails++; }

// reward.js load
const rewardSrc = fs.readFileSync(path.join(root, 'reward.js'), 'utf8');
const commonSrc = fs.readFileSync(path.join(root, 'common.js'), 'utf8');
const sandbox = { window: {}, localStorage: { store: {}, getItem(k){return this.store[k]||null;}, setItem(k,v){this.store[k]=String(v);}, removeItem(k){delete this.store[k];} }, console };
sandbox.global = sandbox.window;
sandbox.window.localStorage = sandbox.localStorage;
try {
  vm.runInNewContext(rewardSrc + '\nthis.MouseHubReward = window.MouseHubReward;', sandbox);
  vm.runInNewContext(commonSrc + '\nthis.MouseHubCommon = window.MouseHubCommon;', sandbox);
  ok('reward.js + common.js load');
} catch (e) {
  bad('load shared: ' + e.message);
  process.exit(1);
}

const R = sandbox.window.MouseHubReward;
const C = sandbox.window.MouseHubCommon;
if (!R || !R.GAMES) bad('MouseHubReward.GAMES missing');
else ok('GAMES count=' + R.GAMES.length);

const needMeta = ['id', 'title', 'url', 'group', 'certName', 'emoji', 'tag'];
for (const g of R.GAMES) {
  for (const k of needMeta) if (g[k] == null) bad('game ' + g.id + ' missing ' + k);
  if (!R.STICKER_META[g.id]) bad('STICKER_META missing ' + g.id);
  if (g.url.startsWith('http')) continue;
  const file = path.join(root, g.url.replace(/^\.\//, ''));
  if (!fs.existsSync(file)) bad('missing file for ' + g.id + ': ' + g.url);
  else {
    const html = fs.readFileSync(file, 'utf8');
    if (!/reward\.js/.test(html)) bad(g.id + ' missing reward.js');
    if (!/cert\.js/.test(html)) bad(g.id + ' missing cert.js');
  }
}
ok('catalog files + sticker meta');

// fun levels must use common.js
for (const id of ['fish', 'pizza', 'planet', 'duo']) {
  const html = fs.readFileSync(path.join(root, id + '.html'), 'utf8');
  if (!/common\.js/.test(html)) bad(id + ' should load common.js');
  if (!/MouseHubCommon/.test(html)) bad(id + ' should use MouseHubCommon');
}
ok('fun levels on common.js');

// shared API surface
for (const k of ['enableDrag', 'bindRight', 'finishClear', 'wireChrome', 'hits', 'sfxOk']) {
  if (typeof C[k] !== 'function') bad('common missing ' + k);
}
ok('common API');

// award smoke
sandbox.localStorage.store = {};
const a = R.award('fish', 5, 'clear');
if (!a || !a.cert || a.cert.tier !== 'gold') bad('award clear gold expected, got ' + JSON.stringify(a && a.cert));
else ok('award fish clear → gold');

if (fails) { console.error('\n' + fails + ' fail(s)'); process.exit(1); }
console.log('\nALL GATES PASS');

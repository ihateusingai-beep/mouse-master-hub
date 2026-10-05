/* mouse-hub rewards + free levels + certs */
(function (global) {
  const LS_PET = 'mouse_hub_pet';
  const LS_STICKERS = 'mouse_hub_stickers';
  const LS_CERTS = 'mouse_hub_certs';
  const LS_AUTO_SPEAK = 'mouse_hub_auto_speak';

  const PET_STAGES = [
    { min: 1, emoji: '🐱', label: '小貓' },
    { min: 3, emoji: '😺', label: '開心貓' },
    { min: 5, emoji: '😻', label: '星星眼' },
    { min: 7, emoji: '😸', label: '得意貓' },
    { min: 9, emoji: '👑🐱', label: '貓大王' }
  ];

  const STICKER_META = {
    move: { emoji: '🖱️', name: '移動' },
    clickL: { emoji: '🎈', name: '氣筒' },
    clickR: { emoji: '🎁', name: '禮物雨' },
    bubbles: { emoji: '🫧', name: '泡泡' },
    balloons: { emoji: '🎈', name: '氣球' },
    gifts: { emoji: '🎁', name: '禮物' },
    chest: { emoji: '💎', name: '寶石' },
    stars: { emoji: '⭐', name: '星星' },
    feeder: { emoji: '🐟', name: '魚魚' },
    fish: { emoji: '🎣', name: '釣魚' },
    pizza: { emoji: '🍕', name: '薄餅' },
    planet: { emoji: '🚀', name: '快遞' },
    duo: { emoji: '👯', name: '接力' }
  };

  /** Free pick — basic first, then skills */
  const GAMES = [
    { id: 'move', title: '滑鼠走走', tag: '只移動', emoji: '🖱️', url: './move.html', group: 'basic', certName: '移動小達人' },
    { id: 'clickL', title: '打氣筒救氣球', tag: '左掣泵氣', emoji: '🎈', url: './click-left.html', group: 'basic', certName: '救氣球小達人' },
    { id: 'clickR', title: '禮物雨', tag: '右掣開盒', emoji: '🎁', url: './click-right.html', group: 'basic', certName: '禮物雨小達人' },
    { id: 'bubbles', title: '泡泡點點', tag: '左掣', emoji: '🫧', url: './bubbles.html', group: 'skill', certName: '泡泡小達人' },
    { id: 'balloons', title: '氣球派對', tag: '左掣連撃', emoji: '🎈', url: './balloons.html', group: 'skill', certName: '氣球小達人' },
    { id: 'gifts', title: '禮物拖拖', tag: '拖曳', emoji: '🎁', url: './gifts.html', group: 'skill', certName: '拖曳小達人' },
    { id: 'chest', title: '寶箱右掣', tag: '右掣', emoji: '📦', url: './chest.html', group: 'skill', certName: '開盒小達人' },
    { id: 'stars', title: '星空挑戰', tag: '混合', emoji: '✨', url: './stars.html', group: 'skill', certName: '星空小達人' },
    { id: 'fish', title: '小貓釣魚', tag: '移+精準點', emoji: '🎣', url: './fish.html', group: 'fun', certName: '釣魚小達人' },
    { id: 'pizza', title: '薄餅店', tag: '左+拖', emoji: '🍕', url: './pizza.html', group: 'fun', certName: '薄餅小達人' },
    { id: 'planet', title: '星球快遞', tag: '混合Boss', emoji: '🚀', url: './planet.html', group: 'fun', certName: '快遞小達人' },
    { id: 'duo', title: '雙人接力', tag: '左vs右', emoji: '👯', url: './duo.html', group: 'fun', certName: '接力小達人' },
    { id: 'feeder', title: '喵喵餵食館', tag: '左·拖·右', emoji: '🐱', url: 'https://ihateusingai-beep.github.io/mouse-feeder/', group: 'skill', certName: '餵食小達人' }
  ];

  // keep PATH alias for older games
  const PATH = GAMES;

  function loadPet() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_PET) || '{}');
      return { xp: Number(p.xp) || 0, level: Math.min(10, Math.max(1, Number(p.level) || 1)) };
    } catch (_) {
      return { xp: 0, level: 1 };
    }
  }
  function savePet(pet) { localStorage.setItem(LS_PET, JSON.stringify(pet)); }
  function stageFor(level) {
    let s = PET_STAGES[0];
    for (const st of PET_STAGES) if (level >= st.min) s = st;
    return s;
  }
  function loadStickers() {
    try { return JSON.parse(localStorage.getItem(LS_STICKERS) || '{}') || {}; } catch (_) { return {}; }
  }
  function loadCerts() {
    try { return JSON.parse(localStorage.getItem(LS_CERTS) || '{}') || {}; } catch (_) { return {}; }
  }
  function saveCerts(c) { localStorage.setItem(LS_CERTS, JSON.stringify(c)); }

  function gameMeta(id) {
    return GAMES.find(g => g.id === id) || { id, title: id, emoji: '⭐', certName: '滑鼠小達人' };
  }

  /** score → tier: gold/silver/bronze */
  function tierFromScore(score, mode) {
    score = Number(score) || 0;
    if (mode === 'race') {
      if (score >= 20) return 'gold';
      if (score >= 12) return 'silver';
      if (score >= 1) return 'bronze';
      return 'bronze';
    }
    if (mode === 'move') {
      if (score >= 5) return 'gold';
      if (score >= 3) return 'silver';
      return 'bronze';
    }
    // clear = at least bronze; high need games
    if (score >= 5) return 'gold';
    if (score >= 3) return 'silver';
    return 'bronze';
  }

  const TIER_META = {
    bronze: { label: '銅獎', medal: '🥉', color: '#CD7F32' },
    silver: { label: '銀獎', medal: '🥈', color: '#9E9E9E' },
    gold: { label: '金獎', medal: '🥇', color: '#F5B700' }
  };

  function saveCert(gameId, score, mode) {
    const tier = tierFromScore(score, mode || 'clear');
    const certs = loadCerts();
    const prev = certs[gameId];
    const rank = { bronze: 1, silver: 2, gold: 3 };
    const keep = prev && rank[prev.tier] > rank[tier] ? prev : {
      tier,
      score: Number(score) || 0,
      at: Date.now(),
      name: (localStorage.getItem('mouse_hub_name') || '').trim()
    };
    if (prev && rank[prev.tier] === rank[tier] && (prev.score || 0) > keep.score) {
      keep.score = prev.score;
      keep.at = prev.at;
      keep.name = prev.name || keep.name;
    }
    certs[gameId] = keep;
    saveCerts(certs);
    return { tier, meta: TIER_META[tier], cert: keep, game: gameMeta(gameId) };
  }

  function award(gameId, score, mode) {
    const stickers = loadStickers();
    const stickerNew = !stickers[gameId];
    const meta = STICKER_META[gameId] || { emoji: '⭐', name: gameId };
    stickers[gameId] = meta.emoji;
    localStorage.setItem(LS_STICKERS, JSON.stringify(stickers));

    const prevLevel = loadPet().level;
    const pet = loadPet();
    pet.xp += 1;
    pet.level = Math.min(10, 1 + Math.floor(pet.xp / 3));
    savePet(pet);

    const cert = saveCert(gameId, score != null ? score : 5, mode || 'clear');

    return {
      pet,
      prevLevel,
      leveledUp: pet.level > prevLevel,
      stickerNew,
      sticker: meta,
      stage: stageFor(pet.level),
      stickers,
      cert
    };
  }

  function fishBones(n, need) {
    let s = '';
    for (let i = 0; i < need; i++) s += i < n ? '🐟' : '🦴';
    return s;
  }
  function pathIndex(id) { return GAMES.findIndex(g => g.id === id); }
  function nextAfter(id) {
    const i = pathIndex(id);
    if (i < 0) return GAMES[0];
    return GAMES[Math.min(GAMES.length - 1, i + 1)];
  }
  function recommend() {
    const st = loadStickers();
    for (const g of GAMES) if (!st[g.id]) return g;
    return GAMES[0];
  }
  function hubUrl(extra) {
    const q = new URLSearchParams(extra || {});
    const s = q.toString();
    return './index.html' + (s ? '?' + s : '');
  }
  function hubWonUrl(gameId) { return hubUrl({ won: gameId }); }
  function gameUrl(g) {
    if (!g || !g.url) return hubUrl();
    const name = (localStorage.getItem('mouse_hub_name') || '').trim();
    let whoId = '';
    try { whoId = (JSON.parse(localStorage.getItem('mouse_hub_who') || 'null') || {}).id || ''; } catch (_) {}
    const q = [];
    if (name) q.push('name=' + encodeURIComponent(name));
    if (whoId) q.push('who=' + encodeURIComponent(whoId));
    const join = g.url.includes('?') ? '&' : '?';
    return g.url + (q.length ? join + q.join('&') : '');
  }
  function autoSpeak() { return localStorage.getItem(LS_AUTO_SPEAK) === '1'; }
  function setAutoSpeak(on) { localStorage.setItem(LS_AUTO_SPEAK, on ? '1' : '0'); }
  function xpToNext(pet) {
    if (pet.level >= 10) return { into: 3, need: 3, left: 0 };
    const into = pet.xp % 3;
    return { into, need: 3, left: 3 - into };
  }
  function displayName() {
    const n = (localStorage.getItem('mouse_hub_name') || '').trim();
    if (n) return n;
    try {
      const w = JSON.parse(localStorage.getItem('mouse_hub_who') || 'null');
      if (w && w.name) return w.name;
    } catch (_) {}
    return '同學';
  }

  global.MouseHubReward = {
    LS_PET, LS_STICKERS, LS_CERTS, LS_AUTO_SPEAK,
    STICKER_META, TIER_META, GAMES, PATH, PET_STAGES,
    loadPet, loadStickers, loadCerts, stageFor, award, saveCert,
    fishBones, nextAfter, recommend, hubUrl, hubWonUrl, gameUrl,
    autoSpeak, setAutoSpeak, xpToNext, pathIndex, gameMeta, displayName,
    tierFromScore
  };
})(window);

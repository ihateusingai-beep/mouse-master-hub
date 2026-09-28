/* mouse-hub shared rewards + path */
(function (global) {
  const LS_PET = 'mouse_hub_pet';
  const LS_STICKERS = 'mouse_hub_stickers';
  const LS_AUTO_SPEAK = 'mouse_hub_auto_speak';

  const PET_STAGES = [
    { min: 1, emoji: '🐱', label: '小貓' },
    { min: 3, emoji: '😺', label: '開心貓' },
    { min: 5, emoji: '😻', label: '星星眼' },
    { min: 7, emoji: '😸', label: '得意貓' },
    { min: 9, emoji: '👑🐱', label: '貓大王' }
  ];

  const STICKER_META = {
    feeder: { emoji: '🐟', name: '魚魚' },
    bubbles: { emoji: '🫧', name: '泡泡' },
    gifts: { emoji: '🎁', name: '禮物' },
    chest: { emoji: '💎', name: '寶石' },
    stars: { emoji: '⭐', name: '星星' },
    balloons: { emoji: '🎈', name: '氣球' }
  };

  /** Learning path order */
  const PATH = [
    { id: 'bubbles', title: '泡泡點點', tag: '左掣', emoji: '🫧', url: './bubbles.html' },
    { id: 'balloons', title: '氣球派對', tag: '左掣連撃', emoji: '🎈', url: './balloons.html' },
    { id: 'gifts', title: '禮物拖拖', tag: '拖曳', emoji: '🎁', url: './gifts.html' },
    { id: 'chest', title: '寶箱右掣', tag: '右掣', emoji: '📦', url: './chest.html' },
    { id: 'stars', title: '星空挑戰', tag: '混合', emoji: '✨', url: './stars.html' },
    { id: 'feeder', title: '喵喵餵食館', tag: '左·拖·右', emoji: '🐱', url: 'https://ihateusingai-beep.github.io/mouse-feeder/' }
  ];

  function loadPet() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_PET) || '{}');
      return {
        xp: Number(p.xp) || 0,
        level: Math.min(10, Math.max(1, Number(p.level) || 1))
      };
    } catch (_) {
      return { xp: 0, level: 1 };
    }
  }

  function savePet(pet) {
    localStorage.setItem(LS_PET, JSON.stringify(pet));
  }

  function stageFor(level) {
    let s = PET_STAGES[0];
    for (const st of PET_STAGES) if (level >= st.min) s = st;
    return s;
  }

  function loadStickers() {
    try {
      return JSON.parse(localStorage.getItem(LS_STICKERS) || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  function award(gameId) {
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

    return {
      pet,
      prevLevel,
      leveledUp: pet.level > prevLevel,
      stickerNew,
      sticker: meta,
      stage: stageFor(pet.level),
      stickers
    };
  }

  function fishBones(n, need) {
    let s = '';
    for (let i = 0; i < need; i++) s += i < n ? '🐟' : '🦴';
    return s;
  }

  function pathIndex(id) {
    return PATH.findIndex(g => g.id === id);
  }

  function nextAfter(id) {
    const i = pathIndex(id);
    if (i < 0) return PATH[0];
    return PATH[Math.min(PATH.length - 1, i + 1)];
  }

  function recommend() {
    const st = loadStickers();
    for (const g of PATH) if (!st[g.id]) return g;
    return PATH[0];
  }

  function hubUrl(extra) {
    const q = new URLSearchParams(extra || {});
    const s = q.toString();
    return './index.html' + (s ? '?' + s : '');
  }

  function hubWonUrl(gameId) {
    return hubUrl({ won: gameId });
  }

  function withProfile(url) {
    try {
      const name = (localStorage.getItem('mouse_hub_name') || '').trim();
      let who = null;
      try { who = JSON.parse(localStorage.getItem('mouse_hub_who') || 'null'); } catch (_) {}
      const u = new URL(url, location.href);
      if (name) u.searchParams.set('name', name);
      if (who && who.id) u.searchParams.set('who', who.id);
      return u.pathname + u.search + (url.startsWith('http') ? '' : '');
    } catch (_) {
      return url;
    }
  }

  /** Resolve game URL with profile query */
  function gameUrl(g) {
    if (!g || !g.url) return hubUrl();
    if (g.url.startsWith('http')) {
      const name = (localStorage.getItem('mouse_hub_name') || '').trim();
      let whoId = '';
      try { whoId = (JSON.parse(localStorage.getItem('mouse_hub_who') || 'null') || {}).id || ''; } catch (_) {}
      const q = [];
      if (name) q.push('name=' + encodeURIComponent(name));
      if (whoId) q.push('who=' + encodeURIComponent(whoId));
      return g.url + (q.length ? (g.url.includes('?') ? '&' : '?') + q.join('&') : '');
    }
    const name = (localStorage.getItem('mouse_hub_name') || '').trim();
    let whoId = '';
    try { whoId = (JSON.parse(localStorage.getItem('mouse_hub_who') || 'null') || {}).id || ''; } catch (_) {}
    const q = [];
    if (name) q.push('name=' + encodeURIComponent(name));
    if (whoId) q.push('who=' + encodeURIComponent(whoId));
    return g.url + (q.length ? (g.url.includes('?') ? '&' : '?') + q.join('&') : '');
  }

  function autoSpeak() {
    return localStorage.getItem(LS_AUTO_SPEAK) === '1';
  }

  function setAutoSpeak(on) {
    localStorage.setItem(LS_AUTO_SPEAK, on ? '1' : '0');
  }

  function xpToNext(pet) {
    if (pet.level >= 10) return { into: 3, need: 3, left: 0 };
    const into = pet.xp % 3;
    return { into, need: 3, left: 3 - into };
  }

  global.MouseHubReward = {
    LS_PET,
    LS_STICKERS,
    LS_AUTO_SPEAK,
    STICKER_META,
    PATH,
    loadPet,
    loadStickers,
    stageFor,
    award,
    fishBones,
    nextAfter,
    recommend,
    hubUrl,
    hubWonUrl,
    gameUrl,
    autoSpeak,
    setAutoSpeak,
    xpToNext,
    pathIndex
  };
})(window);

/* mouse-hub shared rewards — pet XP + stickers */
(function (global) {
  const LS_PET = 'mouse_hub_pet';
  const LS_STICKERS = 'mouse_hub_stickers';

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

  /** Call on game clear. Returns { pet, stickerNew, stage } */
  function award(gameId) {
    const stickers = loadStickers();
    const stickerNew = !stickers[gameId];
    const meta = STICKER_META[gameId] || { emoji: '⭐', name: gameId };
    stickers[gameId] = meta.emoji;
    localStorage.setItem(LS_STICKERS, JSON.stringify(stickers));

    const pet = loadPet();
    pet.xp += 1;
    pet.level = Math.min(10, 1 + Math.floor(pet.xp / 3));
    savePet(pet);

    return {
      pet,
      stickerNew,
      sticker: meta,
      stage: stageFor(pet.level),
      stickers
    };
  }

  function fishBones(n, need) {
    const on = '🐟';
    const off = '🦴';
    let s = '';
    for (let i = 0; i < need; i++) s += i < n ? on : off;
    return s;
  }

  global.MouseHubReward = {
    LS_PET,
    LS_STICKERS,
    STICKER_META,
    loadPet,
    loadStickers,
    stageFor,
    award,
    fishBones
  };
})(window);

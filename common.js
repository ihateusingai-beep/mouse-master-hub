/* mouse-hub shared runtime — audio/UI/input helpers (no game logic) */
(function (global) {
  function $(id) { return document.getElementById(id); }

  function lockSEN() {
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  }

  function loadProfile(avId, nameId) {
    var who = null, name = '';
    try {
      var p = new URLSearchParams(location.search);
      name = (p.get('name') || localStorage.getItem('mouse_hub_name') || '').trim();
      who = JSON.parse(localStorage.getItem('mouse_hub_who') || 'null');
    } catch (_) {}
    if (!who) who = { emoji: '🐱', name: '同學' };
    var av = avId ? $(avId) : $('av');
    var nm = nameId ? $(nameId) : $('whoName');
    if (av) av.textContent = who.emoji || '🐱';
    if (nm) nm.textContent = name || who.name || '同學';
    return name || who.name || '同學';
  }

  var audioCtx = null;
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function armAudioOnce() {
    window.addEventListener('pointerdown', function () { try { ctx(); } catch (_) {} }, { once: true });
  }
  function tone(f, d, t, v) {
    d = d == null ? 0.12 : d; t = t || 'sine'; v = v == null ? 0.2 : v;
    try {
      var c = ctx(), o = c.createOscillator(), g = c.createGain();
      o.type = t; o.frequency.value = f;
      g.gain.setValueAtTime(v, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + d);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + d);
    } catch (_) {}
  }
  function sfxOk() {
    tone(523, 0.1); setTimeout(function () { tone(659, 0.1); }, 70);
    setTimeout(function () { tone(784, 0.12); }, 140);
  }
  function sfxWin() {
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.16, 'triangle', 0.2); }, i * 80);
    });
  }
  function sfxBad() { tone(180, 0.14, 'square', 0.1); }

  function speak(t) {
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-HK'; u.rate = 0.92;
      speechSynthesis.speak(u);
    } catch (_) {}
  }

  function toast(m, bad) {
    var el = $('toast');
    if (!el) return;
    el.textContent = m;
    el.classList.toggle('bad', !!bad);
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 1100);
  }

  function confetti(cols) {
    var box = $('confetti');
    if (!box) return;
    cols = cols || ['#FF6B9D', '#FFD54F', '#69F0AE', '#4FC3F7', '#B388FF'];
    box.innerHTML = '';
    for (var i = 0; i < 30; i++) {
      var el = document.createElement('i');
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = cols[i % cols.length];
      el.style.animationDuration = (1 + Math.random() * 1.2) + 's';
      box.appendChild(el);
    }
    setTimeout(function () { box.innerHTML = ''; }, 2500);
  }

  function setProgress(n, need) {
    need = need || 5;
    var fill = $('fill'), lab = $('mlab');
    if (fill) fill.style.width = Math.min(100, n / need * 100) + '%';
    if (lab) {
      var R = global.MouseHubReward;
      lab.textContent = (R && R.fishBones) ? R.fishBones(n, need) : (n + '/' + need);
    }
  }

  function bigCelebrate(done) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(61,43,90,.55)';
    ov.innerHTML = '<div style="font-size:clamp(2rem,8vw,3.5rem);font-weight:900;color:#fff;text-align:center;text-shadow:0 4px 16px rgba(0,0,0,.35)">🎉 太叻喇！</div>';
    document.body.appendChild(ov);
    setTimeout(function () { ov.remove(); if (done) done(); }, 1800);
  }

  function hits(el, zone, pad) {
    pad = pad == null ? 56 : pad;
    var a = el.getBoundingClientRect(), b = zone.getBoundingClientRect();
    var cx = (a.left + a.right) / 2, cy = (a.top + a.bottom) / 2;
    return cx >= b.left - pad && cx <= b.right + pad && cy >= b.top - pad && cy <= b.bottom + pad;
  }

  /** Fixed-position drag (SEN mouse pitfall fix) */
  function enableDrag(el, zone, onOk, onMiss) {
    var ox = 0, oy = 0, dragging = false;
    function detach() {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    }
    function down(e) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      var r = el.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      el.classList.remove('pulse');
      el.style.position = 'fixed';
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      el.style.zIndex = '30';
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      move(e);
    }
    function move(e) {
      if (!dragging || e.clientX == null) return;
      el.style.left = Math.max(0, Math.min(innerWidth - el.offsetWidth, e.clientX - ox)) + 'px';
      el.style.top = Math.max(0, Math.min(innerHeight - el.offsetHeight, e.clientY - oy)) + 'px';
      if (zone) zone.classList.toggle('hot', hits(el, zone));
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      detach();
      try { if (e && e.pointerId != null) el.releasePointerCapture(e.pointerId); } catch (_) {}
      if (zone && hits(el, zone)) onOk();
      else {
        sfxBad();
        if (zone) zone.classList.remove('hot');
        if (onMiss) onMiss();
      }
    }
    el.addEventListener('pointerdown', down);
  }

  /** Right-click / two-finger / ctrl-click (SEN mouse pitfall) */
  function bindRight(el, onOk, badMsg) {
    var opened = false, until = 0;
    function go(e) {
      if (opened) return;
      opened = true;
      until = Date.now() + 600;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      onOk();
    }
    el.addEventListener('pointerdown', function (e) { if (e.button === 2 || e.ctrlKey) go(e); }, true);
    el.addEventListener('mousedown', function (e) { if (e.button === 2 || e.ctrlKey) go(e); }, true);
    el.addEventListener('contextmenu', function (e) { go(e); }, true);
    el.addEventListener('auxclick', function (e) { if (e.button === 2) go(e); }, true);
    el.addEventListener('click', function (e) {
      if (opened || Date.now() < until) { e.preventDefault(); return; }
      if (e.ctrlKey || e.metaKey) { go(e); return; }
      if (e.button === 0) { sfxBad(); toast(badMsg || '兩指／右掣', true); }
    }, true);
  }

  /**
   * Standard clear-mode win flow used by most skill/fun levels.
   * opts: { gid, progress, mode, label, getDidWin, setDidWin }
   */
  function finishClear(opts) {
    var gid = opts.gid, progress = opts.progress, mode = opts.mode || 'clear', label = opts.label || '';
    if (opts.setDidWin) opts.setDidWin(true);
    try { if (global.MouseHubReward) MouseHubReward.award(gid, progress, mode); } catch (_) {}
    confetti();
    sfxWin();
    if (global.MouseHubReward && MouseHubReward.autoSpeak()) speak('做得好');
    var next = global.MouseHubReward ? MouseHubReward.nextAfter(gid) : null;
    var nb = $('btnNext');
    if (nb) {
      if (next && next.id !== gid) {
        nb.style.display = '';
        nb.textContent = '下一個：' + next.title;
        nb.onclick = function () { location.href = MouseHubReward.gameUrl(next); };
      } else nb.style.display = 'none';
    }
    try {
      var c = MouseHubReward.loadCerts()[gid];
      var medalEl = $('winMedal');
      if (medalEl) medalEl.textContent = (c && MouseHubReward.TIER_META[c.tier].medal) || '🥇';
    } catch (_) {}
    var name = opts.displayName || (global.MouseHubReward && MouseHubReward.displayName()) || '同學';
    bigCelebrate(function () {
      var msg = $('winMsg');
      if (msg) msg.textContent = name + (label ? ' · ' + label : '');
      var win = $('win');
      if (win) win.classList.add('on');
    });
  }

  function wireChrome(opts) {
    var gid = opts.gid, speakText = opts.speakText || '', onRetry = opts.onRetry;
    var hub = $('btnHub'), hub2 = $('btnHub2'), sp = $('btnSpeak'), cert = $('btnCert'), retry = $('btnRetry');
    if (hub) hub.onclick = function () { location.href = './index.html'; };
    if (hub2) hub2.onclick = function () {
      var did = opts.didWin && opts.didWin();
      location.href = (did && global.MouseHubReward) ? MouseHubReward.hubWonUrl(gid)
        : './index.html' + (did ? ('?won=' + gid) : '');
    };
    if (sp) sp.onclick = function () { speak(speakText); };
    if (cert) cert.onclick = function () { global.MouseHubCert && MouseHubCert.showCert(gid); };
    if (retry) retry.onclick = function () {
      var w = $('win'); if (w) w.classList.remove('on');
      if (onRetry) onRetry();
    };
  }

  global.MouseHubCommon = {
    $, lockSEN, loadProfile, ctx, armAudioOnce, tone, sfxOk, sfxWin, sfxBad,
    speak, toast, confetti, setProgress, bigCelebrate, hits, enableDrag, bindRight,
    finishClear, wireChrome
  };
})(window);

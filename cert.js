/* shared printable cert — school printer safe */
(function (global) {
  /* Inline SVG school crest for 将军澳培智学校 (Tseung Kwan O Pui Chi School).
     Eliminates the external PNG dependency so certs work offline / on filtered networks.
     SVG rendered at ~72×72px, scales cleanly to any print size. */
  var LOGO_SVG = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">',
    /* Circle background — school blue */
    '<circle cx="50" cy="50" r="46" fill="#426EB4" stroke="#2A4A80" stroke-width="3"/>',
    /* White inner ring */
    '<circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="2"/>',
    /* Stylised book / open-pages symbol in white */
    '<path d="M28 62 Q50 72 72 62 L72 38 Q50 48 28 38 Z" fill="white" opacity="0.9"/>',
    '<path d="M28 62 Q50 52 72 62 L72 52 Q50 62 28 52 Z" fill="#426EB4" opacity="0.6"/>',
    /* Centre divide line */
    '<line x1="50" y1="38" x2="50" y2="62" stroke="#2A4A80" stroke-width="1.5"/>',
    /* Chinese character hint: 培 (cultivate) stylised strokes */
    '<text x="50" y="46" text-anchor="middle" font-size="16" font-weight="bold" fill="white" font-family="sans-serif">培</text>',
    /* Small star accent top */
    '<polygon points="50,22 52,27 57,27 53,31 55,36 50,33 45,36 47,31 43,27 48,27" fill="#F5B700"/>',
    '</svg>'
  ].join('');
  var LOGO_DATA_URL = 'data:image/svg+xml;base64,' + btoa(LOGO_SVG);

  var printFrame = null;
  var printTimer = null;

  function ensureStyle() {
    if (document.getElementById('mh-cert-style')) return;
    var s = document.createElement('style');
    s.id = 'mh-cert-style';
    s.textContent =
      '#mhCertOv{position:fixed;inset:0;z-index:80;background:rgba(61,43,90,.55);display:none;align-items:center;justify-content:center;padding:12px}' +
      '#mhCertOv.on{display:flex}' +
      '#mhCertBox{width:min(900px,96vw);background:#fff;border-radius:20px;padding:12px;max-height:96vh;overflow:auto}' +
      '#mhCertSheet{' +
      'border:8px solid #F5B700;border-radius:12px;padding:28px 24px;text-align:center;' +
      'background:linear-gradient(180deg,#FFFDF5,#FFF8E7);color:#3D2B5A;' +
      'font-family:"PingFang HK","Noto Sans TC","Microsoft JhengHei",serif}' +
      '#mhCertSheet.bronze{border-color:#CD7F32;background:linear-gradient(180deg,#FFF8F0,#F5E6D3)}' +
      '#mhCertSheet.silver{border-color:#9E9E9E;background:linear-gradient(180deg,#FAFAFA,#ECEFF1)}' +
      '#mhCertSheet.gold{border-color:#F5B700}' +
      '#mhCertSheet .school-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px}' +
      '#mhCertSheet .school-row img{width:64px;height:64px;object-fit:contain}' +
      '#mhCertSheet .school-name{font-size:clamp(1.1rem,2.8vw,1.45rem);font-weight:900;color:#426eb4}' +
      '#mhCertSheet h1{font-size:clamp(1.6rem,4vw,2.4rem);margin:8px 0}' +
      '#mhCertSheet .medal{font-size:3.5rem;line-height:1}' +
      '#mhCertSheet .who{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:900;margin:12px 0;padding:8px 16px;display:inline-block;border-bottom:4px solid #FF6B9D}' +
      '#mhCertSheet .skill{font-size:1.25rem;font-weight:800;margin-top:8px}' +
      '#mhCertSheet .score{font-size:1.1rem;font-weight:800;opacity:.8;margin-top:6px}' +
      '#mhCertSheet .foot{margin-top:18px;font-weight:700;opacity:.6;font-size:.95rem}' +
      '#mhCertActs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:12px}' +
      '#mhCertActs button{min-height:52px;min-width:120px;padding:10px 18px;border-radius:999px;border:none;font-weight:900;font-size:1.1rem;cursor:pointer}' +
      '#mhCertActs .print{background:linear-gradient(135deg,#426eb4,#6a9ad4);color:#fff}' +
      '#mhCertActs .close{background:#fff;border:3px solid rgba(61,43,90,.15)!important;color:#3D2B5A}' +
      /* dedicated print root (in-page fallback) */ +
      '#mhCertPrintRoot{display:none}' +
      '@media print{' +
      '@page{size:A4 landscape;margin:10mm}' +
      'html,body{background:#fff!important;margin:0!important;padding:0!important;height:auto!important;overflow:visible!important}' +
      'body.mh-printing > *:not(#mhCertPrintRoot){display:none!important}' +
      'body.mh-printing #mhCertPrintRoot{display:block!important;position:static!important;width:100%!important;margin:0!important;padding:0!important}' +
      'body.mh-printing #mhCertPrintRoot *{visibility:visible!important}' +
      '}';
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sheetPrintCss() {
    return (
      '@page{size:A4 landscape;margin:10mm}' +
      'html,body{margin:0;padding:0;background:#fff;color:#3D2B5A;' +
      'font-family:"PingFang HK","Noto Sans TC","Microsoft JhengHei",serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.sheet{border:10px solid #F5B700;border-radius:12px;padding:32px 28px;text-align:center;' +
      'background:linear-gradient(180deg,#FFFDF5,#FFF8E7);min-height:180mm;width:100%;' +
      'box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center}' +
      '.sheet.bronze{border-color:#CD7F32;background:linear-gradient(180deg,#FFF8F0,#F5E6D3)}' +
      '.sheet.silver{border-color:#9E9E9E;background:linear-gradient(180deg,#FAFAFA,#ECEFF1)}' +
      '.sheet.gold{border-color:#F5B700}' +
      '.school-row{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px}' +
      '.school-row img{width:80px;height:80px;object-fit:contain}' +
      '.school-name{font-size:28px;font-weight:900;color:#426eb4}' +
      '.medal{font-size:64px;line-height:1;margin:6px 0}' +
      '.sub{font-size:20px;font-weight:900;opacity:.75;margin:4px 0}' +
      'h1{font-size:40px;margin:12px 0;font-weight:900}' +
      '.who{font-size:36px;font-weight:900;margin:16px 0;padding:8px 20px;display:inline-block;border-bottom:5px solid #FF6B9D}' +
      '.skill{font-size:24px;font-weight:800;margin-top:10px}' +
      '.score{font-size:20px;font-weight:800;opacity:.85;margin-top:8px}' +
      '.foot{margin-top:28px;font-weight:700;opacity:.7;font-size:18px}'
    );
  }

  function buildCertMarkup(data) {
    return (
      '<div class="sheet ' + esc(data.tier) + '">' +
        '<div class="school-row">' +
          '<img src="' + LOGO_DATA_URL + '" alt="將軍澳培智學校校徽" width="80" height="80">' +
          '<div class="school-name">將軍澳培智學校</div>' +
        '</div>' +
        '<div class="medal">' + esc(data.medal) + '</div>' +
        '<div class="sub">滑鼠小達人 · 電腦科</div>' +
        '<h1>' + esc(data.title) + '</h1>' +
        '<div class="who">' + esc(data.name) + '</div>' +
        '<div class="skill">' + esc(data.skill) + '</div>' +
        (data.score != null ? '<div class="score">成績：' + esc(data.score) + '</div>' : '') +
        '<div class="foot">將軍澳培智學校 · 電腦科 · ' + esc(data.date) + '</div>' +
      '</div>'
    );
  }

  function buildPrintHtml(data) {
    return (
      '<!DOCTYPE html><html lang="zh-HK"><head><meta charset="UTF-8">' +
      '<title>證書 · 將軍澳培智學校</title>' +
      '<style>' + sheetPrintCss() + '</style></head><body>' +
      buildCertMarkup(data) +
      '</body></html>'
    );
  }

  function readCertData(sheetEl) {
    // Prefer structured data from last showCert; fallback parse DOM
    var d = global.__mhLastCert || null;
    if (d) return d;
    if (!sheetEl) return null;
    var who = sheetEl.querySelector('.who');
    var h1 = sheetEl.querySelector('h1');
    var skill = sheetEl.querySelector('.skill');
    var score = sheetEl.querySelector('.score');
    var foot = sheetEl.querySelector('.foot');
    var medal = sheetEl.querySelector('.medal');
    return {
      tier: sheetEl.className || 'gold',
      medal: medal ? medal.textContent : '🏅',
      title: h1 ? h1.textContent : '證書',
      name: who ? who.textContent : '同學',
      skill: skill ? skill.textContent : '',
      score: score ? score.textContent.replace(/^成績：/, '') : null,
      date: foot ? foot.textContent.replace(/^.*·\s*/, '') : ''
    };
  }

  function cleanupFrame() {
    if (printTimer) { clearTimeout(printTimer); printTimer = null; }
    if (printFrame && printFrame.parentNode) {
      try { printFrame.parentNode.removeChild(printFrame); } catch (_) {}
    }
    printFrame = null;
    try {
      var root = document.getElementById('mhCertPrintRoot');
      if (root) root.innerHTML = '';
    } catch (_) {}
    document.body.classList.remove('mh-printing');
  }

  function waitImages(doc, cb) {
    var imgs = doc ? doc.images : [];
    var pending = 0;
    var i;
    for (i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) pending++;
    }
    if (!pending) { cb(); return; }
    var left = pending;
    var done = false;
    function go() {
      if (done) return;
      done = true;
      cb();
    }
    for (i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) {
        imgs[i].onload = imgs[i].onerror = function () {
          left--;
          if (left <= 0) go();
        };
      }
    }
    setTimeout(go, 1200);
  }

  function printViaPopup(html) {
    var w = null;
    try {
      w = window.open('', 'mhCertPrint', 'width=1100,height=800');
    } catch (_) { w = null; }
    if (!w) return false;
    try {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (_) {
      try { w.close(); } catch (e2) {}
      return false;
    }
    waitImages(w.document, function () {
      try {
        w.focus();
        w.print();
      } catch (_) {}
      // keep window until after print; auto-close later
      try {
        w.onafterprint = function () {
          setTimeout(function () { try { w.close(); } catch (_) {} }, 300);
        };
      } catch (_) {}
      setTimeout(function () { try { w.close(); } catch (_) {} }, 120000);
    });
    return true;
  }

  function printViaSizedIframe(html) {
    cleanupFrame();
    var iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'print-cert');
    // CRITICAL: non-zero size — 0×0 iframe prints blank on Chrome/school PCs
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:1100px;height:800px;' +
      'border:0;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(iframe);
    printFrame = iframe;

    var win = iframe.contentWindow;
    var doc = iframe.contentDocument || (win && win.document);
    if (!doc || !win) {
      cleanupFrame();
      return false;
    }
    doc.open();
    doc.write(html);
    doc.close();

    waitImages(doc, function () {
      try {
        win.focus();
        win.print();
      } catch (_) {
        cleanupFrame();
        return;
      }
      // Do NOT remove iframe immediately — spoolers need the DOM alive
      try {
        win.onafterprint = function () {
          printTimer = setTimeout(cleanupFrame, 1500);
        };
      } catch (_) {}
      printTimer = setTimeout(cleanupFrame, 120000);
    });
    return true;
  }

  function printViaInPage(data) {
    ensureStyle();
    var root = document.getElementById('mhCertPrintRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'mhCertPrintRoot';
      document.body.appendChild(root);
    }
    root.innerHTML = '<style>' + sheetPrintCss() + '</style>' + buildCertMarkup(data);
    document.body.classList.add('mh-printing');
    // next frame so CSS applies before print dialog
    setTimeout(function () {
      try { window.print(); } catch (_) {}
      // cleanup after dialog
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        setTimeout(cleanupFrame, 500);
      }
      window.addEventListener('afterprint', done, { once: true });
      setTimeout(done, 60000);
    }, 50);
    return true;
  }

  function printCert() {
    ensureStyle();
    var sheet = document.getElementById('mhCertSheet');
    var data = readCertData(sheet);
    if (!data) return;
    var html = buildPrintHtml(data);

    // Primary: in-page dedicated cert root (school printers already open from this page)
    if (printViaInPage(data)) return;

    // Fallback: popup with full cert HTML
    if (printViaPopup(html)) return;

    // Last: sized iframe (never 0×0 — Chrome prints blank otherwise)
    printViaSizedIframe(html);
  }

  function showCert(gameId, opts) {
    ensureStyle();
    var R = global.MouseHubReward;
    if (!R) return;
    var g = R.gameMeta(gameId);
    var certs = R.loadCerts();
    var c = (opts && opts.cert) || certs[gameId] || { tier: 'bronze', score: 0 };
    var tier = c.tier || 'bronze';
    var tm = R.TIER_META[tier] || R.TIER_META.bronze;
    var name = (opts && opts.name) || c.name || R.displayName();
    var date = new Date(c.at || Date.now());
    var ds = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    var title = (g.certName || g.title) + ' · ' + tm.label;
    var skill = (g.emoji || '') + ' ' + (g.title || '') + (g.tag ? '（' + g.tag + '）' : '');

    global.__mhLastCert = {
      tier: tier,
      medal: tm.medal,
      title: title,
      name: name,
      skill: skill,
      score: c.score != null ? c.score : null,
      date: ds
    };

    var ov = document.getElementById('mhCertOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'mhCertOv';
      ov.innerHTML = '<div id="mhCertBox"><div id="mhCertSheet"></div><div id="mhCertActs"></div></div>';
      document.body.appendChild(ov);
    }
    var sheet = document.getElementById('mhCertSheet');
    sheet.className = tier;
    sheet.innerHTML =
      '<div class="school-row">' +
        '<img src="' + LOGO_DATA_URL + '" alt="將軍澳培智學校校徽" width="64" height="64" decoding="async">' +
        '<div class="school-name">將軍澳培智學校</div>' +
      '</div>' +
      '<div class="medal">' + tm.medal + '</div>' +
      '<div style="font-weight:900;opacity:.7">滑鼠小達人 · 電腦科</div>' +
      '<h1>' + title + '</h1>' +
      '<div class="who">' + name + '</div>' +
      '<div class="skill">' + skill + '</div>' +
      (c.score != null ? '<div class="score">成績：' + c.score + '</div>' : '') +
      '<div class="foot">將軍澳培智學校 · 電腦科 · ' + ds + '</div>';

    var acts = document.getElementById('mhCertActs');
    acts.innerHTML = '';
    var bp = document.createElement('button');
    bp.className = 'print';
    bp.type = 'button';
    bp.textContent = '列印';
    bp.onclick = function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      printCert();
    };
    var bc = document.createElement('button');
    bc.className = 'close';
    bc.type = 'button';
    bc.textContent = '關閉';
    bc.onclick = function () { ov.classList.remove('on'); };
    acts.appendChild(bp);
    acts.appendChild(bc);
    ov.classList.add('on');
  }

  global.MouseHubCert = { showCert: showCert, printCert: printCert };
})(window);

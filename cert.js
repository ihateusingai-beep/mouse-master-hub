/* shared printable cert overlay — iframe print (school-printer safe) */
(function (global) {
  var LOGO = 'https://www.puichi.edu.hk/it-school/php/webcms/files/upload/tinymce//1a__pui_chi_logo_png_1791177564.png';
  var printFrame = null;

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
      /* fallback in-page print (if iframe blocked) */ +
      '@media print{' +
      'html,body{background:#fff!important;overflow:visible!important;height:auto!important}' +
      'body *{visibility:hidden!important}' +
      '#mhCertOv,#mhCertOv *{visibility:visible!important}' +
      '#mhCertOv{position:absolute!important;left:0;top:0;width:100%;inset:auto;background:#fff!important;display:block!important;padding:0!important;z-index:99999}' +
      '#mhCertActs,.teacher,.won-ov{display:none!important}' +
      '#mhCertBox{box-shadow:none;width:100%;max-height:none;overflow:visible}' +
      '#mhCertSheet{border-width:10px;min-height:90vh;display:flex;flex-direction:column;justify-content:center;break-inside:avoid}' +
      '@page{size:A4 landscape;margin:12mm}' +
      '}';
    document.head.appendChild(s);
  }

  function sheetPrintCss() {
    return (
      '@page{size:A4 landscape;margin:12mm}' +
      'html,body{margin:0;padding:0;background:#fff;color:#3D2B5A;' +
      'font-family:"PingFang HK","Noto Sans TC","Microsoft JhengHei",serif}' +
      '#mhCertSheet{border:10px solid #F5B700;border-radius:12px;padding:28px 24px;text-align:center;' +
      'background:linear-gradient(180deg,#FFFDF5,#FFF8E7);min-height:88vh;' +
      'display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}' +
      '#mhCertSheet.bronze{border-color:#CD7F32;background:linear-gradient(180deg,#FFF8F0,#F5E6D3)}' +
      '#mhCertSheet.silver{border-color:#9E9E9E;background:linear-gradient(180deg,#FAFAFA,#ECEFF1)}' +
      '#mhCertSheet.gold{border-color:#F5B700}' +
      '.school-row{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:8px}' +
      '.school-row img{width:72px;height:72px;object-fit:contain}' +
      '.school-name{font-size:1.5rem;font-weight:900;color:#426eb4}' +
      'h1{font-size:2.2rem;margin:10px 0}' +
      '.medal{font-size:3.8rem;line-height:1}' +
      '.who{font-size:2rem;font-weight:900;margin:14px 0;padding:8px 16px;display:inline-block;border-bottom:4px solid #FF6B9D}' +
      '.skill{font-size:1.35rem;font-weight:800;margin-top:8px}' +
      '.score{font-size:1.15rem;font-weight:800;opacity:.85;margin-top:6px}' +
      '.foot{margin-top:20px;font-weight:700;opacity:.65;font-size:1rem}'
    );
  }

  function cleanupFrame() {
    if (printFrame && printFrame.parentNode) {
      try { printFrame.parentNode.removeChild(printFrame); } catch (_) {}
    }
    printFrame = null;
  }

  function printViaIframe(sheetEl) {
    cleanupFrame();
    var html =
      '<!DOCTYPE html><html lang="zh-HK"><head><meta charset="UTF-8">' +
      '<title>證書 · 將軍澳培智學校</title>' +
      '<style>' + sheetPrintCss() + '</style></head><body>' +
      sheetEl.outerHTML +
      '</body></html>';

    var iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'print');
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
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

    function doPrint() {
      try {
        win.focus();
        win.print();
      } catch (_) {
        cleanupFrame();
        return false;
      }
      // remove after dialog closes (best-effort)
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        setTimeout(cleanupFrame, 800);
      }
      try {
        if (win.matchMedia) {
          var mql = win.matchMedia('print');
          if (mql && mql.addEventListener) {
            mql.addEventListener('change', function (e) { if (!e.matches) finish(); });
          }
        }
        win.onafterprint = finish;
      } catch (_) {}
      setTimeout(finish, 60000);
      return true;
    }

    // images may load async — wait briefly for logo, keep user-gesture window short
    var imgs = doc.images;
    var pending = 0;
    var i;
    for (i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) pending++;
    }
    if (pending === 0) {
      return doPrint();
    }
    var left = pending;
    var fired = false;
    function tryGo() {
      if (fired) return;
      fired = true;
      doPrint();
    }
    for (i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) {
        imgs[i].onload = imgs[i].onerror = function () {
          left--;
          if (left <= 0) tryGo();
        };
      }
    }
    setTimeout(tryGo, 600);
    return true;
  }

  function printCert() {
    var sheet = document.getElementById('mhCertSheet');
    if (!sheet) return;
    var ok = false;
    try { ok = printViaIframe(sheet); } catch (_) { ok = false; }
    if (!ok) {
      // last resort: in-page @media print
      try { window.print(); } catch (_) {}
    }
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
    var ov = document.getElementById('mhCertOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'mhCertOv';
      ov.innerHTML = '<div id="mhCertBox"><div id="mhCertSheet"></div><div id="mhCertActs"></div></div>';
      document.body.appendChild(ov);
    }
    var sheet = document.getElementById('mhCertSheet');
    sheet.className = tier;
    var date = new Date(c.at || Date.now());
    var ds = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    sheet.innerHTML =
      '<div class="school-row">' +
        '<img src="' + LOGO + '" alt="校徽" width="64" height="64" decoding="async">' +
        '<div class="school-name">將軍澳培智學校</div>' +
      '</div>' +
      '<div class="medal">' + tm.medal + '</div>' +
      '<div style="font-weight:900;opacity:.7">滑鼠小達人 · 電腦科</div>' +
      '<h1>' + (g.certName || g.title) + ' · ' + tm.label + '</h1>' +
      '<div class="who">' + name + '</div>' +
      '<div class="skill">' + (g.emoji || '') + ' ' + (g.title || '') + (g.tag ? '（' + g.tag + '）' : '') + '</div>' +
      (c.score != null ? '<div class="score">成績：' + c.score + '</div>' : '') +
      '<div class="foot">將軍澳培智學校 · 電腦科 · ' + ds + '</div>';
    var acts = document.getElementById('mhCertActs');
    acts.innerHTML = '';
    var bp = document.createElement('button');
    bp.className = 'print';
    bp.type = 'button';
    bp.textContent = '列印';
    bp.onclick = function () { printCert(); };
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

/* shared printable cert overlay */
(function (global) {
  function ensureStyle() {
    if (document.getElementById('mh-cert-style')) return;
    const s = document.createElement('style');
    s.id = 'mh-cert-style';
    s.textContent = `
#mhCertOv{position:fixed;inset:0;z-index:80;background:rgba(61,43,90,.55);display:none;align-items:center;justify-content:center;padding:12px}
#mhCertOv.on{display:flex}
#mhCertBox{width:min(900px,96vw);background:#fff;border-radius:20px;padding:12px;max-height:96vh;overflow:auto}
#mhCertSheet{
  border:8px solid #F5B700;border-radius:12px;padding:28px 24px;text-align:center;
  background:linear-gradient(180deg,#FFFDF5,#FFF8E7);color:#3D2B5A;
  font-family:"PingFang HK","Noto Sans TC","Microsoft JhengHei",serif;
}
#mhCertSheet.bronze{border-color:#CD7F32;background:linear-gradient(180deg,#FFF8F0,#F5E6D3)}
#mhCertSheet.silver{border-color:#9E9E9E;background:linear-gradient(180deg,#FAFAFA,#ECEFF1)}
#mhCertSheet.gold{border-color:#F5B700}
#mhCertSheet h1{font-size:clamp(1.6rem,4vw,2.4rem);margin:8px 0}
#mhCertSheet .medal{font-size:3.5rem;line-height:1}
#mhCertSheet .who{font-size:clamp(1.4rem,3.5vw,2rem);font-weight:900;margin:12px 0;padding:8px 16px;display:inline-block;border-bottom:4px solid #FF6B9D}
#mhCertSheet .skill{font-size:1.25rem;font-weight:800;margin-top:8px}
#mhCertSheet .score{font-size:1.1rem;font-weight:800;opacity:.8;margin-top:6px}
#mhCertSheet .foot{margin-top:18px;font-weight:700;opacity:.6;font-size:.95rem}
#mhCertActs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:12px}
#mhCertActs button{min-height:52px;min-width:120px;padding:10px 18px;border-radius:999px;border:none;font-weight:900;font-size:1.1rem;cursor:pointer}
#mhCertActs .print{background:linear-gradient(135deg,#FF6B9D,#FF9D7A);color:#fff}
#mhCertActs .close{background:#fff;border:3px solid rgba(61,43,90,.15)!important;color:#3D2B5A}
@media print{
  body *{visibility:hidden!important}
  #mhCertOv,#mhCertOv *{visibility:visible!important}
  #mhCertOv{position:static;background:#fff;display:block!important;padding:0}
  #mhCertActs{display:none!important}
  #mhCertBox{box-shadow:none;width:100%;max-height:none}
  #mhCertSheet{border-width:10px;min-height:90vh;display:flex;flex-direction:column;justify-content:center}
  @page{size:A4 landscape;margin:12mm}
}
`;
    document.head.appendChild(s);
  }

  function showCert(gameId, opts) {
    ensureStyle();
    const R = global.MouseHubReward;
    if (!R) return;
    const g = R.gameMeta(gameId);
    const certs = R.loadCerts();
    const c = (opts && opts.cert) || certs[gameId] || { tier: 'bronze', score: 0 };
    const tier = c.tier || 'bronze';
    const tm = R.TIER_META[tier] || R.TIER_META.bronze;
    const name = (opts && opts.name) || c.name || R.displayName();
    let ov = document.getElementById('mhCertOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'mhCertOv';
      ov.innerHTML = '<div id="mhCertBox"><div id="mhCertSheet"></div><div id="mhCertActs"></div></div>';
      document.body.appendChild(ov);
    }
    const sheet = document.getElementById('mhCertSheet');
    sheet.className = tier;
    const date = new Date(c.at || Date.now());
    const ds = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
    sheet.innerHTML =
      '<div class="medal">' + tm.medal + '</div>' +
      '<div style="font-weight:900;opacity:.7">滑鼠小達人</div>' +
      '<h1>' + (g.certName || g.title) + ' · ' + tm.label + '</h1>' +
      '<div class="who">' + name + '</div>' +
      '<div class="skill">' + (g.emoji || '') + ' ' + (g.title || '') + (g.tag ? '（' + g.tag + '）' : '') + '</div>' +
      (c.score != null ? '<div class="score">成績：' + c.score + '</div>' : '') +
      '<div class="foot">將軍澳培智學校 · 電腦科 · ' + ds + '</div>';
    const acts = document.getElementById('mhCertActs');
    acts.innerHTML = '';
    const bp = document.createElement('button');
    bp.className = 'print'; bp.type = 'button'; bp.textContent = '列印';
    bp.onclick = () => window.print();
    const bc = document.createElement('button');
    bc.className = 'close'; bc.type = 'button'; bc.textContent = '關閉';
    bc.onclick = () => ov.classList.remove('on');
    acts.appendChild(bp);
    acts.appendChild(bc);
    ov.classList.add('on');
  }

  global.MouseHubCert = { showCert };
})(window);

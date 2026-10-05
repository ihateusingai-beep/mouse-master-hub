# mouse-master-hub — Architecture

> Static multi-page SEN mouse trainer · GitHub Pages · no build  
> Live: https://ihateusingai-beep.github.io/mouse-master-hub/

## 1. Architecture summary

```
index.html (hub)
   │  profile (name/who) → localStorage
   │  openGame() → gameUrl(+query)
   ▼
*.html level pages  ──script──► reward.js   (catalog, XP, stickers, certs)
                    ──script──► cert.js     (overlay + print)
                    ──script──► common.js   (shared audio/UI/input)  ← NEW
   │
   ▼ award(gid, score, mode)
localStorage: mouse_hub_{pet,stickers,certs,name,who,auto_speak}
   │
   ▼ hubWonUrl / ?won= → celebrate sticker fly-in
```

| Layer | Files | Role |
|-------|-------|------|
| Hub | `index.html` | free pick grids (basic/skill/fun), pet, stickers, cert reopen |
| Catalog / economy | `reward.js` | `GAMES`, tiers, `award()`, URLs |
| Cert / print | `cert.js` | overlay + in-page print root |
| Shared runtime | `common.js` | audio, toast, drag, right-click, win chrome |
| Levels | 13× `*.html` | one skill loop each; full-page navigation |

**Data flow (one clear):** play → `award` writes sticker+xp+cert → optional `?won=` hub celebrate → cert print reads certs LS.

**Deploy:** plain static on `main` + `.nojekyll`. No bundler, no framework.

## 2. Problem areas (ordered)

### P0 — Correctness / classroom risk
| Issue | Evidence | Impact |
|-------|----------|--------|
| Right-click helper missing once | `chest.html` called `bindRight` undefined | Dead level (fixed) |
| Print blank page | 0×0 iframe print | Printer gets empty sheet (fixed via print root) |
| External logo dependency | cert logo from `puichi.edu.hk` | Offline/school filter → missing crest |

### P1 — Structure / duplication
| Issue | Evidence | Impact |
|-------|----------|--------|
| Copy-paste kernel ×13 | `loadProfile/ctx/tone/sfx/speak/confetti/win` identical | Bugfixes must land N times (chest bindRight drift) |
| `enableDrag` / `bindRight` duplicated | gifts, stars, pizza, planet, chest | SEN mouse pitfalls easy to regress |
| Inconsistent win chrome | some `bigCelebrate`, some direct overlay; medal source differs | UX drift |
| `NEED` vs race modes | clear NEED=5 vs race score thresholds in `tierFromScore` | Hard to reason about gold rules |

### P2 — Maintainability
| Issue | Evidence | Impact |
|-------|----------|--------|
| No automated gates | no `tests/regression.js` | regressions only found in class |
| Game id string literals | `'chest'`, GID consts scattered | rename/add game = multi-file grep |
| CSS duplicated per page | top/meter/overlay/btn blocks | theme changes expensive |
| `PATH` alias = `GAMES` | reward.js | dead conceptual “path” after free-pick |

### P3 — Performance (minor for this size)
| Issue | Notes |
|-------|-------|
| Per-page full CSS | ~10–15KB HTML each; fine for school LAN |
| `requestAnimationFrame` fish loop | OK; must cancel on win (fish does) |
| Confetti DOM thrash | short-lived; acceptable |
| External logo on print | network on print path |

## 3. Refactoring strategies (keep behavior)

**Do NOT** rewrite as React/Vite SPA for this product — Pages+SEN single files are the product constraint.

### Phase A — Shared kernel (done in `common.js`)
Extract pure helpers only:
- audio, toast, confetti, progress bar text
- `enableDrag`, `bindRight`, `hits`
- `finishClear` + `wireChrome` for standard end flow

**Rule:** game pages own spawn/rules only.

### Phase B — Migrate levels onto `common.js`
Order: fun (newest/most copy-paste) → skill with drag/right → races → hub last.  
One page per commit; smoke: start → complete → cert → hub.

### Phase C — Catalog-driven chrome (optional)
`reward.js` already has `GAMES`. Add `need`, `mode`, `speak` fields; generate meter labels from catalog.

### Phase D — Gates
Minimal `node` script:
- every `GAMES[].url` local file exists (except external feeder)
- every level script parses (`node --check` extract)
- every id has `STICKER_META`

### Phase E — CSS token sheet (optional)
`theme.css` with shared `.top/.btn/.overlay`; pages keep stage-specific art.

## 4. Improved code (landed)

| File | Change |
|------|--------|
| `common.js` | NEW shared runtime |
| `ARCHITECTURE.md` | this doc |
| Fun levels | migrate to `MouseHubCommon` (behavior same) |

## 5. Non-goals
- No framework migration
- No server/backend
- No change to scoring thresholds or cert tiers unless requested
- No removing emoji-first SEN visuals

## 6. Verify after refactors
```bash
# parse
for f in fish pizza planet duo; do
  python3 -c "import re,pathlib;h=pathlib.Path('$f.html').read_text();s=max(re.findall(r'<script(?![^>]*src)[^>]*>([\\s\\S]*?)</script>',h),key=len);open('/tmp/t.js','w').write(s)"
  node --check /tmp/t.js
done
# live markers
curl -sL https://ihateusingai-beep.github.io/mouse-master-hub/reward.js | rg "fish|pizza|planet|duo"
```

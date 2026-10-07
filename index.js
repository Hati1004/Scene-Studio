/* SillyTavern Scene Studio · Minimap HUD 3.9.0
 * 게임 HUD 스타일: 장소 자동 분석 · 지도 이미지 생성(장소별 캐시) · 아이콘/마커 · 장면 이미지 · 드래그 가능한 HUD
 * 이미지 생성: Agent Platform(구 Vertex AI) / Gemini Developer API (Nano Banana) 직접 호출, 또는 ST /sd
 */
(() => {
  const MODULE = 'minimap';
  const ctx = () => SillyTavern.getContext();
  /*MM_CSS_BEGIN*/
  const MM_CSS = "/* ===== 공통 ===== */\n.mm-hidden { display: none !important; }\n\n/* ===== 미니맵 ===== */\n#mm-root {\n  position: fixed; z-index: 3000; width: 240px;\n  background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #111) 88%, transparent);\n  backdrop-filter: blur(6px);\n  border: 1px solid var(--SmartThemeBorderColor, #555);\n  border-radius: 12px; user-select: none; touch-action: none;\n  box-shadow: 0 6px 24px rgba(0,0,0,.45);\n}\n#mm-header {\n  display: flex; align-items: center; gap: 6px; padding: 5px 8px; cursor: move; font-size: .85em;\n  border-bottom: 1px solid var(--SmartThemeBorderColor, #555);\n}\n#mm-title { flex: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.mm-scope { font-size: .75em; opacity: .65; white-space: nowrap; }\n#mm-header button { all: unset; cursor: pointer; padding: 0 4px; opacity: .7; }\n#mm-header button:hover, #mm-header button:focus-visible { opacity: 1; }\n#mm-root.mm-collapsed #mm-body { display: none; }\n#mm-root.mm-collapsed #mm-header { border-bottom: 0; }\n#mm-body { position: relative; }\n\n.mm-viewport {\n  position: relative; width: 100%; aspect-ratio: var(--mm-ratio, 1); overflow: hidden;\n  background: #1b2427; border-radius: 0 0 12px 12px;\n}\n.mm-viewport::after { content: \"\"; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 22px rgba(0,0,0,.55); }\n.mm-stage {\n  position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 0 0;\n  transition: transform .5s ease; background-color: #22302f;\n  background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);\n  background-size: 10% 10%;\n}\n.mm-stage img.mm-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; }\n.mm-stage svg.mm-trail { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }\n.mm-trail polyline { fill: none; stroke: #ffd36b; stroke-width: 2; stroke-dasharray: 5 4; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; opacity: .9; }\n\n/* 장소 아이콘 핀 */\n.mm-pin, .mm-mk, .mm-you {\n  position: absolute; transform: translate(-50%, -50%) scale(calc(1 / var(--z, 1)));\n  display: flex; align-items: center; justify-content: center; border-radius: 50%;\n  transition: left .5s, top .5s;\n}\n.mm-pin {\n  width: 22px; height: 22px; font-size: 11px; color: #10181a; background: var(--c, #9fb0b8);\n  border: 2px solid rgba(255,255,255,.9); box-shadow: 0 1px 4px rgba(0,0,0,.6); cursor: pointer; z-index: 2;\n}\n.mm-pin.mm-unvisited { filter: saturate(.3) brightness(.8); opacity: .75; }\n.mm-pin.mm-edit { outline: 3px solid #ff5d5d; outline-offset: 2px; }\n/* NPC/적/퀘스트 마커 */\n.mm-mk {\n  width: 16px; height: 16px; font-size: 9px; color: #fff; background: var(--c, #fff);\n  border: 1.5px solid #10181a; border-radius: 4px; transform: translate(-50%, -50%) rotate(45deg) scale(calc(1 / var(--z, 1)));\n  z-index: 3; box-shadow: 0 1px 3px rgba(0,0,0,.6);\n}\n.mm-mk i { transform: rotate(-45deg); }\n.mm-mk[data-type=\"quest\"] { color: #3a2a00; }\n/* 내 위치 */\n.mm-you {\n  width: 24px; height: 24px; font-size: 12px; color: #fff; background: #ff4d4d;\n  border: 2px solid #fff; z-index: 5; box-shadow: 0 0 8px rgba(255,77,77,.8);\n}\n.mm-you i { transform: rotate(-45deg) translate(1px, 1px); }\n.mm-you::before { content: \"\"; position: absolute; inset: -8px; border-radius: 50%; border: 2px solid #ff4d4d; animation: mm-ping 1.8s ease-out infinite; }\n@keyframes mm-ping { from { transform: scale(.45); opacity: .9; } to { transform: scale(1.25); opacity: 0; } }\n@media (prefers-reduced-motion: reduce) { .mm-you::before { animation: none; opacity: .5; } .mm-stage, .mm-pin, .mm-mk, .mm-you { transition: none; } }\n.mm-label {\n  position: absolute; left: 50%; top: 100%; margin-top: 3px; transform: translateX(-50%);\n  font-size: 10px; line-height: 1.2; padding: 1px 5px; border-radius: 4px; background: rgba(0,0,0,.75); color: #fff; white-space: nowrap; pointer-events: none;\n}\n.mm-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; font-size: .75em; opacity: .75; padding: 12px; pointer-events: none; z-index: 6; }\n\n/* HUD 버튼 */\n.mm-hud { position: absolute; left: 6px; bottom: 6px; display: flex; gap: 4px; z-index: 8; opacity: 0; transition: opacity .15s; }\n.mm-viewport:hover .mm-hud, .mm-hud:focus-within { opacity: 1; }\n.mm-hudbtn {\n  all: unset; cursor: pointer; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;\n  border-radius: 50%; background: rgba(0,0,0,.65); color: #fff; font-size: 11px; border: 1px solid rgba(255,255,255,.35);\n}\n.mm-hudbtn:hover, .mm-hudbtn:focus-visible { background: rgba(0,0,0,.9); border-color: #fff; }\n.mm-hudbtn.mm-stale { border-color: #ffb35f; color: #ffb35f; }\n.mm-hudbtn.mm-spin i { animation: mm-rot 1s linear infinite; }\n@keyframes mm-rot { to { transform: rotate(360deg); } }\n\n#mm-resize {\n  position: absolute; right: -2px; bottom: -2px; width: 18px; height: 18px; cursor: nwse-resize; z-index: 9;\n  background: linear-gradient(135deg, transparent 55%, rgba(255,255,255,.6) 55% 62%, transparent 62% 72%, rgba(255,255,255,.6) 72% 79%, transparent 79%);\n}\n\n/* 원형 미니맵 */\n#mm-root.mm-round { background: none; border: 0; box-shadow: none; backdrop-filter: none; }\n#mm-root.mm-round #mm-header {\n  border: 1px solid var(--SmartThemeBorderColor, #555); border-radius: 999px; margin-bottom: 6px;\n  background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #111) 88%, transparent);\n}\n#mm-root.mm-round .mm-viewport {\n  aspect-ratio: 1; border-radius: 50%; border: 3px solid #c9a96b;\n  box-shadow: 0 4px 18px rgba(0,0,0,.55), inset 0 0 0 2px rgba(0,0,0,.5);\n}\n#mm-root.mm-round .mm-viewport::after { border-radius: 50%; box-shadow: inset 0 0 18px rgba(0,0,0,.6); }\n#mm-root.mm-round .mm-hud { left: 50%; transform: translateX(-50%); bottom: 10px; }\n.mm-north {\n  display: none; position: absolute; left: 50%; top: -9px; transform: translateX(-50%); z-index: 10;\n  width: 18px; height: 18px; line-height: 18px; text-align: center; font-size: 10px; font-weight: 700;\n  background: #2a2417; color: #e8d6a8; border: 1.5px solid #c9a96b; border-radius: 50%;\n}\n#mm-root.mm-round .mm-north { display: block; }\n\n/* 장면 창 안에 도킹된 HUD 미니맵 */\n#mm-root.mm-docked { position: absolute; z-index: 5; }\n#mm-root.mm-docked #mm-header { display: none; }\n#mm-root.mm-docked:not(.mm-round) { border-radius: 10px; }\n#mm-root.mm-docked .mm-label { font-size: 9px; }\n\n/* ===== 장면 창 ===== */\n#mm-scene {\n  position: fixed; z-index: 2900; width: 520px; background: color-mix(in srgb, #0d1214 92%, transparent);\n  border: 1px solid var(--SmartThemeBorderColor, #555); border-radius: 12px; overflow: hidden;\n  box-shadow: 0 8px 30px rgba(0,0,0,.55); touch-action: none;\n}\n.mm-scene-bar {\n  display: flex; align-items: center; gap: 6px; padding: 5px 10px; cursor: move; font-size: .85em;\n  background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #111) 92%, transparent);\n  border-bottom: 1px solid var(--SmartThemeBorderColor, #555);\n}\n.mm-scene-title { flex: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.mm-scene-bar button { all: unset; cursor: pointer; padding: 0 5px; opacity: .75; }\n.mm-scene-bar button:hover, .mm-scene-bar button:focus-visible { opacity: 1; }\n.mm-scene-bar button:disabled { opacity: .3; cursor: default; }\n.mm-scene-view { cursor: grab; touch-action: none; position: relative; width: 100%; aspect-ratio: 16 / 9; background: #151c1f; overflow: hidden; }\n.mm-scene-img { position: absolute; max-width: none; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; user-select: none; -webkit-user-drag: none; }\n.mm-scene-empty {\n  position: absolute; inset: 0; flex-direction: column; align-items: center; justify-content: center;\n  gap: 10px; text-align: center; font-size: .85em; padding: 16px; color: #cdd8d8;\n}\n.mm-scene-empty.mm-over { background: rgba(0,0,0,.55); z-index: 4; }\n.mm-scene-dock { position: absolute; inset: 0; pointer-events: none; z-index: 5; }\n.mm-scene-dock > * { pointer-events: auto; }\n.mm-scene-resize {\n  position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: nwse-resize; z-index: 9;\n  background: linear-gradient(135deg, transparent 55%, rgba(255,255,255,.6) 55% 62%, transparent 62% 72%, rgba(255,255,255,.6) 72% 79%, transparent 79%);\n}\n/* HUD 텍스트 */\n.mm-hud-title {\n  position: absolute; left: 12px; bottom: 12px; z-index: 4; color: #fff; pointer-events: none;\n  text-shadow: 0 1px 6px rgba(0,0,0,.9); max-width: 55%;\n}\n.mm-hud-title b { display: block; font-size: 1.15em; letter-spacing: .02em; }\n.mm-hud-title small { opacity: .85; }\n.mm-hud-quests {\n  position: absolute; left: 12px; top: 12px; z-index: 4; color: #fff; font-size: .8em; pointer-events: none;\n  display: flex; flex-direction: column; gap: 4px; max-width: 45%;\n}\n.mm-hud-quests div { background: rgba(0,0,0,.55); padding: 3px 8px; border-radius: 6px; border-left: 3px solid #ffd24a; }\n.mm-hud-quests i { color: #ffd24a; margin-right: 4px; }\n#mm-bgfx { position: fixed; inset: 0; z-index: -1; background-size: cover; background-position: center; pointer-events: none; }\n\n/* ===== 설정창 ===== */\n.mm-set-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; flex-wrap: wrap; }\n.mm-set-row input[type=text], .mm-set-row input[type=number], .mm-set-row input[type=password], .mm-set-row select { flex: 1; min-width: 80px; }\n.mm-edit-box { max-width: 420px; margin: 8px auto; border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; overflow: hidden; }\n.mm-edit-box .mm-viewport { cursor: crosshair; border-radius: 0; }\n.mm-edit-box .mm-stage { transition: none; }\n.mm-edit-box .mm-pin { touch-action: none; }\n.mm-place { border: 1px solid transparent; border-radius: 6px; margin: 3px 0; padding: 2px; }\n.mm-place.mm-active { border-color: #ff5d5d; background: rgba(255,93,93,.08); }\n.mm-place-row { display: grid; grid-template-columns: auto 1fr 1fr auto auto; gap: 6px; align-items: center; padding: 2px; }\n.mm-place-row .mm-coord { font-size: .75em; opacity: .7; min-width: 62px; text-align: center; }\n.mm-place-row .mm-coord.mm-warn { color: #ffb35f; opacity: 1; }\n.mm-place details { margin: 2px 4px 4px; font-size: .85em; }\n.mm-place details summary { cursor: pointer; opacity: .75; }\n.mm-place textarea, .mm-app textarea, .inline-drawer-content textarea.text_pole { width: 100%; margin: 3px 0; }\n.mm-mk-row { display: grid; grid-template-columns: 90px 1fr 1fr auto; gap: 6px; align-items: center; margin: 3px 0; }\n.mm-hint { font-size: .8em; opacity: .7; margin: 4px 0; }\n@media (max-width: 600px) {\n  .mm-place-row { grid-template-columns: auto 1fr auto auto; }\n  .mm-place-row .mm-alias { grid-column: 1 / -1; }\n  .mm-mk-row { grid-template-columns: 1fr 1fr; }\n}\n\n/* ===== v3.1 ===== */\n.mm-scene-view.mm-grab { cursor: grabbing; }\n.mm-scene-bar .mm-s-count { font-size: .75em; opacity: .7; min-width: 2.4em; text-align: center; }\n#mm-scene.mm-viewing .mm-scene-bar { background: color-mix(in srgb, #3a2f12 70%, var(--SmartThemeBlurTintColor, #111)); }\n.mm-hud-quests { pointer-events: none; }\n.mm-hud-quests div { pointer-events: auto; display: flex; align-items: center; gap: 4px; }\n.mm-q-x { all: unset; cursor: pointer; margin-left: 6px; padding: 0 5px; opacity: .55; border-radius: 4px; }\n.mm-q-x:hover, .mm-q-x:focus-visible { opacity: 1; background: rgba(255,255,255,.18); }\n\n.mm-app-h { display: flex; align-items: center; justify-content: space-between; font-size: .8em; opacity: .85; }\n.mm-app-empty { font-size: .8em; opacity: .6; margin: 4px 0; }\n.mm-app-other { margin: 6px 0; font-size: .85em; }\n.mm-app-other summary { cursor: pointer; opacity: .75; }\n.mm-app-oth { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0; }\n\n.mm-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; max-height: 340px; overflow-y: auto; padding: 4px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; }\n.mm-g-item { position: relative; display: block; border-radius: 6px; overflow: hidden; background: #151c1f; cursor: pointer; }\n.mm-g-item img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }\n.mm-g-item input { position: absolute; top: 5px; left: 5px; z-index: 2; width: 16px; height: 16px; }\n.mm-g-item span { display: block; padding: 3px 5px; font-size: .7em; line-height: 1.3; color: #cdd8d8; }\n\n/* ===== v3.3: 영상 ===== */\n.mm-scene-vid { position: absolute; max-width: none; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; background: #000; user-select: none; }\n.mm-vid-status {\n  display: none; position: absolute; right: 10px; bottom: 10px; z-index: 4; padding: 3px 10px; border-radius: 999px;\n  background: rgba(0,0,0,.7); color: #fff; font-size: .75em; pointer-events: none;\n}\n.mm-vid-status.on { display: block; }\n\n/* ===== v3.4: 장면 창 탭 / 미니맵 줌 ===== */\n.mm-tabs { display: flex; gap: 2px; padding: 4px 6px 0; overflow-x: auto; border-bottom: 1px solid var(--SmartThemeBorderColor, #555); background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #111) 92%, transparent); }\n.mm-tab { all: unset; cursor: pointer; padding: 5px 10px; font-size: .78em; white-space: nowrap; border-radius: 6px 6px 0 0; opacity: .7; }\n.mm-tab:hover, .mm-tab:focus-visible { opacity: 1; background: rgba(255,255,255,.07); }\n.mm-tab.on { opacity: 1; background: rgba(255,255,255,.12); box-shadow: inset 0 -2px 0 #ffd36b; }\n.mm-panels { display: none; max-height: min(64vh, 640px); overflow-y: auto; padding: 8px 12px 14px; cursor: default; touch-action: pan-y; background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #111) 92%, transparent); }\n.mm-panels h4 { margin: 12px 0 4px; }\n.mm-panel[hidden] { display: none; }\n#mm-scene.mm-tabmode { min-width: min(480px, calc(100vw - 16px)); }\n#mm-scene.mm-tabmode .mm-panels { display: block; }\n#mm-scene.mm-tabmode .mm-scene-view { display: none; }\n\n@media (hover: none) { .mm-hud { opacity: 1; } }\n\n/* ===== v3.5 ===== */\n.mm-viewport { cursor: grab; }\n.mm-viewport.mm-panning { cursor: grabbing; }\n.mm-edit-box .mm-viewport { cursor: crosshair; }\n#mm-resize { width: 22px; height: 22px; right: -4px; bottom: -4px; }\n\n/* 영상: 클릭으로 재생/정지, 정지 시 표시 */\n.mm-scene-view.mm-vid-paused .mm-scene-vid { position: absolute; max-width: none; left: 0; top: 0; object-fit: fill; user-select: none; }\n\n/* 기준 이미지 표시 */\n.mm-anchor-badge { position: absolute; right: 12px; bottom: 12px; z-index: 4; font-size: .75em; padding: 3px 9px; border-radius: 999px; background: rgba(0,0,0,.65); color: #ffd36b; border: 1px solid #ffd36b; pointer-events: none; display: none; }\n.mm-scene-bar .mm-s-pin.on { opacity: 1; color: #ffd36b; }\n.mm-anchor-box { display: flex; gap: 10px; align-items: center; padding: 6px; margin: 6px 0; border: 1px solid var(--SmartThemeBorderColor); border-radius: 8px; }\n.mm-anchor-box img { width: 120px; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 6px; flex: 0 0 auto; }\n.mm-anchor-info { font-size: .85em; flex: 1; }\n.mm-g-item.mm-g-anchor { outline: 2px solid #ffd36b; outline-offset: -2px; }\n.mm-g-item.mm-g-anchor span { color: #ffd36b; }\n\n/* 버튼이 세로로 늘어나는 문제 방지 */\n#mm-scene .menu_button, .mm-sec .menu_button, #extensions_settings2 .mm-set-row .menu_button {\n  width: auto !important; min-width: max-content; white-space: nowrap; flex: 0 0 auto; flex-direction: row; align-items: center; justify-content: center; padding: 6px 12px; line-height: 1.3;\n}\n#mm-scene .menu_button_icon, .mm-sec .menu_button_icon { padding: 6px 9px; min-width: 0; }\n.menu_button.disabled { opacity: .45; pointer-events: none; }\n\n\n/* ===== v3.6 ===== */\n.mm-sec, .mm-panels, .inline-drawer-content .mm-set-row { word-break: keep-all; }\n.mm-style-row select { flex: 1 1 150px; min-width: 120px; }\n.mm-style-row input { flex: 1 1 110px; min-width: 90px; }\n.mm-app-who { display: inline-flex; align-items: center; gap: 7px; }\n.mm-app-av { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; border: 1px solid var(--SmartThemeBorderColor, #555); background: #1b2427; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; }\n.mm-app-who small { opacity: .6; font-size: .75em; border: 1px solid currentColor; border-radius: 999px; padding: 0 6px; }\n.mm-app-empty { display: flex; align-items: center; }\n\n\n#mm-lightbox { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,.85); display: flex; flex-direction: column; color: #fff; }\n.mm-lb-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(0,0,0,.5); }\n.mm-lb-cap { flex: 1; font-size: .9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.mm-lb-bar button { all: unset; cursor: pointer; padding: 5px 10px; border-radius: 6px; font-size: .85em; background: rgba(255,255,255,.12); white-space: nowrap; }\n.mm-lb-bar button:hover, .mm-lb-bar button:focus-visible { background: rgba(255,255,255,.25); }\n.mm-lb-body { flex: 1; overflow: auto; display: flex; padding: 10px; }\n.mm-lb-body img, .mm-lb-body video { margin: auto; max-width: none; flex: 0 0 auto; }\n#mm-lightbox.mm-lb-fitted .mm-lb-body img, #mm-lightbox.mm-lb-fitted .mm-lb-body video { max-width: 100%; max-height: 100%; }\n#mm-lightbox .mm-lb-body video { max-width: 100%; max-height: 100%; }\n\n\n/* ===== v3.7 ===== */\n.mm-place-row { grid-template-columns: auto 1fr auto auto; }\n.mm-place-sub { display: flex; gap: 6px; align-items: center; margin: 2px 4px 4px; flex-wrap: wrap; }\n.mm-place-sub select { flex: 1 1 150px; min-width: 120px; }\n.mm-place-sub input { flex: 2 1 140px; min-width: 110px; }\n.mm-child { margin-left: 16px; border-left: 2px solid rgba(255,255,255,.18); }\n.mm-g-item video { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; pointer-events: none; background: #000; }\n.mm-g-item.mm-g-video span b { color: #ffb35f; }\n\n.mm-log-tbl { width: 100%; border-collapse: collapse; font-size: .85em; margin: 8px 0; }\n.mm-log-tbl th { font-weight: 600; opacity: .7; font-size: .8em; padding: 5px 8px; border-bottom: 1px solid var(--SmartThemeBorderColor, #555); white-space: nowrap; }\n.mm-log-tbl td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.08); white-space: nowrap; }\n.mm-log-tbl td:not(:first-child), .mm-log-tbl th:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }\n.mm-log-tbl th:first-child, .mm-log-tbl td:first-child { text-align: left; }\n.mm-log-tbl tr.mm-log-tot td { font-weight: 700; background: rgba(255,255,255,.06); border-top: 1px solid var(--SmartThemeBorderColor, #555); }\n.mm-log-list { max-height: 320px; overflow-y: auto; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }\n.mm-log-row { padding: 7px 10px; border-radius: 8px; background: rgba(255,255,255,.05); font-size: .82em; line-height: 1.5; }\n.mm-log-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.mm-log-t { opacity: .6; font-variant-numeric: tabular-nums; }\n.mm-log-badge { padding: 0 9px; border-radius: 999px; font-size: .85em; font-weight: 600; border: 1px solid currentColor; }\n.mm-log-badge.k-img { color: #6fb7ff; } .mm-log-badge.k-vid { color: #ffb35f; } .mm-log-badge.k-llm { color: #8be0a4; }\n.mm-log-l { opacity: .8; margin-left: auto; }\n.mm-log-k { margin-top: 3px; opacity: .9; }\n.mm-log-k b { font-weight: 600; }\n.mm-scene-empty .menu_button { width: auto !important; min-width: max-content; white-space: nowrap; word-break: keep-all; flex-direction: row; }\n\n\n/* ===== v3.8 ===== */\n.mm-you { cursor: pointer; }\n#mm-menu { position: fixed; z-index: 99998; min-width: 190px; padding: 5px; border-radius: 10px; background: var(--SmartThemeBlurTintColor, #151c1f); border: 1px solid var(--SmartThemeBorderColor, #555); box-shadow: 0 8px 24px rgba(0,0,0,.55); font-size: .85em; color: var(--SmartThemeBodyColor, #e6eeee); }\n#mm-menu button { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 7px; cursor: pointer; white-space: nowrap; }\n#mm-menu button:hover, #mm-menu button:focus-visible { background: rgba(255,255,255,.12); }\n#mm-menu button.on { color: #ffd36b; }\n#mm-menu .mm-menu-ck { margin-left: auto; }\n.mm-menu-h { padding: 4px 10px 6px; font-size: .78em; opacity: .6; }\n.mm-menu-sep { height: 1px; margin: 5px 4px; background: var(--SmartThemeBorderColor, #555); opacity: .7; }\n\n\n/* ===== v3.9 ===== */\n.mm-vid-status { pointer-events: auto; }\n.mm-vid-status.on { display: flex; align-items: center; gap: 8px; }\n.mm-vid-cancel { all: unset; cursor: pointer; padding: 1px 10px; border-radius: 999px; background: rgba(255,93,93,.9); color: #fff; font-size: .95em; white-space: nowrap; }\n.mm-vid-cancel:hover, .mm-vid-cancel:focus-visible { background: #ff5d5d; }\n.mm-help { margin: 4px 0 8px; padding: 6px 10px; border: 1px solid var(--SmartThemeBorderColor, #555); border-radius: 8px; font-size: .9em; }\n.mm-help summary { cursor: pointer; font-weight: 600; }\n.mm-help ol { margin: 6px 0 4px 18px; padding: 0; word-break: keep-all; }\n.mm-help li { margin: 3px 0; }\n";
  /*MM_CSS_END*/
  function injectCss() {   // 브라우저가 style.css를 캐시해도 항상 최신 스타일이 적용되게 JS에서도 주입
    document.getElementById('mm-css')?.remove();
    const st = document.createElement('style'); st.id = 'mm-css'; st.textContent = MM_CSS; document.head.appendChild(st);
  }



  /* 장소 종류 → [아이콘, 색, 이름] */
  const KINDS = {
    city: ['fa-city', '#6c8cff', '도시'], town: ['fa-house-chimney', '#6c8cff', '마을·구역'],
    inn: ['fa-bed', '#f2a65a', '여관·숙소'], shop: ['fa-bag-shopping', '#4cc38a', '상점'],
    food: ['fa-utensils', '#4cc38a', '식당·카페'], smith: ['fa-hammer', '#c9a37a', '대장간'],
    temple: ['fa-place-of-worship', '#d6b3ff', '신전·교회'], school: ['fa-graduation-cap', '#6cc4e8', '학교'],
    home: ['fa-house', '#b7c4cb', '집'], castle: ['fa-chess-rook', '#e8c36c', '성·궁전'],
    gate: ['fa-archway', '#b7c4cb', '문·다리'], dungeon: ['fa-dungeon', '#c46a6a', '던전·동굴'],
    nature: ['fa-tree', '#6fb56f', '숲·공원'], water: ['fa-water', '#5aaee8', '강·호수·바다'],
    building: ['fa-building', '#b7c4cb', '건물'], other: ['fa-location-dot', '#b7c4cb', '기타'],
  };
  /* 마커 종류 → [아이콘, 색, 이름] */
  const MARKERS = {
    user: ['fa-circle-user', '#3ddc97', '나 (유저)'], char: ['fa-heart', '#ff7ab8', '캐릭터'],
    npc: ['fa-user', '#4aa8ff', 'NPC'], enemy: ['fa-skull', '#ff5d5d', '적'], quest: ['fa-exclamation', '#ffd24a', '퀘스트'],
  };

  const KIND_RULES = [
    ['inn', /inn\b|tavern|hotel|hostel|dorm|lodg|여관|숙소|호텔|기숙|객잔/i], ['food', /restaurant|cafe|diner|dining|bar\b|pub|식당|카페|주점/i],
    ['shop', /shop|store|market|mall|bazaar|상점|가게|시장|마트/i], ['smith', /smith|forge|armory|대장간/i],
    ['temple', /temple|church|shrine|cathedral|신전|교회|성당|사원/i], ['school', /school|universit|campus|academy|library|학교|대학|학원|도서관/i],
    ['castle', /castle|palace|fort|keep|성\b|궁전|요새/i], ['gate', /gate|bridge|tower|문\b|다리|관문/i],
    ['dungeon', /dungeon|cave|mine|crypt|ruins|던전|동굴|광산|유적/i], ['water', /river|lake|sea|ocean|harbor|port|beach|강|호수|바다|항구|해변/i],
    ['nature', /forest|park|garden|mountain|field|woods|숲|공원|정원|산\b|들판/i], ['city', /city|metropol|도시/i],
    ['town', /town|village|district|quarter|street|마을|구역|거리/i], ['home', /house|home|apartment|residence|집|아파트|저택/i],
  ];
  const guessKind = (name) => (KIND_RULES.find(([, re]) => re.test(name)) || ['building'])[0];
  const kindOf = (p) => (KINDS[p.kind] ? p.kind : guessKind(p.name || ''));

  const defaults = {
    enabled: true, llmProfile: '', collapsed: false, x: null, y: null, w: 240,
    mapImage: '', mapRatio: 1, round: true,
    scanDepth: 2, useTag: true, hideTag: true, injectPrompt: false,
    showTitle: true, fog: false, showLabels: false, zoom: 1,
    showUser: true, showChar: true, videoModel: 'veo-3.1-fast-generate-preview', videoSeconds: '4', videoRes: '720p', videoAudio: false,
    useAvatars: true, directScene: true, regenOnVisit: false, videoProvider: 'auto', videoKey: '', videoProject: '', videoLocation: 'us-central1', videoToken: '',
    videoPrompt: 'Bring this scene to life with subtle, natural cinematic motion: a slow gentle camera push-in, people breathing and shifting slightly, hair and clothing moving in the wind, ambient atmosphere (weather, steam, light flicker) animating. Keep the composition, characters, outfits and art style exactly as in the image. No text, no subtitles, no new characters. Quiet ambient sound only.', showNpc: true, showEnemy: true, showQuest: true, questHud: 'off', maxKeep: 40,
    loreFilter: '장소,위치,location,place,loc',
    autoAnalyze: true, llmDetect: false, trackOn: false,
    autoMap: true, mapStyle: 'top-down game minimap illustration, clean readable terrain, soft painterly style',
    sceneOn: true, sceneX: null, sceneY: null, sceneW: 520, dock: true, bgMode: false,
    dockX: 73, dockY: 4, dockW: 25,
    autoGen: false, imgProvider: 'vertex', vertexProject: '', vertexLocation: 'global', geminiKey: '', geminiModel: 'gemini-3.1-flash-image', aspect: '16:9', useRef: true,
    stylePreset: 'custom', styleText: '', stylePresets: [], customText: '', usageLog: [], anchorAuto: false,
    negative: '',
    playerLook: '', appearance: {},
    places: [],
  };

  let editingId = null, editScope = 'world', viewScope = null;
  let analyzing = false, locating = false, genBusy = false, mapBusy = false, tracking = false;
  let sceneState = { placeId: null, url: null, status: '' };
  const tempMaps = {}, mapFailed = {};
  let viewing = null;                       // 장면 창에서 보고 있는 갤러리 인덱스 (null = 현재 장소)
  const pan = { z: 1, cx: 0.5, cy: 0.5, url: '' }; // 장면 둘러보기 상태

  /* ---------- 유틸/저장소 ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const uid = () => 'p' + Math.random().toString(36).slice(2, 9);
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => { const n = +v; return v !== null && v !== '' && v !== undefined && Number.isFinite(n) ? clamp(+n.toFixed(1), 4, 96) : null; };

  function S() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) extensionSettings[MODULE] = structuredClone(defaults);
    const s = extensionSettings[MODULE];
    for (const k of Object.keys(defaults)) if (s[k] === undefined) s[k] = structuredClone(defaults[k]);
    return s;
  }
  const saveSettings = () => ctx().saveSettingsDebounced();
  const freshWorld = (places = []) => ({ places, look: '', scenes: {}, maps: {}, markers: [], gallery: [], videos: {}, analyzed: false, anchor: null });
  const emptyMeta = () => ({ current: null, history: [], world: freshWorld() });
  function M() {
    const m = ctx().chatMetadata;
    if (!m) return emptyMeta();
    if (!m[MODULE]) m[MODULE] = emptyMeta();
    const x = m[MODULE];
    if (!x.world) x.world = freshWorld(structuredClone(S().places || []));
    x.world.maps ||= {}; x.world.markers ||= []; x.world.scenes ||= {}; x.world.videos ||= {};
    if (!x.world.gallery) {
      x.world.gallery = Object.entries(x.world.scenes).filter(([, u]) => typeof u === 'string').map(([k, u]) => {
        const pid = k.split('|')[0];
        return { id: uid(), url: u, placeId: pid, name: (x.world.places.find((q) => q.id === pid) || {}).name || '', t: 0 };
      });
    }
    x.world.gallery = x.world.gallery.filter((g) => !(g.mem || String(g.url).startsWith('blob:')));   // 새로고침 후 사라진 임시 영상 제거
    for (const [iu, vu] of Object.entries(x.world.videos || {})) {                                      // 예전 방식(이미지에 붙은 영상)을 별도 항목으로 변환
      if (!x.world.gallery.some((g) => g.url === vu)) {
        const im = x.world.gallery.find((g) => g.url === iu);
        x.world.gallery.push({ id: uid(), kind: 'video', url: vu, src: iu, placeId: im?.placeId || '', name: im?.name || '', t: (im?.t || 0) + 1, moment: im?.moment || '' });
      }
    }
    return x;
  }
  const W = () => M().world;
  const saveMeta = () => { const c = ctx(); (c.saveMetadataDebounced || c.saveMetadata)?.(); };
  const placeById = (id) => (id ? W().places.find((p) => p.id === id) : null);
  const hasXY = (p) => p && p.x != null && p.y != null;
  const keysOf = (p) => [p.name, ...(p.aliases || [])].map((k) => String(k).trim().toLowerCase()).filter((k) => k.length >= 2);
  const findByName = (nm) => W().places.find((p) => keysOf(p).includes(String(nm).trim().toLowerCase()));
  const curPlace = () => placeById(M().current);

  /* ---------- 지도 계층 (scope) ---------- */
  const childrenOf = (scope) => W().places.filter((p) => (p.parent || 'world') === scope);
  function anchorIn(p, scope) {
    let q = p, n = 0;
    while (q && n++ < 10) { if ((q.parent || 'world') === scope) return q; q = q.parent ? placeById(q.parent) : null; }
    return null;
  }
  function isDesc(rootId, p) {
    let q = p, n = 0;
    while (q && n++ < 10) { if (q.id === rootId) return true; q = q.parent ? placeById(q.parent) : null; }
    return false;
  }
  function scopeOf(cur) {
    if (!cur) return 'world';
    if (childrenOf(cur.id).some(hasXY)) return cur.id;
    return cur.parent && placeById(cur.parent) ? cur.parent : 'world';
  }
  const activeScope = (cur) => (viewScope && (viewScope === 'world' || placeById(viewScope)) ? viewScope : scopeOf(cur));
  const scopeName = (scope) => (scope === 'world' ? '세계' : placeById(scope)?.name || '?');
  function youPos(cur, scope) {
    if (!cur) return null;
    if (cur.id === scope) return { x: 50, y: 50 };
    const a = anchorIn(cur, scope);
    return hasXY(a) ? { x: a.x, y: a.y } : null;
  }
  function mapOf(scope) {
    const w = W();
    return w.maps[scope] || tempMaps[scope] || (scope === 'world' && S().mapImage ? { url: S().mapImage, ratio: S().mapRatio || 1, user: true } : null);
  }
  function mapSig(scope) {
    const kids = childrenOf(scope).filter(hasXY).map((p) => `${p.name}${p.x}${p.y}${kindOf(p)}`).join('|');
    return hash(kids + W().look + S().mapStyle);
  }

  /* ---------- LLM ---------- */
  const LLM_KINDS = [[/worldbuilding analyst/, '장소 분석'], [/Decide where the latest scene/, '위치 판별'], [/Update the map markers/, '마커 추적'], [/visual tags/, '외형 추출'], [/game cinematographer/, '장면 연출 분석']];
  const tokCount = async (t) => { try { const n = await ctx().getTokenCountAsync?.(String(t)); if (Number.isFinite(n)) return n; } catch { /* 추정으로 대체 */ } return Math.ceil(String(t).length / 3.5); };
  function logUsage(e) {
    const s = S();
    s.usageLog.push({ t: Date.now(), ...e });
    if (s.usageLog.length > 400) s.usageLog.splice(0, s.usageLog.length - 400);
    saveSettings();
    if (typeof activeTab !== 'undefined' && activeTab === 'log') renderLog();
  }
  let profWarned = false;
  const profileList = () => { const cm = ctx().extensionSettings?.connectionManager; return Array.isArray(cm?.profiles) ? cm.profiles : []; };
  /* 텍스트 분석 호출: 연결 프로필을 골랐으면 그 프로필로(채팅 내용 없이), 아니면 채팅에 연결된 모델로 */
  async function llm(prompt) {
    const s = S(), kind = (LLM_KINDS.find(([re]) => re.test(prompt)) || [0, '모델 호출'])[1];
    const prof = s.llmProfile ? profileList().find((p) => p.id === s.llmProfile) : null;
    const svc = ctx().ConnectionManagerRequestService;
    let out = '', model = '연결된 채팅 모델';
    if (prof && svc?.sendRequest) {
      try {
        const r = await svc.sendRequest(prof.id, [{ role: 'user', content: prompt }], kind === '장소 분석' ? 8192 : 4096, { stream: false, extractData: true }, {});
        out = typeof r === 'string' ? r : (r?.content ?? '');
        if (!String(out).trim()) throw new Error('프로필 응답이 비어 있어요');
        model = `프로필: ${prof.name}${prof.model ? ` (${prof.model})` : ''}`;
      } catch (e) {
        console.warn('[Minimap] 연결 프로필 호출 실패', e);
        if (!profWarned) { profWarned = true; toastr.warning(`연결 프로필 "${prof.name}" 호출에 실패해서 채팅 모델로 대신 실행해요: ${e.message || e}`); }
        out = '';
      }
    } else if (s.llmProfile && !profWarned) { profWarned = true; toastr.warning('선택한 연결 프로필을 찾지 못해 채팅 모델로 실행해요. (Connection Manager 확장이 켜져 있는지 확인해 주세요)'); }
    if (!String(out).trim()) { out = await ctx().generateQuietPrompt(prompt, false, false); model = '연결된 채팅 모델'; }
    if (typeof out !== 'string' || !out.trim()) throw new Error('모델 응답이 비어 있어요');
    logUsage({ kind, label: curPlace()?.name || '', model, inTok: await tokCount(prompt), outTok: await tokCount(out), est: true });
    return out;
  }
  function parseJSON(text) {
    const t = String(text).replace(/```json|```/g, '');
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) return null;
    try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  }

  /* ---------- 장소 감지 ---------- */
  function detect() {
    const s = S(), places = W().places;
    const msgs = ctx().chat.filter((m) => m && !m.is_system && m.mes).slice(-Math.max(1, s.scanDepth)).reverse();
    for (const m of msgs) {
      if (s.useTag) {
        const tags = [...m.mes.matchAll(/\[LOC:\s*([^\]]+)\]/gi)];
        if (tags.length) { const hit = findByName(tags[tags.length - 1][1]); if (hit) return hit; }
      }
      const text = m.mes.toLowerCase();
      let best = null, bestIdx = -1;
      for (const p of places) for (const k of keysOf(p)) {
        const i = text.lastIndexOf(k);
        if (i > bestIdx) { bestIdx = i; best = p; }
      }
      if (best) return best;
    }
    return null;
  }

  function setCurrent(p) {
    const meta = M();
    const changed = meta.current !== p.id;
    viewScope = null;
    if (changed) {
      meta.current = p.id;
      if (meta.history[meta.history.length - 1] !== p.id) meta.history.push(p.id);
      if (meta.history.length > 60) meta.history.shift();
      saveMeta();
      if (S().trackOn) setTimeout(trackMarkers, 0);
    }
    render();
    if (changed || sceneState.placeId !== p.id) showScene(p);
    if (changed) maybeMap();
  }

  function update() {
    if (!S().enabled && !S().sceneOn) return null;
    const p = detect();
    if (p) setCurrent(p); else { render(); renderScene(); }
    return p;
  }
  async function onNewMessage() {
    const p = update();
    if (!p && S().llmDetect && W().places.length) await llmLocate();
  }

  /* ---------- 로어북/컨텍스트 ---------- */
  async function loreNames() {
    const c = ctx(), set = new Set();
    if (c.chatMetadata?.world_info) set.add(c.chatMetadata.world_info);
    const cw = c.characters?.[c.characterId]?.data?.extensions?.world;
    if (cw) set.add(cw);
    document.querySelectorAll('#world_info option:checked').forEach((o) => set.add(o.textContent.trim()));
    (document.querySelector('#mm_lore_names')?.value || '').split(',').map((t) => t.trim()).filter(Boolean).forEach((n) => set.add(n));
    return [...set];
  }
  async function loadBook(name) {
    const r = await fetch('/api/worldinfo/get', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ name }) });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function gatherContext() {
    const c = ctx(), parts = [];
    for (const ch of castList()) parts.push(`[Character: ${ch.name}]\n${(ch.description || '').slice(0, 2500)}\n${(ch.scenario || '').slice(0, 1000)}`);
    const persona = c.powerUserSettings?.persona_description;
    if (persona) parts.push(`[User persona: ${c.name1}]\n${persona.slice(0, 1500)}`);
    let lore = '';
    for (const name of await loreNames()) {
      try {
        const book = await loadBook(name);
        for (const e of Object.values(book.entries || {})) {
          if (e.disable) continue;
          lore += `- ${(e.comment || (e.key || [])[0] || '').trim()}: ${(e.content || '').replace(/\s+/g, ' ').slice(0, 350)}\n`;
          if (lore.length > 9000) break;
        }
      } catch (err) { console.warn('[Minimap] lorebook', name, err); }
    }
    if (lore) parts.push(`[Lorebook]\n${lore}`);
    const recent = c.chat.filter((m) => !m.is_system).slice(-8).map((m) => `${m.name}: ${String(m.mes).slice(0, 500)}`).join('\n');
    if (recent) parts.push(`[Recent chat]\n${recent}`);
    return parts.join('\n\n');
  }

  /* ---------- 배치/병합 ---------- */
  function nudge(p) {
    const others = W().places.filter((q) => q !== p && hasXY(q) && (q.parent || null) === (p.parent || null));
    for (let i = 0; i < 40 && others.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 9); i++) {
      p.x = clamp(+(p.x + 6 * Math.cos(i * 2.4)).toFixed(1), 6, 94);
      p.y = clamp(+(p.y + 6 * Math.sin(i * 2.4)).toFixed(1), 6, 94);
    }
  }
  function autoLayout() {
    const groups = new Map();
    for (const p of W().places) { const k = p.parent || 'world'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    for (const list of groups.values()) {
      const placed = list.filter(hasXY);
      for (const p of list.filter((q) => !hasXY(q))) {
        let a = placed.length * 2.4, r = 14, pos = null;
        for (let i = 0; i < 300 && !pos; i++) {
          const x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a);
          if (x > 8 && x < 92 && y > 8 && y < 92 && placed.every((q) => Math.hypot(q.x - x, q.y - y) > 13)) pos = { x, y };
          a += 0.7; r += 0.3;
        }
        p.x = +(pos?.x ?? 50).toFixed(1); p.y = +(pos?.y ?? 50).toFixed(1);
        placed.push(p);
      }
    }
  }
  /* 지도는 2단계만: 최상위 장소(건물·마을) > 내부 장소(방·구역). 더 깊은 장소는 최상위 장소 바로 아래로 올림 */
  function rootOf(p) { let q = p, n = 0; while (q?.parent && placeById(q.parent) && n++ < 10) q = placeById(q.parent); return q; }
  function flattenPlaces() {
    let moved = 0;
    for (const p of W().places) {
      if (!p.parent) continue;
      const par = placeById(p.parent);
      if (!par) { p.parent = null; continue; }
      if (par.parent) { p.parent = rootOf(par).id; p.x = null; p.y = null; moved++; }
    }
    return moved;
  }
  function mergePlaces(list) {
    const w = W(), created = [];
    for (const it of (list || []).slice(0, 30)) {
      if (!it?.name) continue;
      const al = (it.aliases || []).map(String).filter(Boolean);
      let p = findByName(it.name);
      if (p) {
        p.desc = p.desc || it.desc || ''; p.visual = p.visual || it.visual || '';
        if (!p.kind && KINDS[it.kind]) p.kind = it.kind;
        al.forEach((a) => { if (!keysOf(p).includes(a.toLowerCase())) (p.aliases ||= []).push(a); });
        continue;
      }
      p = { id: uid(), name: String(it.name).trim(), aliases: al, kind: KINDS[it.kind] ? it.kind : '', x: num(it.x), y: num(it.y), parent: null, desc: it.desc || '', visual: it.visual || '', auto: true, _pn: it.parent };
      w.places.push(p); created.push(p);
    }
    for (const p of created) {
      if (p._pn) { const par = findByName(p._pn); if (par && par !== p && !isDesc(p.id, par)) p.parent = par.id; }
      delete p._pn;
    }
    flattenPlaces();
    created.filter(hasXY).forEach(nudge);
    return created.length;
  }
  /* {{user}} / {{char}} 판별: 이름이 현재 페르소나·캐릭터와 같으면 NPC가 아니라 user/char */
  function roleOf(name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    const c = ctx();
    const same = (a) => { a = String(a || '').trim().toLowerCase(); return !!a && (a === n || (a.length >= 4 && n.length >= 4 && (a.includes(n) || n.includes(a)))); };
    if (same(c.name1)) return 'user';
    if (castList().some((ch) => same(ch.name))) return 'char';
    return null;
  }
  const fixType = (it) => (['npc', 'char', 'user'].includes(it.type) ? roleOf(it.name) || 'npc' : it.type);
  function normalizeMarkers() {
    let changed = false;
    for (const m of W().markers) if (m.type === 'npc') { const r = roleOf(m.name); if (r) { m.type = r; changed = true; } }
    if (changed) saveMeta();
  }
  const roleNote = () => `{{user}} is "${ctx().name1}" → type "user". The main character(s) {{char}} (${castList().map((ch) => ch.name).join(', ') || 'unknown'}) → type "char". Every other named person → "npc".`;

  function mergeMarkers(list) {
    const w = W(); let n = 0;
    for (const it of (list || []).slice(0, 40)) {
      if (!MARKERS[it?.type] || !it.name) continue;
      const type = fixType(it), place = findByName(it.place || '');
      if (!place) continue;
      const dup = w.markers.find((m) => m.type === type && m.name.toLowerCase() === String(it.name).toLowerCase());
      if (dup) { dup.place = place.id; continue; }
      w.markers.push({ id: uid(), type, name: String(it.name).trim(), place: place.id }); n++;
    }
    return n;
  }

  /* ---------- 자동 분석 ---------- */
  async function analyzeWorld() {
    if (analyzing) return;
    if (!ctx().chat.length && ctx().characterId == null) { toastr.info('캐릭터/채팅을 먼저 열어 주세요.'); return; }
    analyzing = true; toastr.info('장소를 분석하는 중…');
    try {
      const known = W().places.map((p) => p.name).join(', ');
      const prompt = `You are a worldbuilding analyst. Do NOT roleplay. Read the material below and extract the LOCATIONS and map markers of this story world.
Reply with ONLY one JSON object, no commentary:
{"look":"one English sentence on the overall visual style and atmosphere of the world",
"places":[{"name":"name in the story's language","aliases":["other names or keywords"],"kind":"city|town|inn|shop|food|smith|temple|school|home|castle|gate|dungeon|nature|water|building|other","parent":"name of the containing place or null","x":0-100,"y":0-100,"desc":"one short sentence in the story's language","visual":"one English sentence on how it looks, for an image generator"}],
"markers":[{"type":"user|char|npc|enemy|quest","name":"name","place":"exact name of a place above"}]}
Rules: at most 20 places and 20 markers. Nest at most ONE level: a building or area (e.g. a cabin) holds its rooms (room, bathroom, kitchen...) as DIRECT children; never put a room inside another room and never give rooms their own sub-places. x,y = position on the top-down map OF ITS PARENT (or of the whole world if parent is null), 0..100, west-east and north-south. Distances between places must reflect their real relative distances. EVERY place needs x,y, even when it has a parent (its position inside the parent's map). Markers: the user and main character(s) (where they are now), named important NPCs, hostile enemies/threats, and quest objectives with a location. ${roleNote()} Skip places already known: ${known || 'none'}.

${await gatherContext()}`;
      const data = parseJSON(await llm(prompt));
      if (!data?.places) throw new Error('결과를 읽지 못했어요. 다시 시도해 주세요.');
      if (data.look && !W().look) W().look = String(data.look).slice(0, 300);
      const n = mergePlaces(data.places), m = mergeMarkers(data.markers);
      autoLayout();
      W().analyzed = true; saveMeta();
      normalizeMarkers(); renderEditor(); renderMarkerList(); render(); renderScene(); updatePrompt(); update(); maybeMap();
      toastr.success(`장소 ${n}개, 마커 ${m}개를 추가했어요. 설정에서 수정할 수 있어요.`);
    } catch (e) { toastr.error('분석 실패: ' + (e.message || e)); }
    finally { analyzing = false; }
  }

  async function llmLocate() {
    if (locating) return; locating = true;
    try {
      const last = ctx().chat.filter((m) => !m.is_system).slice(-2).map((m) => `${m.name}: ${String(m.mes).slice(0, 800)}`).join('\n');
      const known = W().places.map((p) => `${p.name}${p.parent ? ` (inside ${placeById(p.parent)?.name})` : ''} @${p.x ?? '-'},${p.y ?? '-'}`).join('\n');
      const d = parseJSON(await llm(`Do NOT roleplay. Decide where the latest scene takes place.
Known places:
${known}

Scene:
${last}

Reply ONLY with JSON: {"place":"exact known name, or a new place name","is_new":false,"kind":"","parent":null,"x":null,"y":null,"desc":"","visual":"","aliases":[]}
If new: give kind, a parent (the known BUILDING/AREA it belongs to - never another room - or null) and rough x,y (0..100) inside that parent's map (or the world map). Use {"place":null} if unclear.`));
      if (!d?.place) return;
      let p = findByName(d.place);
      if (!p) {
        mergePlaces([{ name: d.place, aliases: d.aliases, kind: d.kind, parent: d.parent, x: d.x, y: d.y, desc: d.desc, visual: d.visual }]);
        autoLayout(); saveMeta(); renderEditor(); updatePrompt();
        p = findByName(d.place);
      }
      if (p) setCurrent(p);
    } catch (e) { console.warn('[Minimap] llmLocate', e); }
    finally { locating = false; }
  }

  async function trackMarkers() {
    if (tracking || !W().places.length) return; tracking = true;
    try {
      const w = W();
      const cur = w.markers.map((m) => `${m.type}|${m.name}|${placeById(m.place)?.name || '-'}`).join('\n');
      const last = ctx().chat.filter((m) => !m.is_system).slice(-4).map((m) => `${m.name}: ${String(m.mes).slice(0, 600)}`).join('\n');
      const d = parseJSON(await llm(`Do NOT roleplay. Update the map markers for this story.
Places: ${w.places.map((p) => p.name).join(', ')}
Current markers (type|name|place):
${cur || '(none)'}

Recent scene:
${last}

Reply ONLY with JSON: {"markers":[{"type":"user|char|npc|enemy|quest","name":"","place":"exact place name","status":"active|done|gone"}]}
Include only markers that are new or changed. ${roleNote()} npc = other named characters who are somewhere specific; enemy = hostile creatures/people; quest = objectives with a location. Use status done/gone when a quest is finished or the NPC/enemy has left or died.`));
      for (const it of d?.markers || []) {
        if (!MARKERS[it?.type] || !it.name) continue;
        const nm = String(it.name).toLowerCase(), type = fixType(it);
        const m = w.markers.find((x) => x.type === type && x.name.toLowerCase() === nm);
        if (it.status === 'done' || it.status === 'gone') { if (m) w.markers = w.markers.filter((x) => x !== m); continue; }
        const place = findByName(it.place || '');
        if (!place) continue;
        if (m) m.place = place.id; else w.markers.push({ id: uid(), type, name: String(it.name).trim(), place: place.id });
      }
      saveMeta(); render(); renderScene(); renderMarkerList();
    } catch (e) { console.warn('[Minimap] trackMarkers', e); }
    finally { tracking = false; }
  }

  /* ---------- 지도 렌더링 ---------- */
  const ZOOMS = [1, 1.5, 2, 3, 4, 6];
  let camPan = { x: 0, y: 0 }, panMode = false, lastCurId = null;
  function cam(pos, ratio, round) {
    const z = +S().zoom || 1;
    let Wst = 100, Hst = 100;
    if (round) { if (ratio >= 1) Wst = ratio * 100; else Hst = 100 / ratio; }
    const kx = 100 / Wst, ky = 100 / Hst;
    const bx = pos ? pos.x : 50, by = pos ? pos.y : 50;
    const cx = clamp(bx + camPan.x, (50 * kx) / z, 100 - (50 * kx) / z), cy = clamp(by + camPan.y, (50 * ky) / z, 100 - (50 * ky) / z);
    camPan.x = cx - bx; camPan.y = cy - by;     // 지도 밖으로 끌어도 되돌릴 때 반응이 무뎌지지 않게
    const f = (v, k) => clamp(50 * k - v * z, 100 * k - 100 * z, 0);
    return { z, Wst, Hst, tx: f(cx, kx), ty: f(cy, ky) };
  }
  function applyCam() {
    const root = document.getElementById('mm-root'); if (!root) return;
    const cur = curPlace(), scope = activeScope(cur), map = mapOf(scope);
    const c = cam(youPos(cur, scope), map?.ratio || 1, S().round), stage = root.querySelector('.mm-stage');
    stage.style.setProperty('--z', c.z);
    stage.style.transform = `translate(${c.tx}%, ${c.ty}%) scale(${c.z})`;
  }
  function stepZoom(dir) {
    const z = +S().zoom || 1;
    let i = ZOOMS.reduce((b, v, k) => (Math.abs(v - z) < Math.abs(ZOOMS[b] - z) ? k : b), 0);
    i = clamp(i + dir, 0, ZOOMS.length - 1);
    S().zoom = ZOOMS[i];
    if (S().zoom === 1) camPan = { x: 0, y: 0 };
    saveSettings(); $('[data-key="zoom"]').val(String(S().zoom)); applyCam();
  }

  function stageHTML(scope, { editor = false, cur = null, visited = new Set(), history = [] } = {}) {
    const s = S(), w = W(), map = mapOf(scope);
    let h = map ? `<img class="mm-img" src="${map.url}" alt="">` : '';
    const kids = childrenOf(scope).filter(hasXY);


    const me = !editor && cur ? youPos(cur, scope) : null;
    const meA = !editor && cur ? anchorIn(cur, scope) : null;
    for (const p of kids) {
      const isMe = meA && meA.id === p.id && cur.id !== scope;
      if (isMe) continue;
      const seen = visited.has(p.id);
      if (!editor && s.fog && !seen) continue;
      const k = KINDS[kindOf(p)];
      const label = s.showLabels || editor ? `<span class="mm-label">${esc(p.name)}</span>` : '';
      h += `<div class="mm-pin ${!editor && !seen ? 'mm-unvisited' : ''} ${editor && p.id === editingId ? 'mm-edit' : ''}" data-id="${p.id}" style="left:${p.x}%;top:${p.y}%;--c:${k[1]}" title="${esc(p.name)}"><i class="fa-solid ${k[0]}"></i>${label}</div>`;
    }

    if (!editor) {
      const shown = { user: s.showUser, char: s.showChar, npc: s.showNpc, enemy: s.showEnemy, quest: s.showQuest };
      const count = {};
      for (const m of w.markers) {
        if (!shown[m.type]) continue;
        const pl = placeById(m.place); if (!pl) continue;
        const a = pl.id === scope ? { id: scope, x: 50, y: 50 } : anchorIn(pl, scope);
        if (!a || !hasXY(a)) continue;
        if (m.type === 'user' && cur && a.id === (cur.id === scope ? scope : meA?.id)) continue; // 현재 위치 화살표와 겹치지 않게
        const i = (count[a.id] = (count[a.id] || 0) + 1) - 1, ang = -0.6 + i * 1.3;
        const x = clamp(a.x + 4.2 * Math.cos(ang), 2, 98), y = clamp(a.y - 4.2 * Math.sin(ang) - 1, 2, 98);
        const t = MARKERS[m.type];
        h += `<div class="mm-mk" data-type="${m.type}" style="left:${x}%;top:${y}%;--c:${t[1]}" title="${esc(t[2])}: ${esc(m.name)}"><i class="fa-solid ${t[0]}"></i></div>`;
      }
      if (me) h += `<div class="mm-you" style="left:${me.x}%;top:${me.y}%" title="현재 위치: ${esc(cur.name)} (더블클릭하면 내 위치 지도로 돌아가요)"><i class="fa-solid fa-location-arrow"></i><span class="mm-label">${esc(cur.name)}</span></div>`;
    }
    return h;
  }

  function placeMinimap(root) {
    const s = S(), dockEl = document.querySelector('#mm-scene .mm-scene-dock');
    const sceneVisible = s.sceneOn && dockEl;
    if (s.dock && sceneVisible) { if (root.parentElement !== dockEl) dockEl.appendChild(root); root.classList.add('mm-docked'); }
    else { if (root.parentElement !== document.body) document.body.appendChild(root); root.classList.remove('mm-docked'); }
  }

  function render() {
    const root = document.getElementById('mm-root');
    if (!root) return;
    const s = S(), w = W();
    placeMinimap(root);
    const docked = root.classList.contains('mm-docked');
    root.classList.toggle('mm-hidden', !s.enabled);
    root.classList.toggle('mm-collapsed', !!s.collapsed && !docked);
    root.classList.toggle('mm-round', !!s.round);

    const meta = M(), cur = placeById(meta.current), scope = activeScope(cur), map = mapOf(scope);
    const ratio = map?.ratio || 1;
    root.style.setProperty('--mm-ratio', s.round ? 1 : ratio);
    if (docked) { root.style.left = s.dockX + '%'; root.style.top = s.dockY + '%'; root.style.width = s.dockW + '%'; }
    else root.style.width = s.w + 'px';

    const par = cur?.parent ? placeById(cur.parent) : null;
    root.querySelector('#mm-title').textContent = cur ? (par ? `${cur.name} · ${par.name}` : cur.name) : '위치 미확인';
    root.querySelector('.mm-scope').textContent = scopeName(scope);

    const visited = new Set();
    for (const id of [...meta.history, meta.current]) { const a = anchorIn(placeById(id), scope); if (a) visited.add(a.id); }
    const stage = root.querySelector('.mm-stage');
    stage.innerHTML = stageHTML(scope, { cur, visited, history: meta.history });
    if (meta.current !== lastCurId) { lastCurId = meta.current; camPan = { x: 0, y: 0 }; }
    const c = cam(youPos(cur, scope), ratio, s.round);
    stage.style.setProperty('--z', c.z);
    stage.style.width = c.Wst + '%'; stage.style.height = c.Hst + '%';
    stage.style.transform = `translate(${c.tx}%, ${c.ty}%) scale(${c.z})`;

    const vp = root.querySelector('.mm-viewport');
    vp.querySelector('.mm-empty')?.remove();
    if (!childrenOf(scope).some(hasXY)) vp.insertAdjacentHTML('beforeend', '<div class="mm-empty">설정 → 미니맵에서<br>장소 자동 분석을 실행하세요</div>');

    const gen = root.querySelector('.mm-mapgen');
    gen.classList.toggle('mm-spin', mapBusy);
    gen.classList.toggle('mm-stale', !!(map && !map.user && map.sig !== mapSig(scope)));
    gen.title = !map ? '이 지도 이미지 생성' : '지도 이미지 다시 생성';
    root.querySelector('.mm-up').style.display = scope === 'world' ? 'none' : '';
    if (docked) clampDock(); else placeInView(root);
  }

  /* 도킹된 미니맵이 장면 밖으로 나가 크기 손잡이를 못 잡는 일이 없도록 안쪽으로 되돌림 */
  /* 미니맵 테두리(바깥 몇 px)를 잡으면 HUD 이동 */
  function inRing(e, vp, round) {
    const r = vp.getBoundingClientRect(), m = Math.max(9, Math.min(r.width, r.height) * 0.07);
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (round) { const R = r.width / 2; return Math.hypot(x - R, y - r.height / 2) > R - m; }
    return x < m || y < m || x > r.width - m || y > r.height - m;
  }
  function clampDock() {
    const root = document.getElementById('mm-root');
    if (!root || !root.classList.contains('mm-docked')) return;
    const dr = root.parentElement.getBoundingClientRect(), s = S();
    if (!dr.width || !dr.height) return;
    let r = root.getBoundingClientRect();
    const hPct = (r.height / dr.height) * 100;
    if (hPct > 96) { s.dockW = +Math.max(12, s.dockW * (96 / hPct)).toFixed(1); root.style.width = s.dockW + '%'; r = root.getBoundingClientRect(); }
    const h2 = (r.height / dr.height) * 100;
    s.dockW = +clamp(s.dockW, 12, 96).toFixed(1);
    s.dockX = +clamp(s.dockX, 0, Math.max(0, 100 - s.dockW)).toFixed(1);
    s.dockY = +clamp(s.dockY, 0, Math.max(0, 100 - h2)).toFixed(1);
    root.style.left = s.dockX + '%'; root.style.top = s.dockY + '%';
  }

  function placeInView(root) {
    const s = S(), r = root.getBoundingClientRect();
    root.style.left = clamp(s.x ?? window.innerWidth - r.width - 16, 0, Math.max(0, window.innerWidth - 60)) + 'px';
    root.style.top = clamp(s.y ?? window.innerHeight - r.height - 120, 0, Math.max(0, window.innerHeight - 32)) + 'px';
  }

  function dragger(handle, target, onEnd, ignore = 'button') {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest(ignore)) return;
      const r = target.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const move = (ev) => {
        target.style.left = clamp(ev.clientX - dx, 0, window.innerWidth - 60) + 'px';
        target.style.top = clamp(ev.clientY - dy, 0, window.innerHeight - 30) + 'px';
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); onEnd(parseInt(target.style.left), parseInt(target.style.top)); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });
  }

  /* 미니맵 헤더의 ▾ 버튼: 지도 목록으로 이동 / 내 위치로 돌아가기 / 접기·펴기 */
  function closeMapMenu() { document.getElementById('mm-menu')?.remove(); }
  function openMapMenu(btn) {
    if (document.getElementById('mm-menu')) { closeMapMenu(); return; }
    const cur = curPlace(), active = activeScope(cur);
    const scopes = [['world', '세계 지도', 'fa-earth-asia'], ...W().places.filter((p) => childrenOf(p.id).length).map((p) => [p.id, `${p.name} 내부`, 'fa-house'])];
    const menu = document.createElement('div');
    menu.id = 'mm-menu';
    menu.innerHTML = `<div class="mm-menu-h">지도 선택</div>${scopes.map(([id, nm, ic]) => `<button data-scope="${esc(id)}" class="${id === active ? 'on' : ''}"><i class="fa-solid ${ic}"></i><span>${esc(nm)}</span>${id === active ? '<i class="fa-solid fa-check mm-menu-ck"></i>' : ''}</button>`).join('')}<div class="mm-menu-sep"></div><button data-act="me"><i class="fa-solid fa-location-crosshairs"></i><span>내 위치 지도로 돌아가기</span></button><button data-act="fold"><i class="fa-solid ${S().collapsed ? 'fa-angles-down' : 'fa-angles-up'}"></i><span>${S().collapsed ? '미니맵 펴기' : '미니맵 접기'}</span></button>`;
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.top = Math.min(r.bottom + 4, window.innerHeight - menu.offsetHeight - 8) + 'px';
    menu.style.left = Math.max(8, Math.min(r.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8)) + 'px';
    const off = (ev) => { if (!menu.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) done(); };
    const key = (ev) => { if (ev.key === 'Escape') done(); };
    const done = () => { closeMapMenu(); document.removeEventListener('pointerdown', off, true); document.removeEventListener('keydown', key, true); };
    document.addEventListener('pointerdown', off, true); document.addEventListener('keydown', key, true);
    menu.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.scope) { viewScope = b.dataset.scope; camPan = { x: 0, y: 0 }; render(); }
      else if (b.dataset.act === 'me') { viewScope = null; camPan = { x: 0, y: 0 }; render(); }
      else if (b.dataset.act === 'fold') { S().collapsed = !S().collapsed; saveSettings(); render(); }
      done();
    });
  }

  function createMinimap() {
    if (document.getElementById('mm-root')) return;
    const root = document.createElement('div');
    root.id = 'mm-root';
    root.innerHTML = `
      <div id="mm-header"><i class="fa-solid fa-map"></i><span id="mm-title">-</span><span class="mm-scope"></span>
        <button id="mm-collapse" title="지도 목록 · 접기/펴기" aria-label="지도 목록 및 접기/펴기"><i class="fa-solid fa-chevron-down"></i></button>
        <button id="mm-close" title="숨기기" aria-label="숨기기"><i class="fa-solid fa-xmark"></i></button></div>
      <div id="mm-body"><span class="mm-north">N</span>
        <div class="mm-viewport"><div class="mm-stage"></div>
          <div class="mm-hud"><button class="mm-hudbtn mm-up" title="상위 지도 보기" aria-label="상위 지도"><i class="fa-solid fa-turn-up"></i></button>
            <button class="mm-hudbtn mm-mapgen" title="지도 이미지 생성" aria-label="지도 생성"><i class="fa-solid fa-rotate"></i></button></div>
</div>
        <div id="mm-resize" title="크기 조절"></div></div>`;
    document.body.appendChild(root);

    dragger(root.querySelector('#mm-header'), root, (x, y) => { S().x = x; S().y = y; saveSettings(); });

    // 도킹 상태(장면 위 HUD): 이동 손잡이(또는 Shift+드래그)로 HUD 위치 이동
    root.addEventListener('pointerdown', (e) => {
      if (!root.classList.contains('mm-docked') || e.target.closest('.mm-pin,.mm-mk,.mm-hudbtn,#mm-resize')) return;
      const vpEl = root.querySelector('.mm-viewport');
      if (!(e.shiftKey || e.target === root || (e.target.closest('.mm-viewport') && inRing(e, vpEl, S().round)))) return;
      e.preventDefault();
      const dock = root.parentElement, dr = dock.getBoundingClientRect(), r = root.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      const move = (ev) => {
        const x = clamp(((ev.clientX - dx - dr.left) / dr.width) * 100, 0, 100 - (r.width / dr.width) * 100);
        const y = clamp(((ev.clientY - dy - dr.top) / dr.height) * 100, 0, 100 - (r.height / dr.height) * 100);
        root.style.left = x + '%'; root.style.top = y + '%';
        S().dockX = +x.toFixed(1); S().dockY = +y.toFixed(1);
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); saveSettings(); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });

    // 크기 조절 (도킹이면 장면 폭의 %, 아니면 px)
    root.querySelector('#mm-resize').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const docked = root.classList.contains('mm-docked'), sx = e.clientX, sw = root.offsetWidth;
      const dw = docked ? root.parentElement.getBoundingClientRect().width : 1;
      const move = (ev) => {
        if (docked) { S().dockW = +clamp(((sw + ev.clientX - sx) / dw) * 100, 12, 60).toFixed(1); root.style.width = S().dockW + '%'; clampDock(); }
        else { S().w = clamp(sw + ev.clientX - sx, 140, 600); root.style.width = S().w + 'px'; }
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); clampDock(); saveSettings(); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });

    root.querySelector('#mm-collapse').addEventListener('click', (e) => { e.stopPropagation(); openMapMenu(e.currentTarget); });
    root.querySelector('#mm-close').addEventListener('click', () => { S().enabled = false; saveSettings(); render(); renderScene(); $('#mm_enabled').prop('checked', false); });
    root.querySelector('.mm-up').addEventListener('click', () => {
      const sc = activeScope(curPlace()), par = sc === 'world' ? null : placeById(sc)?.parent;
      viewScope = par || 'world'; render();
    });
    root.querySelector('.mm-mapgen').addEventListener('click', () => generateMap(activeScope(curPlace()), true));
    // 미니맵 위에서 드래그 = 지도 이동, 휠/핀치 = 확대·축소, 더블클릭 = 전체 보기
    const vp = root.querySelector('.mm-viewport'), ptrs = new Map();
    let wheelAt = 0, pinchBase = 0;
    vp.addEventListener('wheel', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (Date.now() - wheelAt < 120) return; wheelAt = Date.now();
      stepZoom(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });
    vp.addEventListener('dblclick', (e) => {
      if (e.target.closest('.mm-you')) {                       // 내 위치 아이콘 더블클릭 = 내가 있는 지도로 복귀
        e.stopPropagation(); viewScope = null; camPan = { x: 0, y: 0 }; render(); return;
      }
      if (e.target.closest('.mm-pin,.mm-mk,.mm-hudbtn')) return;
      e.stopPropagation(); S().zoom = 1; camPan = { x: 0, y: 0 }; saveSettings(); $('[data-key="zoom"]').val('1'); applyCam();
    });
    vp.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mm-pin,.mm-mk,.mm-hudbtn')) return;
      if (root.classList.contains('mm-docked') && (e.shiftKey || inRing(e, vp, S().round))) return;   // Shift+드래그 / 테두리 드래그는 HUD 이동
      e.preventDefault(); e.stopPropagation();
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchBase = Math.hypot(a.x - b.x, a.y - b.y); }
      if (ptrs.size > 1) return;
      const scope = activeScope(curPlace()), ratio = mapOf(scope)?.ratio || 1, round = S().round, z = +S().zoom || 1;
      const Wst = round && ratio >= 1 ? ratio * 100 : 100, Hst = round && ratio < 1 ? 100 / ratio : 100;
      const pxW = Math.max(1, vp.clientWidth * (Wst / 100) * z), pxH = Math.max(1, vp.clientHeight * (Hst / 100) * z);
      const sx = e.clientX, sy = e.clientY, p0 = { ...camPan };
      vp.classList.add('mm-panning');
      const move = (ev) => {
        if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (ptrs.size >= 2) {
          const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinchBase && d / pinchBase > 1.35) { stepZoom(1); pinchBase = d; } else if (pinchBase && d / pinchBase < 0.74) { stepZoom(-1); pinchBase = d; }
          return;
        }
        camPan.x = p0.x - ((ev.clientX - sx) / pxW) * 100;
        camPan.y = p0.y - ((ev.clientY - sy) / pxH) * 100;
        applyCam();
      };
      const up = (ev) => {
        ptrs.delete(ev.pointerId);
        if (ptrs.size) return;
        vp.classList.remove('mm-panning');
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
    root.querySelector('.mm-stage').addEventListener('click', (e) => {
      const pin = e.target.closest('.mm-pin'); if (!pin) return;
      const p = placeById(pin.dataset.id); if (p) setCurrent(p);
    });
    window.addEventListener('resize', () => { if (!root.classList.contains('mm-docked')) placeInView(root); });
  }

  /* ---------- 지도 이미지 생성 ---------- */
  function makeSketch(kids) {
    const N = 768, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const g = cv.getContext('2d');
    g.fillStyle = '#0f1417'; g.fillRect(0, 0, N, N);
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
    for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo((i * N) / 10, 0); g.lineTo((i * N) / 10, N); g.moveTo(0, (i * N) / 10); g.lineTo(N, (i * N) / 10); g.stroke(); }
    g.strokeStyle = '#8a8f94'; g.lineWidth = 6; g.lineCap = 'round';
    for (const p of kids) {
      let best = null, bd = 1e9;
      for (const q of kids) { if (q === p) continue; const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = q; } }
      if (best) { g.beginPath(); g.moveTo((p.x / 100) * N, (p.y / 100) * N); g.lineTo((best.x / 100) * N, (best.y / 100) * N); g.stroke(); }
    }
    g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
    for (const p of kids) {
      const x = (p.x / 100) * N, y = (p.y / 100) * N;
      g.fillStyle = KINDS[kindOf(p)][1]; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
      g.fillStyle = '#fff'; g.fillText(p.name.slice(0, 18), x, y + 44);
    }
    return { inlineData: { mimeType: 'image/png', data: cv.toDataURL('image/png').split(',')[1] } };
  }

  async function generateMap(scope, manual = false) {
    const s = S();
    if (mapBusy) { if (manual) toastr.info('지도를 생성하는 중이에요.'); return; }
    if (s.imgProvider === 'sd') { if (manual) toastr.info('지도 이미지 생성은 Agent Platform/Gemini 방식에서만 지원해요.'); return; }
    const kids = childrenOf(scope).filter(hasXY);
    if (!kids.length) { if (manual) toastr.info('이 지도에 배치된 장소가 없어요.'); return; }
    mapBusy = true; render(); renderEditor();
    try {
      const list = kids.map((p) => `- ${p.name} (${KINDS[kindOf(p)][2]}) at x=${p.x}%, y=${p.y}%`).join('\n');
      const prompt = `The attached image is a LAYOUT SKETCH for a top-down game minimap of ${scope === 'world' ? 'the world' : `"${scopeName(scope)}"`}. Each colored circle marks a landmark; its label is the name. Landmarks:
${list}
Paint a finished top-down game minimap that keeps every landmark at exactly the sketched position and keeps the same relative distances. Draw a fitting landmark/building footprint at each circle and connect them with roads or paths. Fill the remaining space with fitting terrain. ${W().look ? 'World look: ' + W().look + '.' : ''} ${s.mapStyle}.
IMPORTANT: remove all sketch circles, labels, grid lines and any text from the result. Square image, no border, no UI, no compass, no text.`;
      const url = await geminiGenerate(prompt, [makeSketch(kids)], '1:1', { kind: '지도 생성', label: scopeName(scope) });
      const entry = { url, ratio: 1, sig: mapSig(scope) };
      if (url.startsWith('data:')) tempMaps[scope] = entry; else { W().maps[scope] = entry; saveMeta(); }
      delete mapFailed[scope];
    } catch (e) {
      mapFailed[scope] = true;
      toastr.error('지도 생성 실패: ' + (e.message || e));
    } finally { mapBusy = false; render(); renderEditor(); }
  }

  function maybeMap() {
    const s = S();
    if (!s.autoMap || !s.enabled || s.imgProvider === 'sd') return;
    const scope = activeScope(curPlace());
    if (mapOf(scope) || mapFailed[scope] || childrenOf(scope).filter(hasXY).length < (scope === 'world' ? 2 : 3)) return;   // 방이 적은 내부 지도는 직접 생성
    generateMap(scope);
  }

  /* ---------- 캐릭터 외형 ---------- */
  function castList() {
    const c = ctx(), list = [];
    if (c.groupId) {
      const g = c.groups?.find((x) => x.id == c.groupId);
      g?.members?.forEach((av) => { const ch = c.characters.find((x) => x.avatar === av); if (ch) list.push(ch); });
    } else if (c.characterId != null && c.characters?.[c.characterId]) list.push(c.characters[c.characterId]);
    return list;
  }
  /* 예전(이름만 쓰던) 페르소나 외형 키를 현재 페르소나 키로 옮김 */
  function ensurePersonaKey(label) {
    const app = S().appearance;
    if (label.startsWith('나: ') && label.includes(' #') && !app[label]) {
      const old = labelOf(label);
      if (app[old]) { app[label] = app[old]; delete app[old]; }
    }
  }
  async function appearanceOf(label, text) {
    const s = S();
    ensurePersonaKey(label);
    const a = s.appearance[label];
    if (a?.manual) return a.t;
    if (!text?.trim()) return a?.t || '';
    const h = hash(text);
    if (a && a.h === h) return a.t;
    const out = (await llm(`Do NOT roleplay. From the description below, write ONE line of comma-separated English visual tags describing only the physical appearance and outfit (age impression, hair, eyes, skin, build, clothing, armor, accessories). No names, no personality, under 45 words. Output only that line.

${text.slice(0, 3000)}`)).trim().replace(/\s*\n+\s*/g, ' ').slice(0, 450);
    s.appearance[label] = { h, t: out };
    saveSettings(); renderAppearance();
    return out;
  }
  async function playerAppearance() {
    const s = S(), c = ctx();
    if (s.playerLook.trim()) return s.playerLook.trim();
    return (await appearanceOf(personaKey(), c.powerUserSettings?.persona_description)) || 'an adventurer in practical traveling clothes';
  }

  /* ---------- 장면 이미지 ---------- */
  const styleKey = () => hash(S().styleText);

  const castByName = (name) => {
    const n = String(name || '').trim().toLowerCase();
    return castList().find((ch) => ch.name.toLowerCase() === n) || castList().find((ch) => n.length >= 3 && (ch.name.toLowerCase().includes(n) || n.includes(ch.name.toLowerCase())));
  };

  /* 최근 대화에서 "지금 이 순간"을 읽어 인물별 행동·표정·위치를 정한다 */
  async function directScene(place) {
    const s = S(), c = ctx();
    if (!s.directScene) return null;
    const recent = c.chat.filter((m) => !m.is_system).slice(-4).map((m) => `${m.name}: ${String(m.mes).replace(/\[LOC:[^\]]*\]/gi, '').slice(0, 900)}`).join('\n');
    if (!recent) return null;
    const cast = castList().map((ch) => ch.name).join(', ');
    const raw = await llm(`Do NOT roleplay. You are a game cinematographer. From the latest story beats below, pick the single most visual moment and describe it as one still frame of a third-person over-the-shoulder game screenshot at "${place.name}".
Reply ONLY with JSON: {"moment":"one English sentence: what is happening right now","lighting":"time of day / weather / mood","camera":"short camera direction","actors":[{"name":"exact name","role":"user|char|npc","action":"specific body pose and the ongoing action taken from the text, e.g. leaning over the counter pouring tea, mid-stride pulling the player by the sleeve; never just standing or staring at the camera","expression":"","position":"where in the frame / relative to the player","gaze":"what they are looking at","look":"appearance tags only if the text describes this npc, else empty"}]}
Rules: only people physically present in this moment (max 4). The player is {{user}} = "${c.name1}" (role "user", seen from behind) and the main character(s) are ${cast || 'unknown'} (role "char"). Poses and actions must match what the text says is happening and should differ from person to person. People look at what they are interacting with, not at the camera.

${recent}`);
    const d = parseJSON(raw);
    if (!d || !Array.isArray(d.actors)) return null;
    d.actors = d.actors.filter((a) => a?.name).slice(0, 4).map((a) => ({ ...a, role: roleOf(a.name) || (a.role === 'user' || a.role === 'char' ? 'npc' : a.role || 'npc') }));
    return d;
  }

  async function buildPrompt(place, directed) {
    const s = S(), w = W(), c = ctx();
    const par = place.parent ? placeById(place.parent) : null;
    const parts = s.styleText.trim() ? [String(s.styleText).replace(/16:9/g, s.aspect)] : [];
    if (s.aspect === '21:9') parts.push('ultra-wide panoramic composition with a wide field of view, the surroundings extending far to the left and right');
    if (w.look) parts.push(`World look: ${w.look}`);
    const where = place.visual || place.desc || place.name;
    parts.push(par ? `Location: "${place.name}" inside "${par.name}". ${where}` : `Location: "${place.name}". ${where}`);
    const me = directed?.actors.find((a) => a.role === 'user');
    parts.push(`Foreground, seen from behind: the player character, ${await playerAppearance()}${me?.action ? `, ${me.action}` : ''}`);
    if (directed) {
      if (directed.moment) parts.push(`Moment: ${directed.moment}`);
      if (directed.lighting) parts.push(`Lighting and mood: ${directed.lighting}`);
      if (directed.camera) parts.push(`Camera: ${directed.camera}`);
      for (const a of directed.actors.filter((x) => x.role !== 'user')) {
        let look = '';
        if (a.role === 'char') { const ch = castByName(a.name); if (ch) look = await appearanceOf(ch.name, [ch.description, ch.personality].filter(Boolean).join('\n')); }
        else look = a.look || '';
        parts.push(`${a.name}${look ? ` (${look})` : ''}: ${a.action || 'present in the scene'}${a.expression ? `, ${a.expression} expression` : ''}${a.position ? `, ${a.position}` : ''}${a.gaze ? `, looking at ${a.gaze}` : ''}`);
      }
      parts.push('Candid in-the-moment action poses with natural body language; characters interact with the scene and each other and do not pose for the camera');
    } else {
      const recent = c.chat.slice(-3).map((m) => m.mes || '').join(' ').toLowerCase();
      for (const ch of castList()) {
        if (!recent.includes(ch.name.toLowerCase())) continue;
        const look = await appearanceOf(ch.name, [ch.description, ch.personality].filter(Boolean).join('\n'));
        if (look) parts.push(`${ch.name} stands ahead, ${look}`);
      }
      const near = w.markers.filter((m) => m.place === place.id && (m.type === 'npc' || m.type === 'enemy')).map((m) => m.name);
      if (near.length) parts.push(`Other people or creatures nearby: ${near.join(', ')}`);
    }
    return parts.join('. ');
  }

  async function sdGenerate(prompt) {
    const c = ctx();
    if (!c.executeSlashCommandsWithOptions) throw new Error('이 버전에서 슬래시 명령 API를 찾지 못했어요');
    const clean = (t) => String(t).replace(/[|\r\n"]/g, ' ').replace(/[{}]/g, ' ');
    const neg = S().negative.trim();
    const r = await c.executeSlashCommandsWithOptions(`/sd quiet=true${neg ? ` negative="${clean(neg)}"` : ''} ${clean(prompt)}`, { handleParserErrors: true, handleExecutionErrors: true });
    const url = r?.pipe;
    if (!url || url === 'false') throw new Error('이미지를 받지 못했어요. Image Generation 확장 설정을 확인해 주세요.');
    return url;
  }

  async function urlToInline(url) {
    const r = await fetch(url), b = await r.blob();
    const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(b); });
    return { inlineData: { mimeType: b.type || 'image/png', data } };
  }
  async function saveImage(b64, mime) {
    const fmt = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
    try {
      const r = await fetch('/api/images/upload', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ image: b64, format: fmt, ch_name: 'minimap', filename: 'img_' + Date.now() }) });
      if (!r.ok) throw new Error(r.status);
      return '/' + String((await r.json()).path).replace(/^\/+/, '');
    } catch (e) {
      console.warn('[Minimap] 이미지 서버 저장 실패, 임시 표시만 합니다', e);
      return `data:${mime};base64,${b64}`;
    }
  }

  function apiUrl(action, model) {
    const s = S(), m = encodeURIComponent((model || s.geminiModel).trim());
    if (s.imgProvider !== 'vertex') return `https://generativelanguage.googleapis.com/v1beta/models/${m}:${action}`;
    const proj = s.vertexProject.trim(), loc = (s.vertexLocation || 'global').trim();
    if (!proj) return `https://aiplatform.googleapis.com/v1/publishers/google/models/${m}:${action}`;
    const host = loc === 'global' ? 'aiplatform.googleapis.com' : `${loc}-aiplatform.googleapis.com`;
    return `https://${host}/v1/projects/${encodeURIComponent(proj)}/locations/${loc}/publishers/google/models/${m}:${action}`;
  }

  async function geminiGenerate(prompt, refs = [], aspect, meta = {}) {
    const s = S();
    if (!s.geminiKey.trim()) throw new Error('설정에 API 키를 입력해 주세요');
    const parts = [];
    for (const u of refs) {
      if (typeof u === 'object') { parts.push(u); continue; }
      try { parts.push(await urlToInline(u)); } catch (e) { console.warn('[Minimap] 참조 이미지 로드 실패', e); }
    }
    parts.push({ text: prompt });
    const endpoint = apiUrl('generateContent');
    const call = async (withCfg) => {
      const body = { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } };
      if (withCfg) body.generationConfig.imageConfig = { aspectRatio: aspect || s.aspect };
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.geminiKey.trim() }, body: JSON.stringify(body) });
      return { r, j: await r.json().catch(() => ({})) };
    };
    let { r, j } = await call(true);
    if (r.status === 400 && /imageConfig|aspect/i.test(JSON.stringify(j))) ({ r, j } = await call(false));
    if (!r.ok) throw new Error(`${s.imgProvider === 'vertex' ? 'Agent Platform' : 'Gemini'} ${r.status}: ${j?.error?.message || '요청 실패'}`);
    const um = j.usageMetadata;
    logUsage({ kind: meta.kind || '이미지 생성', label: meta.label || '', model: s.geminiModel, inTok: um?.promptTokenCount, outTok: um?.candidatesTokenCount, thoughts: um?.thoughtsTokenCount, refs: parts.length - 1 });
    const cand = j.candidates?.[0];
    const img = cand?.content?.parts?.map((p) => p.inlineData || p.inline_data).find(Boolean);
    if (!img?.data) {
      if (j.promptFeedback?.blockReason) throw new Error(`요청이 차단됐어요 (${j.promptFeedback.blockReason})`);
      throw new Error(cand?.finishReason ? `이미지가 생성되지 않았어요 (${cand.finishReason}). 안전 필터에 걸렸을 수 있어요.` : '응답에 이미지가 없어요');
    }
    return saveImage(img.data, img.mimeType || img.mime_type || 'image/png');
  }

  async function testGemini() {
    const s = S();
    if (!s.geminiKey.trim()) { toastr.warning('API 키를 먼저 입력해 주세요.'); return; }
    try {
      const vertex = s.imgProvider === 'vertex';
      const r = vertex
        ? await fetch(apiUrl('countTokens'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': s.geminiKey.trim() }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }) })
        : await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(s.geminiModel.trim())}`, { headers: { 'x-goog-api-key': s.geminiKey.trim() } });
      const j = await r.json().catch(() => ({}));
      if (r.ok) toastr.success(`연결 성공: ${s.geminiModel}`); else toastr.error(`${r.status}: ${j?.error?.message || '실패'}`);
    } catch (e) { toastr.error('요청 실패 (네트워크/CORS): ' + (e.message || e)); }
  }

  /* 캐릭터 카드 PNG / 페르소나 아바타를 줄여서 참조 이미지로 보낸다 */
  const avatarCache = {};
  async function avatarInline(url, max = 768) {
    if (avatarCache[url]) return avatarCache[url];
    let out;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const blob = await r.blob(), obj = URL.createObjectURL(blob);
      try {
        const img = await new Promise((ok, no) => { const i = new Image(); const t = setTimeout(() => no(new Error('timeout')), window.__MM_IMG_TIMEOUT || 4000); i.onload = () => { clearTimeout(t); ok(i); }; i.onerror = (e) => { clearTimeout(t); no(e); }; i.src = obj; });
        const k = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        out = { inlineData: { mimeType: 'image/jpeg', data: cv.toDataURL('image/jpeg', 0.88).split(',')[1] } };
      } catch { out = null; }      // 디코딩 실패 시 원본 PNG(카드 정보가 들어 있을 수 있음)를 그대로 보내지 않고 건너뜀
      finally { URL.revokeObjectURL(obj); }
    } catch { out = null; }
    if (out) avatarCache[url] = out;
    return out;
  }
  const personaFile = () => {
    const c = ctx();
    if (c.userAvatar || c.user_avatar) return c.userAvatar || c.user_avatar;
    const attr = (el) => el?.getAttribute('data-avatar-id') || el?.getAttribute('imgfile') || '';
    const sel = document.querySelector('#user_avatar_block .avatar-container.selected');
    if (attr(sel)) return attr(sel);
    const byName = [...document.querySelectorAll('#user_avatar_block .avatar-container')].find((el) => el.querySelector('.ch_name')?.textContent.trim() === c.name1);
    if (attr(byName)) return attr(byName);
    const src = sel?.querySelector('img')?.getAttribute('src') || '';
    const m = src.match(/[?&]file=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  };
  const personaKey = () => { const f = personaFile(); return `나: ${ctx().name1}${f ? ` #${f}` : ''}`; };
  const labelOf = (k) => String(k).replace(/ #[^#]*$/, '');
  const personaThumbs = () => {
    const f = personaFile(), list = [];
    if (f) list.push('/thumbnail?type=persona&file=' + encodeURIComponent(f), '/User Avatars/' + encodeURIComponent(f));
    const fa = [...(ctx().chat || [])].reverse().find((m) => m.is_user && m.force_avatar)?.force_avatar;
    if (fa) list.push(/^(\/|https?:)/.test(fa) ? fa : '/' + fa);
    const m = document.querySelector('#chat .mes[is_user="true"] .avatar img')?.getAttribute('src');
    if (m) list.push(m);
    return list;
  };
  const charThumbs = (ch) => (ch?.avatar ? ['/thumbnail?type=avatar&file=' + encodeURIComponent(ch.avatar), '/characters/' + encodeURIComponent(ch.avatar)] : []);
  function personaAvatarUrls() {
    const c = ctx(), list = [];
    const f = personaFile();
    if (f) { list.push('/User Avatars/' + encodeURIComponent(f)); list.push('/thumbnail?type=persona&file=' + encodeURIComponent(f)); }
    const m = document.querySelector('#chat .mes[is_user="true"] .avatar img')?.getAttribute('src');
    if (m) list.push(m);
    return list;
  }
  const charAvatarUrls = (ch) => (ch?.avatar ? ['/characters/' + encodeURIComponent(ch.avatar), '/thumbnail?type=avatar&file=' + encodeURIComponent(ch.avatar)] : []);
  async function firstAvatar(urls) { for (const u of urls) { const a = await avatarInline(u); if (a) return a; } return null; }

  async function refsFor(place, directed) {
    const s = S(), w = W(), refs = [], notes = [];
    if (s.imgProvider === 'sd') return { refs, notes };
    if (s.useRef) {
      if (w.anchor) { refs.push(w.anchor); notes.push(`Reference image ${refs.length} shows the established art style and the player character seen from behind. Keep the same character design, outfit, proportions and art style.`); }
      const par = place.parent ? placeById(place.parent) : null;
      const ps = par ? w.scenes[par.id + '|' + styleKey()] : null;
      if (ps && ps !== w.anchor && !ps.startsWith('data:')) { refs.push(ps); notes.push(`Reference image ${refs.length} shows "${par.name}". Keep the architecture, signage and materials consistent.`); }
    }
    if (s.useAvatars) {
      const pa = await firstAvatar(personaAvatarUrls());
      if (pa) { refs.push(pa); notes.push(`Reference image ${refs.length} is the portrait of the player character "${ctx().name1}" (seen from behind in the foreground). Match their hair, skin tone, build and outfit exactly.`); }
      const present = new Set();
      for (const a of directed?.actors || []) if (a.role === 'char') { const ch = castByName(a.name); if (ch) present.add(ch); }
      if (!directed) { const recent = ctx().chat.slice(-3).map((m) => m.mes || '').join(' ').toLowerCase(); for (const ch of castList()) if (recent.includes(ch.name.toLowerCase())) present.add(ch); }
      for (const ch of [...present].slice(0, 3)) {
        const ca = await firstAvatar(charAvatarUrls(ch));
        if (ca) { refs.push(ca); notes.push(`Reference image ${refs.length} is the character portrait of "${ch.name}". Match their face, hair, skin tone and outfit exactly.`); }
      }
    }
    return { refs, notes };
  }

  async function generateScene(place, key) {
    if (genBusy) { toastr.info('이미 생성 중이에요.'); return; }
    genBusy = true; sceneState.status = 'busy'; renderScene();
    try {
      const s = S();
      let directed = null;
      try { directed = await directScene(place); } catch (e) { console.warn('[Minimap] 장면 연출 분석 실패, 기본 프롬프트로 진행', e); }
      const prompt = await buildPrompt(place, directed);
      let url;
      if (s.imgProvider !== 'sd') {
        const { refs, notes } = await refsFor(place, directed);
        url = await geminiGenerate(`${notes.join(' ')}\nGenerate one image. ${prompt}.${s.negative.trim() ? `\nAvoid: ${s.negative.trim()}.` : ''}`, refs, undefined, { kind: '장면 이미지', label: place.name });
      } else url = await sdGenerate(prompt);
      if (!url.startsWith('data:')) {
        W().scenes[key] = url;
        if (!W().anchor && S().anchorAuto) W().anchor = url;
        W().gallery.push({ id: uid(), url, placeId: place.id, name: place.name, t: Date.now(), moment: directed?.moment || '' });
        saveMeta();
      }
      if (sceneState.placeId === place.id) { sceneState.url = url; viewing = null; }
    } catch (e) { toastr.error('이미지 생성 실패: ' + (e.message || e)); }
    finally { genBusy = false; sceneState.status = ''; renderScene(); renderGallery(); }
    await pruneImages();
  }

  /* ---------- 영상 (Veo 이미지 → 영상) ---------- */
  const VEO_POLL_MS = window.__MM_POLL_MS || 8000;
  const vidState = { busy: false, t0: 0, timer: 0, abort: null, cancelled: false, started: false };
  const abortErr = () => Object.assign(new Error('취소됨'), { name: 'AbortError' });
  const sleepAbortable = (ms, signal) => new Promise((ok, no) => {
    if (signal?.aborted) return no(abortErr());
    const onAbort = () => { clearTimeout(t); no(abortErr()); };
    const t = setTimeout(() => { signal?.removeEventListener('abort', onAbort); ok(); }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
  const memVideos = {};                 // 서버 저장 실패 시 이번 세션에서만 쓰는 blob URL
  const videoEntryFor = (imgUrl) => [...W().gallery].reverse().find((g) => g.kind === 'video' && g.src === imgUrl) || null;
  const videoFor = (imgUrl) => (imgUrl && (videoEntryFor(imgUrl)?.url || W().videos[imgUrl] || memVideos[imgUrl])) || null;
  const veoRate = (model, res) => {
    const m = String(model).toLowerCase();
    if (m.includes('lite')) return res === '1080p' ? 0.08 : 0.05;
    if (m.includes('fast')) return res === '1080p' ? 0.12 : 0.10;
    return 0.40;
  };
  const vertexModelId = (m) => String(m).trim().replace(/-generate-preview$/, '-generate-001');
  const blobToBase64 = (blob) => new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = no; fr.readAsDataURL(blob); });
  const b64ToBlob = (b64, mime) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); };

  function videoPrompt(place, moment) {
    const where = place ? `Scene: ${place.name}. ${place.visual || place.desc || ''}` : '';
    return `${S().videoPrompt.trim()}\n${moment ? `Action in this moment: ${moment}\n` : ''}${where}`.slice(0, 1100);
  }

  async function extractVideoBlob(resp, vertex, key, signal) {
    if (vertex && !resp?.generateVideoResponse) {
      const v = resp?.videos?.[0];
      if (v?.bytesBase64Encoded) return b64ToBlob(v.bytesBase64Encoded, v.mimeType || 'video/mp4');
      if (v?.gcsUri) throw new Error('영상이 Cloud Storage에 저장됐어요. 프로젝트 ID를 비워 express 모드로 시도해 주세요: ' + v.gcsUri);
      const why = (resp?.raiMediaFilteredReasons || []).join(', ');
      throw new Error(why ? `안전 필터로 차단됐어요: ${why}` : '응답에 영상이 없어요');
    }
    const gv = resp?.generateVideoResponse, uri = gv?.generatedSamples?.[0]?.video?.uri;
    if (!uri) {
      const why = (gv?.raiMediaFilteredReasons || []).join(', ');
      throw new Error(why ? `안전 필터로 차단됐어요: ${why}` : '응답에 영상 주소가 없어요');
    }
    let r = await fetch(uri, { headers: { 'x-goog-api-key': key }, signal }).catch(() => null);
    if (!r || !r.ok) r = await fetch(uri + (uri.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(key), { signal }).catch(() => null);
    if (!r || !r.ok) throw new Error('영상을 내려받지 못했어요 (브라우저 CORS 차단일 수 있어요)');
    return r.blob();
  }

  function veoCfg() {
    const s = S();
    let vp = s.videoProvider === 'auto' ? s.imgProvider : s.videoProvider;
    if (vp === 'sd') vp = 'gemini';
    return { vp, key: (s.videoKey || s.geminiKey).trim(), token: s.videoToken.trim() };
  }
  function veoUrl(action, model, vp) {
    const s = S(), m = encodeURIComponent(model);
    if (vp !== 'vertex') return `https://generativelanguage.googleapis.com/v1beta/models/${m}:${action}`;
    const proj = (s.videoProject || s.vertexProject).trim();
    if (!proj) throw new Error('Agent Platform의 Veo는 프로젝트 ID가 꼭 필요해요 (API 키만 쓰는 express 모드는 400 오류가 나요). 설정 → 움직이는 장면에서 프로젝트 ID를 넣어 주세요.');
    const loc = (s.videoLocation || 'us-central1').trim();
    const host = loc === 'global' ? 'aiplatform.googleapis.com' : `${loc}-aiplatform.googleapis.com`;
    return `https://${host}/v1/projects/${encodeURIComponent(proj)}/locations/${loc}/publishers/google/models/${m}:${action}`;
  }
  function veoErr(r, j, fallback, vp) {
    const reason = j?.error?.details?.find((x) => x.reason)?.reason;
    let msg = `${r.status}: ${j?.error?.message || fallback}${reason ? ` [${reason}]` : ''}`;
    if (reason === 'RESOURCE_PROJECT_INVALID') msg += ' → 프로젝트 ID를 확인해 주세요.';
    if (vp === 'vertex' && (r.status === 401 || r.status === 403)) msg += ' → API 키가 이 요청을 거부했어요. 영상 API 키/액세스 토큰을 따로 넣거나 Gemini Developer API 방식을 써 보세요.';
    return new Error(msg);
  }

  async function veoGenerate(imageUrl, prompt, sec, resolution, signal, onStart) {
    const s = S(), { vp, key, token } = veoCfg();
    if (!key && !token) throw new Error('설정에 API 키를 입력해 주세요');
    if (s.imgProvider === 'sd' && s.videoProvider === 'auto') throw new Error('영상은 Agent Platform/Gemini API 방식에서만 만들 수 있어요 (영상 방식을 따로 골라 주세요)');
    const vertex = vp === 'vertex';
    const model = vertex ? vertexModelId(s.videoModel) : s.videoModel.trim();
    const inl = (await urlToInline(imageUrl)).inlineData;
    const aspectRatio = s.aspect === '9:16' ? '9:16' : '16:9';
    const parameters = vertex
      ? { aspectRatio, durationSeconds: sec, resolution, sampleCount: 1, generateAudio: !!s.videoAudio, personGeneration: 'allow_adult' }
      : { aspectRatio, durationSeconds: String(sec), resolution, personGeneration: 'allow_adult' };
    const instance = vertex ? { prompt, image: { bytesBase64Encoded: inl.data, mimeType: inl.mimeType } } : { prompt, image: { inlineData: inl } };
    const headers = { 'Content-Type': 'application/json' };
    if (vertex && token) headers.Authorization = `Bearer ${token}`; else headers['x-goog-api-key'] = key;
    let r = await fetch(veoUrl('predictLongRunning', model, vp), { method: 'POST', headers, body: JSON.stringify({ instances: [instance], parameters }), signal });
    let j = await r.json().catch(() => ({}));
    if (!r.ok) throw veoErr(r, j, '영상 요청 실패', vp);
    const opName = j.name;
    if (!opName) throw new Error('작업 이름을 받지 못했어요');
    onStart?.();
    const t0 = Date.now();
    while (Date.now() - t0 < 10 * 60 * 1000) {
      await sleepAbortable(VEO_POLL_MS, signal);
      r = vertex
        ? await fetch(veoUrl('fetchPredictOperation', model, vp), { method: 'POST', headers, body: JSON.stringify({ operationName: opName }), signal })
        : await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}`, { headers: { 'x-goog-api-key': key }, signal });
      j = await r.json().catch(() => ({}));
      if (!r.ok) throw veoErr(r, j, '상태 확인 실패', vp);
      if (j.done) break;
    }
    if (!j.done) throw new Error('10분이 지나도 끝나지 않아 중단했어요');
    if (j.error) throw new Error(j.error.message || '영상 생성 실패');
    return extractVideoBlob(j.response, vertex, key, signal);
  }

  async function saveVideo(blob) {
    const b64 = await blobToBase64(blob), name = 'scene_' + Date.now();
    const attempts = [
      ['/api/images/upload', { image: b64, format: 'mp4', ch_name: 'minimap', filename: name }],
      ['/api/files/upload', { name: name + '.mp4', data: b64 }],
    ];
    for (const [ep, body] of attempts) {
      try {
        const r = await fetch(ep, { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify(body) });
        if (r.ok) { const j = await r.json(); if (j?.path) return '/' + String(j.path).replace(/^\/+/, ''); }
      } catch { /* 다음 방법 */ }
    }
    return null;
  }

  function cancelVideo() {
    if (!vidState.busy) return;
    if (!confirm('영상 생성을 취소할까요?\n이미 Google에 요청이 들어갔다면 서버에서는 계속 진행돼 요금이 나올 수 있어요. (이 확장은 결과를 받지 않고 기다리기만 멈춰요)')) return;
    vidState.cancelled = true; vidState.abort?.abort();
  }

  async function makeVideo(imageUrl) {
    const s = S();
    if (!imageUrl) { toastr.info('영상으로 만들 이미지가 없어요.'); return; }
    if (vidState.busy) { toastr.info('이미 영상을 만드는 중이에요.'); return; }
    const resolution = s.videoRes, sec = resolution === '1080p' ? 8 : (+s.videoSeconds || 4);
    const est = (sec * veoRate(s.videoModel, resolution)).toFixed(2);
    if (!confirm(`이 장면을 ${sec}초 영상으로 만들까요?\n모델: ${s.videoModel}\n예상 요금: 약 $${est} (소리 포함이면 더 들 수 있고 요금은 달라질 수 있어요)\n생성에 수십 초~몇 분 걸려요.`)) return;
    const entry = W().gallery.find((g) => g.url === imageUrl), place = placeById(entry?.placeId) || curPlace();
    vidState.busy = true; vidState.cancelled = false; vidState.started = false; vidState.abort = new AbortController();
    vidState.t0 = Date.now(); vidState.timer = setInterval(renderScene, 1000); renderScene();
    try {
      const blob = await veoGenerate(imageUrl, videoPrompt(place, entry?.moment), sec, resolution, vidState.abort.signal, () => { vidState.started = true; });
      logUsage({ kind: '영상 생성', label: place?.name || '', model: s.videoModel, sec, resolution, cost: +est });
      const url = await saveVideo(blob), w = W();
      const vurl = url || URL.createObjectURL(blob);
      if (!url) toastr.warning('서버에 영상 저장이 안 돼서 이번 세션에서만 볼 수 있어요. 내려받기 버튼으로 저장해 두세요.');
      w.gallery.push({ id: uid(), kind: 'video', url: vurl, src: imageUrl, placeId: place?.id || entry?.placeId || '', name: place?.name || entry?.name || '', t: Date.now(), moment: entry?.moment || '', mem: !url });
      if (url) w.videos[imageUrl] = url;
      saveMeta(); viewing = w.gallery.length - 1;
      toastr.success('영상이 만들어졌어요. 장면 창의 < > 로 원본 이미지와 오갈 수 있어요.');
    } catch (e) {
      if (vidState.cancelled || e?.name === 'AbortError') {
        toastr.info(vidState.started ? '영상 생성을 취소했어요. 이미 시작된 작업은 Google 쪽에서 끝까지 진행돼 요금이 나올 수 있어요.' : '영상 생성을 취소했어요.');
        if (vidState.started) logUsage({ kind: '영상 생성(취소)', label: place?.name || '', model: s.videoModel, sec, resolution, cost: +est });
      } else toastr.error('영상 생성 실패: ' + (e.message || e));
    } finally { vidState.busy = false; vidState.abort = null; clearInterval(vidState.timer); renderScene(); renderGallery(); }
  }

  /* ---------- 이미지 기록 / 삭제 ---------- */
  async function deleteFile(url) {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
    const path = decodeURI(url).replace(/^\/+/, '');
    for (const ep of ['/api/images/delete', '/api/files/delete']) {
      try {
        const r = await fetch(ep, { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path }) });
        if (r.ok) return true;
      } catch { /* 다음 엔드포인트 시도 */ }
    }
    return false;
  }
  async function removeImages(urls, files = true) {
    const w = W(), set = new Set(urls);
    for (const u of set) {
      if (String(u).startsWith('blob:')) { try { URL.revokeObjectURL(u); } catch { /* ignore */ } }
      for (const k of Object.keys(w.videos)) if (w.videos[k] === u || k === u) delete w.videos[k];   // 연결만 해제 (이미지와 영상은 별개 항목)
    }
    w.gallery = w.gallery.filter((g) => !set.has(g.url));
    for (const k of Object.keys(w.scenes)) if (set.has(w.scenes[k])) delete w.scenes[k];
    for (const k of Object.keys(w.maps)) if (set.has(w.maps[k]?.url)) delete w.maps[k];
    if (set.has(w.anchor)) w.anchor = null;
    if (set.has(sceneState.url)) sceneState.url = null;
    viewing = null;
    let ok = 0;
    if (files) for (const u of set) if (await deleteFile(u)) ok++;
    saveMeta(); render(); renderScene(); renderGallery(); renderEditor();
    return ok;
  }
  async function removeVideoEntry(id) {
    const e = W().gallery.find((g) => g.id === id);
    if (!e) return;
    const src = e.src;
    await removeImages([e.url]);
    const i = W().gallery.findIndex((g) => g.url === src);
    viewing = i >= 0 ? i : null;      // 영상만 지우고 원본 이미지로 돌아감
    renderScene();
  }
  async function pruneImages() {
    const keep = +S().maxKeep || 0, w = W();
    if (keep < 1 || w.gallery.length <= keep) return;
    const protectedUrl = new Set([w.anchor, sceneState.url].filter(Boolean));
    const victims = w.gallery.filter((g) => !protectedUrl.has(g.url)).slice(0, w.gallery.length - keep).map((g) => g.url);
    if (!victims.length) return;
    await removeImages(victims);
    toastr.info(`오래된 장면 이미지 ${victims.length}장을 정리했어요.`);
  }

  function shownEntry() { return viewing != null ? W().gallery[viewing] || null : null; }
  function stepGallery(dir) {
    const g = W().gallery;
    if (!g.length) { toastr.info('아직 만든 이미지가 없어요.'); return; }
    let base = viewing ?? g.findIndex((x) => x.url === sceneState.url);
    if (base < 0) base = dir < 0 ? g.length : -1;
    const n = base + dir;
    viewing = n >= g.length ? null : clamp(n, 0, g.length - 1);
    renderScene();
  }

  /* ---------- 둘러보기 (드래그/휠 줌) ---------- */
  const shownMedia = (el) => { const vid = el.querySelector('.mm-scene-vid'); return vid.style.display !== 'none' && vid.videoWidth ? vid : el.querySelector('.mm-scene-img'); };
  function layoutImg() {
    const el = document.getElementById('mm-scene'); if (!el) return;
    const view = el.querySelector('.mm-scene-view'), img = el.querySelector('.mm-scene-img'), vid = el.querySelector('.mm-scene-vid');
    const vw = view.clientWidth, vh = view.clientHeight;
    if (!vw) return;
    const m = shownMedia(el), nw = m.videoWidth || m.naturalWidth, nh = m.videoHeight || m.naturalHeight;
    if (!nw) return;
    const sc = Math.max(vw / nw, vh / nh) * pan.z, Wd = nw * sc, Hd = nh * sc;
    pan.cx = clamp(pan.cx, vw / 2 / Wd, 1 - vw / 2 / Wd);
    pan.cy = clamp(pan.cy, vh / 2 / Hd, 1 - vh / 2 / Hd);
    for (const [node, w0, h0] of [[img, img.naturalWidth, img.naturalHeight], [vid, vid.videoWidth, vid.videoHeight]]) {   // 이미지와 영상을 같은 시점으로 맞춤
      if (!w0) continue;
      const k = Math.max(vw / w0, vh / h0) * pan.z, W2 = w0 * k, H2 = h0 * k;
      Object.assign(node.style, { width: W2 + 'px', height: H2 + 'px', left: vw / 2 - pan.cx * W2 + 'px', top: vh / 2 - pan.cy * H2 + 'px' });
    }
  }
  function bindLook(el) {
    const view = el.querySelector('.mm-scene-view'), img = el.querySelector('.mm-scene-img'), vid = el.querySelector('.mm-scene-vid');
    img.addEventListener('load', layoutImg);
    vid.addEventListener('loadedmetadata', layoutImg);
    new ResizeObserver(() => { layoutImg(); clampDock(); }).observe(view);
    view.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('#mm-root,button,.mm-hud-title,.mm-hud-quests')) return;
      e.preventDefault(); view.classList.add('mm-grab');
      const sx = e.clientX, sy = e.clientY;
      let lx = sx, ly = sy, moved = false;
      const move = (ev) => {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 5) moved = true;
        const mm = shownMedia(el), Wd = parseFloat(mm.style.width) || 1, Hd = parseFloat(mm.style.height) || 1;
        pan.cx -= (ev.clientX - lx) / Wd; pan.cy -= (ev.clientY - ly) / Hd;
        lx = ev.clientX; ly = ev.clientY; layoutImg();
      };
      const up = () => {
        view.classList.remove('mm-grab'); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
        if (!moved && vid.style.display !== 'none' && vid.getAttribute('src')) {   // 클릭: 영상 재생/정지
          if (vid.paused) { try { vid.play()?.catch(() => {}); } catch { /* 무시 */ } } else vid.pause();
        }
      };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });
    view.addEventListener('wheel', (e) => {
      if (e.target.closest('#mm-root')) return;
      e.preventDefault();
      pan.z = clamp(pan.z * Math.exp(-e.deltaY * 0.0015), 1, 3); layoutImg();
    }, { passive: false });
    view.addEventListener('dblclick', (e) => { if (e.target.closest('#mm-root,button')) return; Object.assign(pan, { z: 1, cx: 0.5, cy: 0.5 }); layoutImg(); });
  }

  async function showScene(place, force = false) {
    const s = S();
    if (!place) return;
    const key = place.id + '|' + styleKey(), cached = W().scenes[key];
    viewing = null;
    sceneState = { placeId: place.id, url: cached || null, status: '' };
    renderScene();
    if (!s.sceneOn) return;
    if (cached && !force && !s.regenOnVisit) return;
    if (!s.autoGen && !force) return; // 자동 생성이 꺼져 있으면 버튼으로만
    await generateScene(place, key);
  }

  /* ---------- 장면 창 탭 (설정 대부분을 여기로 옮김) ---------- */
  const TABS = [['scene', 'fa-image', '장면'], ['places', 'fa-map-location-dot', '장소·지도'], ['markers', 'fa-location-dot', '마커'], ['look', 'fa-user-pen', '외형'], ['gallery', 'fa-images', '이미지'], ['opts', 'fa-sliders', '옵션'], ['log', 'fa-receipt', '기록']];
  let activeTab = 'scene';
  function setTab(id) {
    const el = document.getElementById('mm-scene'); if (!el) return;
    activeTab = id;
    el.classList.toggle('mm-tabmode', id !== 'scene');
    el.querySelectorAll('.mm-tab').forEach((b) => { b.classList.toggle('on', b.dataset.tab === id); b.setAttribute('aria-selected', b.dataset.tab === id); });
    el.querySelectorAll('.mm-panel').forEach((p) => { p.hidden = p.dataset.tab !== id; });
    if (id === 'places') renderEditor(); if (id === 'gallery') renderGallery(); if (id === 'look') renderAppearance(); if (id === 'log') renderLog();
    renderScene();
  }
  function mountTabs() {
    const el = document.getElementById('mm-scene'); if (!el || el.dataset.tabs) return;
    const strip = el.querySelector('.mm-tabs'), panels = el.querySelector('.mm-panels');
    strip.innerHTML = TABS.map(([id, ic, nm]) => `<button class="mm-tab ${id === 'scene' ? 'on' : ''}" data-tab="${id}" role="tab" aria-selected="${id === 'scene'}"><i class="fa-solid ${ic}"></i> ${nm}</button>`).join('');
    for (const [id] of TABS.slice(1)) {
      const panel = document.createElement('div'); panel.className = 'mm-panel'; panel.dataset.tab = id; panel.hidden = true;
      document.querySelectorAll(`.mm-sec[data-sec="${id}"]`).forEach((sec) => panel.appendChild(sec));
      panels.appendChild(panel);
    }
    strip.addEventListener('click', (e) => { const b = e.target.closest('.mm-tab'); if (b) setTab(b.dataset.tab); });
    el.dataset.tabs = '1';
    fixButtons();
    new MutationObserver(() => fixButtons()).observe(panels, { childList: true, subtree: true });
  }

  function createScene() {
    if (document.getElementById('mm-scene')) return;
    const el = document.createElement('div');
    el.id = 'mm-scene';
    el.innerHTML = `
      <div class="mm-scene-bar">
        <button class="mm-s-prev" title="이전 이미지" aria-label="이전 이미지"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="mm-s-next" title="다음 이미지" aria-label="다음 이미지"><i class="fa-solid fa-chevron-right"></i></button>
        <span class="mm-s-count"></span><span class="mm-scene-title">-</span>
        <button class="mm-s-del" title="지금 보는 이미지 삭제" aria-label="이미지 삭제"><i class="fa-solid fa-trash"></i></button>
        <button class="mm-s-pin" title="이 이미지를 기준(캐릭터·화풍)으로 고정" aria-label="기준 이미지로 고정"><i class="fa-solid fa-thumbtack"></i></button>
        <button class="mm-s-vid" title="영상으로 만들기 (Veo) / 영상·이미지 전환" aria-label="영상"><i class="fa-solid fa-film"></i></button>
        <button class="mm-s-vidre" title="영상 다시 만들기" aria-label="영상 다시 만들기"><i class="fa-solid fa-clapperboard"></i></button>
        <button class="mm-s-mute" title="소리 켜기/끄기" aria-label="소리"><i class="fa-solid fa-volume-xmark"></i></button>
        <button class="mm-s-dl" title="영상 내려받기" aria-label="영상 내려받기"><i class="fa-solid fa-download"></i></button>
        <button class="mm-s-regen" title="이 장소 이미지 다시 생성" aria-label="다시 생성"><i class="fa-solid fa-rotate"></i></button>
        <button class="mm-s-big" title="크게/작게" aria-label="크게/작게"><i class="fa-solid fa-expand"></i></button>
        <button class="mm-s-bg" title="채팅 배경으로 표시" aria-label="배경으로 표시"><i class="fa-regular fa-image"></i></button>
        <button class="mm-s-close" title="닫기" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="mm-tabs" role="tablist"></div><div class="mm-panels"></div>
      <div class="mm-scene-view"><img class="mm-scene-img" alt="" draggable="false"><video class="mm-scene-vid" loop muted playsinline draggable="false"></video><div class="mm-vid-status"><span class="mm-vid-t"></span><button class="mm-vid-cancel" title="영상 생성 취소" aria-label="영상 생성 취소">취소</button></div>
        <div class="mm-scene-empty"><span class="mm-scene-msg"></span><button class="menu_button mm-s-gen">장면 이미지 생성</button></div>
        <div class="mm-anchor-badge"><i class="fa-solid fa-thumbtack"></i> 기준 이미지</div>
        <div class="mm-hud-quests"></div>
        <div class="mm-hud-title"><b></b><small></small></div>
        <div class="mm-scene-dock"></div></div>
      <div class="mm-scene-resize" title="크기 조절"></div>`;
    document.body.appendChild(el);
    dragger(el.querySelector('.mm-scene-bar'), el, (x, y) => { S().sceneX = x; S().sceneY = y; saveSettings(); });
    el.querySelector('.mm-scene-resize').addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sw = el.offsetWidth;
      const move = (ev) => { S().sceneW = clamp(sw + ev.clientX - sx, 280, 1400); el.style.width = S().sceneW + 'px'; };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); saveSettings(); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });
    bindLook(el);
    el.querySelector('.mm-s-prev').addEventListener('click', () => stepGallery(-1));
    el.querySelector('.mm-s-next').addEventListener('click', () => stepGallery(1));
    el.querySelector('.mm-s-del').addEventListener('click', async () => {
      const e = shownEntry();
      if (e?.kind === 'video') {
        if (!confirm('이 영상을 삭제할까요? 원본 이미지는 그대로 남아요. (서버 파일도 함께 삭제돼요)')) return;
        await removeVideoEntry(e.id); return;
      }
      const url = e?.url || sceneState.url;
      if (!url) { toastr.info('삭제할 이미지가 없어요.'); return; }
      if (!confirm('지금 보는 이미지를 삭제할까요? 이 이미지로 만든 영상은 그대로 남아요. (서버 파일도 함께 삭제돼요)')) return;
      await removeImages([url]);
    });
    const curImg = () => { const e = shownEntry(); return e ? (e.kind === 'video' ? e.src : e.url) : sceneState.url; };
    el.querySelector('.mm-s-vid').addEventListener('click', () => {
      const e = shownEntry();
      if (e?.kind === 'video') {                                  // 영상 → 원본 이미지로 이동
        const i = W().gallery.findIndex((x) => x.url === e.src);
        if (i >= 0) { viewing = i; renderScene(); } else toastr.info('원본 이미지는 삭제돼서 이동할 수 없어요.');
        return;
      }
      const url = curImg();
      if (!url) return;
      const ve = videoEntryFor(url);
      if (ve) { viewing = W().gallery.indexOf(ve); renderScene(); } else makeVideo(url);
    });
    el.querySelector('.mm-s-vidre').addEventListener('click', () => { const u = curImg(); if (u) makeVideo(u); else toastr.info('원본 이미지가 없어 다시 만들 수 없어요.'); });
    el.querySelector('.mm-s-mute').addEventListener('click', () => {
      const v = el.querySelector('.mm-scene-vid'); v.muted = !v.muted; renderScene();
    });
    el.querySelector('.mm-s-dl').addEventListener('click', () => {
      const e = shownEntry(); if (e?.kind !== 'video') return;
      const a = document.createElement('a'); a.href = e.url; a.download = 'scene_video.mp4'; document.body.appendChild(a); a.click(); a.remove();
    });
    el.querySelector('.mm-vid-cancel').addEventListener('click', (e) => { e.stopPropagation(); cancelVideo(); });
    const regen = () => { const p = curPlace(); if (p) showScene(p, true); else toastr.info('감지된 장소가 없어요.'); };
    el.querySelector('.mm-s-regen').addEventListener('click', regen);
    el.querySelector('.mm-s-gen').addEventListener('click', regen);
    el.querySelector('.mm-s-pin').addEventListener('click', () => {
      const url = shownEntry()?.url || sceneState.url;
      if (!url || url.startsWith('data:')) { toastr.info('서버에 저장된 이미지만 기준으로 고정할 수 있어요.'); return; }
      if (W().anchor === url) {
        if (!confirm('기준 이미지(화풍·캐릭터 고정)를 해제할까요?')) return;
        W().anchor = null; saveMeta(); toastr.success('기준 이미지를 해제했어요.');
      } else { W().anchor = url; saveMeta(); toastr.success('이 이미지를 기준 이미지로 고정했어요.'); }
      renderScene(); renderGallery();
    });
    el.querySelector('.mm-s-big').addEventListener('click', () => {
      S().sceneW = S().sceneW >= 900 ? 520 : Math.min(1200, window.innerWidth - 24);
      if (S().sceneW >= 900) { S().sceneX = 8; S().sceneY = 8; }
      saveSettings(); renderScene();
    });
    el.querySelector('.mm-s-bg').addEventListener('click', () => { S().bgMode = !S().bgMode; saveSettings(); renderScene(); $('[data-key="bgMode"]').prop('checked', S().bgMode); });
    el.querySelector('.mm-s-close').addEventListener('click', () => { S().sceneOn = false; saveSettings(); renderScene(); render(); $('[data-key="sceneOn"]').prop('checked', false); });
  }

  function renderScene() {
    const el = document.getElementById('mm-scene');
    if (!el) return;
    const s = S(), show = s.sceneOn;
    el.classList.toggle('mm-hidden', !show);
    el.style.width = Math.min(s.sceneW, window.innerWidth - 16) + 'px';
    el.style.left = clamp(s.sceneX ?? 24, 0, Math.max(0, window.innerWidth - 60)) + 'px';
    el.style.top = clamp(s.sceneY ?? 70, 0, Math.max(0, window.innerHeight - 40)) + 'px';
    const cur = curPlace(), busy = sceneState.status === 'busy', par = cur?.parent ? placeById(cur.parent) : null;
    const ent = shownEntry(), g = W().gallery, isVid = ent?.kind === 'video';
    const shownUrl = isVid ? (ent.src || null) : (ent ? ent.url : sceneState.url);    // 보여줄 정지 이미지
    const vurl = isVid ? ent.url : null, useVid = !!vurl, vbusy = vidState.busy, has = !!(shownUrl || vurl);
    el.classList.toggle('mm-viewing', !!ent);
    const stamp = ent?.t ? ' · ' + new Date(ent.t).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    el.querySelector('.mm-scene-title').textContent = ent ? `${isVid ? '영상 · ' : ''}${ent.name || '이미지'}${stamp}` : (cur ? cur.name : '장면');
    el.querySelector('.mm-s-count').textContent = ent ? `${viewing + 1}/${g.length}` : (g.length ? `${g.length}` : '');
    el.querySelector('.mm-s-prev').disabled = !g.length || viewing === 0;
    const ttl = el.querySelector('.mm-hud-title');
    ttl.style.display = s.showTitle && cur ? '' : 'none';
    el.querySelector('.mm-hud-title b').textContent = cur ? cur.name : '';
    el.querySelector('.mm-hud-title small').textContent = par ? par.name : '';
    let quests = W().markers.filter((m) => m.type === 'quest');
    if (s.questHud === 'here') quests = quests.filter((m) => m.place === cur?.id);
    el.querySelector('.mm-hud-quests').innerHTML = s.questHud !== 'off' && !ent ? quests.slice(0, 4).map((q) => `<div data-id="${q.id}"><i class="fa-solid fa-exclamation"></i>${esc(q.name)}<button class="mm-q-x" title="완료/숨기기" aria-label="퀘스트 완료">×</button></div>`).join('') : '';
    const img = el.querySelector('.mm-scene-img'), vid = el.querySelector('.mm-scene-vid');
    img.style.display = shownUrl ? 'block' : 'none';
    vid.style.display = useVid ? 'block' : 'none';
    if (shownUrl && img.getAttribute('src') !== shownUrl) { Object.assign(pan, { z: 1, cx: 0.5, cy: 0.5 }); img.src = shownUrl; }
    if (useVid) {
      if (vid.getAttribute('src') !== vurl) { Object.assign(pan, { z: 1, cx: 0.5, cy: 0.5 }); vid.src = vurl; try { vid.play()?.catch(() => {}); } catch { /* 자동재생 거부 */ } }
    } else if (vid.getAttribute('src')) { try { vid.pause(); } catch { /* ignore */ } vid.removeAttribute('src'); }
    layoutImg();
    const btn = (c) => el.querySelector(c);
    const hasVidFor = !isVid && !!shownUrl && !!videoEntryFor(shownUrl);
    btn('.mm-s-vid').style.display = has ? '' : 'none';
    btn('.mm-s-vid').disabled = vbusy;
    btn('.mm-s-vid i').className = 'fa-solid ' + (isVid ? 'fa-image' : 'fa-film');
    btn('.mm-s-vid').title = isVid ? '원본 이미지로 이동' : (hasVidFor ? '이 이미지로 만든 영상으로 이동' : '영상으로 만들기 (Veo)');
    const isAnchor = !isVid && !!shownUrl && shownUrl === W().anchor;
    btn('.mm-s-pin').style.display = isVid ? 'none' : '';
    btn('.mm-s-pin').classList.toggle('on', isAnchor);
    btn('.mm-s-pin').title = isAnchor ? '기준 이미지예요 — 클릭하면 고정 해제' : '이 이미지를 기준(캐릭터·화풍)으로 고정';
    btn('.mm-anchor-badge').style.display = isAnchor ? '' : 'none';

    btn('.mm-s-vidre').style.display = (isVid || hasVidFor) ? '' : 'none'; btn('.mm-s-vidre').disabled = vbusy;
    btn('.mm-s-mute').style.display = useVid ? '' : 'none';
    btn('.mm-s-mute i').className = 'fa-solid ' + (vid.muted ? 'fa-volume-xmark' : 'fa-volume-high');
    btn('.mm-s-dl').style.display = useVid ? '' : 'none';
    const st = btn('.mm-vid-status'), secs = Math.floor((Date.now() - vidState.t0) / 1000);
    st.classList.toggle('on', vbusy);
    st.querySelector('.mm-vid-t').textContent = vbusy ? `영상 생성 중 ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : '';
    const empty = el.querySelector('.mm-scene-empty');
    empty.style.display = has && !busy ? 'none' : 'flex';
    empty.classList.toggle('mm-over', has);
    el.querySelector('.mm-scene-msg').textContent = busy ? '이미지 생성 중… (수십 초 걸릴 수 있어요)' : (cur ? '' : '장소가 감지되면 이미지를 만들 수 있어요');
    el.querySelector('.mm-s-gen').style.display = busy || !cur || ent ? 'none' : '';
    el.querySelector('.mm-s-regen').disabled = busy;
    el.querySelector('.mm-s-del').style.display = has ? '' : 'none';

    let bg = document.getElementById('mm-bgfx');
    if (!bg) { bg = document.createElement('div'); bg.id = 'mm-bgfx'; document.body.prepend(bg); }
    bg.style.backgroundImage = s.bgMode && shownUrl && show ? `url("${shownUrl}")` : 'none';
    if (show) placeMinimap(document.getElementById('mm-root'));
  }

  /* ---------- AI 태그 ---------- */
  function updatePrompt() {
    const c = ctx();
    if (!c.setExtensionPrompt) return;
    const s = S(), places = W().places;
    let v = '';
    if ((s.enabled || s.sceneOn) && s.injectPrompt && places.length) {
      v = `[Minimap: At the very end of every reply, append the current location of the scene as a tag in exactly this format: [LOC:name]. Use only a name from this list: ${places.map((p) => p.name).join(', ')}.]`;
    }
    c.setExtensionPrompt(MODULE, v, 1, 0);
  }
  let stripTimer = null;
  function stripTags() {
    if (!S().hideTag) return;
    clearTimeout(stripTimer);
    stripTimer = setTimeout(() => {
      document.querySelectorAll('#chat .mes_text').forEach((el) => {
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) if (n.nodeValue.includes('[LOC:')) n.nodeValue = n.nodeValue.replace(/\s*\[LOC:[^\]]*\]/gi, '');
      });
    }, 50);
  }

  /* ---------- 설정 UI ---------- */
  function renderEditor() {
    const box = document.querySelector('#mm_edit_map');
    if (!box) return;
    const places = W().places;
    const scopes = places.filter((p) => childrenOf(p.id).length);
    if (editScope !== 'world' && !scopes.some((p) => p.id === editScope)) editScope = 'world';

    const sel = document.querySelector('#mm_scope');
    sel.innerHTML = `<option value="world">세계 지도</option>` + scopes.map((p) => `<option value="${p.id}" ${p.id === editScope ? 'selected' : ''}>${esc(p.name)} 내부 지도 (${childrenOf(p.id).length})</option>`).join('');
    sel.value = editScope;

    const map = mapOf(editScope);
    box.style.setProperty('--mm-ratio', map?.ratio || 1);
    box.querySelector('.mm-stage').innerHTML = (map ? `<img class="mm-img" src="${map.url}" alt="">` : '') + stageHTML(editScope, { editor: true }).replace(/^<img[^>]*>/, '');
    document.querySelector('#mm_map_state').textContent = map ? (map.user ? '직접 올린 지도' : (map.sig !== mapSig(editScope) ? '생성된 지도 (배치가 바뀌었어요 → 다시 생성 권장)' : '생성된 지도 (최신)')) : '지도 이미지 없음 (격자 표시)';
    document.querySelector('#mm_map_gen').classList.toggle('disabled', mapBusy);

    const kindOpts = (cur) => Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v[2]}</option>`).join('');
    const ordered = [];
    places.filter((p) => !p.parent || !placeById(p.parent)).forEach((p) => { ordered.push(p); places.filter((c) => c.parent === p.id).forEach((c) => ordered.push(c)); });
    document.querySelector('#mm_place_list').innerHTML = ordered.map((p) => {
      const hasKids = childrenOf(p.id).length > 0;
      const parentOpts = places.filter((q) => q.id !== p.id && !q.parent && !isDesc(p.id, q)).map((q) => `<option value="${q.id}" ${q.id === p.parent ? 'selected' : ''}>${esc(q.name)} 안</option>`).join('');
      return `
      <div class="mm-place ${p.id === editingId ? 'mm-active' : ''} ${p.parent ? 'mm-child' : ''}" data-id="${p.id}">
        <div class="mm-place-row">
          <div class="menu_button menu_button_icon mm-pick" title="선택 후 지도 클릭/드래그로 위치 지정"><i class="fa-solid ${KINDS[kindOf(p)][0]}" style="color:${KINDS[kindOf(p)][1]}"></i></div>
          <input type="text" class="text_pole mm-name" placeholder="장소 이름" value="${esc(p.name)}">
          <span class="mm-coord ${hasXY(p) ? '' : 'mm-warn'}">${hasXY(p) ? `${p.x}, ${p.y}` : '좌표 없음'}</span>
          <div class="menu_button menu_button_icon mm-del" title="삭제"><i class="fa-solid fa-trash"></i></div>
        </div>
        <div class="mm-place-sub">
          <select class="text_pole mm-parent" ${hasKids ? 'disabled title="내부 장소가 있는 장소는 다른 장소 안으로 옮길 수 없어요"' : 'title="이 장소가 속한 건물/장소 (옮기기)"'}><option value="">세계 지도에 표시</option>${parentOpts}</select>
          <input type="text" class="text_pole mm-alias" placeholder="별칭 (쉼표로 구분)" value="${esc((p.aliases || []).join(', '))}">
        </div>
        <details><summary>상세 (종류·설명·이미지 묘사)</summary>
          <div class="mm-set-row"><span>종류</span><select class="text_pole mm-kind">${kindOpts(kindOf(p))}</select></div>
          <textarea class="text_pole mm-desc" rows="2" placeholder="설명">${esc(p.desc || '')}</textarea>
          <textarea class="text_pole mm-visual" rows="2" placeholder="이미지 생성용 묘사 (영어 권장)">${esc(p.visual || '')}</textarea>
        </details>
      </div>`;
    }).join('') || '<div class="mm-hint">등록된 장소가 없어요. 위의 자동 분석을 실행해 보세요.</div>';
    $('#mm_look').val(W().look || '');
  }

  function renderMarkerList() {
    const box = document.querySelector('#mm_marker_list');
    if (!box) return;
    const w = W();
    box.innerHTML = w.markers.map((m) => `
      <div class="mm-mk-row" data-id="${m.id}">
        <select class="text_pole mm-mk-type">${Object.entries(MARKERS).map(([k, v]) => `<option value="${k}" ${k === m.type ? 'selected' : ''}>${v[2]}</option>`).join('')}</select>
        <input type="text" class="text_pole mm-mk-name" value="${esc(m.name)}" placeholder="이름">
        <select class="text_pole mm-mk-place">${w.places.map((p) => `<option value="${p.id}" ${p.id === m.place ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
        <div class="menu_button menu_button_icon mm-mk-del" title="삭제"><i class="fa-solid fa-trash"></i></div>
      </div>`).join('') || '<div class="mm-hint">마커가 없어요. 자동 분석이나 추적으로 채워지고, 직접 추가할 수도 있어요.</div>';
  }

  function appearanceKeys() { return [personaKey(), ...castList().map((ch) => ch.name)]; }
  function renderAppearance() {
    const box = document.querySelector('#mm_appearance');
    if (!box) return;
    const app = S().appearance, cur = appearanceKeys(), pk = personaKey();
    ensurePersonaKey(pk);
    const urlsFor = (k) => {
      if (k === pk) return personaThumbs();
      const ch = castList().find((x) => x.name === k) || (ctx().characters || []).find((x) => x.name === k);
      return ch ? charThumbs(ch) : (app[k]?.av ? app[k].av.split('|') : []);
    };
    const who = (k) => {
      const u = urlsFor(k); if (u.length && app[k]) app[k].av = u.join('|');
      const kind = k.startsWith('나: ') ? '페르소나' : '캐릭터';
      return `<span class="mm-app-who">${u.length ? `<img class="mm-app-av" src="${esc(u[0])}" data-alt="${esc(u.slice(1).join('|'))}" alt="" loading="lazy">` : '<i class="fa-solid fa-user mm-app-av"></i>'}<span>${esc(labelOf(k).replace(/^나: /, ''))}</span><small>${kind}</small></span>`;
    };
    const others = Object.keys(app).filter((k) => !cur.includes(k));
    let h = cur.map((k) => app[k]
      ? `<div class="mm-app" data-k="${esc(k)}"><div class="mm-app-h">${who(k)}<div class="menu_button menu_button_icon mm-app-del" title="이 외형 삭제 (다음에 다시 추출)"><i class="fa-solid fa-trash"></i></div></div><textarea class="text_pole" rows="2">${esc(app[k].t)}</textarea></div>`
      : `<div class="mm-app-empty">${who(k)} — 아직 추출 전</div>`).join('');
    if (others.length) {
      h += `<details class="mm-app-other"><summary>다른 캐릭터·페르소나 외형 ${others.length}개 (관리)</summary>${others.map((k) => `<div class="mm-app-oth" data-k="${esc(k)}">${who(k)}<div class="menu_button menu_button_icon mm-app-del" title="삭제"><i class="fa-solid fa-trash"></i></div></div>`).join('')}<div class="menu_button" id="mm_app_purge">위 목록 전부 삭제</div></details>`;
    }
    box.innerHTML = h;
  }
  async function extractCurrentAppearance() {
    const c = ctx();
    try {
      for (const ch of castList()) await appearanceOf(ch.name, [ch.description, ch.personality].filter(Boolean).join('\n'));
      if (!S().playerLook.trim()) await appearanceOf(personaKey(), c.powerUserSettings?.persona_description);
      toastr.success('외형을 추출했어요.');
    } catch (e) { toastr.error('외형 추출 실패: ' + (e.message || e)); }
  }

  /* ---------- 이미지 관리 (설정창) ---------- */
  function renderGallery() {
    const box = document.querySelector('#mm_gallery');
    if (!box) return;
    const w = W();
    renderAnchorBox();
    const items = [...w.gallery].map((g, i) => ({ url: g.url, idx: i, label: g.name || '장면', t: g.t, kind: g.kind === 'video' ? '영상' : '장면', video: g.kind === 'video' })).reverse();
    for (const [scope, m] of Object.entries(w.maps)) if (m?.url) items.push({ url: m.url, idx: -1, label: scopeName(scope), t: 0, kind: '지도', video: false });
    box.innerHTML = items.map((it) => {
      const anchor = !it.video && it.url === w.anchor, hasV = !it.video && it.idx >= 0 && !!videoEntryFor(it.url);
      const thumb = it.video ? `<video preload="metadata" muted playsinline src="${esc(it.url)}#t=0.1"></video>` : `<img loading="lazy" src="${esc(it.url)}" alt="">`;
      const when = it.t ? `<br>${new Date(it.t).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '';
      return `<label class="mm-g-item ${anchor ? 'mm-g-anchor' : ''} ${it.video ? 'mm-g-video' : ''}" data-url="${esc(it.url)}" data-idx="${it.idx}"><input type="checkbox">${thumb}<span><b>${esc(it.kind)}</b>${anchor ? ' <i class="fa-solid fa-thumbtack" title="기준 이미지"></i> 기준' : ''}${hasV ? ' <i class="fa-solid fa-film" title="영상 있음"></i>' : ''} ${esc(it.label)}${when}</span></label>`;
    }).join('') || '<div class="mm-hint">이 채팅에서 만든 이미지가 없어요.</div>';
    const nImg = w.gallery.filter((g) => g.kind !== 'video').length, nVid = w.gallery.length - nImg;
    const info = document.querySelector('#mm_g_info');
    if (info) info.textContent = items.length ? `장면 ${nImg}장 · 영상 ${nVid}개 · 지도 ${items.length - w.gallery.length}장` : '';
  }
  const galleryChecked = () => [...document.querySelectorAll('#mm_gallery .mm-g-item')].filter((l) => l.querySelector('input').checked).map((l) => l.dataset.url);

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, 1200 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          resolve({ data: cv.toDataURL('image/jpeg', 0.85), ratio: cv.width / cv.height });
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  async function importLore() {
    const s = S(), names = await loreNames();
    if (!names.length) { toastr.warning('활성화된 로어북이 없어요.'); return; }
    const words = s.loreFilter.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const prefix = words.length ? new RegExp(`^(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*[:：\\-–]\\s*`, 'i') : null;
    const list = [];
    for (const name of names) {
      try {
        const book = await loadBook(name);
        for (const e of Object.values(book.entries || {})) {
          if (e.disable) continue;
          const comment = (e.comment || '').trim(), keys = (e.key || []).map((k) => k.trim()).filter(Boolean);
          if (words.length && !words.some((w) => comment.toLowerCase().includes(w))) continue;
          const pname = (prefix ? comment.replace(prefix, '') : comment) || keys[0];
          if (pname) list.push({ name: pname, aliases: keys.filter((k) => k !== pname), desc: (e.content || '').slice(0, 120) });
        }
      } catch { toastr.error(`"${name}" 불러오기 실패`); }
    }
    const n = mergePlaces(list); autoLayout(); saveMeta(); renderEditor(); render(); updatePrompt();
    toastr.success(`${n}개 장소를 가져왔어요.`);
  }

  /* ---------- 화풍 프리셋 / 투명도 / 기준 이미지 ---------- */
  const presetText = (id) => (id === 'custom' ? (S().customText || '') : (S().stylePresets.find((x) => x.id === id)?.text ?? null));
  function migrateStyle() {
    const s = S();
    if (!s._m36) { s.anchorAuto = false; s._m36 = true; }
    if (s.stylePreset === 'custom' && !s.customText) s.customText = s.styleText;
    if (presetText(s.stylePreset) === null) {            // 삭제됐거나 예전 버전의 기본 프리셋 ID
      if (s.styleText && !s.stylePresets.some((x) => x.text === s.styleText)) { const id = uid(); s.stylePresets.push({ id, name: '이전 프롬프트', text: s.styleText }); s.stylePreset = id; }
      else s.stylePreset = 'custom';
    }
    saveSettings();
  }
  function renderStylePresets() {
    const s = S(), sel = document.querySelector('#mm_style_sel');
    if (!sel) return;
    sel.innerHTML = '<option value="custom">직접 입력</option>' + s.stylePresets.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('');
    sel.value = presetText(s.stylePreset) !== null ? s.stylePreset : 'custom';
    const cur = s.stylePresets.find((x) => x.id === sel.value);
    $('#mm_style_name').val(cur ? cur.name : '');
    $('#mm_style_del').toggleClass('disabled', !cur);
  }
  function renderAnchorBox() {
    const box = document.querySelector('#mm_anchor_box');
    if (!box) return;
    const w = W(), g = w.gallery.find((x) => x.url === w.anchor);
    box.innerHTML = w.anchor
      ? `<img src="${esc(w.anchor)}" alt=""><div class="mm-anchor-info"><b><i class="fa-solid fa-thumbtack"></i> 고정된 기준 이미지</b><br>${esc(g?.name || '장면')}${g?.t ? ' · ' + new Date(g.t).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}<div class="mm-set-row"><div class="menu_button" id="mm_anchor_view">보기</div><div class="menu_button" id="mm_anchor_clear">고정 해제</div></div></div>`
      : '<div class="mm-hint">고정된 기준 이미지가 없어요. 장면 창의 핀 버튼이나 아래 "선택한 1장을 기준으로 고정"으로 정할 수 있어요.</div>';
  }

  /* ---------- 사용 기록 탭 ---------- */
  function renderLog() {
    const sum = document.querySelector('#mm_log_sum'), list = document.querySelector('#mm_log_list');
    if (!sum || !list) return;
    const range = $('#mm_log_range').val() || 'today';
    const start = range === 'today' ? new Date().setHours(0, 0, 0, 0) : range === '7' ? Date.now() - 7 * 864e5 : 0;
    const rows = S().usageLog.filter((x) => x.t >= start);
    const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString());
    const g = {};
    for (const r of rows) {
      const o = (g[r.kind] ||= { n: 0, i: 0, o: 0, sec: 0, cost: 0, est: false });
      o.n++; o.i += r.inTok || 0; o.o += r.outTok || 0; o.sec += r.sec || 0; o.cost += r.cost || 0; if (r.est) o.est = true;
    }
    const tot = Object.values(g).reduce((a, o) => ({ n: a.n + o.n, i: a.i + o.i, o: a.o + o.o, cost: a.cost + o.cost }), { n: 0, i: 0, o: 0, cost: 0 });
    sum.innerHTML = rows.length
      ? `<table class="mm-log-tbl"><tr><th>종류</th><th>횟수</th><th>입력 토큰</th><th>출력 토큰</th><th>비고</th></tr>${Object.entries(g).map(([k, o]) => `<tr><td>${esc(k)}</td><td>${o.n}</td><td>${o.est ? '~' : ''}${fmt(o.i)}</td><td>${o.est ? '~' : ''}${fmt(o.o)}</td><td>${o.sec ? `${o.sec}초 · 약 $${o.cost.toFixed(2)}` : o.est ? '추정' : ''}</td></tr>`).join('')}<tr class="mm-log-tot"><td>합계</td><td>${tot.n}</td><td>${fmt(tot.i)}</td><td>${fmt(tot.o)}</td><td>${tot.cost ? `영상 약 $${tot.cost.toFixed(2)}` : ''}</td></tr></table>`
      : '<div class="mm-hint">이 기간의 기록이 없어요.</div>';
    list.innerHTML = rows.slice(-100).reverse().map((r) => {
      const d = new Date(r.t), t = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const cls = /영상/.test(r.kind) ? 'k-vid' : /이미지|지도/.test(r.kind) ? 'k-img' : 'k-llm';
      const tk = r.sec ? `<b>${r.sec}초</b> · ${esc(r.resolution || '')} · 예상 <b>$${(r.cost || 0).toFixed(2)}</b>`
        : `입력 <b>${r.est ? '~' : ''}${fmt(r.inTok)}</b> · 출력 <b>${r.est ? '~' : ''}${fmt(r.outTok)}</b>${r.thoughts ? ` · 사고 <b>${fmt(r.thoughts)}</b>` : ''}${r.refs ? ` · 참조 이미지 ${r.refs}장` : ''}`;
      return `<div class="mm-log-row"><div class="mm-log-top"><span class="mm-log-t">${t}</span><span class="mm-log-badge ${cls}">${esc(r.kind)}</span><span class="mm-log-l">${esc(r.label || '')}</span></div><div class="mm-log-k">${tk}</div></div>`;
    }).join('');
  }

  /* ---------- 이미지 크게 보기 (더블클릭) ---------- */
  function openLightbox(url, caption, vurl, startVideo = false) {
    document.getElementById('mm-lightbox')?.remove();
    const box = document.createElement('div');
    box.id = 'mm-lightbox';
    box.innerHTML = `<div class="mm-lb-bar"><span class="mm-lb-cap">${esc(caption || '')}</span>${vurl ? '<button class="mm-lb-vid"><i class="fa-solid fa-film"></i> 영상</button>' : ''}<button class="mm-lb-fit"><i class="fa-solid fa-expand"></i> 화면에 맞추기</button><button class="mm-lb-x" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button></div><div class="mm-lb-body">${startVideo ? `<video src="${esc(vurl)}" controls autoplay loop playsinline></video>` : `<img src="${esc(url)}" alt="">`}</div>`;
    document.body.appendChild(box);
    const body = box.querySelector('.mm-lb-body');
    const close = () => { box.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    box.querySelector('.mm-lb-x').addEventListener('click', close);
    body.addEventListener('click', (e) => { if (e.target === body) close(); });
    box.querySelector('.mm-lb-fit').addEventListener('click', () => box.classList.toggle('mm-lb-fitted'));
    box.querySelector('.mm-lb-vid')?.addEventListener('click', () => {
      const v = body.querySelector('video');
      if (v && !url) return;
      body.innerHTML = v ? `<img src="${esc(url)}" alt="">` : `<video src="${esc(vurl)}" controls autoplay loop playsinline></video>`;
    });
  }

  /* ST 테마 CSS가 버튼 폭을 min-content로 줄여 글자가 세로로 쌓이는 문제 방지 */
  function fixButtons() {
    document.querySelectorAll('#mm-scene .menu_button, .mm-sec .menu_button, #extensions_settings2 .mm-set-row .menu_button').forEach((b) => {
      for (const [k, v] of [['width', 'auto'], ['min-width', 'max-content'], ['white-space', 'nowrap'], ['flex', '0 0 auto'], ['flex-direction', 'row'], ['word-break', 'keep-all'], ['writing-mode', 'horizontal-tb']]) b.style.setProperty(k, v, 'important');
    });
  }

  /* ---------- 텍스트 분석용 연결 프로필 ---------- */
  let profSig = '';
  function renderProfiles(force = false) {
    const sel = document.querySelector('#mm_profile'), hint = document.querySelector('#mm_profile_hint');
    if (!sel) return;
    const list = profileList(), sig = JSON.stringify(list.map((p) => [p.id, p.name, p.model])) + S().llmProfile;
    if (!force && sig === profSig) return;
    profSig = sig;
    sel.innerHTML = '<option value="">채팅에 연결된 모델 그대로 사용</option>' + list.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}${p.model ? ` — ${esc(p.model)}` : ''}</option>`).join('');
    sel.value = list.some((p) => p.id === S().llmProfile) ? S().llmProfile : '';
    hint.innerHTML = list.length
      ? '장소 분석·마커 추적·외형 추출·장면 연출 같은 <b>텍스트 호출</b>에 쓸 모델이에요. Flash 같은 저렴한 모델 프로필을 고르면 채팅 내용을 보내지 않고 필요한 정보만 보내서 훨씬 싸요. 비워 두면 지금 채팅에 연결된 모델을 써요. (이미지·영상 모델은 아래 별도 설정)'
      : '연결 프로필 목록을 찾지 못했어요. SillyTavern의 <b>Connection Manager</b> 확장을 켜고 프로필을 만들면 여기서 고를 수 있어요. 지금은 채팅에 연결된 모델을 써요.';
  }

  function buildSettings() {
    const html = `
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>🎬 장면 생성기 · 미니맵 HUD</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <details class="mm-help"><summary>빠른 시작 · 사용 방법</summary>
          <ol>
            <li>아래 <b>장면 이미지 생성</b>에서 방식(Agent Platform 또는 Gemini API)을 고르고 API 키를 넣은 뒤 <b>연결 테스트</b>를 눌러요.</li>
            <li>채팅을 열고 장면 창의 <b>장소·지도</b> 탭에서 <b>장소·마커 자동 분석</b>을 눌러요.</li>
            <li>장소가 감지되면 장면 창의 <b>장면 이미지 생성</b> 버튼(또는 옵션의 자동 생성)으로 이미지를 만들어요.</li>
            <li>영상은 이미지 위쪽의 필름 버튼으로 만들어요. Agent Platform은 프로젝트 ID가 꼭 필요해요.</li>
            <li>미니맵: 휠로 확대·축소, 드래그로 이동, 더블클릭으로 전체 보기, 빨간 내 위치 더블클릭으로 내 지도 복귀, ▾ 버튼으로 지도 목록.</li>
          </ol>
          <div class="mm-hint">이미지·영상 생성은 내 API 키로 Google에 요청되고 요금이 발생해요. 자세한 설치·설정·문제 해결은 README를 참고해 주세요.</div>
        </details>
        <label class="checkbox_label"><input type="checkbox" id="mm_enabled"><span>미니맵 사용</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="sceneOn"><span>장면창 생성 (끄면 장면 창 없이 미니맵만 써요)</span></label>
        <div class="mm-set-row"><span>텍스트 분석용 연결 프로필</span><select class="text_pole" id="mm_profile"></select></div>
        <div class="mm-hint" id="mm_profile_hint"></div>

        <div class="mm-sec" data-sec="places">
        <h4>자동 분석</h4>
        <div class="mm-hint">캐릭터 카드, 페르소나, 로어북, 최근 대화를 읽고 장소·위치·종류·NPC/적/퀘스트를 만들어요 (현재 연결된 모델 1회 호출).</div>
        <div class="mm-set-row"><div class="menu_button" id="mm_analyze">장소·마커 자동 분석</div><div class="menu_button" id="mm_import">로어북 가져오기(무료)</div></div>
        <div class="mm-set-row"><input type="text" class="text_pole" id="mm_lore_names" placeholder="추가 로어북 이름 (쉼표, 선택)"></div>
        <div class="mm-set-row"><input type="text" class="text_pole" data-key="loreFilter" placeholder="무료 가져오기용 코멘트 필터"></div>
        <label class="checkbox_label"><input type="checkbox" data-key="autoAnalyze"><span>장소가 없는 채팅을 열면 자동 분석</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="llmDetect"><span>대화에서 새 장소 자동 발견 (키워드 감지 실패 시 모델 호출)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="trackOn"><span>장소가 바뀔 때 NPC/적/퀘스트 마커 자동 갱신 (모델 호출)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showTitle"><span>장면 왼쪽 아래에 장소 이름 표시</span></label>

        <h4>지도·장소 편집</h4>
        <div class="mm-set-row"><span>편집할 지도</span><select class="text_pole" id="mm_scope"></select></div>
        <div class="mm-hint">지도는 2단계예요. "세계 지도"에는 건물·마을 같은 장소가, "○○ 내부 지도"에는 그 안의 방·구역(예: 오두막 안의 방, 화장실, 주방)이 한 장에 같이 표시돼요. 장소 목록에서 "상위" 드롭다운으로 다른 건물 안으로 옮길 수 있어요.</div>
        <div class="mm-set-row"><div class="menu_button" id="mm_flatten">내부 지도 정리 (방마다 따로 생긴 지도를 건물 하나로 합치기)</div></div>
        <div class="mm-edit-box" id="mm_edit_map"><div class="mm-viewport"><div class="mm-stage"></div></div></div>
        <div class="mm-hint" id="mm_map_state"></div>
        <div class="mm-set-row"><div class="menu_button" id="mm_map_gen">이 지도 이미지 생성/재생성</div><div class="menu_button" id="mm_clear_img">지도 이미지 제거</div></div>
        <div class="mm-set-row"><span>직접 올리기</span><input type="file" id="mm_file" accept="image/*"></div>
        <label class="checkbox_label"><input type="checkbox" data-key="autoMap"><span>장소가 바뀌었는데 지도가 없으면 자동 생성 (이미지 요금 발생)</span></label>
        <div class="mm-set-row"><span>지도 화풍</span><input type="text" class="text_pole" data-key="mapStyle"></div>
        <div class="mm-set-row"><span>월드 분위기</span><input type="text" class="text_pole" id="mm_look" placeholder="예: 중세 판타지 산악 마을, 따뜻한 햇살"></div>
        <div class="mm-set-row"><div class="menu_button" id="mm_add">＋ 장소 추가</div></div>
        <div class="mm-hint">📍 아이콘을 누르면 장소가 선택돼요. 지도를 클릭하거나 핀을 드래그해서 위치를 옮겨요. 다른 지도를 열고 클릭하면 그 지도 안으로 이동해요.</div>
        <div id="mm_place_list"></div>

        </div>
        <div class="mm-sec" data-sec="markers">
        <h4>마커 (나 · 캐릭터 · NPC · 적 · 퀘스트)</h4>
        <label class="checkbox_label"><input type="checkbox" data-key="showUser"><span>나 ({{user}}) 표시 — 초록 사람 아이콘</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showChar"><span>캐릭터 ({{char}}) 표시 — 분홍 하트 아이콘</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showNpc"><span>NPC 표시 — 파란 아이콘</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showEnemy"><span>적 표시</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showQuest"><span>퀘스트 마커 표시 (미니맵)</span></label>
        <div class="mm-set-row"><span>장면 위 퀘스트 목록</span><select class="text_pole" data-key="questHud"><option value="off">숨김</option><option value="here">현재 장소 퀘스트만</option><option value="all">전체 (최대 4개)</option></select></div>
        <div id="mm_marker_list"></div>
        <div class="mm-set-row"><div class="menu_button" id="mm_mk_add">＋ 마커 추가</div></div>

        </div>

        <h4>장면 이미지 생성</h4>
        <div class="mm-set-row"><span>생성 방식</span>
          <select class="text_pole" data-key="imgProvider"><option value="vertex">Agent Platform API (구 Vertex AI) 직접</option><option value="gemini">Gemini Developer API (AI Studio) 직접</option><option value="sd">ST Image Generation 확장 (/sd, 지도 생성 불가)</option></select></div>
        <div class="mm-set-row"><span>API 키</span><input type="password" class="text_pole" data-key="geminiKey" placeholder="Google Cloud / AI Studio API 키" autocomplete="off"></div>
        <div class="mm-set-row"><span>프로젝트 ID</span><input type="text" class="text_pole" data-key="vertexProject" placeholder="비우면 API 키 전용(express) 모드"></div>
        <div class="mm-set-row"><span>리전</span><input type="text" class="text_pole" data-key="vertexLocation" placeholder="global 또는 us-central1"></div>
        <div class="mm-set-row"><span>모델</span><input type="text" class="text_pole" data-key="geminiModel" list="mm_models"><datalist id="mm_models"><option value="gemini-3.1-flash-image"><option value="gemini-3-pro-image"><option value="gemini-2.5-flash-image"></datalist><div class="menu_button" id="mm_test">연결 테스트</div></div>
        <div class="mm-set-row"><span>장면 비율</span><select class="text_pole" data-key="aspect"><option value="16:9">16:9</option><option value="21:9">21:9 와이드 (드래그로 둘러보기에 유리)</option><option>3:2</option><option>4:3</option><option>1:1</option><option>9:16</option></select></div>
        <label class="checkbox_label"><input type="checkbox" data-key="useRef"><span>기준 이미지를 참조로 보내 캐릭터·화풍 일관성 높이기</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="useAvatars"><span>캐릭터 카드 PNG·페르소나 아바타를 참조 이미지로 같이 보내기 (얼굴·외형 반영)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="directScene"><span>최근 대화를 읽어 인물별 행동·표정·위치 반영 (이미지마다 모델 호출 1회)</span></label>
        <div class="mm-hint">API 키는 SillyTavern 설정 파일에 평문으로 저장돼요. 이미지 1장마다 Google 요금이 들어요.</div>
        <div class="mm-set-row mm-style-row"><span>화풍 프롬프트</span><select class="text_pole" id="mm_style_sel"></select><input type="text" class="text_pole" id="mm_style_name" placeholder="이름"><div class="menu_button menu_button_icon" id="mm_style_save" title="저장 (같은 이름이면 덮어써요)"><i class="fa-solid fa-floppy-disk"></i></div><div class="menu_button menu_button_icon" id="mm_style_del" title="이 프리셋 삭제"><i class="fa-solid fa-trash"></i></div></div>
        <textarea class="text_pole" data-key="styleText" rows="5"></textarea>
        <div class="mm-hint">"직접 입력"에 글을 쓰고 이름을 정해 저장 아이콘을 누르면 프리셋으로 저장돼요. 같은 이름이면 덮어써요.</div>
        <div class="mm-set-row"><span>제외 요소</span><input type="text" class="text_pole" data-key="negative" placeholder="생성에서 빼고 싶은 요소 (선택)"></div>

        <h4>움직이는 장면 (Veo 영상)</h4>
        <div class="mm-hint">장면 창의 필름 버튼을 누르면 지금 보는 이미지를 영상으로 바꿔요. 이미지 1장당 영상 1개가 저장되고, 요금은 초당 과금이라 만들기 전에 예상 요금을 물어봐요. 자동 생성은 하지 않아요.</div>
        <div class="mm-set-row"><span>영상 방식</span><select class="text_pole" data-key="videoProvider"><option value="auto">이미지와 같은 방식</option><option value="vertex">Agent Platform (프로젝트 ID 필요)</option><option value="gemini">Gemini Developer API</option></select></div>
        <div class="mm-set-row"><span>영상 API 키</span><input type="password" class="text_pole" data-key="videoKey" placeholder="비우면 이미지 API 키 사용" autocomplete="off"></div>
        <div class="mm-set-row"><span>프로젝트 ID</span><input type="text" class="text_pole" data-key="videoProject" placeholder="비우면 위 이미지 설정의 프로젝트 ID 사용"></div>
        <div class="mm-set-row"><span>리전</span><input type="text" class="text_pole" data-key="videoLocation" placeholder="us-central1 (권장)"></div>
        <div class="mm-set-row"><span>액세스 토큰</span><input type="password" class="text_pole" data-key="videoToken" placeholder="선택: API 키가 거부될 때 (gcloud auth print-access-token)" autocomplete="off"></div>
        <div class="mm-hint">Agent Platform의 Veo는 API 키만 쓰는 express 모드가 안 돼서 "400 Invalid resource field value" 오류가 나요. 프로젝트 ID와 리전(us-central1)을 넣어야 해요.</div>
        <div class="mm-set-row"><span>영상 모델</span><input type="text" class="text_pole" data-key="videoModel" list="mm_vmodels"><datalist id="mm_vmodels"><option value="veo-3.1-lite-generate-preview"><option value="veo-3.1-fast-generate-preview"><option value="veo-3.1-generate-preview"></datalist></div>
        <div class="mm-hint">Agent Platform 방식이면 이름이 -generate-preview로 끝나는 모델은 자동으로 -generate-001로 바꿔 호출해요. 다른 이름이 필요하면 그대로 입력하세요.</div>
        <div class="mm-set-row"><span>길이</span><select class="text_pole" data-key="videoSeconds"><option value="4">4초</option><option value="6">6초</option><option value="8">8초</option></select><span>해상도</span><select class="text_pole" data-key="videoRes"><option value="720p">720p</option><option value="1080p">1080p (8초 고정)</option></select></div>
        <label class="checkbox_label"><input type="checkbox" data-key="videoAudio"><span>소리 포함 (Agent Platform에서만 끌 수 있고, 켜면 요금이 늘어요)</span></label>
        <textarea class="text_pole" data-key="videoPrompt" rows="4"></textarea>


        <div class="mm-sec" data-sec="look">
        <h4>외형 (이미지 생성에 반영)</h4>
        <div class="mm-hint">캐릭터 카드 PNG와 페르소나 아바타는 AI에게 참조 이미지로 같이 보내고(이미지 생성 설정에서 끌 수 있어요), 아래 글 설명은 보조로 같이 써요.</div>
        <div class="mm-set-row"><span>내 캐릭터 외형</span></div>
        <textarea class="text_pole" data-key="playerLook" rows="2" placeholder="비우면 페르소나 설명에서 자동 추출"></textarea>
        <div class="mm-hint">현재 캐릭터와 지금 쓰는 페르소나의 외형만 보여요 (자동 추출, 수정하면 고정돼요)</div>
        <div id="mm_appearance"></div>
        <div class="mm-set-row"><div class="menu_button" id="mm_reapp">현재 캐릭터 외형 다시 추출</div></div>
        </div>

        <div class="mm-sec" data-sec="gallery">
        <h4>이미지 관리</h4>
        <div id="mm_anchor_box" class="mm-anchor-box"></div>
        <div class="mm-hint">이 채팅에서 만든 장면·지도 이미지예요. 선택 삭제하면 서버 파일(user/images/minimap)도 함께 지워져요. 채팅을 분기했다면 분기본에서도 안 보일 수 있어요.</div>
        <div class="mm-set-row"><span>자동 정리: 장면 최대 보관 장수 (0 = 끔)</span><input type="number" class="text_pole" data-key="maxKeep" min="0" max="500"></div>
        <div class="mm-set-row"><div class="menu_button" id="mm_g_all">전체 선택</div><div class="menu_button" id="mm_g_none">선택 해제</div><div class="menu_button" id="mm_g_del">선택 삭제</div><div class="menu_button" id="mm_g_anchor">선택한 1장을 기준으로 고정</div><div class="menu_button" id="mm_g_delvid">선택 영상만 삭제</div><div class="menu_button" id="mm_g_trim">최신 10장만 남기기</div></div>
        <div id="mm_gallery" class="mm-gallery"></div><div class="mm-hint" id="mm_g_info"></div>

        </div>

        <div class="mm-sec" data-sec="opts">
        <h4>장면 표시</h4>
        <label class="checkbox_label"><input type="checkbox" data-key="round"><span>원형 미니맵</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="anchorAuto"><span>이미지를 처음 만들면 자동으로 기준 이미지로 고정 (화풍·캐릭터 고정)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="autoGen"><span>장소가 실제로 바뀔 때만 장면 자동 생성 (끄면 버튼으로 생성 · 이미 만든 장소는 캐시 사용)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="regenOnVisit"><span>이미 만든 장소에 다시 가도 새 장면 만들기 (자동 생성이 켜져 있을 때)</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="bgMode"><span>장면을 채팅 배경으로 표시</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="dock"><span>미니맵을 장면 위 HUD로 합성</span></label>
        <div class="mm-set-row"><div class="menu_button" id="mm_reset_hist">이동 기록 초기화</div><div class="menu_button" id="mm_reset_pos">창·HUD 위치 초기화</div></div>

        <h4>감지·표시 옵션</h4>
        <label class="checkbox_label"><input type="checkbox" data-key="useTag"><span>[LOC:장소] 태그 우선 인식</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="hideTag"><span>채팅 화면에서 태그 숨김</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="injectPrompt"><span>AI에게 태그 출력 지시 자동 삽입</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="fog"><span>안 가 본 장소 숨기기</span></label>
        <label class="checkbox_label"><input type="checkbox" data-key="showLabels"><span>모든 핀에 이름 표시</span></label>
        <div class="mm-set-row"><span>스캔 범위(최근 메시지 수)</span><input type="number" class="text_pole" data-key="scanDepth" min="1" max="20"></div>
        <div class="mm-hint">미니맵 조작: 마우스 휠 또는 두 손가락으로 확대·축소, 드래그로 지도 이동, 더블클릭으로 전체 보기. HUD 위치는 Shift+드래그나 미니맵 테두리를 잡고 끌어 옮기고, 모서리 손잡이로 크기를 조절해요.</div>
        </div>

        <div class="mm-sec" data-sec="log">
        <h4>사용 기록 (토큰 · 호출)</h4>
        <div class="mm-hint">이미지·지도 생성은 API가 알려준 토큰 수를, 영상은 초와 예상 요금을 기록해요. 모델 호출(장소 분석, 마커 추적 등)은 이 확장이 추가한 지시문과 응답만 센 추정치(~)예요. SillyTavern이 채팅 내용을 함께 보내서 실제 입력 토큰은 더 많을 수 있어요.</div>
        <div class="mm-set-row"><span>기간</span><select class="text_pole" id="mm_log_range"><option value="today">오늘</option><option value="7">최근 7일</option><option value="all">전체</option></select><div class="menu_button" id="mm_log_clear">기록 지우기</div></div>
        <div id="mm_log_sum"></div>
        <div id="mm_log_list" class="mm-log-list"></div>
        </div>
      </div>
    </div>`;
    $('#extensions_settings2').append(html);

    const s = S();
    $('#mm_enabled').prop('checked', s.enabled).on('change', function () { s.enabled = this.checked; saveSettings(); updatePrompt(); render(); renderScene(); });
    $('.inline-drawer-content [data-key]').each(function () {
      const k = this.dataset.key;
      if (this.type === 'checkbox') this.checked = !!s[k]; else this.value = s[k];
      $(this).on('change input', () => {
        let v = this.type === 'checkbox' ? this.checked : (this.type === 'range') ? +this.value : this.type === 'number' ? Math.max(this.min !== '' ? +this.min : 1, Math.round(+this.value || 0)) : this.value;
        if (k === 'zoom') v = +v;
        s[k] = v;
        if (k === 'styleText' && s.stylePreset === 'custom') s.customText = v;
                saveSettings(); updatePrompt(); render(); renderScene(); renderEditor();
        if (k === 'hideTag') stripTags();
      });
    });

    $('#mm_profile').on('change', function () { s.llmProfile = this.value; profWarned = false; saveSettings(); renderProfiles(true); });
    $('#mm_profile').on('focus mouseenter', () => renderProfiles());
    renderProfiles(true);
    $('#mm_style_sel').on('change', function () {
      s.stylePreset = this.value; s.styleText = presetText(this.value) || ''; $('[data-key="styleText"]').val(s.styleText);
      saveSettings(); renderStylePresets(); renderScene();
    });
    $('#mm_style_save').on('click', () => {
      const cur = s.stylePresets.find((q) => q.id === s.stylePreset);
      const name = String($('#mm_style_name').val() || '').trim() || cur?.name || '';
      if (!name) { toastr.info('저장할 이름을 입력해 주세요.'); return; }
      if (!s.styleText.trim()) { toastr.info('프롬프트가 비어 있어요.'); return; }
      const same = s.stylePresets.find((q) => q.name === name);
      if (same) { same.text = s.styleText; s.stylePreset = same.id; toastr.success(`"${name}"에 덮어썼어요.`); }
      else { const id = uid(); s.stylePresets.push({ id, name, text: s.styleText }); s.stylePreset = id; toastr.success(`"${name}"으로 저장했어요.`); }
      saveSettings(); renderStylePresets();
    });
    $('#mm_style_del').on('click', () => {
      const x = s.stylePresets.find((q) => q.id === s.stylePreset);
      if (!x) { toastr.info('"직접 입력"은 삭제할 수 없어요. 글을 지우면 비워져요.'); return; }
      if (!confirm(`"${x.name}" 프리셋을 삭제할까요?`)) return;
      s.stylePresets = s.stylePresets.filter((q) => q.id !== x.id);
      s.stylePreset = s.stylePresets[0]?.id || 'custom'; s.styleText = presetText(s.stylePreset) || '';
      $('[data-key="styleText"]').val(s.styleText); saveSettings(); renderStylePresets(); renderScene();
    });
    $(document).on('click', '#mm_anchor_clear', () => {
      if (!confirm('기준 이미지(화풍·캐릭터 고정)를 해제할까요? 이미지 파일은 지워지지 않아요.')) return;
      W().anchor = null; saveMeta(); renderAnchorBox(); renderGallery(); renderScene(); toastr.success('기준 이미지를 해제했어요.');
    });
    $(document).on('click', '#mm_anchor_view', () => {
      const idx = W().gallery.findIndex((g) => g.url === W().anchor);
      if (idx >= 0) { viewing = idx; setTab('scene'); } else toastr.info('갤러리에서 이 이미지를 찾지 못했어요.');
    });
    $('#mm_g_anchor').on('click', () => {
      const urls = galleryChecked();
      if (urls.length !== 1) { toastr.info('기준으로 고정할 이미지를 1장만 선택하세요.'); return; }
      if (urls[0].startsWith('data:')) { toastr.info('서버에 저장된 이미지만 고정할 수 있어요.'); return; }
      W().anchor = urls[0]; saveMeta(); renderAnchorBox(); renderGallery(); renderScene(); toastr.success('기준 이미지로 고정했어요.');
    });
    document.querySelector('#mm_appearance')?.addEventListener('error', (e) => {      // 썸네일이 없으면 원본 경로로 재시도
      const t = e.target;
      if (t.tagName !== 'IMG') return;
      const alt = (t.dataset.alt || '').split('|').filter(Boolean);
      if (alt.length) { t.src = alt.shift(); t.dataset.alt = alt.join('|'); } else t.style.visibility = 'hidden';
    }, true);
    $('#mm_flatten').on('click', () => {
      const n = flattenPlaces(); autoLayout(); saveMeta(); renderEditor(); render(); updatePrompt();
      toastr.success(n ? `${n}개 장소를 건물 바로 아래로 옮겨 내부 지도를 합쳤어요. 새 위치를 확인해 주세요.` : '합칠 내부 지도가 없어요. 이미 정리돼 있어요.');
    });
    $('#mm_analyze').on('click', analyzeWorld);
    $('#mm_import').on('click', importLore);
    $('#mm_test').on('click', testGemini);
    $('#mm_scope').on('change', function () { editScope = this.value; renderEditor(); });
    $('#mm_map_gen').on('click', () => generateMap(editScope, true));
    $('#mm_file').on('change', async function () {
      const f = this.files?.[0]; if (!f) return;
      try {
        const { data, ratio } = await resizeImage(f);
        const url = await saveImage(data.split(',')[1], 'image/jpeg');
        const entry = { url, ratio, user: true };
        if (url.startsWith('data:')) tempMaps[editScope] = entry; else { W().maps[editScope] = entry; saveMeta(); }
        renderEditor(); render();
      } catch { toastr.error('이미지를 불러오지 못했어요.'); }
      this.value = '';
    });
    $('#mm_clear_img').on('click', () => {
      delete W().maps[editScope]; delete tempMaps[editScope]; delete mapFailed[editScope];
      if (editScope === 'world') { s.mapImage = ''; s.mapRatio = 1; saveSettings(); }
      saveMeta(); renderEditor(); render();
    });
    $('#mm_look').on('input', function () { W().look = this.value; saveMeta(); });
    $('#mm_add').on('click', () => {
      const p = { id: uid(), name: '새 장소', aliases: [], kind: '', x: null, y: null, parent: editScope === 'world' ? null : editScope, desc: '', visual: '' };
      W().places.push(p); editingId = p.id; autoLayout(); saveMeta(); renderEditor(); render();
    });

    const rowId = (el) => $(el).closest('.mm-place').data('id');
    $('#mm_place_list')
      .on('click', '.mm-pick', function () { editingId = rowId(this); const p = placeById(editingId); if (p) editScope = p.parent || 'world'; renderEditor(); })
      .on('click', '.mm-del', function () {
        const id = rowId(this), w = W();
        w.places = w.places.filter((p) => p.id !== id);
        w.places.forEach((p) => { if (p.parent === id) p.parent = null; });
        w.markers = w.markers.filter((m) => m.place !== id);
        if (editingId === id) editingId = null;
        autoLayout(); saveMeta(); renderEditor(); renderMarkerList(); updatePrompt(); render();
      })
      .on('input', '.mm-name', function () { const p = placeById(rowId(this)); if (p) { p.name = this.value; saveMeta(); updatePrompt(); } })
      .on('input', '.mm-alias', function () { const p = placeById(rowId(this)); if (p) { p.aliases = this.value.split(',').map((t) => t.trim()).filter(Boolean); saveMeta(); } })
      .on('input', '.mm-desc', function () { const p = placeById(rowId(this)); if (p) { p.desc = this.value; saveMeta(); } })
      .on('input', '.mm-visual', function () { const p = placeById(rowId(this)); if (p) { p.visual = this.value; saveMeta(); } })
      .on('change', '.mm-kind', function () { const p = placeById(rowId(this)); if (p) { p.kind = this.value; saveMeta(); renderEditor(); render(); } })
      .on('change', '.mm-parent', function () {
        const p = placeById(rowId(this)); if (!p) return;
        p.parent = this.value || null; p.x = null; p.y = null;
        editScope = p.parent || 'world';
        autoLayout(); saveMeta(); renderEditor(); render();
      });

    const vpSel = '#mm_edit_map .mm-viewport';
    $('#mm_edit_map').on('click', '.mm-viewport', function (e) {
      if (e.target.closest('.mm-pin')) return;
      const p = placeById(editingId);
      if (!p) { toastr.info('먼저 장소 아이콘을 눌러 선택하세요.'); return; }
      if (editScope === p.id || isDesc(p.id, placeById(editScope))) { toastr.warning('자기 자신의 내부 지도에는 넣을 수 없어요.'); return; }
      const r = this.getBoundingClientRect();
      p.parent = editScope === 'world' ? null : editScope;
      p.x = +clamp(((e.clientX - r.left) / r.width) * 100, 0, 100).toFixed(1);
      p.y = +clamp(((e.clientY - r.top) / r.height) * 100, 0, 100).toFixed(1);
      saveMeta(); renderEditor(); render();
    });
    $('#mm_edit_map').on('pointerdown', '.mm-pin', function (e) {
      e.preventDefault();
      const id = this.dataset.id, vp = document.querySelector(vpSel);
      editingId = id;
      const move = (ev) => {
        const p = placeById(id), r = vp.getBoundingClientRect();
        p.x = +clamp(((ev.clientX - r.left) / r.width) * 100, 0, 100).toFixed(1);
        p.y = +clamp(((ev.clientY - r.top) / r.height) * 100, 0, 100).toFixed(1);
        const map = mapOf(editScope);
        document.querySelector('#mm_edit_map .mm-stage').innerHTML = (map ? `<img class="mm-img" src="${map.url}" alt="">` : '') + stageHTML(editScope, { editor: true });
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); saveMeta(); renderEditor(); render(); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    });

    // 마커 편집
    $('#mm_mk_add').on('click', () => {
      const w = W(); if (!w.places.length) { toastr.info('먼저 장소를 등록하세요.'); return; }
      w.markers.push({ id: uid(), type: 'npc', name: '새 마커', place: (curPlace() || w.places[0]).id }); saveMeta(); renderMarkerList(); render();
    });
    const mk = (el) => W().markers.find((m) => m.id === $(el).closest('.mm-mk-row').data('id'));
    $('#mm_marker_list')
      .on('change', '.mm-mk-type', function () { const m = mk(this); if (m) { m.type = this.value; saveMeta(); render(); renderScene(); } })
      .on('input', '.mm-mk-name', function () { const m = mk(this); if (m) { m.name = this.value; saveMeta(); renderScene(); } })
      .on('change', '.mm-mk-place', function () { const m = mk(this); if (m) { m.place = this.value; saveMeta(); render(); } })
      .on('click', '.mm-mk-del', function () { const m = mk(this); if (m) { W().markers = W().markers.filter((x) => x !== m); saveMeta(); renderMarkerList(); render(); renderScene(); } });

    $('#mm_appearance').on('input', 'textarea', function () {
      const k = $(this).closest('.mm-app').data('k');
      s.appearance[k] = { ...(s.appearance[k] || {}), t: this.value, manual: true }; saveSettings();
    });
    $('#mm_reapp').on('click', () => {
      for (const k of appearanceKeys()) if (s.appearance[k] && !s.appearance[k].manual) delete s.appearance[k];
      saveSettings(); renderAppearance(); extractCurrentAppearance();
    });
    $('#mm_appearance')
      .on('click', '.mm-app-del', function () { delete s.appearance[$(this).closest('[data-k]').data('k')]; saveSettings(); renderAppearance(); })
      .on('click', '#mm_app_purge', function () {
        if (!confirm('현재 캐릭터·페르소나 외 저장된 외형을 모두 삭제할까요?')) return;
        const cur = appearanceKeys();
        for (const k of Object.keys(s.appearance)) if (!cur.includes(k)) delete s.appearance[k];
        saveSettings(); renderAppearance();
      });

    $('#mm_g_all').on('click', () => $('#mm_gallery input').prop('checked', true));
    $('#mm_g_none').on('click', () => $('#mm_gallery input').prop('checked', false));
    $('#mm_g_del').on('click', async () => {
      const urls = galleryChecked();
      if (!urls.length) { toastr.info('삭제할 이미지를 선택하세요.'); return; }
      if (!confirm(`선택한 ${urls.length}개 이미지를 삭제할까요? (서버 파일도 함께 삭제돼요)`)) return;
      const ok = await removeImages(urls);
      if (ok < urls.length) toastr.warning(`${urls.length}개 중 ${ok}개 파일을 삭제했어요. 나머지는 목록에서만 지워졌고, user/images/minimap 폴더에서 직접 지울 수 있어요.`);
      else toastr.success(`${ok}개 삭제했어요.`);
    });
    $('#mm_g_delvid').on('click', async () => {
      const urls = galleryChecked().filter((u) => videoFor(u));
      if (!urls.length) { toastr.info('영상이 있는 항목을 선택하세요.'); return; }
      if (!confirm(`선택한 ${urls.length}개의 영상을 삭제할까요? (이미지는 남아요)`)) return;
      const w = W();
      for (const u of urls) { const v = w.videos[u]; delete w.videos[u]; if (memVideos[u]) { URL.revokeObjectURL(memVideos[u]); delete memVideos[u]; } if (v) await deleteFile(v); }
      saveMeta(); renderScene(); renderGallery(); toastr.success(`${urls.length}개 영상을 삭제했어요.`);
    });
    $('#mm_g_trim').on('click', async () => {
      const w = W(), keep = new Set([w.anchor, sceneState.url].filter(Boolean));
      const victims = w.gallery.slice(0, Math.max(0, w.gallery.length - 10)).map((g) => g.url).filter((u) => !keep.has(u));
      if (!victims.length) { toastr.info('정리할 이미지가 없어요.'); return; }
      if (!confirm(`오래된 장면 ${victims.length}장을 삭제할까요? (서버 파일도 함께 삭제돼요)`)) return;
      await removeImages(victims); toastr.success(`${victims.length}장 정리했어요.`);
    });
    $('#mm_gallery').on('dblclick', '.mm-g-item', function () {
      const url = this.dataset.url, idx = +this.dataset.idx, g = idx >= 0 ? W().gallery[idx] : null;
      const cap = g ? `${g.kind === 'video' ? '영상 · ' : ''}${g.name || '장면'}${g.t ? ' · ' + new Date(g.t).toLocaleString() : ''}` : '지도';
      if (g?.kind === 'video') openLightbox(g.src || '', cap, g.url, true); else openLightbox(url, cap, videoEntryFor(url)?.url);
    });
    $('#mm_log_range').on('change', renderLog);
    $('#mm_log_clear').on('click', () => { if (!confirm('사용 기록을 모두 지울까요?')) return; s.usageLog = []; saveSettings(); renderLog(); });
    $(document).on('click', '#mm-scene .mm-q-x', function (e) {
      e.stopPropagation();
      const id = $(this).closest('[data-id]').data('id'), w = W();
      w.markers = w.markers.filter((m) => m.id !== id); saveMeta(); render(); renderScene(); renderMarkerList();
    });
    $('#mm_reset_hist').on('click', () => { const m = M(); m.current = null; m.history = []; saveMeta(); update(); render(); });
    $('#mm_reset_pos').on('click', () => { Object.assign(s, { x: null, y: null, sceneX: null, sceneY: null, w: 240, sceneW: 520, dockX: 73, dockY: 4, dockW: 25 }); saveSettings(); render(); renderScene(); });

    renderEditor(); renderMarkerList(); renderAppearance(); renderGallery();
  }

  /* ---------- 초기화 ---------- */
  jQuery(() => {
    const c = ctx(), ET = c.event_types || c.eventTypes;
    injectCss(); migrateStyle(); buildSettings(); renderStylePresets(); createScene(); mountTabs(); createMinimap(); render(); renderScene(); updatePrompt();

    const onChatChanged = async () => {
      editingId = null; editScope = 'world'; viewScope = null;
      sceneState = { placeId: null, url: null, status: '' };
      viewing = null;
      normalizeMarkers(); autoLayout(); renderEditor(); renderMarkerList(); renderAppearance(); renderGallery(); updatePrompt(); stripTags();
      const p = update();
      if (!p) { const cur = curPlace(); if (cur) showScene(cur); }
      maybeMap();
      if (S().autoAnalyze && !W().places.length && !W().analyzed && ctx().characterId != null && ctx().chat.length) await analyzeWorld();
    };
    c.eventSource.on(ET.CHAT_CHANGED, onChatChanged);
    for (const name of ['MESSAGE_RECEIVED', 'MESSAGE_SWIPED', 'MESSAGE_EDITED', 'MESSAGE_DELETED']) {
      if (ET[name]) c.eventSource.on(ET[name], () => { onNewMessage(); stripTags(); });
    }
    if (ET.PERSONA_CHANGED) c.eventSource.on(ET.PERSONA_CHANGED, renderAppearance);
    for (const name of ['CHARACTER_MESSAGE_RENDERED', 'USER_MESSAGE_RENDERED', 'MESSAGE_UPDATED']) {
      if (ET[name]) c.eventSource.on(ET[name], stripTags);
    }
    const chatEl = document.getElementById('chat');
    if (chatEl) new MutationObserver(stripTags).observe(chatEl, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', renderScene);
  });
})();

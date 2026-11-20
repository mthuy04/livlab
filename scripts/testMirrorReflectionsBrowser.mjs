// Live mirror reflections in Room Studio, checked in a real browser.
//
//   node scripts/testMirrorReflectionsBrowser.mjs [origin] [outdir]
//
// Loads a furnished bathroom with the four approved mirrors (round Roca LED,
// arched Kohler, arched and rectangular INAX) and checks, in the actual
// Room Studio renderer:
//   - each mirror face reflects the room (not black, not flat);
//   - moving the camera re-renders the reflections;
//   - moving a product with the keyboard changes what the mirror shows;
//   - the round and arched faces keep their own outlines;
//   - the Roca LED still glows and lights its wall;
//   - `?mirrors=static` falls back to a non-black static mirror;
//   - the cost of the reflection passes, against the static fallback.
// Headless Chrome (SwiftShader) via the DevTools protocol; no dependencies.
// Uses localStorage only: nothing is saved to the database.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.argv[2] || process.env.ROOM_QA_ORIGIN || 'http://localhost:3000';
const out = process.argv[3] || process.env.ROOM_QA_OUTPUT || 'artifacts/room-studio-mirrors';
const bin =
  process.env.ROOM_QA_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
mkdirSync(out, { recursive: true });

const ROOM = { length: 3.5, width: 2.55, height: 2.65 };
const back = -ROOM.width / 2;
const left = -ROOM.length / 2;
const right = ROOM.length / 2;
const snapshot = {
  version: 3,
  dimensions: ROOM,
  architecture: { basinCounter: false, skirting: true, cutaway: true, niche: false },
  visualStyle: { id: 'warm-stone', overrides: [] },
  elements: [
    { type: 'shower-partition', id: 'screen', x: 0.64, z: -0.64, rotation: 90, length: 1.24, height: 2.02, glazing: 'clear', mechanism: 'fixed', entrySide: 'left', swing: 'forward', open: false },
    { type: 'entrance-door', id: 'entry', wall: 'front', offset: 1.25, width: 1, height: 2.1, mechanism: 'hinged', hinge: 'left', swing: 'inward', open: true },
  ],
  placedProducts: [
    // id, placement, position, rotationY, wall
    ['a851693513', 'wall', [-0.9, 0.5275, back + 0.23 + 0.001], 0, 'back'],
    ['a812401000', 'wall', [-0.9, 1.5, back + 0.0125 + 0.001], 0, 'back'],
    ['ac-912vn', 'floor', [0.15, 0.34, back + 0.3605 + 0.015], 0],
    ['bfv-70s', 'wall', [1.46, 1.726945, back + 0.26275], 0, 'back'],
    ['bf-1656v', 'floor', [-0.75, 0.28, -back - 0.4 - 0.02], 0],
    ['k-30638-cpl', 'wall', [right - 0.0175 - 0.001, 1.5, 0.35], -Math.PI / 2, 'right'],
    ['kf-6075var', 'wall', [left + 0.0025 + 0.001, 1.5, -0.5], Math.PI / 2, 'left'],
    ['kf-6090va', 'wall', [left + 0.0025 + 0.001, 1.5, 0.6], Math.PI / 2, 'left'],
  ].map(([sku, placementType, position, rotationY, wall]) => ({
    instanceId: sku,
    productId: 'livlab-3d-' + sku,
    placementType,
    position,
    rotationY,
    ...(wall ? { wall } : {}),
  })),
};

/* ── DevTools plumbing ─────────────────────────────────────────────────── */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(bin, ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mirror-qa-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(200);
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach((l) => l(m));
});
const send = (method, params = {}) => new Promise((res, rej) => { const n = ++seq; pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result))); ws.send(JSON.stringify({ id: n, method, params })); });
const js = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const errors = [];
listeners.push((m) => {
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 240));
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || /mirror/i.test(JSON.stringify(m.params.args)))) errors.push(m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 240));
});
await send('Page.enable');
await send('Runtime.enable');

// Before any page script: seed the room, and observe the renderer through
// three's devtools hook to measure each mirror right after it is drawn.
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    localStorage.setItem('livlab_room_studio_state_v1', ${JSON.stringify(JSON.stringify(snapshot))});
    localStorage.setItem('livlab_quote_items', '[]');
    const events = new EventTarget();
    window.__THREE_DEVTOOLS__ = events;
    window.qa = { renders: 0, ms: [] };
    const mul = (m, v) => { const e = m.elements, [x, y, z, w = 1] = v; return [e[0]*x+e[4]*y+e[8]*z+e[12]*w, e[1]*x+e[5]*y+e[9]*z+e[13]*w, e[2]*x+e[6]*y+e[10]*z+e[14]*w, e[3]*x+e[7]*y+e[11]*z+e[15]*w]; };
    events.addEventListener('observe', (event) => {
      const gl = event.detail;
      if (!gl || !gl.isWebGLRenderer || window.qa.gl) return;
      window.qa.gl = gl;
      const render = gl.render.bind(gl);
      gl.render = (scene, camera) => {
        const main = scene.isScene && gl.getRenderTarget() === null;
        const t0 = performance.now();
        const result = render(scene, camera);
        if (!main) return result;
        window.qa.ms.push(performance.now() - t0);
        window.qa.renders++;
        window.qa.camera = camera; window.qa.scene = scene;
        const ctx = gl.getContext();
        const W = ctx.drawingBufferWidth, H = ctx.drawingBufferHeight;
        const project = (o, p) => {
          const w = mul(o.matrixWorld, p);
          const v = mul(camera.matrixWorldInverse, w);
          const c = mul(camera.projectionMatrix, v);
          return [(c[0] / c[3] * 0.5 + 0.5) * W, (c[1] / c[3] * 0.5 + 0.5) * H];
        };
        const faces = [];
        scene.traverse((o) => {
          const live = o.name === 'livlab-mirror-reflection';
          const face = o.isMesh && !Array.isArray(o.material) && /^MIRROR/.test(o.material?.name || '');
          if (!live && !face) return;
          for (let p = o; p; p = p.parent) if (!p.visible) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const b = o.geometry.boundingBox;
          const pts = [[b.min.x, b.min.y, b.max.z], [b.max.x, b.min.y, b.max.z], [b.max.x, b.max.y, b.max.z], [b.min.x, b.max.y, b.max.z]].map((p) => project(o, p));
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          const rect = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
          const world = mul(o.matrixWorld, [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.max.z]);
          // Central 70% of the outline's box: still inside a round or arched face.
          const cx = (rect[0] + rect[2]) / 2, cy = (rect[1] + rect[3]) / 2, hw = (rect[2] - rect[0]) * 0.35, hh = (rect[3] - rect[1]) * 0.35;
          const x0 = Math.max(0, Math.round(cx - hw)), y0 = Math.max(0, Math.round(cy - hh));
          const w = Math.min(W - x0, Math.round(hw * 2)), h = Math.min(H - y0, Math.round(hh * 2));
          let mean = null, dark = null, spread = null, sig = null;
          if (w > 4 && h > 4) {
            const px = new Uint8Array(w * h * 4);
            ctx.readPixels(x0, y0, w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
            let sum = 0, darkN = 0, min = 255, max = 0; const n = w * h; const G = 6; const cells = new Array(G * G).fill(0), counts = new Array(G * G).fill(0);
            for (let i = 0; i < n; i++) {
              const l = 0.2126 * px[i*4] + 0.7152 * px[i*4+1] + 0.0722 * px[i*4+2];
              sum += l; if (l < 25) darkN++; if (l < min) min = l; if (l > max) max = l;
              const cxI = Math.min(G - 1, Math.floor((i % w) / w * G)), cyI = Math.min(G - 1, Math.floor(Math.floor(i / w) / h * G));
              cells[cyI * G + cxI] += l; counts[cyI * G + cxI]++;
            }
            mean = +(sum / n).toFixed(1); dark = +(darkN / n).toFixed(3); spread = Math.round(max - min);
            sig = cells.map((c, i) => Math.round(c / Math.max(1, counts[i])));
          }
          faces.push({ kind: live ? 'live' : 'face', material: o.material?.name, world: world.slice(0, 3).map((v) => +v.toFixed(3)), rect: rect.map(Math.round), mean, dark, spread, sig });
        });
        window.qa.faces = faces;
        let leds = 0, washes = 0;
        scene.traverse((o) => {
          if (o.isMesh && !Array.isArray(o.material) && o.material?.name === 'LED_ON__3000K_PERIMETER_DIFFUSER' && o.material.emissiveIntensity > 0) leds++;
          if (o.isMesh && o.name === 'livlab-led-wall-glow' && o.visible) washes++;
        });
        window.qa.leds = leds; window.qa.washes = washes;
        return result;
      };
    });
  })();`,
});

const loaded = () => new Promise((r) => { const l = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r(); } }; listeners.push(l); });
async function open(path) {
  const done = loaded();
  await send('Page.navigate', { url: origin + path });
  await Promise.race([done, sleep(30000)]);
}
/** Waits until the scene has stopped redrawing (on-demand rendering goes quiet). */
async function settle(min = 1500, timeout = 60000) {
  const start = Date.now();
  let last = -1, quietSince = Date.now();
  while (Date.now() - start < timeout) {
    await sleep(250);
    const n = await js('window.qa.renders');
    if (n !== last) { last = n; quietSince = Date.now(); }
    else if (n > 0 && Date.now() - quietSince > min) return;
  }
}
async function waitFor(expr, timeout = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await js(expr)) return true; await sleep(400); }
  return false;
}
const shot = async (name) => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(data, 'base64')); };
const read = () => js(`({ faces: window.qa.faces, stats: { ...window.__livlabMirrorStats, sizes: window.__livlabMirrorStats?.sizes }, leds: window.qa.leds, washes: window.qa.washes, renders: window.qa.renders })`);
const sigDiff = (a, b) => (a && b ? Math.round(a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length) : null);
const byWorld = (faces, w) => faces.find((f) => Math.hypot(f.world[0] - w[0], f.world[1] - w[1], f.world[2] - w[2]) < 0.05);

let passed = 0, failed = 0;
const check = (name, ok, detail) => { ok ? passed++ : failed++; console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail !== undefined ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`); };

async function drag(dx, dy) {
  // Start on empty canvas beside the room: dragging a product would move it.
  const box = await js(`(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + r.width * 0.06, r.top + r.height * 0.45]; })()`);
  const [x, y] = box;
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 12; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (dx * i) / 12, y: y + (dy * i) / 12, button: 'left', buttons: 1 }); await sleep(40); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + dx, y: y + dy, button: 'left', clickCount: 1 });
}

try {
  for (const [device, metrics] of [['desktop', { width: 1440, height: 900, mobile: false }], ['mobile', { width: 390, height: 844, mobile: true }]]) {
    console.log(`\n${device}`);
    await send('Emulation.setDeviceMetricsOverride', { ...metrics, deviceScaleFactor: 1 });
    await send('Emulation.setTouchEmulationEnabled', { enabled: metrics.mobile });
    await send('Emulation.setEmitTouchEventsForMouse', { enabled: false });
    errors.length = 0;
    await open('/room-studio');
    const ready = await waitFor(`(window.qa.faces || []).filter((f) => f.kind === 'live').length >= 4 && (window.__livlabMirrorStats?.passes ?? 0) >= 4`);
    await settle();
    let s = await read();
    const live = s.faces.filter((f) => f.kind === 'live');
    check('bốn mặt gương phản chiếu trực tiếp', ready && live.length === 4, live.map((f) => f.material));
    check('mỗi gương một bề mặt phản chiếu, không sản phẩm khác', s.stats.mirrors === 4, s.stats);
    const onScreen = live.filter((f) => f.mean !== null);
    check('gương không đen', onScreen.length > 0 && onScreen.every((f) => f.dark < 0.2 && f.mean > 45), onScreen.map((f) => [f.material.slice(0, 6), f.mean, f.dark]));
    check('gương hiện cảnh phòng, không phải mảng màu phẳng', onScreen.every((f) => f.spread > 25), onScreen.map((f) => f.spread));
    check('đèn LED Roca vẫn sáng và hắt lên tường', s.leds > 0 && s.washes === 1, { leds: s.leds, washes: s.washes });
    if (device === 'desktop') check('độ phân giải phản chiếu ≤ 1024', s.stats.sizes.every(([w, h]) => Math.max(w, h) <= 1024), s.stats.sizes);
    else check('thiết bị cảm ứng: độ phân giải ≤ 768', s.stats.sizes.every(([w, h]) => Math.max(w, h) <= 768), s.stats.sizes);
    await shot(`${device}-orbit`);

    if (device === 'desktop') {
      // Object: click the bath on screen to select it, then move it with
      // Shift + arrow (10 cm a step). The camera does not move. From the
      // opening view the round mirror looks down towards the front-left,
      // where the bath stands.
      const at = await js(`(() => {
        const { camera } = window.qa; const r = document.querySelector('canvas').getBoundingClientRect();
        const p = { x: -0.75, y: 0.45, z: ${-back - 0.42} };
        const e = camera.matrixWorldInverse.elements, P = camera.projectionMatrix.elements;
        const v = [e[0]*p.x+e[4]*p.y+e[8]*p.z+e[12], e[1]*p.x+e[5]*p.y+e[9]*p.z+e[13], e[2]*p.x+e[6]*p.y+e[10]*p.z+e[14]];
        const c = [P[0]*v[0]+P[4]*v[1]+P[8]*v[2]+P[12], P[1]*v[0]+P[5]*v[1]+P[9]*v[2]+P[13], P[3]*v[0]+P[7]*v[1]+P[11]*v[2]+P[15]];
        return [r.left + (c[0]/c[2]*0.5+0.5)*r.width, r.top + (1-(c[1]/c[2]*0.5+0.5))*r.height];
      })()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at[0], y: at[1] });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at[0], y: at[1], button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at[0], y: at[1], button: 'left', clickCount: 1 });
      await settle();
      s = await read();
      const beforeMove = s.faces.filter((f) => f.kind === 'live');
      const passesBeforeMove = s.stats.passes;
      const stored = () => js(`JSON.parse(localStorage.getItem('livlab_room_studio_state_v1')).placedProducts.find((p) => p.instanceId === 'bf-1656v').position`);
      const posBefore = await stored();
      for (let i = 0; i < 4; i++) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, modifiers: 8 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, modifiers: 8 }); await sleep(80); }
      await settle();
      const posAfter = await stored();
      s = await read();
      const afterMove = s.faces.filter((f) => f.kind === 'live');
      const diffs = beforeMove.map((f) => { const g = byWorld(afterMove, f.world); return [f.world.map((v) => v.toFixed(2)).join(','), g ? sigDiff(f.sig, g.sig) : null]; });
      check('chọn bồn tắm và dịch bằng Shift + mũi tên', posAfter[0] > posBefore[0] + 0.25, { posBefore, posAfter });
      check('di chuyển vật: phản chiếu được vẽ lại, camera đứng yên', s.stats.passes > passesBeforeMove && diffs.every(([w]) => afterMove.some((g) => g.world.map((v) => v.toFixed(2)).join(',') === w)), { before: passesBeforeMove, after: s.stats.passes });
      check('di chuyển vật: hình trong gương thay đổi', diffs.some(([, d]) => d !== null && d > 3), diffs);
      await shot('desktop-object-moved');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await settle();
    }

    // Camera: orbit, and the reflection must be redrawn for the new viewpoint.
    s = await read();
    const passesBefore = s.stats.passes;
    const roca = byWorld(s.faces.filter((f) => f.kind === 'live'), [-0.9, 1.5, back + 0.026]) ?? s.faces.find((f) => f.kind === 'live');
    await drag(metrics.mobile ? 80 : 220, metrics.mobile ? 20 : 40);
    await settle();
    s = await read();
    const rocaAfter = byWorld(s.faces.filter((f) => f.kind === 'live'), roca.world);
    check('xoay camera: phản chiếu được vẽ lại', s.stats.passes > passesBefore, { before: passesBefore, after: s.stats.passes });
    check('xoay camera: hình trong gương đổi theo góc nhìn', rocaAfter && sigDiff(roca.sig, rocaAfter.sig) > 3, rocaAfter && sigDiff(roca.sig, rocaAfter.sig));
    await shot(`${device}-orbit-moved`);

    if (device === 'desktop') {
      // Eye level, inside the room.
      const walk = await js(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Tham quan 3D' && !x.disabled); if (b) b.click(); return !!b; })()`);
      await settle(2500);
      s = await read();
      const walkLive = s.faces.filter((f) => f.kind === 'live' && f.mean !== null);
      check('tham quan 3D: gương vẫn phản chiếu, không đen', walk && walkLive.every((f) => f.dark < 0.2), walkLive.map((f) => [f.material.slice(0, 6), f.mean, f.dark]));
      await shot('desktop-walkthrough');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });

      // Cost: the same orbit, live against static, timed per main render.
      const timeOrbit = async () => {
        await js('window.qa.ms = []');
        for (let i = 0; i < 4; i++) await drag(i % 2 ? -160 : 160, 0);
        await settle();
        return js('(() => { const a = window.qa.ms.slice().sort((x, y) => x - y); return { frames: a.length, median: +a[Math.floor(a.length / 2)].toFixed(1), p90: +a[Math.floor(a.length * 0.9)].toFixed(1) }; })()');
      };
      await open('/room-studio');
      await waitFor(`(window.__livlabMirrorStats?.passes ?? 0) >= 4`);
      await settle();
      const liveCost = await timeOrbit();
      await open('/room-studio?mirrors=static');
      await waitFor(`(window.qa.faces || []).length >= 4`);
      await settle();
      s = await read();
      const staticFaces = s.faces.filter((f) => f.kind === 'face' && f.mean !== null);
      check('dự phòng tĩnh (?mirrors=static): không có phản chiếu trực tiếp', s.faces.every((f) => f.kind === 'face'));
      check('dự phòng tĩnh: gương không đen', staticFaces.length > 0 && staticFaces.every((f) => f.dark < 0.2 && f.mean > 45), staticFaces.map((f) => [f.material.slice(0, 6), f.mean, f.dark]));
      await shot('desktop-static-fallback');
      const staticCost = await timeOrbit();
      console.log('  · thời gian vẽ (SwiftShader, CPU):', JSON.stringify({ live: liveCost, static: staticCost }));
    }
    check('không lỗi trong trang', errors.filter((e) => !/401|auth\/me/.test(e)).length === 0, errors);
  }
} finally {
  ws.close();
  chrome.kill();
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.ROOM_QA_PLAYWRIGHT || 'playwright-core');
const origin = process.env.ROOM_QA_ORIGIN || 'http://localhost:3000';
const output = process.env.ROOM_QA_OUTPUT || 'artifacts/room-studio-p12';
await mkdir(output, { recursive: true });
const key = 'livlab_room_studio_state_v1';
const snapshot = {
  version: 3,
  dimensions: { length: 3.5, width: 2.55, height: 2.65 },
  architecture: { basinCounter: true, skirting: true, cutaway: true, niche: true },
  elements: [
    {
      type: 'window',
      id: 'window',
      wall: 'left',
      offset: 0.8,
      width: 1.25,
      height: 0.85,
      sill: 1.25,
      mechanism: 'fixed',
      glazing: 'clear',
      frame: 'graphite',
      open: false,
      daylightBackdrop: true,
    },
    {
      type: 'shower-partition',
      id: 'screen',
      x: 0.64,
      z: -0.64,
      rotation: 90,
      length: 1.24,
      height: 2.02,
      glazing: 'clear',
      mechanism: 'fixed',
      entrySide: 'left',
      swing: 'forward',
      open: false,
    },
  ],
  placedProducts: [
    ['l-293v', 'counter', [-1.14, 0.8775, -0.99]],
    ['ac-912vn', 'floor', [-0.12, 0.34, -0.89]],
    ['bfv-70s', 'wall', [1.46, 1.726945, -1.01225]],
  ].map(([sku, placementType, position]) => ({
    instanceId: sku,
    productId: 'livlab-3d-' + sku,
    placementType,
    position,
    rotationY: 0,
    ...(placementType === 'wall' ? { wall: 'back' } : {}),
  })),
};
snapshot.visualStyle = { id: 'warm-stone', overrides: [] };
snapshot.elements.push({
  type: 'entrance-door',
  id: 'entry',
  wall: 'front',
  offset: 1.25,
  width: 1,
  height: 2.1,
  mechanism: 'hinged',
  hinge: 'left',
  swing: 'inward',
  open: true,
});
const browser = await chromium.launch({
  executablePath: process.env.ROOM_QA_CHROMIUM,
  args: [
    '--use-gl=angle',
    '--use-angle=' + (process.env.ROOM_QA_ANGLE || 'swiftshader'),
    '--enable-unsafe-swiftshader',
    '--disable-gpu-shader-disk-cache',
    '--disk-cache-size=1048576',
  ],
});
try {
  for (const [device, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 768, 1024],
    ['mobile', 390, 844],
  ]) {
    if (process.argv[2] && device !== process.argv[2]) continue;
    const touch = device !== 'desktop';
    const ctx = await browser.newContext({
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch,
      reducedMotion: device === 'mobile' ? 'reduce' : 'no-preference',
    });
    await ctx.addInitScript(
      ({ snapshot, key }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(snapshot));
        localStorage.setItem('livlab_quote_items', '[]');
        const events = new EventTarget();
        window.__THREE_DEVTOOLS__ = events;
        const frames = [];
        window.qa = { frames };
        events.addEventListener('observe', (e) => {
          const gl = e.detail;
          if (!gl.isWebGLRenderer) return;
          const render = gl.render.bind(gl);
          gl.render = (s, c) => {
            if (s.isScene && gl.getRenderTarget() === null) {
              window.qa.pose = {
                position: c.position.toArray(),
                quaternion: c.quaternion.toArray(),
                zoom: c.zoom,
                projection: c.isOrthographicCamera ? 'plan' : 'perspective',
              };
              if (!window.qa.renderer) {
                const context = gl.getContext(),
                  info = context.getExtension('WEBGL_debug_renderer_info');
                window.qa.renderer = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'WebGL2';
              }
              window.qa.memory = { ...gl.info.memory, programs: gl.info.programs?.length };
              const tick = document.timeline.currentTime;
              if (tick !== null && tick !== window.qa.tick) {
                window.qa.tick = tick;
                frames.push(performance.now());
              }
            }
            return render(s, c);
          };
        });
        // Count active interaction handlers on persistent DOM surfaces across complete round trips.
        const listeners = new Map(),
          ids = new WeakMap();
        let next = 0;
        function id(x) {
          if (!ids.has(x)) ids.set(x, ++next);
          return ids.get(x);
        }
        for (const method of ['addEventListener', 'removeEventListener']) {
          const orig = EventTarget.prototype[method];
          EventTarget.prototype[method] = function (type, handler, opts) {
            if (
              handler &&
              (this === window || this === document || this.tagName === 'CANVAS') &&
              /^(pointer|wheel|key|visibilitychange|blur)/.test(type)
            ) {
              const key =
                id(this) +
                '/' +
                type +
                '/' +
                id(handler) +
                '/' +
                Boolean(typeof opts === 'boolean' ? opts : opts?.capture);
              if (method === 'addEventListener') listeners.set(key, true);
              else listeners.delete(key);
            }
            return orig.apply(this, arguments);
          };
        }
        window.qa.listeners = () => listeners.size;
      },
      { snapshot, key }
    );
    const page = await ctx.newPage(),
      errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (m) => {
      if (/shader error|GL_INVALID|context lost|maximum update depth/i.test(m.text())) errors.push(m.text());
    });
    await ctx.route('**/*', (r) =>
      /^https?:/.test(r.request().url()) && new URL(r.request().url()).origin !== origin
        ? r.abort()
        : r.continue()
    );
    const button = (n) => page.getByRole('button', { name: n, exact: true });
    const canvas = page.locator('canvas').first(),
      pose = () => page.evaluate(() => window.qa.pose);
    const shot = async (n, full = false) =>
      (full ? page : canvas).screenshot({ path: join(output, n + '.png') });
    const read = () =>
      page.evaluate(
        (k) => ({
          room: JSON.parse(localStorage.getItem(k)),
          basket: localStorage.getItem('livlab_quote_items'),
        }),
        key
      );
    const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
    const close = (a, b, tol = 0.004) => assert.ok(distance(a, b) < tol, JSON.stringify({ a, b }));
    const settle = () => page.waitForTimeout(620);
    const enter = async () => {
      await button('Tham quan 3D').click();
      await page.waitForFunction(() => Math.abs(window.qa.pose.position[1] - 1.6) < 0.00001);
      await settle();
    };
    const leave = async () => {
      await button('Thoát tham quan').click();
      await settle();
    };
    const move = async (code, ms) => {
      await page.keyboard.down(code);
      await page.waitForTimeout(ms);
      await page.keyboard.up(code);
      await page.waitForTimeout(100);
    };
    try {
      await page.goto(origin + '/room-studio');
      await canvas.waitFor();
      await page.waitForFunction(
        () =>
          window.qa.pose &&
          performance.getEntriesByType('resource').filter((r) => r.name.includes('.glb')).length >= 3
      );
      await page.waitForLoadState('networkidle');
      await settle();
      const baseline = await read(),
        initial = await pose();
      if (!touch) {
        await shot('overview');
        await button('Mặt bằng').click();
        await settle();
        assert.equal((await pose()).projection, 'plan');
        await shot('floor-plan');
        const rect = await canvas.boundingBox();
        await page.mouse.move(rect.x + 15, rect.y + rect.height * 0.7);
        await page.mouse.down();
        await page.mouse.move(rect.x + 70, rect.y + rect.height * 0.7, { steps: 6 });
        await page.mouse.up();
        await page.mouse.wheel(0, -105);
        await settle();
        const plan = await pose();
        assert.ok(Math.abs(plan.position[0]) > 0.01);
        await enter();
        await leave();
        const restoredPlan = await pose();
        assert.equal(restoredPlan.projection, 'plan');
        close(plan.position, restoredPlan.position);
        assert.ok(Math.abs(plan.zoom - restoredPlan.zoom) < 0.1);
        await button('Toàn cảnh').click();
        await settle();
        await page.locator('[data-product-instance="l-293v"]').first().click({ force: true });
        await button('Tập trung').click();
        await settle();
        await shot('product-focus');
        assert.ok(distance((await pose()).position, initial.position) > 0.5);
        await button('Toàn cảnh').click();
        await page.waitForTimeout(75);
        const r = await canvas.boundingBox();
        await page.mouse.move(r.x + 12, r.y + 80);
        await page.mouse.wheel(0, -120);
        await settle();
      }
      assert.deepEqual(await read(), baseline);
      const previous = await pose();
      // Observe the actual projection curtain while entering. Reduced motion must remain instantaneous.
      await page.evaluate(() => {
        const el = document.querySelector('[data-camera-mode] > [aria-hidden]');
        window.qa.fades = [];
        window.qa.observer = new MutationObserver(() => window.qa.fades.push(Number(el.style.opacity)));
        window.qa.observer.observe(el, { attributes: true, attributeFilter: ['style'] });
      });
      await enter();
      const fades = await page.evaluate(() => {
        window.qa.observer.disconnect();
        return window.qa.fades;
      });
      assert.equal(
        fades.some((opacity) => opacity > 0.1),
        device !== 'mobile'
      );
      const spawn = await pose();
      close(spawn.position, [0, 1.6, 0.995]);
      let start, end, collision;
      if (touch) {
        const cdp = await ctx.newCDPSession(page);
        const rect = await button('Tiến').boundingBox(),
          point = { x: rect.x + 20, y: rect.y + 20, id: 1 };
        start = await page.evaluate(() => performance.now());
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        await page.waitForTimeout(550);
        end = await page.evaluate(() => performance.now());
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.ok((await pose()).position[2] < spawn.position[2] - 0.22);
        const look = { x: width * 0.52, y: height * 0.48, id: 2 };
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [look] });
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ ...look, x: look.x - Math.min(157, width * 0.39), y: look.y + 137 }],
        });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
        await page.waitForTimeout(100);
        assert.ok(distance((await pose()).quaternion, spawn.quaternion) > 0.05);
        await shot(device + '-controls', true);
      } else {
        await shot('entrance', true);
        start = await page.evaluate(() => performance.now());
        await page.keyboard.down('w');
        await page.waitForTimeout(1800);
        end = await page.evaluate(() => performance.now());
        await page.keyboard.up('w');
        await page.waitForTimeout(100);
        const stopped = await pose();
        await move('ArrowUp', 250);
        close((await pose()).position, stopped.position, 0.012);
        assert.ok(stopped.position[2] < 0.3 && stopped.position[2] > -1.15);
        collision = { stopped: stopped.position, afterContinuedInput: (await pose()).position };
        async function tilt(pixels) {
          await page.mouse.move(width * 0.48, height * 0.4);
          await page.mouse.down();
          await page.mouse.move(width * 0.48, height * 0.4 + pixels, { steps: 8 });
          await page.mouse.up();
          await page.waitForTimeout(100);
        }
        await page.getByText('Lối đi bị chắn', { exact: true }).waitFor();
        await tilt(244);
        await shot('fixture-collision', true);
        await tilt(-244);
        await move('s', 520);
        const before = await pose();
        await page.mouse.move(width * 0.52, height * 0.48);
        await page.mouse.down();
        await page.mouse.move(width * 0.52 - 218, height * 0.48 + 105, { steps: 10 });
        await page.mouse.up();
        await settle();
        await shot('vanity', true);
        await page.mouse.move(width * 0.52, height * 0.48);
        await page.mouse.down();
        await page.mouse.move(width * 0.52 + 436, height * 0.48 - 38, { steps: 10 });
        await page.mouse.up();
        await settle();
        await shot('shower', true);
        close((await pose()).position, before.position);
        await page.keyboard.down('d');
        await page.waitForTimeout(180);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.keyboard.up('d');
        await settle();
        const idle = await pose();
        await page.waitForTimeout(130);
        close(idle.position, (await pose()).position);
      }
      const intervals = await page.evaluate(
        ([begin, end]) => {
          const t = window.qa.frames.filter((x) => x >= begin && x <= end);
          return t.slice(1).map((v, i) => v - t[i]);
        },
        [start, end]
      );
      assert.ok(intervals.length > 3);
      if (touch) await leave();
      else {
        await page.keyboard.press('Escape');
        await settle();
      }
      const restored = await pose();
      close(restored.position, previous.position);
      close(restored.quaternion, previous.quaternion);
      assert.deepEqual(await read(), baseline);
      const sample = () =>
        page.evaluate(() => ({ resources: window.qa.memory, listeners: window.qa.listeners() }));
      await enter();
      await leave();
      const warm = await sample();
      for (let i = 0; i < 3; i++) {
        await enter();
        await leave();
      }
      const after = await sample();
      assert.deepEqual(after, warm);
      if (!touch) {
        const selected = (await read()).room.placedProducts.find((p) => p.instanceId === 'l-293v');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        assert.notDeepEqual(
          (await read()).room.placedProducts.find((p) => p.instanceId === 'l-293v').position,
          selected.position
        );
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(500);
        assert.deepEqual((await read()).room.placedProducts, baseline.room.placedProducts);
      }
      if (!touch) {
        await button('Thêm cửa sổ').click();
        const from = await pose();
        await button('Đề xuất').click();
        await settle();
        assert.ok(distance((await pose()).position, from.position) > 0.2);
        await shot('proposal-focus');
        await button('Bỏ bản xem trước').click();
        assert.deepEqual((await read()).room.placedProducts, baseline.room.placedProducts);
      }
      assert.deepEqual(errors, []);
      intervals.sort((a, b) => a - b);
      const record = {
        device,
        width,
        height,
        browser: await browser.version(),
        renderer: await page.evaluate(() => window.qa.renderer),
        collision,
        samples: intervals.length,
        fps: (1000 * intervals.length) / intervals.reduce((a, b) => a + b, 0),
        frameMedianMs: intervals[Math.floor(intervals.length / 2)],
        frameP95Ms: intervals[Math.floor(intervals.length * 0.95)],
        warm,
        after,
        spawn,
        restored,
        errors,
      };
      await writeFile(join(output, device + '.json'), JSON.stringify(record, null, 2));
      console.log(device, JSON.stringify(record));
    } finally {
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

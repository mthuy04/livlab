import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.ROOM_QA_PLAYWRIGHT || 'playwright-core');
const origin = process.env.ROOM_QA_ORIGIN || 'http://localhost:3000';
const output = process.env.ROOM_QA_OUTPUT || 'artifacts/room-studio-p11';
await mkdir(output, { recursive: true });
const styles = [
  ['warm-stone', 'Đá ấm'],
  ['minimal-white', 'Trắng tối giản'],
  ['modern-hotel', 'Khách sạn hiện đại'],
];
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
  for (const [name, width, height, low] of [
    ['desktop', 1440, 900, false],
    ['tablet', 768, 1024, false],
    ['mobile', 390, 844, true],
    ['low', 1440, 900, true],
    ['high', 1440, 900, false],
    ['controls', 1440, 900, false],
  ]) {
    if (process.argv[2] && name !== process.argv[2]) continue;
    const touch = width < 1024;
    const compareTier = name === 'high' || name === 'low';
    const ctx = await browser.newContext({
      viewport: { width, height },
      isMobile: touch,
      hasTouch: touch,
      reducedMotion: name === 'mobile' ? 'reduce' : 'no-preference',
    });
    await ctx.addInitScript(
      ({ key, snapshot, low }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(snapshot));
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => (low ? 2 : 12) });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => (low ? 2 : 8) });
        const gl = WebGL2RenderingContext.prototype;
        const resources = { Texture: 0, Buffer: 0, Program: 0 };
        const frames = [];
        window.qaRender = { resources, frames };
        for (const resource of Object.keys(resources)) {
          for (const [op, delta] of [
            ['create', 1],
            ['delete', -1],
          ]) {
            const method = op + resource,
              original = gl[method];
            gl[method] = function (...args) {
              const result = original.apply(this, args);
              if (op === 'create' ? result : args[0]) resources[resource] += delta;
              return result;
            };
          }
        }
        let last = -1;
        for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced']) {
          const original = gl[method];
          gl[method] = function (...args) {
            const tick = document.timeline.currentTime;
            if (tick !== null && tick !== last) {
              last = tick;
              frames.push(performance.now());
            }
            return original.apply(this, args);
          };
        }
      },
      {
        key,
        snapshot: compareTier
          ? {
              ...snapshot,
              visualStyle: { id: 'modern-hotel', overrides: [] },
              lighting: 'warm',
              surfaceStyles: {
                floor: { material: 'stone-look', color: 'grey', finish: 'matte' },
                walls: { material: 'marble', color: 'dark-grey', finish: 'matte' },
              },
            }
          : snapshot,
        low,
      }
    );
    const page = await ctx.newPage(),
      errors = [],
      warnings = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (/shader error|GL_INVALID|out of memory|context lost|VALIDATE_STATUS/i.test(m.text()))
        errors.push(m.text());
      else if (/webgl|THREE\./i.test(m.text())) warnings.push(m.text());
    });
    await ctx.route('**/*', (r) =>
      /^https?:/.test(r.request().url()) && new URL(r.request().url()).origin !== origin
        ? r.abort()
        : r.continue()
    );
    const btn = (name) => page.getByRole('button', { name, exact: true });
    const nav = page.getByRole('navigation', { name: 'Khu vực làm việc' });
    const material = page.getByRole('tab', { name: 'Vật liệu', exact: true });
    const store = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
    const canvas = page.locator('canvas').first();
    const waitStyle = async (id) =>
      page.waitForFunction(({ key, id }) => JSON.parse(localStorage.getItem(key))?.visualStyle?.id === id, {
        key,
        id,
      });
    const shot = async (label, full = false) => {
      await page.waitForTimeout(1000);
      await (full ? page : canvas).screenshot({ path: join(output, label + '.png') });
    };
    async function openMaterials() {
      if (touch) await nav.getByRole('button', { name: 'Phòng', exact: true }).click();
      await material.click();
    }
    try {
      await page.goto(origin + '/room-studio');
      await canvas.waitFor();
      await openMaterials();
      await page.waitForTimeout(1000);
      await page.waitForFunction(() => {
        const assets = performance.getEntriesByType('resource');
        return (
          assets.filter((r) => r.name.includes('.glb')).length >= 3 &&
          assets.some((r) => r.name.endsWith('/minerals.webp')) &&
          window.qaRender.frames.length >= 3
        );
      });
      await page.waitForLoadState('networkidle');
      const before = await store(),
        basket = await page.evaluate(() => localStorage.getItem('livlab_quote_items'));
      const beforeTier = await page.locator('[data-render-tier]').getAttribute('data-render-tier');
      const ids = compareTier || name === 'controls' ? [] : name === 'desktop' ? styles : [styles[0]];
      if (compareTier) {
        await shot('modern-hotel-' + name);
        assert.equal(await page.locator('[data-render-tier]').getAttribute('data-render-tier'), name);
      }
      const latency = [];
      for (const [id, label] of ids) {
        await btn(label).focus();
        await btn(label).evaluate((el) =>
          el.addEventListener(
            'click',
            () => {
              window.qaRender.clicked = performance.now();
            },
            { once: true }
          )
        );
        await page.keyboard.press('Enter');
        await btn('Áp dụng').waitFor();
        await page.waitForTimeout(850);
        assert.equal((await store()).visualStyle?.id, ids[ids.findIndex((v) => v[0] === id) - 1]?.[0]);
        await page.waitForFunction(() => window.qaRender.frames.some((t) => t >= window.qaRender.clicked));
        const timing = await page.evaluate(() => {
          const { frames, clicked } = window.qaRender;
          const relevant = frames.filter((t) => t >= clicked);
          return {
            firstRenderMs: Math.round(relevant[0] - clicked),
            intervals: relevant.slice(1).map((t, i) => Math.round(t - relevant[i])),
          };
        });
        latency.push({ id, ...timing });
        if (name === 'desktop' && id === styles[0][0]) await shot('style-proposal', true);
        await btn('Áp dụng').click();
        await waitStyle(id);
        assert.deepEqual((await store()).placedProducts, before.placedProducts);
        assert.deepEqual((await store()).elements, before.elements);
        if (name === 'desktop') {
          await shot(id + '-overview');
          const r = await canvas.boundingBox();
          await page.screenshot({
            type: 'jpeg',
            quality: 88,
            path: join(output, id + '-card.jpg'),
            clip: {
              x: r.x + r.width * 0.18,
              y: r.y + r.height * 0.24,
              width: r.width * 0.56,
              height: (r.width * 0.56 * 2) / 3,
            },
          });
        }
      }
      if (name === 'desktop') {
        await shot('style-switcher', true);
        await btn('Đá ấm').click();
        await btn('Bỏ qua').click();
        await waitStyle('modern-hotel');
        await page
          .getByRole('button', { name: /^Hoàn tác ·/ })
          .first()
          .click();
        await waitStyle('minimal-white');
        await page
          .getByRole('button', { name: /^Làm lại ·/ })
          .first()
          .click();
        await waitStyle('modern-hotel');
        await page.reload();
        await material.click();
        await waitStyle('modern-hotel');
        await shot('saved-style', true);
        await page.waitForTimeout(600);
        const repeat = async () => {
          for (let i = 0; i < 6; i++) {
            await btn(styles[i % 3][1]).click();
            await page.waitForTimeout(120);
          }
          await btn('Bỏ qua').click();
          await page.waitForTimeout(2000);
        };
        await repeat();
        const snapshotResources = () => page.evaluate(() => ({ ...window.qaRender.resources }));
        const warmup = await snapshotResources();
        await repeat();
        const initial = await snapshotResources();
        await repeat();
        const final = await snapshotResources();
        for (const [style, label, instance, filename] of [
          ['warm-stone', 'Đá ấm', 'l-293v', 'vanity'],
          ['minimal-white', 'Trắng tối giản', 'bfv-70s', 'shower'],
          ['modern-hotel', 'Khách sạn hiện đại', 'bfv-70s', 'glass-metal'],
        ]) {
          await material.click();
          await btn(label).click();
          await btn('Áp dụng').click();
          await waitStyle(style);
          await page.getByRole('tab', { name: 'Phòng', exact: true }).click();
          await page
            .locator('[data-product-instance="' + instance + '"]')
            .first()
            .click({ force: true });
          await page.getByTitle('Phóng tới sản phẩm đang chọn').click();
          await page.waitForTimeout(900);
          const bounds = await canvas.boundingBox();
          // Focus stays in place when the user clears the product selection.
          await btn('Bỏ chọn').click();
          if (filename !== 'vanity') {
            await page.mouse.move(bounds.x + bounds.width * 0.58, bounds.y + bounds.height * 0.48);
            await page.mouse.wheel(0, filename === 'glass-metal' ? -570 : -280);
          }
          await page.mouse.move(5, 5);
          await shot(filename + '-focus');
          await page.getByTitle('Đưa cả phòng vào khung nhìn').click();
        }
        console.log('Repeat switch resources', JSON.stringify({ warmup, initial, final }));
        await writeFile(
          join(output, 'resource-sample.json'),
          JSON.stringify({ warmup, initial, final }, null, 2)
        );
      } else if (name === 'controls') {
        await btn('Khách sạn hiện đại').click();
        await btn('Áp dụng').click();
        await waitStyle('modern-hotel');
        await shot('style-switcher', true);
        await page.reload();
        await material.click();
        await waitStyle('modern-hotel');
        await shot('saved-style', true);
        await btn('Đá ấm').click();
        await page.getByText('Chi tiết thay đổi', { exact: true }).click();
        await shot('style-proposal', true);
        await btn('Bỏ qua').click();
        await btn('Terrazzo').click();
        await page.getByRole('radio', { name: /Ánh sáng ban ngày/ }).click();
        await page.waitForFunction(
          (k) => JSON.parse(localStorage.getItem(k)).visualStyle.overrides.length === 2,
          key
        );
        await page.reload();
        await material.click();
        const restored = await store();
        assert.deepEqual(restored.visualStyle, { id: 'modern-hotel', overrides: ['floor', 'lighting'] });
        assert.equal(restored.surfaceStyles.floor.material, 'terrazzo');
        assert.equal(restored.surfaceStyles.walls.material, 'marble');
        assert.equal(restored.lighting, 'daylight');
        assert.deepEqual(restored.placedProducts, before.placedProducts);
      } else if (touch) {
        await shot(name + '-styles', true);
      }
      assert.equal(await page.evaluate(() => localStorage.getItem('livlab_quote_items')), basket);
      assert.deepEqual(errors, []);
      const record = {
        viewport: name,
        startTier: beforeTier,
        endTier: await page.locator('[data-render-tier]').getAttribute('data-render-tier'),
        latency,
        warnings: [...new Set(warnings)],
      };
      Object.assign(record, {
        browser: await browser.version(),
        renderer: await canvas.evaluate((el) => {
          const gl = el.getContext('webgl2'),
            info = gl?.getExtension('WEBGL_debug_renderer_info');
          return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'WebGL 2';
        }),
      });
      await writeFile(join(output, name + '-qa.json'), JSON.stringify(record, null, 2));
      console.log(name + ' passed');
    } finally {
      if (errors.length) console.error(errors);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

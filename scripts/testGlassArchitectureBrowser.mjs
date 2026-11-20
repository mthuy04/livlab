import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ROOM_QA_PLAYWRIGHT || 'playwright-core');
const origin = new URL(process.env.ROOM_QA_ORIGIN || 'http://127.0.0.1:3000').origin;
const output = process.env.ROOM_QA_OUTPUT || 'artifacts/room-studio-p02b';
const key = 'livlab_room_studio_state_v1';
await mkdir(output, { recursive: true });

async function planDrag(page, kind, dx, dz, touch) {
  const group = page.locator('[data-kind="' + kind + '"]');
  await group.scrollIntoViewIfNeeded();
  const coords = await group.evaluate((el, { dx, dz }) => {
    const line = el.querySelector('path'), centre = line.getPointAtLength(line.getTotalLength() / 2), m = line.getScreenCTM();
    return [[centre.x, centre.y], [centre.x + dx, centre.y + dz]].map(([x, y]) => {
      const p = new DOMPoint(x, y).matrixTransform(m); return { x: p.x, y: p.y };
    });
  }, { dx, dz });
  const [a, b] = coords;
  const cdp = touch ? await page.context().newCDPSession(page) : null;
  const send = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [p] : [] });
  if (touch) await send('touchStart', a);
  else { await page.mouse.move(a.x, a.y); await page.mouse.down(); }
  await group.evaluate(el => {
    const path = el.querySelector('path'), original = path.getAttribute('d');
    window.__glassQA = null;
    el.addEventListener('pointermove', () => {
      const started = performance.now();
      function sample() {
        if (path.getAttribute('d') !== original) window.__glassQA = performance.now() - started;
        else if (performance.now() - started < 5000) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }, { once: true, capture: true });
  });
  if (touch) await send('touchMove', b);
  else await page.mouse.move(b.x, b.y);
  await page.waitForFunction(() => typeof window.__glassQA === 'number', null, { timeout: 8000 });
  if (touch) { await send('touchEnd'); await cdp.detach(); }
  else await page.mouse.up();
  return page.evaluate(() => Number(window.__glassQA.toFixed(1)));
}

async function rotateHandle(page, touch) {
  const handle = page.locator('[data-kind="shower-partition"] [data-rotate]');
  await handle.scrollIntoViewIfNeeded();
  const [a, b] = await handle.evaluate(el => {
    const circle = el.querySelector('circle');
    const x = Number(circle.getAttribute('cx')), z = Number(circle.getAttribute('cy'));
    const m = el.getScreenCTM();
    // A 1.2 m horizontal span centred at (0.20,0.12), turned 30 degrees.
    return [[x, z], [.2 + .6 * Math.cos(Math.PI / 6), .12 + .6 * Math.sin(Math.PI / 6)]].map(([u, v]) => {
      const p = new DOMPoint(u, v).matrixTransform(m);
      return { x: p.x, y: p.y };
    });
  });
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    for (const [type, point] of [['touchStart', a], ['touchMove', b], ['touchEnd', null]])
      await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [point] : [] });
    await cdp.detach();
  } else {
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 4 }); await page.mouse.up();
  }
}

// Compare the room pixels, excluding the workspace toolbars and preview label.
async function captureRoom(page) {
  const r = await page.locator('canvas').boundingBox();
  assert.ok(r);
  const png = await page.screenshot({ clip: {
    x: Math.round(r.x + r.width * .15), y: Math.round(r.y + r.height * .18),
    width: Math.floor(r.width * .7), height: Math.floor(r.height * .64),
  } });
  return png.toString('base64');
}

async function assertSceneChanged(page, before, after, label) {
  const changed = await page.evaluate(async images => {
    const [a, b] = await Promise.all(images.map(async data => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + data;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, image.width, image.height).data;
    }));
    let count = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) >= 12) count++;
    }
    return count;
  }, [before, after]);
  assert.ok(changed >= 25, label + ' changed only ' + changed + ' room pixels');
}

async function exercise(page, name, touch) {
  const button = n => page.getByRole('button', { name: n, exact: true });
  const field = n => page.getByLabel(n);
  const draw = type => page.locator('[data-kind="' + type + '"]');
  const store = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), key);
  const waitSaved = (type, property, value) => page.waitForFunction(({ key, type, property, value }) => {
    const layout = JSON.parse(localStorage.getItem(key) ?? 'null')?.elements ?? [];
    return layout.some(el => el.type === type && el[property] === value);
  }, { key, type, property, value });
  const nav = page.getByRole('navigation', { name: 'Khu vực làm việc' }).getByRole('button', { name: 'Phòng', exact: true });
  const screenshot = async label => {
    await page.locator('canvas').waitFor();
    await page.waitForTimeout(550);
    await page.screenshot({ path: join(output, name + '-' + label + '.png') });
  };
  await page.goto(origin + '/room-studio');
  if (touch) { await nav.waitFor(); await nav.click(); }
  await button('Thêm cửa sổ').click();
  await field('Kiểu cửa sổ').evaluate(el => el.scrollIntoView({ block: 'center' }));
  await screenshot('window-selected');
  await field('Tường cửa sổ').selectOption('back');
  await field('Cách đầu tường (cm)').fill('30');
  await field('Rộng cửa sổ (cm)').fill('100');
  await field('Chiều cao (cm)').fill('95');
  await field('Cao bậu (cm)').fill('90');
  await field('Kiểu cửa sổ').selectOption('casement');
  await field('Hiện cửa mở').check();
  await field('Bề mặt kính').selectOption('frosted');
  if (name === 'desktop') {
    await screenshot('graphite-frame');
    const graphite = await captureRoom(page);
    await field('Khung').selectOption('ivory');
    await screenshot('ivory-frame');
    await assertSceneChanged(page, graphite, await captureRoom(page), 'Selected frame finish');
  }
  assert.equal(await draw('window').getAttribute('data-wall'), 'back');
  const windowMs = await planDrag(page, 'window', .18, 0, touch);
  assert.equal(await field('Cách đầu tường (cm)').inputValue(), '48');
  assert.deepEqual((await store())?.elements ?? [], []);
  await button('Áp dụng').scrollIntoViewIfNeeded();
  await screenshot('window-preview');
  await button('Áp dụng').click();
  await waitSaved('window', 'offset', .48);
  if (touch) await nav.click();
  await screenshot('window-opening');
  if (touch) await nav.click();
  const before = (await store()).elements;
  await field('Cao bậu (cm)').fill('999');
  assert.equal(await button('Áp dụng').isEnabled(), false);
  await button('Áp dụng').scrollIntoViewIfNeeded();
  if (name === 'desktop') await screenshot('invalid-sill');
  await button('Bỏ bản xem trước').click();
  assert.deepEqual((await store()).elements, before);

  await button('Thêm vách kính').click();
  await field('Tâm X (cm)').fill('0'); await field('Tâm Z (cm)').fill('0');
  await field('Góc xoay (°)').fill('0'); await field('Dài toàn bộ (cm)').fill('120');
  await field('Chiều cao (cm)').fill('188');
  await field('Kiểu vách').selectOption('walk-in');
  await field('Bề mặt kính').selectOption('tinted');
  await button('Áp dụng').click(); await waitSaved('shower-partition', 'x', 0);
  await field('Dài toàn bộ (cm)').scrollIntoViewIfNeeded();
  await screenshot('partition-selected');
  const partitionMs = await planDrag(page, 'shower-partition', .2, .12, touch);
  assert.equal(await field('Tâm X (cm)').inputValue(), '20');
  assert.equal(await field('Tâm Z (cm)').inputValue(), '12');
  await rotateHandle(page, touch);
  assert.equal(await field('Góc xoay (°)').inputValue(), '30');
  await field('Góc xoay (°)').fill('35');
  await field('Góc xoay (°)').fill('30');
  assert.equal((await store()).elements.find(e => e.type === 'shower-partition').rotation, 0);
  await button('Áp dụng').click(); await waitSaved('shower-partition', 'rotation', 30);
  await page.getByRole('button', { name: /^Hoàn tác · Chỉnh vách kính/ }).click();
  await waitSaved('shower-partition', 'rotation', 0);
  if (name === 'desktop') await screenshot('after-undo');
  await page.getByRole('button', { name: /^Làm lại · Chỉnh vách kính/ }).click();
  await waitSaved('shower-partition', 'rotation', 30);
  if (name === 'desktop') await screenshot('after-redo');
  const restored = (await store()).elements;
  await page.reload(); if (touch) { await nav.waitFor(); await nav.click(); }
  assert.deepEqual((await store()).elements, restored);
  // Select a different object directly on the plan after reload.
  const panelPath = draw('shower-partition').locator('path').first();
  await panelPath.click({ force: true });
  await field('Góc xoay (°)').waitFor();
  assert.equal(await field('Góc xoay (°)').inputValue(), '30');
  await field('Dài toàn bộ (cm)').scrollIntoViewIfNeeded();
  await screenshot('restored-rotation');
  for (const mechanism of ['hinged', 'sliding']) {
    await field('Kiểu vách').selectOption(mechanism);
    await field('Bên lối vào').selectOption('left');
    const paths = () => draw('shower-partition').locator('path').evaluateAll(paths => paths.map(p => p.getAttribute('d')));
    const closed = await paths();
    let closedRoom;
    if (name === 'desktop') {
      await screenshot(mechanism + '-closed');
      closedRoom = await captureRoom(page);
    }
    await field('Hiện cửa mở').check();
    assert.notDeepEqual(await paths(), closed);
    if (closedRoom) {
      await screenshot(mechanism + '-open');
      await assertSceneChanged(page, closedRoom, await captureRoom(page), mechanism + ' 3D leaf');
    }
    await button('Áp dụng').click(); await waitSaved('shower-partition', 'mechanism', mechanism);
    if (touch) await nav.click();
    await button('Mặt bằng').click();
    if (name === 'desktop') await screenshot(mechanism + '-plan');
    await button('Phối cảnh').click();
    if (touch) await nav.click();
  }
  await field('Tâm X (cm)').fill('650'); assert.equal(await button('Áp dụng').isEnabled(), false);
  await button('Bỏ bản xem trước').click();
  await button('Gỡ vách kính').click(); await button('Áp dụng').click();
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).elements.length === 1, key);
  if (name === 'desktop') {
    const product = page.locator('[draggable=true]').first();
    const canvas = page.locator('canvas');
    await product.dragTo(canvas);
    await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).placedProducts.length === 1, key);
    assert.equal((await store()).elements[0].type, 'window');
    await button('Mặt bằng').click();
    await page.waitForTimeout(650);
    const saved = await store(), placed = saved.placedProducts[0], rect = await canvas.boundingBox();
    const pixelsPerMetre = Math.min(rect.width / (saved.dimensions.length + .8), rect.height / (saved.dimensions.width + .8));
    const x = rect.x + rect.width / 2 + placed.position[0] * pixelsPerMetre;
    const y = rect.y + rect.height / 2 + placed.position[2] * pixelsPerMetre;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + .24 * pixelsPerMetre, y, { steps: 6 }); await page.mouse.up();
    await page.waitForFunction(({ key, original }) => Math.abs(JSON.parse(localStorage.getItem(key)).placedProducts[0].position[0] - original) > .05,
      { key, original: placed.position[0] });
    await page.getByRole('button', { name: /^Hoàn tác · Di chuyển sản phẩm/ }).click();
    await page.waitForFunction(({ key, original }) => JSON.parse(localStorage.getItem(key)).placedProducts[0].position[0] === original,
      { key, original: placed.position[0] });
  }
  console.log(JSON.stringify({ viewport: name, windowDragMs: windowMs, partitionDragMs: partitionMs }));
}
const browser = await chromium.launch({
  executablePath: process.env.ROOM_QA_CHROMIUM,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    if (process.argv[2] && process.argv[2] !== name) continue;
    const touch = name !== 'desktop';
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, locale: 'vi-VN' });
    await ctx.route('**/*', route => {
      const url = new URL(route.request().url());
      return /^https?:$/.test(url.protocol) && url.origin !== origin ? route.abort() : route.continue();
    });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try { await exercise(page, name, touch); assert.deepEqual(errors, []); }
    finally { await ctx.close(); }
  }
} finally { await browser.close(); }

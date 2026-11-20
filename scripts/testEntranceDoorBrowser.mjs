/** Run against a local production server. Playwright is an optional QA tool. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ROOM_QA_PLAYWRIGHT || 'playwright-core');
const origin = new URL(process.env.ROOM_QA_ORIGIN || 'http://127.0.0.1:3000').origin;
const output = process.env.ROOM_QA_OUTPUT || 'artifacts/room-studio-p02a';
const roomKey = 'livlab_room_studio_state_v1';
const quoteKey = 'livlab_quote_items';
const foreignKey = roomKey + ':tungdang';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.ROOM_QA_CHROMIUM,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function snapshot(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), roomKey);
}

async function waitForDoors(page, count, offset) {
  await page.waitForFunction(({ key, count, offset }) => {
    const elements = JSON.parse(localStorage.getItem(key) ?? 'null')?.elements?.filter(e => e.type === 'entrance-door');
    return elements?.length === count && (offset === undefined || Math.abs(elements[0].offset - offset) < 1e-6);
  }, { key: roomKey, count, offset });
}

async function dragDoor(page, mobile) {
  const group = page.locator('[data-door-id]');
  await group.scrollIntoViewIfNeeded();
  const { start, end } = await group.evaluate(el => {
    const line = el.querySelector('path');
    const centre = line.getPointAtLength(line.getTotalLength() / 2);
    const matrix = line.getScreenCTM();
    const pixel = x => {
      const p = new DOMPoint(x, centre.y).matrixTransform(matrix);
      return { x: p.x, y: p.y };
    };
    return { start: pixel(centre.x), end: pixel(centre.x + 0.24) };
  });
  if (mobile) {
    const client = await page.context().newCDPSession(page);
    for (const [type, point] of [['touchStart', start], ['touchMove', end], ['touchEnd', null]]) {
      await client.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [point] : [] });
    }
    await client.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
  }
}

async function cameraScreenshot(page, name) {
  // The existing camera glide lasts 450 ms. Wait through it before photographing the scene.
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(output, name + '.png') });
}

async function exercise(page, mobile) {
  const button = name => page.getByRole('button', { name, exact: true });
  const navRoom = page.getByRole('navigation', { name: 'Khu vực làm việc' }).getByRole('button', { name: 'Phòng', exact: true });
  const panel = async () => {
    if (!mobile) return;
    await navRoom.waitFor();
    if (!await button('Thêm cửa').isVisible()) await navRoom.click();
  };
  const side = mobile ? 'mobile' : 'desktop';
  await page.goto(origin + '/room-studio');
  await panel();
  await button('Thêm cửa').click();
  await page.getByLabel('Tường đặt cửa').selectOption('right');
  await page.getByLabel('Cách đầu tường (cm)').fill('30');
  await page.getByLabel('Hướng mở').selectOption('outward');
  assert.equal(await page.locator('[data-door-id]').getAttribute('data-offset'), '0.3');
  assert.deepEqual((await snapshot(page))?.elements ?? [], []);
  await button('Bỏ bản xem trước').click();
  assert.equal(await page.locator('[data-door-id]').count(), 0);

  await button('Thêm cửa').click();
  await page.getByLabel('Tường đặt cửa').selectOption('back');
  await page.getByLabel('Bản lề').selectOption('right');
  await page.getByLabel('Cách đầu tường (cm)').fill('22');
  await page.getByLabel('Rộng cửa (cm)').fill('500');
  assert.equal(await button('Áp dụng').isEnabled(), false);
  await page.getByLabel('Rộng cửa (cm)').fill('85');
  await page.getByLabel('Cao cửa (cm)').fill('208');
  await button('Áp dụng').click();
  await waitForDoors(page, 1, 0.22);
  const [original] = (await snapshot(page)).elements;
  assert.equal(original.hinge, 'right');
  assert.equal(original.width, 0.85);
  assert.equal(original.height, 2.08);
  await dragDoor(page, mobile);
  await page.waitForFunction(() => document.querySelector('[data-door-id]')?.getAttribute('data-offset') === '0.46');
  assert.deepEqual((await snapshot(page)).elements, [original]);
  await button('Áp dụng').click();
  await waitForDoors(page, 1, 0.46);
  await page.getByRole('button', { name: /^Hoàn tác · Chỉnh cửa/ }).click();
  await waitForDoors(page, 1, 0.22);
  await page.getByRole('button', { name: /^Làm lại · Chỉnh cửa/ }).click();
  await waitForDoors(page, 1, 0.46);
  await page.reload();
  await panel();
  assert.equal(await page.getByLabel('Cách đầu tường (cm)').inputValue(), '46');
  await page.getByLabel('Rộng cửa (cm)').scrollIntoViewIfNeeded();
  if (mobile) {
    await cameraScreenshot(page, 'mobile-editor');
    await navRoom.click();
  }
  await cameraScreenshot(page, side + '-perspective');
  await button('Mặt bằng').click();
  await cameraScreenshot(page, side + '-plan');
  if (mobile) await panel();
  else {
    await button('Phối cảnh').click();
    await page.getByLabel('Tường đặt cửa').selectOption('front');
    await page.getByLabel('Hiện cửa mở').uncheck();
    await button('Áp dụng').click();
    await page.getByLabel('Tự làm mờ tường chắn').scrollIntoViewIfNeeded();
    await cameraScreenshot(page, 'front-cutaway');
    assert.equal((await snapshot(page)).elements[0].wall, 'front');
    await page.getByLabel('Tự làm mờ tường chắn').click();
    await button('Áp dụng').click();
    await cameraScreenshot(page, 'front-enclosed');
    assert.equal((await snapshot(page)).architecture.cutaway, false);
  }
  await button('Gỡ cửa').click();
  assert.equal((await snapshot(page)).elements[0].id, original.id);
  await button('Áp dụng').click();
  await waitForDoors(page, 0);
}

async function checkFixture(page) {
  const otherDesign = JSON.stringify({ version: 1, dimensions: { length: 4, width: 3, height: 2.6 } });
  const manual = JSON.stringify([{ productId: 'manual', name: 'Manual quote item', quantity: 2 }]);
  await page.addInitScript(({ roomKey, quoteKey, foreignKey, otherDesign, manual }) => {
    if (localStorage.getItem(roomKey)) return;
    localStorage.setItem(foreignKey, otherDesign);
    localStorage.setItem(quoteKey, manual);
    localStorage.setItem(roomKey, JSON.stringify({
      version: 1, dimensions: { length: 3, width: 2, height: 2.7 },
      architecture: { window: true, glassPartition: false },
      placedProducts: [{ productId: 'llv-toi-toto-cs948dt8', instanceId: 'wc', placementType: 'floor',
        rotationY: 0, position: [-0.62, 0.403, -0.62] }],
    }));
  }, { roomKey, quoteKey, foreignKey, otherDesign, manual });
  await page.goto(origin + '/room-studio');
  const apply = page.getByRole('button', { name: 'Áp dụng', exact: true });
  await page.getByRole('button', { name: 'Thêm cửa', exact: true }).click();
  await page.getByLabel('Tường đặt cửa').selectOption('back');
  await page.getByLabel('Cách đầu tường (cm)').fill('50');
  await page.getByText(/vùng mở cửa vướng.*TOTO/i).first().waitFor();
  assert.equal(await apply.isEnabled(), false);
  assert.deepEqual((await snapshot(page)).elements?.filter(e => e.type === 'entrance-door') ?? [], []);
  await apply.scrollIntoViewIfNeeded();
  await cameraScreenshot(page, 'swing-conflict');
  await page.getByLabel('Hướng mở').selectOption('outward');
  await apply.click();
  await waitForDoors(page, 1, 0.5);
  const saved = await snapshot(page);
  assert.equal(saved.version, 3);
  assert.equal(saved.architecture.window, true);
  assert.equal(saved.architecture.glassPartition, false);
  assert.equal(saved.placedProducts[0].instanceId, 'wc');
  assert.deepEqual(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [quoteKey, foreignKey]), [manual, otherDesign]);
}

try {
  for (const mode of ['desktop', 'mobile', 'fixture']) {
    const mobile = mode === 'mobile';
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile, hasTouch: mobile, locale: 'vi-VN',
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return /^https?:$/.test(url.protocol) && url.origin !== origin ? route.abort() : route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (mode === 'fixture') await checkFixture(page);
    else await exercise(page, mobile);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(mode + ' passed');
  }
} finally {
  await browser.close();
}

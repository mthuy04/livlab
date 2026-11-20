import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.ROOM_QA_PLAYWRIGHT ?? 'playwright-core');
const origin = process.env.ROOM_QA_ORIGIN ?? 'http://127.0.0.1:3000';
const output = process.env.ROOM_QA_OUTPUT ?? 'artifacts/room-studio-p07/smart';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.ROOM_QA_CHROMIUM,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const room = 'livlab_room_studio_state_v1',
  basket = 'livlab_quote_items';
const id = 'llv-toi-toto-cs948dt8';
const manual = {
  productId: id,
  quantity: 7,
  name: 'Manual QA',
  sku: 'manual',
  priceMin: 10,
  priceMax: 10,
  addedAt: 'before',
  priceRange: '10đ',
};
try {
  for (const [device, width, height] of [
    ['desktop', 1440, 900],
    ['tablet', 768, 1024],
    ['mobile', 390, 844],
  ]) {
    if (process.argv[2] && device !== process.argv[2]) continue;
    const touch = device !== 'desktop';
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    await ctx.route('**/*', (r) => (new URL(r.request().url()).origin === origin ? r.continue() : r.abort()));
    await ctx.addInitScript(
      ({ room, basket, id, manual, touch }) => {
        if (localStorage.getItem(room)) return;
        localStorage.setItem(basket, JSON.stringify([manual]));
        localStorage.setItem(
          room,
          JSON.stringify({
            version: 3,
            dimensions: { length: 3, width: 2, height: 2.7 },
            elements: [
              {
                id: 'door',
                type: 'entrance-door',
                wall: 'back',
                offset: 0.5,
                width: 0.85,
                height: 2,
                mechanism: 'hinged',
                hinge: 'left',
                swing: 'inward',
                open: true,
              },
            ],
            placedProducts: [
              {
                productId: id,
                instanceId: 'wc',
                placementType: 'floor',
                rotationY: 0,
                position: [touch ? -0.62 : 0.45, 0.403, -0.62],
              },
            ],
          })
        );
      },
      { room, basket, id, manual, touch }
    );
    const page = await ctx.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const button = (name) => page.getByRole('button', { name, exact: true });
    const nav = (name) =>
      page.getByRole('navigation', { name: 'Khu vực làm việc' }).getByRole('button', { name, exact: true });
    const read = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
    const shot = async (label) => page.screenshot({ path: join(output, device + '-' + label + '.png') });
    try {
      await page.goto(origin + '/room-studio');
      if (touch) await nav('Phòng').click();
      await page.getByText('Công cụ hình học', { exact: true }).click();
      await page.getByLabel('Số đo (cm)').check();
      await page.getByLabel(/Vùng chiếm chỗ/).check();
      if (touch) await nav('Phòng').click();
      await shot('measurements');
      if (!touch) {
        await button('Mặt bằng').click();
        const canvas = page.locator('canvas');
        await canvas.waitFor();
        await page.waitForTimeout(650);
        const rect = await canvas.boundingBox();
        const zoom = Math.min(rect.width / 3.8, rect.height / 2.8);
        const y = rect.y + rect.height / 2 - 0.62 * zoom;
        await page.mouse.move(rect.x + rect.width / 2 + 0.45 * zoom, y);
        await page.mouse.down();
        await page.mouse.move(rect.x + rect.width / 2 - 0.62 * zoom, y, { steps: 8 });
        await page
          .getByRole('status', { name: 'Vị trí đang kéo' })
          .filter({ hasText: /vùng mở cửa vướng/ })
          .waitFor();
        assert.equal((await read(room)).placedProducts[0].position[0], 0.45);
        await shot('live-door-warning');
        await page.mouse.up();
        await page.waitForFunction(
          (k) => JSON.parse(localStorage.getItem(k)).placedProducts[0].position[0] < 0,
          room
        );
        await button('Phối cảnh').click();
      }
      const before = (await read(room)).placedProducts[0];
      if (touch) {
        await button('Tuỳ chọn phòng').click();
        await button('Lưu thiết kế vào giỏ báo giá').click();
      } else await button('Lưu thiết kế').click();
      await page.waitForFunction(
        (k) => JSON.parse(localStorage.getItem(k)).some((i) => i.roomDesignId),
        basket
      );
      if (touch) await nav('Kỹ thuật').click();
      else await page.getByTitle('Mở thẻ Kỹ thuật').click();
      const select = page.getByLabel('Xung đột cần xử lý');
      const issue = await select
        .locator('option')
        .evaluateAll(
          (options) => options.find((o) => o.value.startsWith('door:') && o.value.includes('swing'))?.value
        );
      assert.ok(issue);
      await select.selectOption(issue);
      await button('SMART FIX').click();
      await button('Xem trước phương án 1').click();
      assert.deepEqual((await read(room)).placedProducts[0], before);
      assert.deepEqual((await read(basket))[0], manual);
      await shot('smart-fix-preview');
      await button('Áp dụng').click();
      await page.waitForFunction(
        ({ k, p }) =>
          JSON.stringify(JSON.parse(localStorage.getItem(k)).placedProducts[0]) !== JSON.stringify(p),
        { k: room, p: before }
      );
      const after = (await read(room)).placedProducts[0];
      await page.getByRole('button', { name: /^Hoàn tác ·/ }).click();
      await page.waitForFunction(
        ({ k, p }) =>
          JSON.stringify(JSON.parse(localStorage.getItem(k)).placedProducts[0]) === JSON.stringify(p),
        { k: room, p: before }
      );
      await page.getByRole('button', { name: /^Làm lại ·/ }).click();
      await page.waitForFunction(
        ({ k, p }) =>
          JSON.stringify(JSON.parse(localStorage.getItem(k)).placedProducts[0]) === JSON.stringify(p),
        { k: room, p: after }
      );
      if (!touch) {
        await page.locator('[data-product-instance="wc"]').first().click({ force: true });
        const replace = page.getByLabel('Thay sản phẩm', { exact: true });
        await replace.selectOption('llv-toi-inax-ac602vn');
        await page.getByText('Ngân sách tham khảo', { exact: true }).last().waitFor();
        assert.equal((await read(basket))[1].productId, id);
        await shot('replacement-budget');
        await button('Áp dụng').click();
        await page.waitForFunction(
          (k) =>
            JSON.parse(localStorage.getItem(k)).some(
              (i) => i.roomDesignId && i.productId === 'llv-toi-inax-ac602vn'
            ),
          basket
        );
        await page.getByRole('button', { name: /^Hoàn tác · Thay sản phẩm/ }).click();
        await page.waitForFunction(
          ({ k, id }) =>
            JSON.parse(localStorage.getItem(k)).some((i) => i.roomDesignId && i.productId === id),
          { k: basket, id }
        );
      }
      await page.reload();
      assert.deepEqual((await read(basket))[0], manual);
      assert.equal((await read(basket)).length, 2);
      if (!touch) {
        const linkedBasket = await read(basket);
        await page.evaluate((key) => {
          const layout = JSON.parse(localStorage.getItem(key));
          delete layout.quoteDesignId;
          layout.elements.push({
            id: 'walk-in',
            type: 'shower-partition',
            x: 0.75,
            z: 0.1,
            rotation: 90,
            length: 1.2,
            height: 2,
            entrySide: 'left',
            mechanism: 'walk-in',
            swing: 'forward',
            open: false,
            glazing: 'clear',
          });
          layout.placedProducts.push({
            productId: 'livlab-3d-bfv-70s',
            instanceId: 'shower',
            placementType: 'wall',
            wall: 'back',
            position: [1.05, 1.3, -0.72],
            rotationY: 0,
          });
          localStorage.setItem(key, JSON.stringify(layout));
        }, room);
        await page.reload();
        await page.getByText('Công cụ hình học', { exact: true }).click();
        await page.getByLabel('Số đo (cm)').check();
        await page.getByLabel(/Vùng chiếm chỗ/).check();
        await button('Mặt bằng').click();
        for (const label of ['Ướt · gợi ý', 'Khô · gợi ý', 'Lối vào 60 cm', '120 cm']) {
          await page.getByText(label, { exact: true }).first().waitFor();
        }
        await shot('shower-zones');
        await page.getByLabel(/Vùng chiếm chỗ/).uncheck();
        await page.getByText('Ướt · gợi ý', { exact: true }).waitFor({ state: 'hidden' });
        assert.deepEqual(await read(basket), linkedBasket);
      }
      assert.deepEqual(errors, []);
      console.log(device + ' passed');
    } finally {
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

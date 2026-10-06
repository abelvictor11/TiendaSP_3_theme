import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';

const url = process.env.INSTITUTIONAL_PREVIEW_URL || 'http://localhost:4173';
test('institutional sections render, hydrate and prepare contact on desktop and mobile', async () => {
  const server = process.env.INSTITUTIONAL_PREVIEW_URL
    ? null
    : spawn(process.execPath, ['scripts/preview-institutional-projects.mjs'], {
        cwd: new URL('../..', import.meta.url),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
  if (server)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        server.kill();
        reject(new Error('Preview server startup timed out'));
      }, 20000);
      server.stdout.on('data', (data) => {
        if (data.toString().includes('Institutional UI preview:')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      server.on('exit', (code) => {
        if (code) {
          clearTimeout(timeout);
          reject(new Error(`Preview server exited ${code}`));
        }
      });
    });
  const browser = await chromium.launch({headless: true});
  try {
    for (const viewport of [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ]) {
      const page = await browser.newPage({viewport});
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url, {waitUntil: 'networkidle'});
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(
        (await page.locator('h1').textContent()).includes(
          'Tu proyecto fitness',
        ),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((img) => img.decode());
        assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({path: `/tmp/institutional-${viewport.width}.png`});
      await page.locator('a[href="#asesoria"]').first().click();
      assert.equal(new URL(page.url()).hash, '#asesoria');
      const form = page.locator('form');
      assert.equal(await form.getAttribute('method'), 'post');
      await form.locator('button[type=submit]').click();
      assert.equal(new URL(page.url()).hostname, new URL(url).hostname);
      const fields = {
        name: 'Prueba de interfaz',
        company: 'Institución de prueba',
        email: 'test@example.com',
        phone: '3000000000',
        city: 'Medellín',
        area: '120',
        message: 'Prueba técnica. No enviar.',
      };
      for (const [name, value] of Object.entries(fields))
        await form.locator(`[name="${name}"]`).fill(value);
      await form.locator('[name=sector]').selectOption({label: 'Hotel o club'});
      await form.locator('button[type=submit]').click();
      assert.equal(new URL(page.url()).hostname, new URL(url).hostname);
      await form.locator('[name=consent]').check();
      await form.screenshot({
        path: `/tmp/institutional-contact-${viewport.width}.png`,
      });
      const requested = page.waitForRequest((request) =>
        request.url().startsWith('https://wa.me/'),
      );
      await page.route('https://wa.me/**', (route) => route.abort());
      await form.locator('button[type=submit]').click();
      const target = new URL((await requested).url());
      assert.equal(target.pathname, '/573108183750');
      assert.ok(
        target.searchParams.get('text').includes('Institución de prueba'),
      );
      assert.ok(target.searchParams.get('text').includes('120 m²'));
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally {
    await browser.close();
    server?.kill();
  }
});

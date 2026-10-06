import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
import {build} from 'esbuild';

const path = new URL('../../app/lib/institutional.ts', import.meta.url);
test('institutional landing has an editable content adapter', () => {
  assert.ok(existsSync(path), 'missing institutional content adapter');
});
if (existsSync(path)) {
  const {outputFiles} = await build({
    entryPoints: [path.pathname],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
  });
  const api = await import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
  );
  test('unconfigured landing gets the PDF-backed default sections', () => {
    const route = api.resolveInstitutionalRoute(null);
    const blocks = route.sections.references.nodes.map(
      api.readInstitutionalSection,
    );
    assert.equal(blocks[0].variant, 'hero');
    assert.ok(blocks.some((s) => s.variant === 'contact'));
    assert.ok(blocks.some((s) => s.variant === 'projects'));
  });
  test('a deliberately empty builder route stays empty', () => {
    const route = {sections: {references: {nodes: []}}};
    assert.equal(api.resolveInstitutionalRoute(route), route);
  });
  test('editorial text and reordered items override defaults', () => {
    const block = api.readInstitutionalSection({
      id: 'custom',
      institutional_variant: {value: 'sectors'},
      institutional_heading: {value: 'Tu proyecto'},
      institutional_items: {
        references: {
          nodes: [{id: 'a', institutional_title: {value: 'Hospitales'}}],
        },
      },
    });
    assert.equal(block.heading, 'Tu proyecto');
    assert.equal(block.items[0].title, 'Hospitales');
  });
  test('unsafe editorial URLs cannot become actionable links', () => {
    for (const value of [
      'javascript:alert(1)',
      '//evil.test',
      'data:text/html,hello',
      'https://test.com/\n',
    ])
      assert.equal(api.safeInstitutionalUrl(value), '');
    assert.equal(api.safeInstitutionalUrl('#asesoria'), '#asesoria');
    assert.equal(
      api.safeInstitutionalUrl('/collections/cardio'),
      '/collections/cardio',
    );
  });
  test('contact validates consent and required fields before preparing WhatsApp', () => {
    assert.throws(() =>
      api.buildInstitutionalInquiry({name: '', consent: false}, '573108183750'),
    );
    assert.throws(() =>
      api.buildInstitutionalInquiry(
        {name: 'Victor', email: 'bad', consent: true},
        '573108183750',
      ),
    );
  });
  test('WhatsApp message includes the company, sector and project brief', () => {
    const url = api.buildInstitutionalInquiry(
      {
        name: 'Victor',
        company: 'Hotel & Spa',
        email: 'test@example.com',
        phone: '3108183750',
        city: 'Medellín',
        sector: 'Hoteles',
        area: '80',
        message: 'Renovar gimnasio',
        consent: true,
      },
      '+57 310 818 3750',
    );
    assert.equal(new URL(url).pathname, '/573108183750');
    const text = new URL(url).searchParams.get('text');
    assert.match(text, /Hotel & Spa/);
    assert.match(text, /Renovar gimnasio/);
    assert.match(text, /80 m²/);
  });
}

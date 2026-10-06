import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

// Execute the real utility without needing the storefront SDK or a live shop.
function loadUtility(path, names, dependencies = {}) {
  const source = stripTypeScriptTypes(readFileSync(new URL(path, import.meta.url), 'utf8'))
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export /g, '');
  return runInNewContext(`${source}\n;({${names.join(',')}})`, {
    URL, Request, Response, console, ...dependencies,
  });
}

test('numbered collection page loader exists', () => {
  assert.ok(existsSync(new URL('../app/utils/loadCollectionPage.ts', import.meta.url)),
    'collections need a loader that resolves numbered pages');
});

const {getPaginationAndFiltersFromRequest} = loadUtility(
  '../app/utils/getPaginationAndFiltersFromRequest.ts',
  ['getPaginationAndFiltersFromRequest'], {
    FILTER_URL_PREFIX: 'filter.',
    getPaginationVariables: () => ({first: 24, endCursor: 'legacy-cursor'}),
    getSortValuesFromParam: () => ({sortKey: 'PRICE', reverse: true}),
  });

test('numbered collection pages preserve the existing cursor API for other routes', () => {
  const result = getPaginationAndFiltersFromRequest(new Request('https://shop.test/collections/bikes?page=13&filter.available=true'));
  assert.equal(result.page, 13);
  assert.equal(result.paginationVariables.endCursor, 'legacy-cursor');
  assert.equal(result.filters[0].available, true);
});

test('invalid numbered pages fall back to the first page', () => {
  for (const page of ['0', '-1', 'NaN', '2.5', 'Infinity', 'abc']) {
    const result = getPaginationAndFiltersFromRequest(new Request(`https://shop.test/collections/bikes?page=${page}`));
    assert.equal(result.page, 1);
  }
});

test('pagination links keep filters and sort, and remove old cursors', () => {
  const component = readFileSync(new URL('../app/components/PaginationBar.tsx', import.meta.url), 'utf8');
  const source = component.slice(component.indexOf('  function getPageUrl('), component.indexOf('  function handleJumpSubmit('));
  const getPageUrl = runInNewContext(`${stripTypeScriptTypes(source)}; getPageUrl`, {
    URLSearchParams,
    searchParams: new URLSearchParams('page=4&sort=newest&filter.available=true&cursor=old&direction=next'),
  });
  const next = new URLSearchParams(getPageUrl(5).slice(1));
  assert.equal(next.get('page'), '5');
  assert.equal(next.get('sort'), 'newest');
  assert.equal(next.get('filter.available'), 'true');
  assert.equal(next.has('cursor'), false);
  assert.equal(next.has('direction'), false);
  assert.equal(new URLSearchParams(getPageUrl(1).slice(1)).has('page'), false);
});

const loaderPath = '../app/utils/loadCollectionPage.ts';
if (existsSync(new URL(loaderPath, import.meta.url))) {
  const stock = loadUtility('../app/utils/fetchProductsStockFirst.ts',
    ['fetchProductsStockFirst', 'getTotalProductsForAppliedFilters', 'hasAvailabilityFilter'],
    {COMMON_PRODUCT_CARD_FRAGMENT: ''});
  const {loadCollectionPage} = loadUtility(loaderPath, ['loadCollectionPage'], stock);
  const facet = {id: 'filter.v.availability', values: [
    {count: 600, input: '{"available":true}'},
    {count: 0, input: '{"available":false}'},
  ]};
  const products = Array.from({length: 600}, (_, index) => ({id: String(index + 1)}));
  function storefront() {
    const calls = [];
    return {calls, i18n: {country: 'CO', language: 'ES'},
      async query(_, {variables}) {
        calls.push(variables);
        const start = Number(variables.after || 0);
        const end = Math.min(start + variables.first, products.length);
        return {collection: {id: 'collection', products: {
          nodes: products.slice(start, end), filters: [facet],
          pageInfo: {endCursor: String(end), hasNextPage: end < products.length},
        }}};
      },
    };
  }
  const args = {handle: 'bikes', collectionQuery: 'query',
    filters: [{available: true}], sortKey: 'PRICE', reverse: true};

  test('page 13 chains cursors beyond the 250-product API limit', async () => {
    const shop = storefront();
    const result = await loadCollectionPage({...args, storefront: shop, page: 13});
    assert.equal(result.products[0].id, '289');
    assert.equal(result.products.length, 24);
    assert.equal(result.totalProducts, 600);
    assert.equal(result.currentPage, 13);
    assert.deepEqual(shop.calls.map(v => v.first), [1, 250, 38, 24]);
    for (const call of shop.calls) {
      assert.deepEqual(call.filters, args.filters);
      assert.equal(call.sortKey, 'PRICE');
      assert.equal(call.reverse, true);
    }
  });

  test('availability filtering counts only the chosen availability', () => {
    assert.equal(stock.getTotalProductsForAppliedFilters([{available: false}], facet), 0);
    assert.equal(stock.getTotalProductsForAppliedFilters([{available: true}], facet), 600);
  });

  test('unknown collections keep the 404 response', async () => {
    const shop = {i18n: {country: 'CO', language: 'ES'}, query: async () => ({collection: null})};
    await assert.rejects(loadCollectionPage({...args, storefront: shop, page: 1}),
      error => error instanceof Response && error.status === 404);
  });

  test('collections without an availability facet still have pagination totals', async () => {
    const shop = storefront();
    const query = shop.query.bind(shop);
    shop.query = async (...input) => {
      const result = await query(...input);
      result.collection.products.filters = [];
      return result;
    };
    const result = await loadCollectionPage({...args, filters: [], storefront: shop, page: 1});
    assert.equal(result.totalProducts, 600);
    assert.equal(result.products.length, 24);
  });

  test('a stale page URL loads the last available page', async () => {
    const result = await loadCollectionPage({...args, storefront: storefront(), page: 999});
    assert.equal(result.currentPage, 25);
    assert.equal(result.products[0].id, '577');
  });
}

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { StoreService } = require('../dist/store/store.service');
const { MockGeoProvider } = require('../dist/providers/geo/mock-geo.provider');
const { ShopsService } = require('../dist/shops/shops.service');
const { ShopsController } = require('../dist/shops/shops.controller');

test('GET /api/shops radius filter, sorting, and enrichment fields', async (t) => {
  const store = new StoreService();
  const geo = new MockGeoProvider();
  const service = new ShopsService(store, geo);
  const controller = new ShopsController(service);

  await t.test('returns only shops within 10km and excludes shops beyond 10km', () => {
    // Cheras center
    const results = service.findAll(3.139, 101.6869, 10);

    // 16 shops + 3 freelance = 19 inside 10km
    assert.equal(results.length, 19, `Expected 19 shops/freelance within 10km, got ${results.length}`);

    // Verify the 4 outside shops are excluded
    const outsideIds = ['shop-017', 'shop-018', 'shop-019', 'shop-020'];
    for (const id of outsideIds) {
      assert.equal(results.some((s) => s.id === id), false, `Shop ${id} should be filtered out`);
    }

    // Verify freelance shops are included
    const freelance = results.filter((s) => s.kind === 'freelance');
    assert.equal(freelance.length, 3, 'Expected 3 freelance barbers');
  });

  await t.test('enriches each shop with lat, lng, distanceKm, openNow, kind, and minPriceSen', () => {
    const results = service.findAll(3.139, 101.6869, 10);
    for (const shop of results) {
      assert.equal(typeof shop.lat, 'number');
      assert.equal(typeof shop.lng, 'number');
      assert.equal(typeof shop.distanceKm, 'number');
      assert.equal(typeof shop.openNow, 'boolean');
      assert.ok(shop.kind === 'shop' || shop.kind === 'freelance');
      assert.equal(typeof shop.minPriceSen, 'number');
      assert.ok(shop.minPriceSen > 0);
    }
  });

  await t.test('sorts results ascending by distanceKm', () => {
    const results = service.findAll(3.139, 101.6869, 10);
    for (let i = 0; i < results.length - 1; i++) {
      assert.ok(
        results[i].distanceKm <= results[i + 1].distanceKm,
        `Expected results[${i}].distanceKm (${results[i].distanceKm}) <= results[${i + 1}].distanceKm (${results[i + 1].distanceKm})`,
      );
    }
  });

  await t.test('controller clamps radiusKm to maximum 10km', () => {
    // Querying with radiusKm=50 should still be clamped to 10
    const results = controller.findAll('3.139', '101.6869', '50');
    assert.equal(results.length, 19, 'Clamped radius to 10km should only return 19 results');
  });

  await t.test('smaller radius returns subset of shops', () => {
    const results5km = service.findAll(3.139, 101.6869, 5);
    assert.ok(results5km.length < 19, '5km radius should return fewer shops than 10km');
    assert.ok(results5km.length > 0, '5km radius should return at least 1 shop');
    for (const shop of results5km) {
      assert.ok(shop.distanceKm <= 5.0, `Shop ${shop.id} distance ${shop.distanceKm} exceeds 5km`);
    }
  });
});

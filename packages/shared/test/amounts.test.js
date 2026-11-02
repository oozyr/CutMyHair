const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateBookingAmounts,
  SERVICE_MARKUP_SEN,
  PLATFORM_FEE_PERCENT,
  NOSHOW_DEPOSIT_SPLIT,
  formatSen,
  senToRm,
  rmToSen,
  PLANS,
  PLAN_LIST,
} = require('../dist');

test('constants are correctly configured', () => {
  assert.equal(SERVICE_MARKUP_SEN, 500);
  assert.equal(PLATFORM_FEE_PERCENT, 3);
  assert.deepEqual(NOSHOW_DEPOSIT_SPLIT, { shop: 70, cutmyhair: 30 });
});

test('calculateBookingAmounts computes correct financial splits for RM 15 service', () => {
  const result = calculateBookingAmounts(1500);
  assert.equal(result.servicePriceSen, 1500);
  assert.equal(result.markupSen, 500);
  assert.equal(result.customerTotalSen, 2000);
  assert.equal(result.platformFeeSen, 45); // 3% of 1500
  assert.equal(result.shopPayoutSen, 1455); // 1500 - 45

  // Total customer payment must equal shop payout + CutMyHair total revenue
  const cutmyhairRevenue = result.markupSen + result.platformFeeSen;
  assert.equal(result.shopPayoutSen + cutmyhairRevenue, result.customerTotalSen);
});

test('calculateBookingAmounts computes correct financial splits for RM 20 service', () => {
  const result = calculateBookingAmounts(2000);
  assert.equal(result.servicePriceSen, 2000);
  assert.equal(result.markupSen, 500);
  assert.equal(result.customerTotalSen, 2500);
  assert.equal(result.platformFeeSen, 60); // 3% of 2000
  assert.equal(result.shopPayoutSen, 1940); // 2000 - 60
  assert.equal(result.shopPayoutSen + result.markupSen + result.platformFeeSen, result.customerTotalSen);
});

test('calculateBookingAmounts handles zero price safely', () => {
  const result = calculateBookingAmounts(0);
  assert.equal(result.servicePriceSen, 0);
  assert.equal(result.markupSen, 500);
  assert.equal(result.customerTotalSen, 500);
  assert.equal(result.platformFeeSen, 0);
  assert.equal(result.shopPayoutSen, 0);
});

test('money formatting helpers work correctly', () => {
  assert.equal(formatSen(1500), 'RM 15.00');
  assert.equal(formatSen(45), 'RM 0.45');
  assert.equal(formatSen(0), 'RM 0.00');
  assert.equal(formatSen(11900), 'RM 119.00');
  assert.equal(senToRm(1550), 15.5);
  assert.equal(rmToSen(15.5), 1550);
  assert.equal(rmToSen('RM 20.00'), 2000);
});

test('subscription plans and feature flags are properly defined', () => {
  assert.equal(PLAN_LIST.length, 3);
  assert.equal(PLANS.base.priceMonthlySen, 3900);
  assert.equal(PLANS.base.includedBarbers, 2);
  assert.equal(PLANS.base.extraBarberPriceSen, 600);
  assert.equal(PLANS.base.features.onlinePayments, true);
  assert.equal(PLANS.base.features.payroll, false);

  assert.equal(PLANS.pro.priceMonthlySen, 7900);
  assert.equal(PLANS.pro.includedBarbers, 4);
  assert.equal(PLANS.pro.extraBarberPriceSen, 900);
  assert.equal(PLANS.pro.features.payroll, true);
  assert.equal(PLANS.pro.features.multiBranch, false);

  assert.equal(PLANS.max.priceMonthlySen, 11900);
  assert.equal(PLANS.max.includedBarbers, 6);
  assert.equal(PLANS.max.extraBarberPriceSen, 1500);
  assert.equal(PLANS.max.features.multiBranch, true);
  assert.equal(PLANS.max.features.analytics, true);
});

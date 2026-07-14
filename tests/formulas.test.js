import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  safeNum, roundVND, costOf, itemTotal, sumRevenue, itemVAT, sumVAT, revenueInclVAT,
  plannedCostOf, sumPlannedCost, sumActualCost, profit, profitMargin, itemMargin,
  avgProgress, evm, sCurveCumulative, sumContractValue, quotationBest, quotationTotalBest,
} from '../shared/formulas.js';

const items = [
  { qty: 10, unitPrice: 1000, internalCost: 700, vatRate: 10, progress: 50 },
  { qty: 5, unitPrice: 2000, unitCost: 1500, progress: 100 },
];

test('safeNum clamps non-finite and negatives', () => {
  assert.equal(safeNum('abc'), 0);
  assert.equal(safeNum(-5), 0);
  assert.equal(safeNum(3.7), 3.7);
  assert.equal(safeNum(undefined), 0);
});

test('roundVND rounds to whole dong', () => {
  assert.equal(roundVND(1234.56), 1235);
  assert.equal(roundVND(1234.4), 1234);
});

test('costOf prefers internalCost then unitCost', () => {
  assert.equal(costOf({ internalCost: 700 }), 700);
  assert.equal(costOf({ unitCost: 1500 }), 1500);
  assert.equal(costOf({}), 0);
  assert.equal(costOf(null), 0);
});

test('itemTotal = qty * unitPrice', () => {
  assert.equal(itemTotal(items[0]), 10000);
  assert.equal(itemTotal(items[1]), 10000);
});

test('sumRevenue excludes VAT (base)', () => {
  assert.equal(sumRevenue(items), 20000);
  assert.equal(sumRevenue([]), 0);
});

test('sumVAT sums per-item VAT honoring item.vatRate, default 10', () => {
  // item0: 10000 * 10% = 1000 ; item1: 10000 * 10%(default) = 1000 => 2000
  assert.equal(sumVAT(items), 2000);
  // override default to 0: item0 still has explicit vatRate:10, so only it contributes
  assert.equal(sumVAT(items, 0), 1000);
});

test('itemVAT honors item-level rate', () => {
  assert.equal(itemVAT(items[0], 10), 1000);
  assert.equal(itemVAT({ qty: 10, unitPrice: 1000, vatRate: 5 }, 10), 500);
});

test('revenueInclVAT adds VAT', () => {
  assert.equal(revenueInclVAT(20000, 2000), 22000);
});

test('plannedCostOf and sumPlannedCost use costOf*qty', () => {
  assert.equal(plannedCostOf(items[0]), 7000);
  assert.equal(sumPlannedCost(items), 7000 + 5 * 1500);
});

test('sumActualCost sums costLogs.amount', () => {
  assert.equal(sumActualCost([{ amount: 100 }, { amount: 250 }, {}]), 350);
  assert.equal(sumActualCost([]), 0);
});

test('profit = revenue - plannedCost', () => {
  assert.equal(profit(20000, 14500), 5500);
  assert.equal(profit(100, 200), -100);
});

test('profitMargin percent, safe when revenue 0', () => {
  assert.equal(profitMargin(5500, 20000), 27.5);
  assert.equal(profitMargin(100, 0), 0);
  assert.equal(profitMargin(0, 20000), 0);
});

test('itemMargin per-unit sell price basis', () => {
  assert.equal(itemMargin(items[0]), ((1000 - 700) / 1000) * 100); // 30
  assert.equal(itemMargin({ unitPrice: 0 }), 0);
});

test('avgProgress simple vs weighted', () => {
  const list = [
    { qty: 1, unitPrice: 100, progress: 0 },
    { qty: 1, unitPrice: 100, progress: 100 },
  ];
  assert.equal(avgProgress(list, 'simple'), 50);
  // weighted by qty*unitPrice: equal weights -> still 50
  assert.equal(avgProgress(list, 'weighted'), 50);
  // empty
  assert.equal(avgProgress([], 'simple'), 0);
  // unequal weights pulls toward bigger contract
  const w = [
    { qty: 1, unitPrice: 900, progress: 0 },
    { qty: 1, unitPrice: 100, progress: 100 },
  ];
  assert.equal(avgProgress(w, 'weighted'), 10);
});

test('avgProgress simple matches single-project dashboard expectation', () => {
  const its = [
    { progress: 10 }, { progress: 20 }, { progress: 30 },
  ];
  assert.equal(avgProgress(its, 'simple'), 20);
});

test('evm computes CPI/SPI and is divide-by-zero safe', () => {
  const e = evm({ PV: 100, EV: 90, AC: 80 });
  assert.equal(e.CPI, Number((90 / 80).toFixed(2)));
  assert.equal(e.SPI, Number((90 / 100).toFixed(2)));
  assert.equal(e.CV, 10);
  assert.equal(e.SV, -10);
  // zero denominators -> 0, no NaN
  const z = evm({ PV: 0, EV: 0, AC: 0 });
  assert.equal(z.CPI, 0);
  assert.equal(z.SPI, 0);
  assert.equal(Number.isNaN(z.CPI), false);
});

test('sCurveCumulative accumulates plan/actual and variance', () => {
  const pts = [
    { week: 1, planned: 10, actual: 8 },
    { week: 2, planned: 20, actual: 22 },
  ];
  const out = sCurveCumulative(pts);
  assert.equal(out[0].cumPlan, 10);
  assert.equal(out[0].cumActual, 8);
  assert.equal(out[0].variance, -2);
  assert.equal(out[1].cumPlan, 30);
  assert.equal(out[1].cumActual, 30);
  assert.equal(out[1].variance, 2);
});

test('sumContractValue sums port contractValue', () => {
  assert.equal(sumContractValue([{ contractValue: 100 }, { contractValue: 250 }, {}]), 350);
});

test('quotationBest picks lowest positive supplier', () => {
  const q = { qty: 2, supplierA: 100, supplierB: 90, supplierC: 0 };
  assert.equal(quotationBest(q).name, 'Supplier B');
  assert.equal(quotationBest(q).val, 90);
  assert.equal(quotationTotalBest([q]), 180);
  assert.equal(quotationTotalBest([]), 0);
  assert.equal(quotationBest({ supplierA: 0, supplierB: 0, supplierC: 0 }).name, '-');
});

// Engine tính toán trung tâm — 1 nguồn sự thật cho cả server (db.js) và client.
// Pure ESM, không phụ thuộc React/Node. Mọi module GỌI từ đây, không tự viết công thức.

export const safeNum = (n, min = 0) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return v < min ? min : v;
};

export const roundVND = (n) => Math.round(Number(n) || 0);

export const costOf = (item) => safeNum(item?.internalCost ?? item?.unitCost ?? 0);

export const itemTotal = (item) => roundVND(safeNum(item?.qty) * safeNum(item?.unitPrice));

export const sumRevenue = (items = []) =>
  roundVND(items.reduce((s, i) => s + safeNum(i?.qty) * safeNum(i?.unitPrice), 0));

export const itemVatRate = (item, defaultRate = 10) =>
  safeNum(item?.vatRate != null ? item.vatRate : defaultRate);

export const itemVAT = (item, defaultRate = 10) =>
  roundVND(itemTotal(item) * itemVatRate(item, defaultRate) / 100);

export const sumVAT = (items = [], defaultRate = 10) =>
  roundVND(items.reduce((s, i) => s + itemVAT(i, defaultRate), 0));

export const revenueInclVAT = (revenue = 0, vat = 0) =>
  roundVND(safeNum(revenue) + safeNum(vat));

export const plannedCostOf = (item) => roundVND(safeNum(item?.qty) * costOf(item));

export const sumPlannedCost = (items = []) =>
  roundVND(items.reduce((s, i) => s + safeNum(i?.qty) * costOf(i), 0));

export const sumActualCost = (costLogs = []) =>
  roundVND(costLogs.reduce((s, c) => s + safeNum(c?.amount), 0));

export const profit = (revenue = 0, plannedCost = 0) =>
  roundVND(safeNum(revenue) - safeNum(plannedCost));

export const profitMargin = (profitVal = 0, revenue = 0) => {
  const r = safeNum(revenue);
  return r > 0 ? Number(((safeNum(profitVal) / r) * 100).toFixed(2)) : 0;
};

export const itemMargin = (item) => {
  const price = safeNum(item?.unitPrice);
  const cost = costOf(item);
  return price > 0 ? ((price - cost) / price) * 100 : 0;
};

export const avgProgress = (items = [], mode = 'simple') => {
  const list = items.filter(Boolean);
  if (list.length === 0) return 0;
  if (mode === 'weighted') {
    const weights = list.map((i) => safeNum(i?.qty) * safeNum(i?.unitPrice));
    const totalW = weights.reduce((s, w) => s + w, 0);
    if (totalW <= 0) {
      return Math.round(list.reduce((s, i) => s + safeNum(i?.progress), 0) / list.length);
    }
    const weighted = list.reduce((s, i, idx) => s + safeNum(i?.progress) * weights[idx], 0);
    return Math.round(weighted / totalW);
  }
  return Math.round(list.reduce((s, i) => s + safeNum(i?.progress), 0) / list.length);
};

export const evm = ({ PV = 0, EV = 0, AC = 0 } = {}) => {
  const pv = safeNum(PV);
  const ev = safeNum(EV);
  const ac = safeNum(AC);
  const CPI = ac > 0 ? ev / ac : 0;
  const SPI = pv > 0 ? ev / pv : 0;
  return {
    CPI: Number(CPI.toFixed(2)),
    SPI: Number(SPI.toFixed(2)),
    CV: roundVND(ev - ac),
    SV: roundVND(ev - pv),
  };
};

export const sCurveCumulative = (points = []) => {
  // Stored sCurve points already hold CUMULATIVE planned/actual percentages per week.
  return points.map((p) => {
    const planned = safeNum(p?.planned);
    const actual = p?.actual == null ? null : safeNum(p?.actual);
    return {
      ...p,
      label: p?.week != null ? `T${p.week}` : p?.label,
      plannedPct: planned / 100,
      actualPct: actual == null ? null : actual / 100,
      cumPlan: Number(planned.toFixed(2)),
      cumActual: actual == null ? null : Number(actual.toFixed(2)),
      variance: actual == null ? null : Number((actual - planned).toFixed(2)),
    };
  });
};

export const sumContractValue = (ports = []) =>
  roundVND(ports.reduce((s, p) => s + safeNum(p?.contractValue), 0));

export const quotationPrices = (q) => [
  { name: 'Supplier A', val: safeNum(q?.supplierA) },
  { name: 'Supplier B', val: safeNum(q?.supplierB) },
  { name: 'Supplier C', val: safeNum(q?.supplierC) },
];

export const quotationBest = (q) => {
  const prices = quotationPrices(q).filter((p) => p.val > 0);
  if (prices.length === 0) return { name: '-', val: 0 };
  return prices.reduce((min, p) => (p.val < min.val ? p : min));
};

export const quotationTotalBest = (quotes = []) =>
  roundVND(quotes.reduce((s, q) => s + quotationBest(q).val * safeNum(q?.qty), 0));

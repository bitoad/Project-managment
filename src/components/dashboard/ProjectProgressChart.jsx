import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area, Line, ReferenceLine } from 'recharts';

const COLORS = { planned: '#2F5CE0', actual: '#F5803E', grid: '#EEF1F6', axis: '#94a3b8', today: '#166534' };

function SCurveTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const planned = payload.find((p) => p.dataKey === 'planned');
  const actual = payload.find((p) => p.dataKey === 'actual');
  const pVal = planned?.value;
  const aVal = actual?.value;
  const delta = pVal != null && aVal != null ? aVal - pVal : null;
  return (
    <div className="ds-tooltip" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#1e293b' }}>{label}</div>
      {pVal != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.planned, display: 'inline-block' }} />
          <span style={{ color: '#64748b' }}>Kế hoạch:</span>
          <span style={{ fontWeight: 600, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{pVal}%</span>
        </div>
      )}
      {aVal != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.actual, display: 'inline-block' }} />
          <span style={{ color: '#64748b' }}>Thực tế:</span>
          <span style={{ fontWeight: 600, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{aVal}%</span>
        </div>
      )}
      {delta != null && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #f1f5f9', color: delta >= 0 ? COLORS.planned : '#EF4444', fontWeight: 600, fontSize: 12 }}>
          {delta >= 0 ? '+' : ''}{delta}% so với kế hoạch
        </div>
      )}
    </div>
  );
}

export default function ProjectProgressChart({ data = [], avgProgress = 0 }) {
  const chartData = useMemo(() => {
    if (data && data.length) {
      return data.map((d) => ({
        label: d.label,
        planned: Math.round((d.plannedPct || 0) * 100),
        actual: d.actualPct == null ? null : Math.round(d.actualPct * 100),
      }));
    }
    const target = Math.max(avgProgress, 1);
    const n = 12;
    return Array.from({ length: n }, (_, i) => {
      const planned = Math.round(((i + 1) / n) * target);
      return { label: `T${i + 1}`, planned, actual: null };
    });
  }, [data, avgProgress]);

  const hasActual = chartData.some((d) => d.actual != null);
  const lastIdx = chartData.length - 1;

  return (
    <div style={{ width: '100%', height: 300 }}>
      {chartData.length ? (
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.planned} stopOpacity={0.18} />
                <stop offset="100%" stopColor={COLORS.planned} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.actual} stopOpacity={0.14} />
                <stop offset="100%" stopColor={COLORS.actual} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.axis }} stroke="#E5E7EB" />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: COLORS.axis }} stroke="#E5E7EB" domain={[0, 100]} />
            <Tooltip content={<SCurveTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="planned" name="Kế hoạch (%)" stroke={COLORS.planned} strokeWidth={2} fill="url(#scPlanned)" dot={false} activeDot={{ r: 4 }} />
            {hasActual && (
              <>
                <Area type="monotone" dataKey="actual" name="Thực tế (%)" stroke={COLORS.actual} strokeWidth={2.5} fill="url(#scActual)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
                <ReferenceLine x={chartData[lastIdx]?.label} stroke={COLORS.today} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Hôm nay', position: 'insideTopRight', fill: COLORS.today, fontSize: 11, fontWeight: 600 }} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
          Chưa có dữ liệu S-Curve
        </div>
      )}
    </div>
  );
}

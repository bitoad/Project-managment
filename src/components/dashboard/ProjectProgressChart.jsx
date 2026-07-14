import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area, AreaChart } from 'recharts';
import { fmtChart } from '../shared/tokens.js';

// Renders the S-Curve from a prepared `data` array (planned%/actual% per week).
// Falls back to a synthetic linear planned ramp when `data` is empty.
export default function ProjectProgressChart({ data = [], avgProgress = 0 }) {
  const chartData = useMemo(() => {
    if (data && data.length) {
      return data.map((d) => ({
        label: d.label,
        planned: Math.round((d.plannedPct || 0) * 100),
        actual: d.actualPct == null ? null : Math.round(d.actualPct * 100),
      }));
    }
    // Fallback: synthetic linear planned curve from avgProgress
    const target = Math.max(avgProgress, 1);
    const n = 12;
    return Array.from({ length: n }, (_, i) => {
      const planned = Math.round(((i + 1) / n) * target);
      return { label: `T${i + 1}`, planned, actual: null };
    });
  }, [data, avgProgress]);

  const hasActual = chartData.some((d) => d.actual != null);

  return (
    <div style={{ width: '100%', height: 300 }}>
      {chartData.length ? (
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2F5CE0" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2F5CE0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: fmtChart.muted }} stroke="#E5E7EB" />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: fmtChart.muted }} stroke="#E5E7EB" domain={[0, 100]} />
            <Tooltip formatter={(v) => (v == null ? '—' : `${v}%`)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="planned" name="Kế hoạch (%)" stroke="#2F5CE0" strokeWidth={2} fill="url(#scPlanned)" dot={false} />
            {hasActual && (
              <Line type="monotone" dataKey="actual" name="Thực tế (%)" stroke="#F5803E" strokeWidth={2.5} dot={{ r: 2 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: fmtChart.muted, fontSize: 13 }}>
          Chưa có dữ liệu S-Curve
        </div>
      )}
    </div>
  );
}

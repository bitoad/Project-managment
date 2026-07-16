import React from 'react';
import { Progress } from 'antd';

// Health gauges: schedule / cost / procurement / engineering. value = 0-100.
export default function ProjectHealth({ items = [], subStats = [] }) {
  return (
    <div className="dash-metric-strip">
      {items.map((m) => {
        const v = Math.max(0, Math.min(100, Math.round(m.value || 0)));
        const color = v >= 80 ? 'var(--color-success)' : v >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
        return (
          <div className="dash-gauge" key={m.key}>
            <Progress
              type="dashboard"
              percent={v}
              size={96}
              strokeColor={color}
              format={(p) => (
                <span style={{ fontSize: 18, fontWeight: 700, color }}>
                  {p}
                  <span style={{ fontSize: 11, fontWeight: 500 }}>%</span>
                </span>
              )}
            />
            <div className="dash-gauge-label">{m.label}</div>
            {m.name && <div className="dash-gauge-name">{m.name}</div>}
          </div>
        );
      })}
      {subStats.length > 0 && (
        <div className="dash-health-substats">
          {subStats.map((s) => (
            <div className="dash-health-substat" key={s.key}>
              <span className="dash-health-substat-val" style={{ color: s.color || 'var(--color-text)' }}>{s.value}</span>
              <span className="dash-health-substat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

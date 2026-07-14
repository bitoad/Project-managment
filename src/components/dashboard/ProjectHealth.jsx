import React from 'react';
import { Progress } from 'antd';

// Health gauges: schedule / cost / procurement / engineering. value = 0-100.
export default function ProjectHealth({ items = [] }) {
  return (
    <div className="dash-metric-strip">
      {items.map((m) => {
        const v = Math.max(0, Math.min(100, Math.round(m.value || 0)));
        const color = v >= 80 ? '#1FA971' : v >= 60 ? '#F5A623' : '#EF4444';
        return (
          <div className="dash-gauge" key={m.key}>
            <Progress
              type="dashboard"
              percent={v}
              size={92}
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
            {m.name && <div className="dash-gauge-name">{m.name}</div>}
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { Empty } from 'antd';

// Props: title, icon (node), color, segments:[{label,value,color}], total, empty(bool)
export default function ModuleStatusCard({ title, icon, color = '#2F5CE0', segments = [], total = 0, empty = false }) {
  if (empty) {
    return (
      <div className="msc">
        <div className="msc-head">
          <span className="msc-icon" style={{ background: `${color}1a`, color }}>{icon}</span>
          <span className="msc-title">{title}</span>
          <span className="msc-total dash-muted">—</span>
        </div>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" style={{ margin: '12px 0' }} />
      </div>
    );
  }
  return (
    <div className="msc">
      <div className="msc-head">
        <span className="msc-icon" style={{ background: `${color}1a`, color }}>{icon}</span>
        <span className="msc-title">{title}</span>
        <span className="msc-total">{total}</span>
      </div>
      <div className="msc-bar">
        {segments.map((s, i) => (
          <span
            key={i}
            className="msc-seg"
            style={{ width: `${total ? (s.value / total) * 100 : 0}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <ul className="msc-legend">
        {segments.map((s, i) => (
          <li key={i}>
            <span className="msc-dot" style={{ background: s.color }} />
            {s.label}
            <b>{s.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

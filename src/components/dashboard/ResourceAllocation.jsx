import React from 'react';
import { Empty } from 'antd';

// data: { name, count, color }
export default function ResourceAllocation({ data = [] }) {
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhiệm vụ" />;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ul className="res-list">
      {data.slice(0, 8).map((d) => (
        <li className="res-item" key={d.name}>
          <span className="res-name">{d.name}</span>
          <span className="res-bar-wrap">
            <span className="res-bar" style={{ width: `${(d.count / max) * 100}%`, background: d.color }} />
          </span>
          <span className="res-count">{d.count}</span>
        </li>
      ))}
    </ul>
  );
}

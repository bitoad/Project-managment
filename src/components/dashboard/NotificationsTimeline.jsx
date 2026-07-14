import React from 'react';
import { Empty } from 'antd';

// items: { id, title, project, date, color }
export default function NotificationsTimeline({ items = [] }) {
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />;
  return (
    <ul className="nt-list">
      {items.slice(0, 7).map((n) => (
        <li className="nt-item" key={n.id}>
          <span className="nt-dot" style={{ background: n.color || '#2F5CE0' }} />
          <div className="nt-body">
            <div className="nt-title">{n.title}</div>
            <div className="nt-meta">
              <span className="nt-project">{n.project}</span>
              <span className="nt-date">{n.date}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

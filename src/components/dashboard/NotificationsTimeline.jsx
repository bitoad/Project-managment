import React from 'react';
import { BellOutlined } from '@ant-design/icons';
import EmptyState from '../shared/EmptyState.jsx';

// items: { id, title, project, date, color }
export default function NotificationsTimeline({ items = [] }) {
  if (!items.length) return <EmptyState icon={<BellOutlined />} title="Chưa có thông báo" />;
  return (
    <ul className="nt-list">
      {items.slice(0, 7).map((n) => (
        <li className="nt-item" key={n.id}>
          <span className="nt-dot" style={{ background: n.color || 'var(--color-primary)' }} />
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

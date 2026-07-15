import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import EmptyState from '../shared/EmptyState.jsx';

// items: { id, title, date (ISO), owner, days (number), color }
function ownerInitials(owner) {
  if (!owner) return '–';
  const parts = String(owner).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MilestonesPanel({ items = [], onOpen }) {
  if (!items.length) return <EmptyState icon={<CalendarOutlined />} title="Chưa có mốc" />;
  return (
    <ul className="ms-list">
      {items.slice(0, 8).map((m) => {
        const past = m.days < 0;
        return (
          <li className="ms-item" key={m.id} onClick={() => onOpen && onOpen(m)}>
            <div className="ms-date">
              <span className="ms-day">{new Date(m.date).getDate()}</span>
              <span className="ms-mon">T{new Date(m.date).getMonth() + 1}</span>
            </div>
            <div className="ms-body">
              <div className="ms-title">{m.title}</div>
              <div className="ms-meta">
                <span className="ms-avatar" style={{ background: m.color }}>{ownerInitials(m.owner)}</span>
                <span className="ms-owner">{m.owner || 'Chưa gán'}</span>
              </div>
            </div>
            <div className={`ms-chip ${past ? 'ms-past' : ''}`}>
              {past ? `trễ ${-m.days} ngày` : `còn ${m.days} ngày`}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

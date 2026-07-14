import React from 'react';

// counts: { overdue, open, blocked, completed }
export default function KanbanSnapshot({ counts = {}, onOpen }) {
  const cards = [
    { key: 'overdue', label: 'Quá hạn', value: counts.overdue || 0, color: '#EF4444' },
    { key: 'open', label: 'Đang mở', value: counts.open || 0, color: '#2F5CE0' },
    { key: 'blocked', label: 'Chặn', value: counts.blocked || 0, color: '#F5A623' },
    { key: 'completed', label: 'Hoàn thành', value: counts.completed || 0, color: '#1FA971' },
  ];
  return (
    <div className="ks-grid">
      {cards.map((c) => (
        <div className="ks-card" key={c.key} onClick={() => onOpen && onOpen(c)}>
          <div className="ks-value" style={{ color: c.color }}>{c.value}</div>
          <div className="ks-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

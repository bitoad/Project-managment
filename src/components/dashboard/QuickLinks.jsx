import React from 'react';
import {
  ProjectOutlined,
  AppstoreOutlined,
  InboxOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const quickLinks = [
  { to: '/projects', label: 'Dự án', icon: <ProjectOutlined />, accent: '#046754', accentEnd: '#0C342C' },
  { to: '/ports', label: 'Cảng', icon: <AppstoreOutlined />, accent: '#166534', accentEnd: '#1FA971' },
  { to: '/items', label: 'Hạng mục', icon: <InboxOutlined />, accent: '#D97706', accentEnd: '#F5A623' },
  { to: '/kanban', label: 'Kanban', icon: <UnorderedListOutlined />, accent: '#7C3AED', accentEnd: '#8B5CF6' },
  { to: '/timeline', label: 'Tiến độ', icon: <CalendarOutlined />, accent: '#0284C7', accentEnd: '#0EA5E9' },
  { to: '/team', label: 'Nhóm', icon: <TeamOutlined />, accent: '#DC2626', accentEnd: '#EF4444' },
  { to: '/cost', label: 'Chi phí', icon: <DollarOutlined />, accent: '#059669', accentEnd: '#10B981' },
  { to: '/risk', label: 'Rủi ro', icon: <WarningOutlined />, accent: '#EA580C', accentEnd: '#F5803E' },
];

export default function QuickLinks() {
  const navigate = useNavigate();

  return (
    <section className="col-12 ds-ql-wrap">
      <div className="ds-ql-head">
        <span className="ds-ql-title">Truy cập nhanh</span>
      </div>
      <div className="glass-section">
        <div className="ds-quicklinks">
          {quickLinks.map((q) => (
            <div
              key={q.to}
              className="glass-card"
              onClick={() => navigate(q.to)}
              style={{ '--glass-accent': q.accent, '--glass-accent-end': q.accentEnd }}
            >
              <div className="glass-icon-bubble">
                {q.icon}
              </div>
              <span className="glass-label">{q.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

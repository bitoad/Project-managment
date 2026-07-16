import React from 'react';
import { Select, Tooltip } from 'antd';
import {
  CalendarOutlined,
  FilterOutlined,
  PlusOutlined,
  DownloadOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fmtShort } from '../helpers.js';

export default function DashboardHero({
  portfolioView,
  projectId,
  projects,
  bannerTitle,
  user,
  todayStr,
  heroStats,
  projectOptions,
  onSelectProject,
  onCreateOpen,
  onExport,
  exporting,
}) {
  const heroInitial = (bannerTitle || 'D').trim().charAt(0).toUpperCase();

  return (
    <section className="col-12 dash-hero">
      <div className="dash-hero-bg" aria-hidden />
      <div className="dash-hero-top">
        <div className="dash-hero-id">
          <div className="dash-hero-avatar">
            {portfolioView ? <ProjectOutlined /> : heroInitial}
          </div>
          <div className="dash-hero-titles">
            <div className="dash-hero-eyebrow">
              <span className="dash-hero-dot" />
              {portfolioView ? 'Danh mục dự án' : 'Bảng điều khiển dự án'}
            </div>
            <h1 className="dash-hero-title">{bannerTitle}</h1>
            <div className="dash-hero-sub">
              Xin chào, <b>{user?.name || user?.username || 'Người dùng'}</b>
              <span className="dash-hero-sep">&bull;</span>
              <span className="dash-hero-date">
                <CalendarOutlined /> {todayStr}
              </span>
            </div>
          </div>
        </div>

        <div className="dash-hero-actions">
          <Select
            value={portfolioView ? 'all' : projectId}
            onChange={onSelectProject}
            popupMatchSelectWidth={false}
            className="dash-hero-select"
            options={projectOptions}
            suffixIcon={<FilterOutlined />}
          />
          <Tooltip title="Tải báo cáo tổng quan (PDF)">
            <button
              className={`btn btn-gradient dash-hero-export${exporting ? ' btn-loading' : ''}`}
              onClick={onExport}
            >
              <DownloadOutlined /> Xuất báo cáo
            </button>
          </Tooltip>
          <button
            className="btn btn-primary"
            onClick={onCreateOpen}
          >
            <PlusOutlined /> Thêm dự án
          </button>
        </div>
      </div>

      {/* live stat strip */}
      <div className="dash-hero-stats">
        {heroStats.map((s) => (
          <div className="dash-hero-stat" key={s.key}>
            <span
              className="dash-hero-stat-ic"
              style={{ color: s.tone, background: `${s.tone}1a` }}
            >
              {s.icon}
            </span>
            <span className="dash-hero-stat-body">
              <span className="dash-hero-stat-val">{s.value}</span>
              <span className="dash-hero-stat-lbl">{s.label}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Spin, message, Select, Tag, Segmented, Tooltip } from 'antd';
import { FieldTimeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { tasksApi, portsApi } from '../api/api.js';
import { PORT_COLORS, statusColor, TONE } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';
import PageLoader from '../components/shared/PageLoader.jsx';

const { Text } = Typography;

const STATUS_LABEL = {
  todo: 'Cần làm',
  inprogress: 'Đang làm',
  review: 'Kiểm tra',
  done: 'Hoàn thành',
};

const DAY_WIDTH = 40; // px mỗi ngày
const ROW_HEIGHT = 40;

export default function Timeline() {
  const { currentProjectId, portfolioView } = useProject();
  const [tasks, setTasks] = useState([]);
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPort, setFilterPort] = useState('all');
  const [groupBy, setGroupBy] = useState('port'); // port | owner | status

  const load = async () => {
    try {
      setLoading(true);
      const [t, p] = await Promise.all([
        tasksApi.getAll(currentProjectId, portfolioView),
        portsApi.getAll(currentProjectId, portfolioView),
      ]);
      setTasks(t);
      setPorts(p);
    } catch (e) {
      message.error('Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentProjectId, portfolioView]);

  // Lọc task có ngày bắt đầu & kết thúc
  const validTasks = useMemo(() => {
    return tasks
      .filter((t) => t.startDate && t.endDate)
      .filter((t) => filterPort === 'all' || t.portId === filterPort);
  }, [tasks, filterPort]);

  // Tính khoảng thời gian (min start → max end)
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (validTasks.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 30 };
    const starts = validTasks.map((t) => new Date(t.startDate).getTime());
    const ends = validTasks.map((t) => new Date(t.endDate).getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const days = Math.max(30, Math.ceil((max - min) / 86400000) + 5);
    return { minDate: new Date(min), maxDate: new Date(max), totalDays: days };
  }, [validTasks]);

  // Nhóm task theo tiêu chí
  const grouped = useMemo(() => {
    const groups = {};
    validTasks.forEach((t) => {
      let key;
      if (groupBy === 'port') key = t.portId || '(Không rõ)';
      else if (groupBy === 'owner') key = t.owner || '(Chưa giao)';
      else key = STATUS_LABEL[t.status] || t.status;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [validTasks, groupBy]);

  // Mảng các ngày trên timeline
  const days = useMemo(() => {
    const arr = [];
    const d = new Date(minDate);
    for (let i = 0; i < totalDays; i++) {
      arr.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  }, [minDate, totalDays]);

  // Gom ngày thành các tuần (bắt đầu Thứ 2)
  const weeks = useMemo(() => {
    const arr = [];
    let current = null;
    days.forEach((d, i) => {
      const isWeekStart = d.getDay() === 1; // Monday
      if (i === 0 || isWeekStart) {
        if (current) arr.push(current);
        current = {
          startIdx: i,
          endIdx: i,
          label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        };
      } else {
        current.endIdx = i;
      }
    });
    if (current) arr.push(current);
    return arr;
  }, [days]);

  // Tính offset (px) từ ngày bắt đầu timeline
  const dayOffset = (dateStr) => {
    const diff = Math.floor((new Date(dateStr) - minDate) / 86400000);
    return Math.max(0, diff) * DAY_WIDTH;
  };

  // Chiều rộng thanh (px)
  const barWidth = (start, end) => {
    const diff = Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
    return Math.max(DAY_WIDTH, diff * DAY_WIDTH);
  };

  if (loading) {
    return <div className="ds-container"><PageLoader /></div>;
  }

  const today = new Date();
  const todayOffset = Math.max(0, Math.floor((today - minDate) / 86400000)) * DAY_WIDTH;
  const timelineWidth = totalDays * DAY_WIDTH;
  const sidebarWidth = 220;

  return (
    <div className="ds-container">
      <div className="ds-page-header">
        <div>
          <div className="ds-h1"><FieldTimeOutlined /> Timeline</div>
          <div className="ds-caption">Tiến độ theo thời gian</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text type="secondary">Nhóm theo:</Text>
          <Segmented
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { label: 'Hạng mục', value: 'port' },
              { label: 'Người', value: 'owner' },
              { label: 'Trạng thái', value: 'status' },
            ]}
          />
          <Select
            value={filterPort}
            onChange={setFilterPort}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...ports.map((p) => ({ value: p.id, label: p.id })),
            ]}
          />
        </div>
      </div>

      <div className="ev-guide">
        <InfoCircleOutlined /> <b>Biểu đồ Gantt</b>: mỗi thanh là một công việc, vị trí &amp; độ dài thể hiện thời gian bắt đầu → kết thúc. Màu thanh = trạng thái (Cần làm / Đang làm / Kiểm tra / Hoàn thành). Dùng bộ lọc trên để thu hẹp theo Port hoặc người phụ trách.
      </div>

      {validTasks.length === 0 ? (
        <div className="ds-section">
          <EmptyState icon={<FieldTimeOutlined />} title="Không có công việc có ngày bắt đầu & kết thúc để hiển thị" />
        </div>
      ) : (
        <Card className="ds-chart-card" bordered={false} styles={{ body: { padding: 0 } }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: sidebarWidth + timelineWidth + 20, position: 'relative' }}>
              {/* Header: tuần / ngày */}
              <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 6, background: '#fff', flexDirection: 'column', borderBottom: '2px solid #f0f0f0' }}>
                {/* Hàng tuần */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ width: sidebarWidth, padding: '8px 12px', fontWeight: 700, background: '#fafafa', borderRight: '1px solid #f0f0f0' }}>
                    Tuần
                  </div>
                  <div style={{ display: 'flex' }}>
                    {weeks.map((w, wi) => (
                      <div
                        key={wi}
                        style={{
                          width: (w.endIdx - w.startIdx + 1) * DAY_WIDTH,
                          textAlign: 'center',
                          padding: '6px 0',
                          borderRight: '1px solid #f5f5f5',
                          fontSize: 11,
                          fontWeight: 600,
                          color: TONE.ink,
                        }}
                      >
                        {w.label}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Hàng ngày */}
                <div style={{ display: 'flex' }}>
                  <div style={{ width: sidebarWidth, padding: '10px 12px', borderRight: '1px solid #f0f0f0', fontWeight: 600, background: '#fafafa' }}>
                    Công việc
                  </div>
                  <div style={{ display: 'flex', position: 'relative' }}>
                    {days.map((d, i) => {
                      const isFirstOfMonth = d.getDate() === 1;
                      return (
                        <div
                          key={i}
                          style={{
                            width: DAY_WIDTH,
                            padding: '4px 0',
                            textAlign: 'center',
                            borderRight: '1px solid #f5f5f5',
                            fontSize: 10,
                            color: d.getDay() === 0 || d.getDay() === 6 ? TONE.danger : TONE.textSecondary,
                            background: d.getDay() === 0 || d.getDay() === 6 ? 'var(--color-surface-2)' : 'transparent',
                          }}
                        >
                          {isFirstOfMonth && (
                            <div style={{ fontWeight: 700, color: TONE.primary, fontSize: 11 }}>
                              Th{d.getMonth() + 1}
                            </div>
                          )}
                          {d.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Body: nhóm + task bars */}
              {Object.entries(grouped).map(([groupKey, groupTasks]) => (
                <div key={groupKey}>
                  {/* Group header */}
                  <div style={{ display: 'flex', background: '#f0f5ff', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: sidebarWidth, padding: '8px 12px', borderRight: '1px solid #f0f0f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {groupBy === 'port' && <Tag color={PORT_COLORS[groupKey]}>{groupKey}</Tag>}
                      {groupBy !== 'port' && <Text strong>{groupKey}</Text>}
                      <Tag style={{ marginLeft: 'auto' }}>{groupTasks.length}</Tag>
                    </div>
                    <div style={{ width: timelineWidth, position: 'relative' }} />
                  </div>

                  {/* Task rows */}
                  {groupTasks.map((task) => {
                    const offset = dayOffset(task.startDate);
                    const width = barWidth(task.startDate, task.endDate);
                    const isDone = task.status === 'done';
                    const barColor = isDone ? TONE.success : PORT_COLORS[task.portId] || TONE.primary;
                    return (
                      <div key={task.id} style={{ display: 'flex', borderBottom: '1px solid #f5f5f5', height: ROW_HEIGHT }}>
                        <div
                          style={{
                            width: sidebarWidth,
                            padding: '0 12px',
                            borderRight: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 12,
                          }}
                        >
                          <Tooltip title={task.title}>
                            <Text ellipsis style={{ maxWidth: 180 }}>{task.title}</Text>
                          </Tooltip>
                        </div>
                        <div style={{ width: timelineWidth, position: 'relative' }}>
                          <Tooltip
                            title={
                              <div>
                                <div><b>{task.title}</b></div>
                                <div>Người: {task.owner || '-'}</div>
                                <div>{new Date(task.startDate).toLocaleDateString('vi-VN')} → {new Date(task.endDate).toLocaleDateString('vi-VN')}</div>
                                <div>Tiến độ: {task.progress || 0}%</div>
                              </div>
                            }
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 8,
                                left: offset,
                                width: width,
                                height: 24,
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                opacity: isDone ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: 6,
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 600,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                boxShadow: isDone ? 'none' : '0 1px 4px rgba(0,0,0,0.15)',
                              }}
                            >
                              {task.progress || 0}%
                              <span
                                style={{
                                  position: 'absolute',
                                  right: -5,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: barColor,
                                  border: '2px solid #fff',
                                  boxShadow: `0 0 0 2px ${barColor}`,
                                }}
                              />
                            </div>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Đường phân cách tuần */}
              {weeks.map((w, wi) => (
                <div
                  key={`wk-${wi}`}
                  style={{
                    position: 'absolute',
                    left: sidebarWidth + w.startIdx * DAY_WIDTH,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: '#e8e8e8',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Today line */}
              <div
                className="timeline-today-pulse"
                style={{
                  position: 'absolute',
                  left: sidebarWidth + todayOffset,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: TONE.danger,
                  opacity: 0.7,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: TONE.success, borderRadius: 2 }} /> Hoàn thành
            </span>
            {ports.map((p) => (
              <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: PORT_COLORS[p.id] || TONE.primary, borderRadius: 2 }} />
                {p.id}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 2, height: 14, background: TONE.danger }} /> Hôm nay
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

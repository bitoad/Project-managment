import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  AuditOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TableOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { portsApi, risksApi, teamApi } from '../api/api.js';
import { PORT_COLORS, PORT_LIST, riskColor, TONE, cardListColumns } from '../components/helpers.js';
import { useProject } from '../context/ProjectContext.jsx';
import StatCard from '../components/StatCard.jsx';
import { InboxOutlined } from '@ant-design/icons';
import EmptyState from '../components/shared/EmptyState.jsx';

const { Title, Text, Paragraph } = Typography;

const CATEGORIES = [
  'Schedule',
  'Cost',
  'Quality',
  'Procurement',
  'Contract',
  'Safety',
  'Technical',
  'Commercial',
  'Interface',
  'Resource',
];

const PROB_LABEL = {
  1: 'Rất thấp',
  2: 'Thấp',
  3: 'Trung bình',
  4: 'Cao',
  5: 'Rất cao',
};

const IMPACT_LABEL = {
  1: 'Tối thiểu',
  2: 'Nhỏ',
  3: 'Trung bình',
  4: 'Lớn',
  5: 'Nghiêm trọng',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Đang mở', color: 'red' },
  { value: 'mitigated', label: 'Đang xử lý', color: 'orange' },
  { value: 'closed', label: 'Đã đóng', color: 'green' },
  { value: 'accepted', label: 'Chấp nhận', color: 'blue' },
];

const RESPONSE_OPTIONS = [
  { value: 'mitigate', label: 'Giảm thiểu' },
  { value: 'avoid', label: 'Tránh' },
  { value: 'transfer', label: 'Chuyển giao' },
  { value: 'accept', label: 'Chấp nhận' },
  { value: 'monitor', label: 'Theo dõi' },
];

function scoreOf(risk) {
  return risk.score || ((risk.probability || 1) * (risk.impact || 1));
}

function residualScoreOf(risk) {
  if (!risk.residualProbability || !risk.residualImpact) return null;
  return risk.residualScore || (risk.residualProbability * risk.residualImpact);
}

function getRiskLevel(score) {
  if (score >= 15) return { label: 'Nghiêm trọng', color: 'red', sort: 4 };
  if (score >= 10) return { label: 'Cao', color: 'orange', sort: 3 };
  if (score >= 6) return { label: 'Trung bình', color: 'gold', sort: 2 };
  return { label: 'Thấp', color: 'green', sort: 1 };
}

function getStatusMeta(status) {
  return STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];
}

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function dateToFormValue(value) {
  return value ? dayjs(value) : null;
}

export default function RiskMatrix() {
  const { currentProjectId, portfolioView } = useProject();
  const [risks, setRisks] = useState([]);
  const [ports, setPorts] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerRisk, setDrawerRisk] = useState(null);
  const [editRisk, setEditRisk] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPort, setFilterPort] = useState();
  const [filterStatus, setFilterStatus] = useState();
  const [filterLevel, setFilterLevel] = useState();
  const [selectedCell, setSelectedCell] = useState(null);
  const [form] = Form.useForm();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const probability = Form.useWatch('probability', form) || 1;
  const impact = Form.useWatch('impact', form) || 1;
  const residualProbability = Form.useWatch('residualProbability', form);
  const residualImpact = Form.useWatch('residualImpact', form);

  const load = async () => {
    try {
      setLoading(true);
      const [riskList, portList, teamList] = await Promise.all([
        risksApi.getAll(currentProjectId, portfolioView),
        portsApi.getAll(currentProjectId, portfolioView),
        teamApi.getAll(currentProjectId, portfolioView),
      ]);
      setRisks(riskList);
      setPorts(portList);
      setTeam(teamList);
    } catch (e) {
      message.error('Không tải được dữ liệu rủi ro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentProjectId, portfolioView]);

  const portOptions = useMemo(() => {
    const list = ports.length > 0 ? ports.map((port) => port.id) : PORT_LIST;
    return list.map((port) => ({ value: port, label: port }));
  }, [ports]);

  const ownerOptions = useMemo(() => {
    const names = [...new Set([...team.map((member) => member.name), ...risks.map((risk) => risk.owner)].filter(Boolean))];
    return names.map((name) => ({ value: name, label: name }));
  }, [risks, team]);

  const enrichedRisks = useMemo(() => {
    return risks.map((risk) => {
      const score = scoreOf(risk);
      const residualScore = residualScoreOf(risk);
      const level = getRiskLevel(score);
      const residualLevel = residualScore ? getRiskLevel(residualScore) : null;
      const daysUntilDue = getDaysUntil(risk.dueDate);
      const isOverdue = risk.status !== 'closed' && risk.status !== 'accepted' && daysUntilDue !== null && daysUntilDue < 0;
      return { ...risk, score, residualScore, level, residualLevel, daysUntilDue, isOverdue };
    });
  }, [risks]);

  const filteredRisks = useMemo(() => {
    const q = normalize(search);
    return enrichedRisks.filter((risk) => {
      const matchesSearch = !q || [
        risk.id,
        risk.title,
        risk.category,
        risk.owner,
        risk.portId,
        risk.cause,
        risk.consequence,
        risk.mitigation,
      ].some((field) => normalize(field).includes(q));
      const matchesPort = !filterPort || risk.portId === filterPort;
      const matchesStatus = !filterStatus || risk.status === filterStatus;
      const matchesLevel = !filterLevel || risk.level.label === filterLevel;
      const matchesCell = !selectedCell || (risk.impact === selectedCell.impact && risk.probability === selectedCell.probability);
      return matchesSearch && matchesPort && matchesStatus && matchesLevel && matchesCell;
    });
  }, [enrichedRisks, filterLevel, filterPort, filterStatus, search, selectedCell]);

  const heatmap = useMemo(() => {
    const grid = {};
    for (let impactValue = 1; impactValue <= 5; impactValue += 1) {
      for (let probabilityValue = 1; probabilityValue <= 5; probabilityValue += 1) {
        grid[`${impactValue}-${probabilityValue}`] = [];
      }
    }
    enrichedRisks
      .filter((risk) => risk.status !== 'closed' && risk.status !== 'accepted')
      .forEach((risk) => {
        const key = `${risk.impact}-${risk.probability}`;
        if (grid[key]) grid[key].push(risk);
      });
    return grid;
  }, [enrichedRisks]);

  const stats = useMemo(() => {
    const open = enrichedRisks.filter((risk) => risk.status === 'open');
    const severe = open.filter((risk) => risk.score >= 15);
    const high = open.filter((risk) => risk.score >= 10);
    const overdue = enrichedRisks.filter((risk) => risk.isOverdue);
    const mitigated = enrichedRisks.filter((risk) => risk.status === 'mitigated' || risk.status === 'closed').length;
    return {
      total: enrichedRisks.length,
      open: open.length,
      high: high.length,
      severe: severe.length,
      overdue: overdue.length,
      controlRate: enrichedRisks.length ? Math.round((mitigated / enrichedRisks.length) * 100) : 0,
    };
  }, [enrichedRisks]);

  const openAdd = () => {
    setEditRisk(null);
    form.resetFields();
    form.setFieldsValue({
      probability: 3,
      impact: 3,
      residualProbability: 2,
      residualImpact: 2,
      portId: portOptions[0]?.value || 'PORT 1',
      category: 'Schedule',
      status: 'open',
      responseStrategy: 'mitigate',
      dueDate: dayjs().add(14, 'day'),
    });
    setModalOpen(true);
  };

  const openEdit = (risk) => {
    setEditRisk(risk);
    form.setFieldsValue({
      ...risk,
      dueDate: dateToFormValue(risk.dueDate),
      identifiedAt: dateToFormValue(risk.identifiedAt),
      closedAt: dateToFormValue(risk.closedAt),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        identifiedAt: values.identifiedAt ? values.identifiedAt.format('YYYY-MM-DD') : null,
        closedAt: values.closedAt ? values.closedAt.format('YYYY-MM-DD') : null,
        residualScore: values.residualProbability && values.residualImpact
          ? values.residualProbability * values.residualImpact
          : null,
      };
      if (editRisk) {
        await risksApi.update(editRisk.id, payload);
        message.success('Đã cập nhật rủi ro');
      } else {
        await risksApi.create(payload);
        message.success('Đã thêm rủi ro');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      if (e?.errorFields) return;
      message.error('Lỗi khi lưu rủi ro');
    }
  };

  const onDelete = async (id) => {
    await risksApi.remove(id);
    message.success('Đã xóa rủi ro');
    load();
  };

  const updateStatus = async (risk, status) => {
    const payload = { status };
    if (status === 'closed') payload.closedAt = dayjs().format('YYYY-MM-DD');
    await risksApi.update(risk.id, payload);
    message.success('Đã cập nhật trạng thái');
    load();
  };

  const clearFilters = () => {
    setSearch('');
    setFilterPort(undefined);
    setFilterStatus(undefined);
    setFilterLevel(undefined);
    setSelectedCell(null);
  };

  return (
    <div className="ds-container">
      <div className="ds-page-header">
        <div>
          <div className="ds-h1">Ma trận Rủi ro</div>
          <div className="ds-caption">Đánh giá &amp; phân cấp rủi ro</div>
        </div>
        <Space wrap>
          <button className="btn btn-outline btn-sm" onClick={load}>
            <ReloadOutlined /> Tải lại
          </button>
          <button className="btn btn-primary" onClick={openAdd} disabled={portfolioView} title={portfolioView ? 'Chọn 1 dự án để thêm rủi ro' : undefined}>
            <PlusOutlined /> Thêm rủi ro
          </button>
        </Space>
      </div>

      <div className="ds-stat-grid">
        <StatCard
          icon={<AuditOutlined />}
           accent="var(--accent-primary)"
          title="Tổng rủi ro"
          value={stats.total}
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          accent="linear-gradient(135deg,#EF4444,#ff7875)"
          title="Đang mở"
          value={stats.open}
          valueStyle={{ color: TONE.danger }}
        />
        <StatCard
          icon={<WarningOutlined />}
          accent="linear-gradient(135deg,#FA8C16,#ffc069)"
          title="Cao / nghiêm trọng"
          value={stats.high}
          valueStyle={{ color: TONE.warning }}
          footer={<>{stats.severe} rủi ro nghiêm trọng</>}
        />
        <StatCard
          icon={<SafetyCertificateOutlined />}
          accent="linear-gradient(135deg,#1FA971,#3cc995)"
          title="Tỷ lệ kiểm soát"
          value={stats.controlRate}
          suffix="%"
          progress={stats.controlRate}
        />
      </div>

      <div className="risk-guide">
        <div className="risk-guide-title">
          <InfoCircleOutlined /> Cách đọc Ma trận rủi ro 5 × 5
        </div>
        <div className="risk-guide-body">
          <span>Mỗi ô thể hiện <b>số rủi ro</b> có <b>Xác suất (P)</b> × <b>Tác động (I)</b> tương ứng. Tích số càng lớn → mức độ càng <b>nghiêm trọng</b> (màu càng đỏ).</span>
          <span className="risk-gradient-bar" aria-hidden />
          <span className="risk-gradient-legend"><i>Thấp</i><i>Trung bình</i><i>Cao</i><i>Nghiêm trọng</i></span>
          <span>👉 Ô góc <b>trên-bên-phải (đỏ)</b> = rủi ro cần xử lý đầu tiên. Nhấn vào ô để lọc danh sách bên dưới.</span>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={14}>
          <Card
            className="ds-chart-card"
            bordered={false}
            title="Risk Heatmap"
            extra={
              <Space size={4} wrap>
                {selectedCell && (
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedCell(null)}>
                    Bỏ chọn {selectedCell.impact} x {selectedCell.probability}
                  </button>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>Nhấn ô để lọc bảng ↓</Text>
              </Space>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 8, alignItems: 'stretch' }}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textAlign: 'center', fontWeight: 700, color: TONE.textMuted, letterSpacing: 1 }}>
                TÁC ĐỘNG (I) ↑
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(5, minmax(${isMobile ? 46 : 64}px, 1fr))`, gap: 6 }}>
                  {[5, 4, 3, 2, 1].map((impactValue) => (
                    <React.Fragment key={impactValue}>
                      {[1, 2, 3, 4, 5].map((probabilityValue) => {
                        const cellRisks = heatmap[`${impactValue}-${probabilityValue}`] || [];
                        const score = impactValue * probabilityValue;
                        const level = getRiskLevel(score);
                        const isSelected = selectedCell?.impact === impactValue && selectedCell?.probability === probabilityValue;
                        const tip = cellRisks.length
                          ? cellRisks.map((r) => `• ${r.title} (${r.owner || '?'})`).join('\n')
                          : 'Không có rủi ro';
                        return (
                          <Tooltip key={`${impactValue}-${probabilityValue}`} title={<div style={{ whiteSpace: 'pre-line' }}>{tip}</div>}>
                            <button
                              type="button"
                              onClick={() => setSelectedCell(isSelected ? null : { impact: impactValue, probability: probabilityValue })}
                              className="risk-heatmap-cell"
                              style={{
                                minHeight: 78,
                                width: '100%',
                                border: isSelected ? `3px solid ${TONE.ink}` : '1px solid rgba(255,255,255,0.55)',
                                background: `linear-gradient(135deg, ${riskColor(score)} 0%, ${riskColor(score)}cc 100%)`,
                                opacity: cellRisks.length ? 1 : 0.4,
                                cursor: 'pointer',
                                borderRadius: 6,
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                boxShadow: isSelected ? `0 0 0 2px ${riskColor(score)}` : cellRisks.length ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 22, lineHeight: 1 }}>{cellRisks.length || ''}</div>
                                <div style={{ fontSize: 10, opacity: 0.95 }}>{level.label}</div>
                                <div style={{ fontSize: 10, opacity: 0.8 }}>{impactValue} x {probabilityValue}</div>
                              </div>
                            </button>
                          </Tooltip>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 8, textAlign: 'center' }}>
                  {[1, 2, 3, 4, 5].map((value) => <Text strong key={value}>{value}</Text>)}
                </div>
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <Text strong type="secondary">XÁC SUẤT (P) → &nbsp; 1=Rất thấp … 5=Rất cao</Text>
                </div>
              </div>
            </div>
            <Space wrap style={{ marginTop: 16 }}>
              <Tag color="green">Thấp (1-5)</Tag>
              <Tag color="gold">Trung bình (6-9)</Tag>
              <Tag color="orange">Cao (10-14)</Tag>
              <Tag color="red">Nghiêm trọng (15-25)</Tag>
              {stats.overdue > 0 && <Tag color="red">{stats.overdue} quá hạn xử lý</Tag>}
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="ds-chart-card" bordered={false} title={<span className="ds-card-head-icon"><WarningOutlined style={{ color: TONE.danger }} /> Rủi ro ưu tiên</span>}>
            {enrichedRisks.filter((risk) => risk.status === 'open').sort((a, b) => b.score - a.score).slice(0, 5).length === 0 ? (
              <EmptyState icon={<InboxOutlined />} title="Không có rủi ro đang mở" />
            ) : (
              <Timeline
                items={enrichedRisks
                  .filter((risk) => risk.status === 'open')
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((risk) => ({
                    color: risk.level.color,
                    children: (
                      <div>
                        <Space wrap size={6}>
                          <Text strong>{risk.title}</Text>
                          <Tag color={PORT_COLORS[risk.portId] || 'blue'}>{risk.portId}</Tag>
                          <Tag color={risk.level.color}>{risk.score}</Tag>
                        </Space>
                        <div>
                          <Text type="secondary">
                            {risk.owner || 'Chưa gán owner'} {risk.dueDate ? `- hạn ${dayjs(risk.dueDate).format('DD/MM/YYYY')}` : ''}
                          </Text>
                        </div>
                      </div>
                    ),
                  }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card className="ds-card" style={{ marginTop: 16 }} styles={{ body: { padding: 16 } }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm rủi ro, nguyên nhân, hậu quả, owner..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: isMobile ? '100%' : 320 }}
            />
            <Select
              allowClear
              placeholder="Tất cả Port"
              value={filterPort}
              onChange={setFilterPort}
              options={portOptions}
              style={{ width: 150 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_OPTIONS.map((status) => ({ value: status.value, label: status.label }))}
              style={{ width: 150 }}
            />
            <Select
              allowClear
              placeholder="Mức rủi ro"
              value={filterLevel}
              onChange={setFilterLevel}
              options={['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'].map((level) => ({ value: level, label: level }))}
              style={{ width: 160 }}
            />
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>
              <ClearOutlined /> Xóa bộ lọc
            </button>
          </Space>
          <Text type="secondary">
            <FilterOutlined /> Hiển thị {filteredRisks.length} / {enrichedRisks.length}
          </Text>
        </Space>
      </Card>

      <Card className="ds-chart-card" bordered={false} title={<span className="ds-card-head-icon"><TableOutlined style={{ color: TONE.primary }} /> Risk Register</span>} style={{ marginTop: 16 }}>
        <Table
          className="ds-table-premium card-list"
          dataSource={filteredRisks}
          rowKey={(record) => record.__key || record.id}
          loading={loading}
          scroll={{ x: 1450 }}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onDoubleClick: () => setDrawerRisk(record),
          })}
          columns={cardListColumns([
            ...(portfolioView
              ? [{ title: 'Dự án', dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true, fixed: 'left' }]
              : []),
            {
              title: 'Mã',
              dataIndex: 'id',
              key: 'id',
              width: 92,
              fixed: 'left',
              ellipsis: true,
              render: (id) => <Text strong>{id}</Text>,
            },
            {
              title: 'Rủi ro',
              dataIndex: 'title',
              key: 'title',
              width: 280,
              fixed: 'left',
              ellipsis: true,
              render: (title, record) => (
                <div style={{ maxWidth: 260, overflow: 'hidden' }}>
                  <Tooltip title={title}>
                    <Button type="link" style={{ padding: 0, height: 'auto', fontWeight: 600, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} onClick={() => setDrawerRisk(record)}>
                      {title}
                    </Button>
                  </Tooltip>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.cause ? `Nguyên nhân: ${record.cause}` : 'Chưa nhập nguyên nhân'}
                    </Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Port',
              dataIndex: 'portId',
              key: 'portId',
              width: 100,
              render: (portId) => <Tag color={PORT_COLORS[portId] || 'blue'}>{portId}</Tag>,
            },
            {
              title: 'Loại',
              dataIndex: 'category',
              key: 'category',
              width: 130,
              render: (category) => <Tag>{category}</Tag>,
            },
            {
              title: 'P',
              dataIndex: 'probability',
              key: 'probability',
              width: 92,
              align: 'center',
              render: (value) => <Text>{value} - {PROB_LABEL[value]}</Text>,
            },
            {
              title: 'I',
              dataIndex: 'impact',
              key: 'impact',
              width: 110,
              align: 'center',
              render: (value) => <Text>{value} - {IMPACT_LABEL[value]}</Text>,
            },
            {
              title: 'Score',
              dataIndex: 'score',
              key: 'score',
              width: 98,
              align: 'center',
              sorter: (a, b) => a.score - b.score,
              render: (_, record) => <Tag color={record.level.color} style={{ fontWeight: 700 }}><span className="ds-num">{record.score}</span> - {record.level.label}</Tag>,
            },
            {
              title: 'Residual',
              dataIndex: 'residualScore',
              key: 'residualScore',
              width: 112,
              align: 'center',
              render: (_, record) => (
                record.residualScore
                  ? <Tag color={record.residualLevel.color}><span className="ds-num">{record.residualScore}</span></Tag>
                  : <Text type="secondary">-</Text>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              width: 125,
              render: (status) => {
                const meta = getStatusMeta(status);
                return <Tag color={meta.color}>{meta.label}</Tag>;
              },
            },
            {
              title: 'Owner',
              dataIndex: 'owner',
              key: 'owner',
              width: 150,
              render: (owner) => owner || <Text type="secondary">Chưa gán</Text>,
            },
            {
              title: 'Hạn xử lý',
              dataIndex: 'dueDate',
              key: 'dueDate',
              width: 150,
              render: (dueDate, record) => {
                if (!dueDate) return <Text type="secondary">-</Text>;
                if (record.isOverdue) {
                  return <Badge status="error" text={`Quá hạn ${Math.abs(record.daysUntilDue)} ngày`} />;
                }
                if (record.daysUntilDue <= 7 && record.status !== 'closed') {
                  return <Badge status="warning" text={`Còn ${record.daysUntilDue} ngày`} />;
                }
                return <Text><CalendarOutlined /> {dayjs(dueDate).format('DD/MM/YYYY')}</Text>;
              },
            },
            {
              title: 'Hành động giảm thiểu',
              dataIndex: 'mitigation',
              key: 'mitigation',
              width: 260,
              ellipsis: true,
              render: (mitigation) => mitigation || <Text type="secondary">Chưa có</Text>,
            },
            {
              title: '',
              key: 'action',
              width: 150,
              fixed: 'right',
              render: (_, record) => (
                <Space size={4}>
                  <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(record)} disabled={portfolioView} title="Sửa"><EditOutlined /></button>
                  {record.status !== 'closed' && (
                    <button className="btn btn-outline btn-sm btn-icon" onClick={() => updateStatus(record, 'closed')} disabled={portfolioView} title="Đóng"><CheckCircleOutlined /></button>
                  )}
                  <Popconfirm title="Xóa rủi ro?" onConfirm={() => onDelete(record.id)} disabled={portfolioView}>
                    <button className="btn btn-danger btn-sm btn-icon" disabled={portfolioView} title="Xóa"><DeleteOutlined /></button>
                  </Popconfirm>
                </Space>
              ),
            },
          ])}
        />
      </Card>

      <Modal
        title={editRisk ? `Sửa rủi ro ${editRisk.id}` : 'Thêm rủi ro mới'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        width={isMobile ? '92%' : 920}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item name="title" label="Mô tả rủi ro" rules={[{ required: true, message: 'Nhập mô tả rủi ro' }]}>
                <Input.TextArea rows={2} placeholder="Ví dụ: Nhà cung cấp giao vật tư trễ làm ảnh hưởng tiến độ lắp đặt" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="category" label="Loại rủi ro" rules={[{ required: true }]}>
                <Select options={CATEGORIES.map((category) => ({ value: category, label: category }))} />
              </Form.Item>
              <Form.Item name="portId" label="Port" rules={[{ required: true }]}>
                <Select options={portOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="cause" label="Nguyên nhân">
                <Input.TextArea rows={2} placeholder="Nguồn gốc rủi ro, giả định, phụ thuộc..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="consequence" label="Hậu quả nếu xảy ra">
                <Input.TextArea rows={2} placeholder="Ảnh hưởng đến tiến độ, chi phí, chất lượng, an toàn..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="probability" label="Xác suất" rules={[{ required: true }]}>
                <Select options={Object.entries(PROB_LABEL).map(([value, label]) => ({ value: Number(value), label: `${value} - ${label}` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="impact" label="Tác động" rules={[{ required: true }]}>
                <Select options={Object.entries(IMPACT_LABEL).map(([value, label]) => ({ value: Number(value), label: `${value} - ${label}` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Điểm rủi ro">
                <Tag color={getRiskLevel(probability * impact).color} style={{ padding: '5px 10px', fontWeight: 700 }}>
                  {probability * impact} - {getRiskLevel(probability * impact).label}
                </Tag>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="estimatedCostImpact" label="Tác động chi phí (VND)">
                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/[^\d.]/g, '')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="responseStrategy" label="Chiến lược xử lý">
                <Select options={RESPONSE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="owner" label="Người phụ trách" rules={[{ required: true, message: 'Chọn hoặc nhập owner' }]}>
                <Select showSearch allowClear options={ownerOptions} optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="Trạng thái">
                <Select options={STATUS_OPTIONS.map((status) => ({ value: status.value, label: status.label }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="identifiedAt" label="Ngày nhận diện">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="dueDate" label="Hạn xử lý">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="closedAt" label="Ngày đóng">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="mitigation" label="Kế hoạch giảm thiểu / hành động xử lý">
            <Input.TextArea rows={3} placeholder="Việc cần làm, người phối hợp, bằng chứng hoàn thành..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="residualProbability" label="P sau xử lý">
                <Select allowClear options={Object.entries(PROB_LABEL).map(([value, label]) => ({ value: Number(value), label: `${value} - ${label}` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="residualImpact" label="I sau xử lý">
                <Select allowClear options={Object.entries(IMPACT_LABEL).map(([value, label]) => ({ value: Number(value), label: `${value} - ${label}` }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Residual score">
                {residualProbability && residualImpact ? (
                  <Tag color={getRiskLevel(residualProbability * residualImpact).color} style={{ padding: '5px 10px', fontWeight: 700 }}>
                    {residualProbability * residualImpact}
                  </Tag>
                ) : <Text type="secondary">Chưa đánh giá</Text>}
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="contingencyPlan" label="Phương án dự phòng">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú / bằng chứng">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={drawerRisk ? `Chi tiết ${drawerRisk.id}` : ''}
        open={!!drawerRisk}
        onClose={() => setDrawerRisk(null)}
        width={isMobile ? '100%' : 560}
        extra={drawerRisk && (
          <button className="btn btn-primary" onClick={() => { openEdit(drawerRisk); setDrawerRisk(null); }} disabled={portfolioView}>
            <EditOutlined /> Sửa
          </button>
        )}
      >
        {drawerRisk && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ marginTop: 0 }}>{drawerRisk.title}</Title>
              <Space wrap>
                <Tag color={PORT_COLORS[drawerRisk.portId] || 'blue'}>{drawerRisk.portId}</Tag>
                <Tag>{drawerRisk.category}</Tag>
                <Tag color={drawerRisk.level.color}>{drawerRisk.score} - {drawerRisk.level.label}</Tag>
                <Tag color={getStatusMeta(drawerRisk.status).color}>{getStatusMeta(drawerRisk.status).label}</Tag>
              </Space>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Owner">{drawerRisk.owner || '-'}</Descriptions.Item>
              <Descriptions.Item label="Deadline">
                {drawerRisk.dueDate ? dayjs(drawerRisk.dueDate).format('DD/MM/YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Chiến lược">{RESPONSE_OPTIONS.find((item) => item.value === drawerRisk.responseStrategy)?.label || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tác động chi phí">
                {drawerRisk.estimatedCostImpact ? `${drawerRisk.estimatedCostImpact.toLocaleString('vi-VN')} VND` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Residual score">
                {drawerRisk.residualScore ? `${drawerRisk.residualScore} - ${drawerRisk.residualLevel?.label}` : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong>Nguyên nhân</Text>
              <Paragraph>{drawerRisk.cause || 'Chưa nhập'}</Paragraph>
              <Text strong>Hậu quả</Text>
              <Paragraph>{drawerRisk.consequence || 'Chưa nhập'}</Paragraph>
              <Text strong>Kế hoạch giảm thiểu</Text>
              <Paragraph>{drawerRisk.mitigation || 'Chưa nhập'}</Paragraph>
              <Text strong>Phương án dự phòng</Text>
              <Paragraph>{drawerRisk.contingencyPlan || 'Chưa nhập'}</Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

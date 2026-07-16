import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Progress, Empty, Row, Col, Statistic, message, Spin, Segmented,
} from 'antd';
import {
  CheckSquareOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { tasksApi } from '../api/api.js';
import { PORT_COLORS, priorityColor, TONE } from '../components/helpers.js';
import { useUser } from '../context/UserContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';
import PageLoader from '../components/shared/PageLoader.jsx';

const { Title, Text } = Typography;

const STATUS_LABEL = {
  todo: { label: 'Cần làm', color: 'default' },
  inprogress: { label: 'Đang làm', color: 'blue' },
  review: { label: 'Kiểm tra', color: 'gold' },
  done: { label: 'Hoàn thành', color: 'green' },
};
const PRIORITY_LABEL = { high: 'Cao', medium: 'TB', low: 'Thấp' };

export default function MyTasks() {
  const { currentUser } = useUser();
  const { portfolioView } = useProject();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setTasks(await tasksApi.getAll(null, portfolioView));
    } catch (e) {
      message.error('Không tải được công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  // Lọc task theo người đăng nhập
  const myTasks = tasks.filter((t) => t.owner === currentUser?.name);

  const today = new Date();
  const isOverdue = (t) => t.status !== 'done' && t.endDate && new Date(t.endDate) < today;

  const myDone = myTasks.filter((t) => t.status === 'done').length;
  const myPending = myTasks.filter((t) => t.status !== 'done').length;
  const myOverdue = myTasks.filter(isOverdue).length;

  let displayTasks = myTasks;
  if (filter === 'pending') displayTasks = myTasks.filter((t) => t.status !== 'done');
  else if (filter === 'overdue') displayTasks = myTasks.filter(isOverdue);
  else if (filter === 'done') displayTasks = myTasks.filter((t) => t.status === 'done');

  return (
    <div className="page-container">
      <Title level={3} style={{ marginBottom: 4 }}>
        <CheckSquareOutlined /> Việc của tôi
      </Title>
      <Text type="secondary">
        Xin chào <b>{currentUser?.name}</b> — đây là danh sách công việc được giao cho bạn
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 8 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="Tổng công việc" value={myTasks.length} prefix={<CheckSquareOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="Đang chờ" value={myPending} valueStyle={{ color: TONE.warning }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Quá hạn"
              value={myOverdue}
              valueStyle={{ color: myOverdue > 0 ? TONE.danger : TONE.success }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Đang chờ', value: 'pending' },
              { label: 'Quá hạn', value: 'overdue' },
              { label: 'Hoàn thành', value: 'done' },
            ]}
          />
        </div>

        {displayTasks.length === 0 ? (
          <Empty description="Không có công việc nào" />
        ) : (
          <Table
            dataSource={displayTasks}
            rowKey="id"
            pagination={{ pageSize: 12 }}
            scroll={{ x: 900 }}
            rowClassName={(r) => (isOverdue(r) ? 'overdue-row' : '')}
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 80, render: (t) => <Text strong>{t}</Text> },
              { title: 'Công việc', dataIndex: 'title', key: 'title' },
              {
                title: 'Hạng mục', dataIndex: 'portId', key: 'port', width: 100,
                render: (t) => <Tag color={PORT_COLORS[t] || 'blue'}>{t}</Tag>,
              },
              { title: 'Item', dataIndex: 'itemCode', key: 'item', width: 80 },
              {
                title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120,
                render: (s) => {
                  const st = STATUS_LABEL[s] || { label: s, color: 'default' };
                  return <Tag color={st.color}>{st.label}</Tag>;
                },
              },
              {
                title: 'Ưu tiên', dataIndex: 'priority', key: 'pri', width: 90,
                render: (p) => <Tag color={priorityColor[p]}>{PRIORITY_LABEL[p] || p}</Tag>,
              },
              {
                title: 'Deadline', dataIndex: 'endDate', key: 'end', width: 120,
                render: (v, r) => {
                  if (!v) return <Text type="secondary">-</Text>;
                  const date = new Date(v).toLocaleDateString('vi-VN');
                  if (isOverdue(r)) return <Tag color="red" icon={<ExclamationCircleOutlined />}>{date}</Tag>;
                  return <Text>{date}</Text>;
                },
                sorter: (a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0),
              },
              {
                title: 'Tiến độ', dataIndex: 'progress', key: 'prog', width: 140,
                render: (v) => <Progress percent={v || 0} size="small" />,
              },
            ]}
          />
        )}
      </Card>

      <style>{`
        .overdue-row { background: #fff2f0 !important; }
        .overdue-row:hover { background: #ffe7e5 !important; }
      `}</style>
    </div>
  );
}

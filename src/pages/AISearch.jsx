import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Checkbox, List, Tag, Spin, Empty, Typography, Space, Avatar, message } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, LinkOutlined } from '@ant-design/icons';
import { researchApi } from '../api/api.js';
import { TONE } from '../components/helpers.js';

const { Text, Paragraph } = Typography;
const SOURCE_OPTIONS = [
  { label: 'Datasheet', value: 'datasheet' },
  { label: 'Standard', value: 'standard' },
  { label: 'Catalogue', value: 'catalogue' },
];

function RefItem({ item: r, type }) {
  return (
    <List.Item>
      <div style={{ width: '100%' }}>
        <Space size={6} wrap>
          <Tag color={type === 'datasheet' ? 'blue' : type === 'catalogue' ? 'purple' : 'green'}>{type}</Tag>
          <a href={r.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
            <LinkOutlined /> {r.title}
          </a>
          <Tag>{r.retrievedVia}</Tag>
        </Space>
        <div style={{ fontSize: 12, color: TONE.textMuted, marginTop: 2 }}>
          {r.source} {r.excerpt ? '— ' + r.excerpt : ''}
        </div>
      </div>
    </List.Item>
  );
}

function AssistantMessage({ data, error }) {
  if (error) {
    return <div style={{ color: TONE.danger }}>⚠️ {error}</div>;
  }
  const refs = [
    ...(data.datasheets || []).map((r) => ({ r, type: 'datasheet' })),
    ...(data.catalogues || []).map((r) => ({ r, type: 'catalogue' })),
    ...(data.standards || []).map((r) => ({ r, type: 'standard' })),
  ];
  return (
    <div>
      <Paragraph style={{ marginBottom: 8 }}>{data.technicalSummary}</Paragraph>
      {refs.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có nguồn nào" />
      ) : (
        <List
          size="small"
          dataSource={refs}
          renderItem={({ r, type }) => <RefItem item={r} type={type} />}
        />
      )}
    </div>
  );
}

export default function AISearch() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sources, setSources] = useState(['datasheet', 'standard', 'catalogue']);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const data = await researchApi.query({ query: text, sources });
      setMessages([...next, { role: 'assistant', data }]);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Lỗi không xác định';
      message.error(msg);
      setMessages([...next, { role: 'assistant', error: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <Card size="small" style={{ flex: '0 0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Text strong><RobotOutlined /> AI Search — Document Researcher</Text>
          <Space wrap>
            <Text type="secondary">Nguồn:</Text>
            <Checkbox.Group options={SOURCE_OPTIONS} value={sources} onChange={setSources} />
          </Space>
        </Space>
      </Card>

      <Card style={{ flex: 1, overflow: 'auto' }} styles={{ body: { height: '100%', overflow: 'auto' } }}>
        {messages.length === 0 ? (
          <Empty description="Nhập câu hỏi để tìm kiếm tài liệu kỹ thuật (vd: Jotun Facade 1403)" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && <Avatar style={{ backgroundColor: TONE.primary }} icon={<RobotOutlined />} />}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: 12,
                    borderRadius: 12,
                    background: m.role === 'user' ? TONE.primary : 'var(--color-surface-2)',
                    color: m.role === 'user' ? '#fff' : 'inherit',
                  }}
                >
                  {m.role === 'user' ? (
                    <span>{m.content}</span>
                  ) : (
                    <AssistantMessage data={m.data} error={m.error} />
                  )}
                </div>
                {m.role === 'user' && <Avatar style={{ backgroundColor: TONE.textMuted }} icon={<UserOutlined />} />}
              </div>
            ))}
            {loading && <Spin style={{ margin: 8 }} />}
            <div ref={endRef} />
          </Space>
        )}
      </Card>

      <Space.Compact style={{ width: '100%' }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi... (Enter để gửi)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={send}>
          Gửi
        </Button>
      </Space.Compact>
    </div>
  );
}

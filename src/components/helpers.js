// Hàm tiện ích dùng chung cho toàn app

// costOf là công thức tập trung ở engine — re-export để giữ nguyên các import cũ
export { costOf } from '../../shared/formulas.js';

// Format tiền VND đầy đủ
export const fmtVND = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
};

// Format tiền rút gọn (Tỷ / Tr / K)
export const fmtShort = (n) => {
  if (n === null || n === undefined || n === '') return '0';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + ' Tỷ';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(0) + ' Tr';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + ' K';
  return String(n);
};

// Format ngày
export const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('vi-VN');
  } catch {
    return '-';
  }
};

// Màu theo tiến độ
export const progressColor = (p) => {
  if (p >= 80) return '#52c41a';
  if (p >= 50) return '#1677ff';
  if (p >= 25) return '#faad14';
  return '#ff4d4f';
};

// Màu theo trạng thái item/task
export const statusColor = {
  Engineering: 'blue',
  Approved: 'cyan',
  Procurement: 'gold',
  Fabrication: 'orange',
  Delivery: 'purple',
  Installation: 'geekblue',
  Completed: 'green',
  open: 'red',
  mitigated: 'orange',
  closed: 'green',
  todo: 'default',
  inprogress: 'blue',
  review: 'gold',
  done: 'green',
};

// Màu theo mức độ ưu tiên
export const priorityColor = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

// Màu theo risk score
export const riskColor = (score) => {
  if (score >= 15) return '#ff4d4f';
  if (score >= 10) return '#fa8c16';
  if (score >= 6) return '#faad14';
  return '#52c41a';
};

// Mức độ khẩn cấp của deadline theo số ngày còn lại (đồng bộ màu Risk Matrix)
// 🔴 Đỏ: quá hạn hoặc còn ≤1 ngày | 🟠 Cam: 2–3 ngày | 🟡 Vàng: 4–7 ngày | 🟢 Xanh: >7 ngày
export const getUrgencyColor = (days) => {
  if (days == null) return '#8c8c8c';
  if (days < 0) return '#ff4d4f';
  if (days <= 1) return '#ff4d4f';
  if (days <= 3) return '#fa8c16';
  if (days <= 7) return '#faad14';
  return '#52c41a';
};

export const getUrgencyLevel = (days) => {
  if (days == null) return { color: '#8c8c8c', label: 'Chưa rõ', level: 'default' };
  if (days < 0) return { color: '#ff4d4f', label: `Quá hạn ${Math.abs(days)} ngày`, level: 'error' };
  if (days <= 1) return { color: '#ff4d4f', label: 'Còn 1 ngày', level: 'error' };
  if (days <= 3) return { color: '#fa8c16', label: `Còn ${days} ngày`, level: 'warning' };
  if (days <= 7) return { color: '#faad14', label: `Còn ${days} ngày`, level: 'warning' };
  return { color: '#52c41a', label: `Còn ${days} ngày`, level: 'success' };
};

export const URGENCY_LEGEND = [
  { color: '#ff4d4f', label: 'Quá hạn / ≤1 ngày' },
  { color: '#fa8c16', label: '2–3 ngày' },
  { color: '#faad14', label: '4–7 ngày' },
  { color: '#52c41a', label: '>7 ngày' },
];

// Danh sách Port
export const PORT_LIST = ['PORT 1', 'PORT 2', 'PORT 3', 'PORT 4', 'PORT 5', 'PORT 6', 'PORT 7'];

// Danh sách trạng thái Item/Task
export const STATUS_LIST = ['Engineering', 'Approved', 'Procurement', 'Fabrication', 'Delivery', 'Installation', 'Completed'];

// Trạng thái mua hàng / giao hàng (procurement) — trường riêng procStatus ở Item
export const PROC_STATUS_LIST = ['Chưa đặt', 'Đã đặt hàng', 'Đang SX', 'Đã giao', 'Lắp đặt xong'];

export const procStatusColor = (status) => ({
  'Chưa đặt': 'default',
  'Đã đặt hàng': 'blue',
  'Đang SX': 'processing',
  'Đã giao': 'cyan',
  'Lắp đặt xong': 'green',
}[status] || 'default');

// Map trạng thái mua hàng → % hoàn thành (chia đều tới 100%)
export const PROC_STATUS_PROGRESS = {
  'Chưa đặt': 0,
  'Đã đặt hàng': 25,
  'Đang SX': 50,
  'Đã giao': 75,
  'Lắp đặt xong': 100,
};

// Map trạng thái → % tiến độ mặc định
export const STATUS_PROGRESS = {
  Engineering: 10,
  Approved: 20,
  Procurement: 30,
  Fabrication: 60,
  Delivery: 80,
  Installation: 90,
  Completed: 100,
};

// Danh sách loại chi phí
export const COST_TYPES = [
  'Material', 'Fabrication', 'Installation', 'Logistics', 'Equipment',
  'Subcontractor', 'Overhead', 'Design', 'Testing & Inspection', 'Temporary Work', 'Contingency',
];

// Port colors — Ant Tag preset tokens (hợp lệ cho cả <Tag color> và inline CSS background/strokeColor)
export const PORT_COLORS = {
  'PORT 1': '#1677ff',
  'PORT 2': '#52c41a',
  'PORT 3': '#faad14',
  'PORT 4': '#eb2f96',
  'PORT 5': '#722ed1',
  'PORT 6': '#13c2c2',
  'PORT 7': '#fa8c16',
};

// Bảng màu tập trung (khớp theme.css / DESIGN.md PART 1) — dùng thay inline hex trong chart/icon/tone.
// Trả CSS var string để đồng bộ theme, tránh hardcode rải rác.
export const CHART_COLORS = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  purple: '#8B5CF6',   // brand-gradient accent (dùng hạn chế)
  sky: '#0EA5E9',      // brand-gradient accent (dùng hạn chế)
  muted: 'var(--color-text-tertiary)',
};
// Palette cố định cho biểu đồ (thứ tự theo DESIGN.md chart-palette)
export const CHART_PALETTE = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  '#8B5CF6',
  'var(--color-danger)',
  '#3B82F6',
];
// Tone cho KPI/stat icon (dùng làm style color)
export const TONE = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  purple: '#8B5CF6',
  sky: '#0EA5E9',
  gray: 'var(--color-text-tertiary)',
};

// Inject data-label vào mỗi column để CSS card-list (mobile <=640px)
// có thể hiển thị tên cột trên từng dòng. Trả về mảng mới, không mutate.
export const cardListColumns = (columns) =>
  (columns || []).map((col) => {
    if (!col || col.onCell) return col;
    const label = typeof col.title === 'string' ? col.title : (col.key || col.dataIndex || '');
    return { ...col, onCell: () => ({ 'data-label': label }) };
  });

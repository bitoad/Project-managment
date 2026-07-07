// Hàm tiện ích dùng chung cho toàn app

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

// Danh sách Port
export const PORT_LIST = ['PORT 1', 'PORT 2', 'PORT 3', 'PORT 4', 'PORT 5', 'PORT 6', 'PORT 7'];

// Danh sách trạng thái Item/Task
export const STATUS_LIST = ['Engineering', 'Approved', 'Procurement', 'Fabrication', 'Delivery', 'Installation', 'Completed'];

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

// Port colors (đồng bộ với seed)
export const PORT_COLORS = {
  'PORT 1': '#1677ff',
  'PORT 2': '#52c41a',
  'PORT 3': '#faad14',
  'PORT 4': '#eb2f96',
  'PORT 5': '#722ed1',
  'PORT 6': '#13c2c2',
  'PORT 7': '#fa8c16',
};

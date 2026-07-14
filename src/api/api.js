import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Lỗi không xác định';
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    console.error('[API Error]', message);
    return Promise.reject(error);
  }
);

// Lấy projectId hiện tại từ localStorage
function getProjectId() {
  return localStorage.getItem('currentProjectId') || 'block-b-gas';
}

// Header projectId + auth token cho mọi request
api.interceptors.request.use((config) => {
  if (!config.headers['x-project-id']) {
    config.headers['x-project-id'] = getProjectId();
  }
  const token = localStorage.getItem('authToken');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

// ============ PROJECTS ============
export const projectsApi = {
  getAll: () => api.get('/projects').then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
  reset: (id) => api.post(`/projects/${id}/reset`).then((r) => r.data),
  importExcel: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/projects/${id}/import-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      .then((r) => r.data);
  },
  exportExcel: (id) =>
    api
      .get(`/projects/${id}/export-excel`, { responseType: 'blob' })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `project_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }),
};

// ============ DASHBOARD ============
export const dashboardApi = {
  get: (projectId) => {
    const config = projectId ? { headers: { 'x-project-id': projectId } } : {};
    return api.get('/dashboard', config).then((r) => r.data);
  },
  aggregate: (projectIds) => {
    const qs = Array.isArray(projectIds) && projectIds.length ? `?projectIds=${projectIds.join(',')}` : '';
    return api.get(`/dashboard/aggregate${qs}`).then((r) => r.data);
  },
};

// Ghi đè x-project-id / x-portfolio cho 1 request.
// - projectId: ghim dự án cụ thể (bỏ qua nếu undefined → interceptor dùng currentProjectId).
// - portfolio: true → gửi header x-portfolio để backend trả dữ liệu tổng hợp TẤT CẢ dự án (read-only).
const withProject = (projectId, portfolio) => {
  const headers = {};
  if (projectId) headers['x-project-id'] = projectId;
  if (portfolio) headers['x-portfolio'] = 'true';
  return { headers };
};

// ============ META & SETTINGS ============
export const metaApi = {
  get: () => api.get('/meta').then((r) => r.data),
  update: (data) => api.put('/meta', data).then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data),
};

// ============ PORTS ============
export const portsApi = {
  getAll: (projectId, portfolio) => api.get('/ports', withProject(projectId, portfolio)).then((r) => r.data),
  get: (id) => api.get(`/ports/${id}`).then((r) => r.data),
  create: (data) => api.post('/ports', data).then((r) => r.data),
  update: (id, data) => api.put(`/ports/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/ports/${id}`).then((r) => r.data),
};

// ============ ITEMS ============
export const itemsApi = {
  getAll: (projectId, portfolio) => api.get('/items', withProject(projectId, portfolio)).then((r) => r.data),
  get: (code) => api.get(`/items/${code}`).then((r) => r.data),
  create: (data) => api.post('/items', data).then((r) => r.data),
  update: (code, data) => api.put(`/items/${code}`, data).then((r) => r.data),
  remove: (code) => api.delete(`/items/${code}`).then((r) => r.data),
};

// ============ SUPPLIERS ============
export const suppliersApi = {
  getAll: (projectId, portfolio) => api.get('/suppliers', withProject(projectId, portfolio)).then((r) => r.data),
  get: (id) => api.get(`/suppliers/${id}`).then((r) => r.data),
  create: (data) => api.post('/suppliers', data).then((r) => r.data),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/suppliers/${id}`).then((r) => r.data),
};

// ============ SUPPLIER PORTS ============
export const supplierPortsApi = {
  getAll: (portId, portfolio) => api.get('/supplier-ports', { params: portId ? { portId } : {}, ...withProject(undefined, portfolio) }).then((r) => r.data),
  create: (data) => api.post('/supplier-ports', data).then((r) => r.data),
  update: (id, data) => api.put(`/supplier-ports/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/supplier-ports/${id}`).then((r) => r.data),
};

// ============ RISKS ============
export const risksApi = {
  getAll: (projectId, portfolio) => api.get('/risks', withProject(projectId, portfolio)).then((r) => r.data),
  create: (data) => api.post('/risks', data).then((r) => r.data),
  update: (id, data) => api.put(`/risks/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/risks/${id}`).then((r) => r.data),
};

// ============ TASKS ============
export const tasksApi = {
  getAll: (projectId, portfolio) => api.get('/tasks', withProject(projectId, portfolio)).then((r) => r.data),
  create: (data) => api.post('/tasks', data).then((r) => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
};

// ============ TEAM ============
export const teamApi = {
  getAll: (projectId, portfolio) => api.get('/team', withProject(projectId, portfolio)).then((r) => r.data),
  create: (data) => api.post('/team', data).then((r) => r.data),
  update: (id, data) => api.put(`/team/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/team/${id}`).then((r) => r.data),
};

// ============ COST LOGS ============
export const costLogsApi = {
  getAll: (projectId, portfolio) => api.get('/cost-logs', withProject(projectId, portfolio)).then((r) => r.data),
  create: (data) => api.post('/cost-logs', data).then((r) => r.data),
  update: (id, data) => api.put(`/cost-logs/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/cost-logs/${id}`).then((r) => r.data),
};

// ============ QUOTATIONS ============
export const quotationsApi = {
  getAll: (projectId, portfolio) => api.get('/quotations', withProject(projectId, portfolio)).then((r) => r.data),
  create: (data) => api.post('/quotations', data).then((r) => r.data),
  update: (id, data) => api.put(`/quotations/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/quotations/${id}`).then((r) => r.data),
};

// ============ S-CURVE ============
export const sCurveApi = {
  getAll: (projectId) => api.get('/s-curve', withProject(projectId)).then((r) => r.data),
  update: (week, data) => api.put(`/s-curve/${week}`, data).then((r) => r.data),
};

// ============ DOCUMENTS ============
export const documentsApi = {
  getAll: (portId, portfolio) => api.get('/documents', { params: portId ? { portId } : {}, ...withProject(undefined, portfolio) }).then((r) => r.data),
  create: (formData) =>
    api
      .post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  update: (id, data) => api.put(`/documents/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/documents/${id}`).then((r) => r.data),
};

// ============ AUTH (hotfix ADR-012 / P0 ADR-013) ============
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

// ============ RBAC (modeled only — ADR-014) ============
export const rbacApi = {
  get: () => api.get('/rbac').then((r) => r.data),
};

// ============ RESEARCH (Document Researcher agent) ============
export const researchApi = {
  query: (data) => api.post('/research/query', data, { timeout: 120000 }).then((r) => r.data),
};

// ============ GLOBAL SEARCH ============
export const searchApi = {
  query: (q) => api.get('/search', { params: { q } }).then((r) => r.data),
};

export default api;

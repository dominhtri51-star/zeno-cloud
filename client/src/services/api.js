import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor đính kèm Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeno_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor xử lý lỗi & token hết hạn
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Có thể xử lý refresh hoặc redirect login
    }
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getHealth: () => api.get('/health'),
  changePassword: (data) => api.post('/auth/change-password', data),
  sendRecoveryOtp: (data) => api.post('/auth/send-recovery-otp', data),
  verifyRecoveryOtp: (data) => api.post('/auth/verify-recovery-otp', data),
  getSettings: (account) => api.get(`/auth/settings?account=${account || 'default'}`),
  updateSettings: (data) => api.post('/auth/settings', data),
  getTechnicianCodes: () => api.get('/auth/technician-codes'),
  createTechnicianCode: (data) => api.post('/auth/technician-codes', data),
  deleteTechnicianCode: (code) => api.delete(`/auth/technician-codes/${code}`),
  sendCloudOtp: (data) => api.post('/auth/send-cloud-otp', data),
  registerSunwise: (data) => api.post('/auth/register-sunwise', data),
  updatePhone: (data) => api.post('/auth/update-phone', data)
};

export const customerService = {
  getCustomers: () => api.get('/customers'),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  setTechnicianCode: (id, data) => api.post(`/customers/${id}/technician-code`, data),
  resetPassword: (id, newPassword) => api.post(`/customers/${id}/reset-password`, { newPassword }),
  deleteCustomer: (id) => api.delete(`/customers/${id}`)
};

export const groupService = {
  getGroups: () => api.get('/groups'),
  createGroup: (data) => api.post('/groups', data),
  getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId })
};

export const publicService = {
  sendOtp: (data) => api.post('/public/send-otp', data),
  register: (data) => api.post('/public/register', data),
  getAreaCodes: () => api.get('/public/area-codes')
};

export const monitoringService = {
  getStations: () => api.get('/stations'),
  getStation: (id) => api.get(`/stations/${id}`),
  deleteStation: (id) => api.delete(`/stations/${id}`),
  getStationSettings: (stationId) => api.get(`/stations/settings?stationId=${stationId || 'ST-001'}`),
  updateStationSettings: (stationId, settings) => api.post('/stations/settings', { stationId, settings }),
  getAlarms: () => api.get('/alarms'),
  resolveAlarm: (id) => api.put(`/alarms/${id}/resolve`),
  shareStation: (data) => api.post('/stations/share', data),
  unshareStation: (data) => api.post('/stations/unshare', data),
  getStationShares: (stationId) => api.get(`/stations/shares?stationId=${stationId}`),
  getAvailableDealers: () => api.get('/stations/dealers-list')
};

export default api;

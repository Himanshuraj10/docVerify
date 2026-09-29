import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/verify/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  signup: async (name, email, password, confirm_password) => {
    const res = await api.post('/auth/signup', { name, email, password, confirm_password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token, new_password, confirm_password) => {
    const res = await api.post('/auth/reset-password', { token, new_password, confirm_password });
    return res.data;
  }
};

export const verifyService = {
  verifyDocument: async (formData) => {
    const res = await api.post('/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getVerification: async (id) => {
    const res = await api.get(`/verification/${id}`);
    return res.data;
  },
  getReceipt: async (id) => {
    const res = await api.get(`/verification/${id}/receipt`);
    return res.data;
  },
  getUserVerifications: async () => {
    const res = await api.get('/user/verifications');
    return res.data;
  }
};

export const publicService = {
  getVerification: async (id) => {
    const res = await api.get(`/public/verify/${id}`);
    return res.data;
  }
};

export const complaintService = {
  submitComplaint: async (data) => {
    const res = await api.post('/complaints', data);
    return res.data;
  },
  getComplaint: async (id) => {
    const res = await api.get(`/complaints/${id}`);
    return res.data;
  },
  getUserComplaints: async () => {
    const res = await api.get('/complaints/user/my-complaints');
    return res.data;
  }
};

export const helpDeskService = {
  getFaqs: async () => {
    const res = await api.get('/faqs');
    return res.data;
  },
  queryChatbot: async (message) => {
    const res = await api.post('/chatbot', { message });
    return res.data;
  }
};

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },
  getVerifications: async (params) => {
    const res = await api.get('/admin/verifications', { params });
    return res.data;
  },
  getSuspicious: async () => {
    const res = await api.get('/admin/suspicious');
    return res.data;
  },
  getComplaints: async (params) => {
    const res = await api.get('/admin/complaints', { params });
    return res.data;
  },
  updateComplaint: async (id, status, response) => {
    const res = await api.put(`/admin/complaints/${id}`, { status, response });
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  getBlockchain: async () => {
    const res = await api.get('/admin/blockchain');
    return res.data;
  }
};

export const ownerService = {
  getDashboard: async () => {
    const res = await api.get('/owner/dashboard');
    return res.data;
  },
  getAdmins: async () => {
    const res = await api.get('/owner/admins');
    return res.data;
  },
  createAdmin: async (data) => {
    const res = await api.post('/owner/admins', data);
    return res.data;
  },
  updateAdmin: async (id, data) => {
    const res = await api.put(`/owner/admins/${id}`, data);
    return res.data;
  },
  resetAdminPassword: async (id) => {
    const res = await api.post(`/owner/admins/${id}/reset-password`);
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/owner/users');
    return res.data;
  },
  toggleUserActive: async (id) => {
    const res = await api.post(`/owner/users/${id}/toggle-active`);
    return res.data;
  },
  getContent: async () => {
    const res = await api.get('/owner/content');
    return res.data;
  },
  updateContent: async (section, data) => {
    const res = await api.put(`/owner/content/${section}`, data);
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get('/owner/settings');
    return res.data;
  },
  updateSetting: async (key, setting_value, description) => {
    const res = await api.put(`/owner/settings/${key}`, { setting_value, description });
    return res.data;
  }
};

export default api;

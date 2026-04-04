// src/services/api.ts

// Helper to grab the token if the user is logged in
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- AUTH ---
  login: async (credentials: any) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  // --- ADMIN & ANALYTICS ---
  getAdminDashboard: async () => {
    const res = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
    return res.json();
  },

  getUnderservedAreas: async () => {
    const res = await fetch('/api/admin/underserved-areas', { headers: getAuthHeaders() });
    return res.json();
  },

  // --- TEACHERS ---
  getTeachers: async () => {
    const res = await fetch('/api/teachers/', { headers: getAuthHeaders() });
    return res.json();
  },

  // --- EVENTS & AI ---
  getEvents: async () => {
    const res = await fetch('/api/events/', { headers: getAuthHeaders() });
    return res.json();
  },

  getAiRecommendations: async () => {
    const res = await fetch('/api/ai/recommendations', { headers: getAuthHeaders() });
    return res.json();
  }
};
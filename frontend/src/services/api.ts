// src/services/api.ts

// Helper to grab the token if the user is logged in
// Helper to grab the token if the user is logged in
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "");

const getAuthHeaders = () => {
  // Changed to match the key your team used in authContext.tsx!
  const token = localStorage.getItem('pholaris_access_token'); 
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ... keep the rest of your api.ts exactly the same ...
export const api = {
  // --- AUTH ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  // --- ADMIN & ANALYTICS ---
  getAdminDashboard: async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers: getAuthHeaders() });
    return res.json();
  },

  getUnderservedAreas: async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/underserved-areas`, { headers: getAuthHeaders() });
    return res.json();
  },

  // --- TEACHERS ---
  getTeachers: async () => {
    const res = await fetch(`${API_BASE_URL}/api/teachers/`, { headers: getAuthHeaders() });
    return res.json();
  },

  // --- EVENTS & AI ---
  getEvents: async () => {
    const res = await fetch(`${API_BASE_URL}/api/events/`, { headers: getAuthHeaders() });
    return res.json();
  },

  getAiRecommendations: async () => {
    const res = await fetch(`${API_BASE_URL}/api/ai/recommendations`, { headers: getAuthHeaders() });
    return res.json();
  }
};
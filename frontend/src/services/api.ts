// src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const ACCESS_TOKEN_KEY = "pholaris_access_token";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
}

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

const toQueryString = (query?: QueryParams) => {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
};

async function request(path: string, options: RequestOptions = {}) {
  const {
    method = "GET",
    query,
    body,
    auth = true,
    headers = {},
  } = options;

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  let requestBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (isFormData) {
      requestBody = body as FormData;
    } else {
      finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
    method,
    headers: finalHeaders,
    body: requestBody,
  });

  return response.json();
}

export const api = {
  // --- AUTH ---
  register: (payload: { email: string; password: string; full_name: string }) =>
    request("/api/auth/register", { method: "POST", body: payload, auth: false }),

  login: (credentials: { identifier: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: credentials, auth: false }),

  refresh: (refreshToken: string) =>
    request("/api/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
      auth: false,
    }),

  getMe: () => request("/api/auth/me"),

  // --- ADMIN ---
  uploadTeachers: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/admin/upload-teachers", { method: "POST", body: form });
  },

  getAdminDashboard: () => request("/api/admin/dashboard"),

  getUnderservedAreas: (limit?: number) =>
    request("/api/admin/underserved-areas", { query: { limit } }),

  voidStaleEvents: () => request("/api/admin/void-stale-events", { method: "POST" }),

  // --- ANALYTICS ---
  getAnalyticsOverview: () => request("/api/analytics/overview"),
  getRegionAnalytics: (region: string) => request(`/api/analytics/region/${region}`),
  getSpecializationProximity: () => request("/api/analytics/specialization-proximity"),
  getTrainingDrought: () => request("/api/analytics/training-drought"),
  getExperienceVoid: () => request("/api/analytics/experience-void"),
  getInstructionalRisk: () => request("/api/analytics/instructional-risk"),
  getBurnoutCapacity: () => request("/api/analytics/burnout-capacity"),
  getSubjectGaps: () => request("/api/analytics/subject-gaps"),
  getTrainingFrequency: () => request("/api/analytics/training-frequency"),
  getUpliftPriority: (topN?: number) => request("/api/analytics/uplift-priority", { query: { top_n: topN } }),
  getPredictiveWorkforce: () => request("/api/analytics/predictive-workforce"),
  getRegionalReadiness: () => request("/api/analytics/regional-readiness"),
  getAnalyticsCacheMeta: () => request("/api/analytics/cache-meta"),
  refreshAnalytics: () => request("/api/analytics/refresh", { method: "POST" }),

  // --- TEACHERS ---
  getMyTeacherProfile: () => request("/api/teachers/me"),
  updateMyTeacherProfile: (payload: Record<string, unknown>) =>
    request("/api/teachers/me", { method: "PUT", body: payload }),
  saveMyOnboarding: (payload: Record<string, unknown>) =>
    request("/api/teachers/me/onboarding", { method: "PUT", body: payload }),
  addMyTraining: (payload: Record<string, unknown>) =>
    request("/api/teachers/me/trainings", { method: "POST", body: payload }),
  getMyTrainings: () => request("/api/teachers/me/trainings"),
  getMyBadges: () => request("/api/teachers/me/badges"),
  getTeachers: (params?: { region?: string; subject?: string; skip?: number; limit?: number }) =>
    request("/api/teachers/", { query: params }),
  getTeacherById: (teacherId: string) => request(`/api/teachers/${teacherId}`),

  // --- EVENTS ---
  getEvents: (params?: { event_status?: string; region?: string; timeline?: string; skip?: number; limit?: number }) =>
    request("/api/events/", { query: params }),
  getEventById: (eventId: string) => request(`/api/events/${eventId}`),
  createEvent: (payload: Record<string, unknown>) => request("/api/events/", { method: "POST", body: payload }),
  updateEvent: (eventId: string, payload: Record<string, unknown>) =>
    request(`/api/events/${eventId}`, { method: "PUT", body: payload }),
  deleteEvent: (eventId: string) => request(`/api/events/${eventId}`, { method: "DELETE" }),
  approveEvent: (eventId: string) => request(`/api/events/${eventId}/approve`, { method: "POST" }),
  sendEventInvitations: (eventId: string) =>
    request(`/api/events/${eventId}/send-invitations`, { method: "POST" }),
  voteEvent: (eventId: string, vote: "approve" | "reject") =>
    request(`/api/events/${eventId}/vote`, { method: "POST", body: { vote } }),
  rsvpEvent: (eventId: string, interested: boolean) =>
    request(`/api/events/${eventId}/rsvp`, { method: "POST", body: { interested } }),
  getEventVotes: (eventId: string) => request(`/api/events/${eventId}/votes`),
  getEventRsvps: (eventId: string) => request(`/api/events/${eventId}/rsvps`),
  submitEventSentiment: (eventId: string, sentimentText: string) =>
    request(`/api/events/${eventId}/sentiments`, { method: "POST", body: { sentiment_text: sentimentText } }),
  getEventSentiments: (eventId: string, params?: { skip?: number; limit?: number }) =>
    request(`/api/events/${eventId}/sentiments`, { query: params }),

  // --- AI ---
  generateAiEvents: () => request("/api/ai/generate-events", { method: "POST" }),
  getAiRecommendations: () => request("/api/ai/recommendations"),
  generateAiInvitations: (eventId: string) =>
    request(`/api/ai/generate-invitations/${eventId}`, { method: "POST" }),
  scorePendingSentiments: () => request("/api/ai/score-pending-sentiments", { method: "POST" }),
  approveAiEvents: (eventSlugs: string[]) =>
    request("/api/ai/approve-events", { method: "POST", body: { event_slugs: eventSlugs } }),

  // --- MAPS ---
  getMapRegions: () => request("/api/maps/regions", { auth: false }),
  getMapRegionDetail: (region: string) => request(`/api/maps/regions/${region}`, { auth: false }),
  getMapEventsByRegion: () => request("/api/maps/events-by-region", { auth: false }),
};
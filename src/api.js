const getBaseUrl = () => {
  const env = import.meta.env?.VITE_API_URL;
  return env ? String(env).replace(/\/$/, "") : "";
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function adminRequest(path, options = {}) {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function adminLogin({ phone, password }) {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Login failed");
    err.status = res.status;
    throw err;
  }

  const user = data.data?.user;
  const token = data.data?.token;

  if (!user || !token) {
    throw new Error("Invalid server response");
  }

  return { user, token };
}

export function saveAdminSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userRole", user.role);
}

export function clearAdminSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
}

export const fetchDashboard = () => adminRequest("/api/admin/dashboard");

export const fetchUsers = ({ role = "all", page = 1, limit = 20, search = "" } = {}) => {
  const params = new URLSearchParams();
  if (role && role !== "all") params.set("role", role);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const q = String(search || "").trim();
  if (q) params.set("search", q);
  return adminRequest(`/api/admin/users?${params}`);
};

export const createStaffUser = (body) =>
  adminRequest("/api/admin/users", { method: "POST", body: JSON.stringify(body) });

export const updateUser = (id, body) =>
  adminRequest(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteUser = (id) =>
  adminRequest(`/api/admin/users/${id}`, { method: "DELETE" });

export const fetchMyProfile = () => adminRequest("/api/users/me");

export const updateMyProfile = (body) =>
  adminRequest("/api/users/me", { method: "PATCH", body: JSON.stringify(body) });

export const changeMyPassword = (body) =>
  adminRequest("/api/users/me/password", { method: "PUT", body: JSON.stringify(body) });

export const fetchQuestions = ({ page = 1, limit = 20, search = "", status = "all" } = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status && status !== "all") params.set("status", status);
  const q = String(search || "").trim();
  if (q) params.set("search", q);
  return adminRequest(`/api/admin/questions?${params}`);
};

export const createQuestion = (body) =>
  adminRequest("/api/admin/questions", { method: "POST", body: JSON.stringify(body) });

export const updateQuestion = (id, body) =>
  adminRequest(`/api/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deactivateQuestion = (id) =>
  adminRequest(`/api/admin/questions/${id}`, { method: "DELETE" });

export const fetchMatches = ({ page = 1, limit = 20, search = "", status = "all" } = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status && status !== "all") params.set("status", status);
  const q = String(search || "").trim();
  if (q) params.set("search", q);
  return adminRequest(`/api/admin/matches?${params}`);
};

export const fetchPlatformConfig = () => adminRequest("/api/admin/platform-config");

export const updatePlatformConfig = (body) =>
  adminRequest("/api/admin/platform-config", { method: "PATCH", body: JSON.stringify(body) });

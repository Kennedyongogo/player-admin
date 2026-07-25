const TOKEN_KEY = "apac_south_admin_token";
const USER_KEY = "apac_south_admin_user";

const getBaseUrl = () => {
  const env = import.meta.env?.VITE_API_URL;
  return env ? String(env).replace(/\/$/, "") : "";
};

async function request(path, options = {}) {
  const base = getBaseUrl();
  const token = localStorage.getItem(TOKEN_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 12000);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, v);
  });
  return q.toString();
};

export async function adminLogin(payload) {
  return request("/api/auth/admin/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function getMe() {
  return request("/api/users/me");
}

export async function getDashboard() {
  return request("/api/admin/dashboard");
}

export async function getMeta() {
  return request("/api/admin/meta");
}

export async function getUsers(params = {}) {
  return request(`/api/admin/users?${qs(params)}`);
}

export async function updateUser(id, payload) {
  return request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function createUser(payload) {
  return request("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function getReports() {
  return request("/api/admin/reports");
}

export async function broadcastNotification(payload) {
  return request("/api/admin/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAuditLogs(params = {}) {
  return request(`/api/admin/audit-logs?${qs(params)}`);
}

export async function getTournaments(params = {}) {
  return request(`/api/tournaments?${qs(params)}`);
}

export async function getTournament(id) {
  return request(`/api/tournaments/${id}`);
}

export async function createTournament(payload) {
  return request("/api/tournaments", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTournament(id, payload) {
  return request(`/api/tournaments/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function archiveTournament(id) {
  return request(`/api/tournaments/${id}/archive`, { method: "POST" });
}

export async function getRegistrations(tournamentId, params = {}) {
  return request(`/api/tournaments/${tournamentId}/registrations?${qs(params)}`);
}

export async function reviewRegistration(registrationId, payload) {
  return request(`/api/tournaments/registrations/${registrationId}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getTeams(params = {}) {
  return request(`/api/teams?${qs(params)}`);
}

export async function getTeam(id) {
  return request(`/api/teams/${id}`);
}

export async function getLobbies(tournamentId) {
  return request(`/api/lobbies/tournament/${tournamentId}`);
}

export async function createLobby(tournamentId, payload) {
  return request(`/api/lobbies/tournament/${tournamentId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function assignLobbyTeam(lobbyId, payload) {
  return request(`/api/lobbies/${lobbyId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeLobbyTeam(lobbyId, teamId) {
  return request(`/api/lobbies/${lobbyId}/teams/${teamId}`, { method: "DELETE" });
}

export async function regenerateLobbyCodes(lobbyId, scope = "all") {
  return request(`/api/lobbies/${lobbyId}/regenerate-codes`, {
    method: "POST",
    body: JSON.stringify({ scope }),
  });
}

export async function lockLobby(lobbyId) {
  return request(`/api/lobbies/${lobbyId}/lock`, { method: "POST" });
}

export async function startLobby(lobbyId) {
  return request(`/api/lobbies/${lobbyId}/start`, { method: "POST" });
}

export async function closeLobby(lobbyId) {
  return request(`/api/lobbies/${lobbyId}/close`, { method: "POST" });
}

export async function getScores(params = {}) {
  return request(`/api/scores?${qs(params)}`);
}

export async function submitScore(payload) {
  return request("/api/scores", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateScore(id, payload) {
  return request(`/api/scores/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteScore(id) {
  return request(`/api/scores/${id}`, { method: "DELETE" });
}

export async function syncOverstat(tournamentId, standings) {
  return request(`/api/scores/sync/${tournamentId}`, {
    method: "POST",
    body: JSON.stringify(standings ? { standings } : {}),
  });
}

export async function getLeaderboards(params = {}) {
  return request(`/api/leaderboards?${qs(params)}`);
}

export async function upsertLeaderboardEntry(payload) {
  return request("/api/leaderboards/entries", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteLeaderboardEntry(id) {
  return request(`/api/leaderboards/entries/${id}`, { method: "DELETE" });
}

export async function recalculateWeekly() {
  return request("/api/leaderboards/recalculate-weekly", { method: "POST" });
}

export async function rebuildLive(tournamentId) {
  return request("/api/leaderboards/rebuild-live", {
    method: "POST",
    body: JSON.stringify({ tournamentId }),
  });
}

export async function archiveHistorical(tournamentId) {
  return request("/api/leaderboards/archive-historical", {
    method: "POST",
    body: JSON.stringify({ tournamentId }),
  });
}

export async function getSponsors(params = {}) {
  return request(`/api/sponsors?${qs(params)}`);
}

export async function createSponsor(payload) {
  return request("/api/sponsors", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateSponsor(id, payload) {
  return request(`/api/sponsors/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteSponsor(id) {
  return request(`/api/sponsors/${id}`, { method: "DELETE" });
}

export async function getNews(params = {}) {
  return request(`/api/news?${qs(params)}`);
}

export async function createNews(payload) {
  return request("/api/news", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateNews(id, payload) {
  return request(`/api/news/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteNews(id) {
  return request(`/api/news/${id}`, { method: "DELETE" });
}

export async function getStreams(params = {}) {
  return request(`/api/streams?${qs(params)}`);
}

export async function createStream(payload) {
  return request("/api/streams", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateStream(id, payload) {
  return request(`/api/streams/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteStream(id) {
  return request(`/api/streams/${id}`, { method: "DELETE" });
}

export async function getBrackets(params = {}) {
  return request(`/api/brackets?${qs(params)}`);
}

export async function getBracket(id) {
  return request(`/api/brackets/${id}`);
}

export async function createBracket(payload) {
  return request("/api/brackets", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateBracket(id, payload) {
  return request(`/api/brackets/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function setBracketMatch(id, payload) {
  return request(`/api/brackets/${id}/matches`, { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteBracket(id) {
  return request(`/api/brackets/${id}`, { method: "DELETE" });
}

export async function getAnnouncements(params = {}) {
  return request(`/api/announcements?${qs(params)}`);
}

export async function createAnnouncement(payload) {
  return request("/api/announcements", { method: "POST", body: JSON.stringify(payload) });
}

export async function publishAnnouncement(id) {
  return request(`/api/announcements/${id}/publish`, { method: "POST" });
}

export async function deleteAnnouncement(id) {
  return request(`/api/announcements/${id}`, { method: "DELETE" });
}

const UPLOAD_KINDS = ["logo", "banner", "avatar", "cover"];

export async function uploadFile(kind, file) {
  if (!UPLOAD_KINDS.includes(kind)) throw new Error(`Invalid upload kind: ${kind}`);
  const formData = new FormData();
  formData.append("file", file);
  return request(`/api/uploads/${kind}`, { method: "POST", body: formData });
}

export async function getConfig() {
  return request("/api/config");
}

export async function upsertConfig(key, value) {
  return request(`/api/config/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * API utility — centralized fetch wrapper with JWT token injection.
 * Aligned with the backend's API conventions (backend/ directory).
 */

const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('rms_token');
}

export function setToken(token) {
    if (token) {
        localStorage.setItem('rms_token', token);
    } else {
        localStorage.removeItem('rms_token');
    }
}

export async function api(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await res.json();

    if (!res.ok) {
        const err = new Error(data.message || `API error: ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

// ── Auth helpers ────────────────────────────────────────────────────────────

export async function loginAPI(email, password) {
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
}

export async function registerAPI({ username, email, password, phone, unit }) {
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, phone, unit }),
    });
    // Note: registration starts as 'pending' — no token issued until approved
    return data;
}

export async function getMeAPI() {
    return api('/auth/me');
}

export function logoutAPI() {
    setToken(null);
}

export function getGoogleOAuthURL() {
    // In development, the Vite proxy handles /api routes,
    // but for OAuth we need a full redirect to the backend
    return 'http://localhost:5000/api/auth/google';
}

// ── Users ───────────────────────────────────────────────────────────────────

export function getUsers(params = '') {
    return api(`/users${params ? '?' + params : ''}`);
}

export function getUserById(id) {
    return api(`/users/${id}`);
}

export function createUser(data) {
    return api('/users', { method: 'POST', body: JSON.stringify(data) });
}

export function updateUser(id, data) {
    return api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteUser(id) {
    return api(`/users/${id}`, { method: 'DELETE' });
}

export function updateUserStatus(id, status) {
    return api(`/auth/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

// ── Requests / Complaints ───────────────────────────────────────────────────

export function getRequests(params = '') {
    return api(`/requests${params ? '?' + params : ''}`);
}

export function getRequestById(id) {
    return api(`/requests/${id}`);
}

export function createRequest(data) {
    return api('/requests', { method: 'POST', body: JSON.stringify(data) });
}

export function updateRequest(id, data) {
    return api(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export const updateRequestStatus = async (id, data) => {
    return api(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
};

export const convertRequestToJob = async (id, data) => {
    return api(`/requests/${id}/convert-to-job`, { method: 'POST', body: JSON.stringify(data) });
};

export function deleteRequest(id) {
    return api(`/requests/${id}`, { method: 'DELETE' });
}

export function escalateRequest(id, note) {
    return api(`/requests/${id}/escalate`, { method: 'POST', body: JSON.stringify({ note }) });
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export const getJobs = async (query = '') => {
    return api(`/jobs${query ? `?${query}` : ''}`);
};

export function createJob(data) {
    return api('/jobs', { method: 'POST', body: JSON.stringify(data) });
}

export function updateJob(id, data) {
    return api(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export const updateJobStatus = async (id, status, notes) => {
    return api(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ status, completionNotes: notes }) });
};

// ── Notifications ───────────────────────────────────────────────────────────

export function getNotifications() {
    return api('/notifications');
}

export function markNotificationRead(id) {
    return api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
    return api('/notifications/read-all', { method: 'PATCH' });
}

export function dismissNotification(id) {
    return api(`/notifications/${id}`, { method: 'DELETE' });
}

export function sendAnnouncement(data) {
    return api('/notifications/announce', { method: 'POST', body: JSON.stringify(data) });
}

export function sendDirectMessage(userId, data) {
    return api('/notifications/direct', { method: 'POST', body: JSON.stringify({ userId, ...data }) });
}

// ── Digital ID ──────────────────────────────────────────────────────────────

export function getDigitalIds(params = '') {
    return api(`/digital-id${params ? '?' + params : ''}`);
}

export function getMyDigitalId() {
    return api('/digital-id/me');
}

export function requestDigitalId(data) {
    return api('/digital-id/generate', { method: 'POST', body: JSON.stringify(data) });
}

export function approveDigitalId(id) {
    return api(`/digital-id/${id}/approve`, { method: 'POST' });
}

export function revokeDigitalId(id, reason) {
    return api(`/digital-id/${id}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function updateDigitalId(id, data) {
    return api(`/digital-id/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── Households ──────────────────────────────────────────────────────────────

export function getHouseholds(params = '') {
    return api(`/households${params ? '?' + params : ''}`);
}

export function createHousehold(data) {
    return api('/households', { method: 'POST', body: JSON.stringify(data) });
}

export function updateHousehold(id, data) {
    return api(`/households/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ── Reports ─────────────────────────────────────────────────────────────────

export function getReports(path = '') {
    return api(`/reports${path}`);
}

// ── Audit Logs ──────────────────────────────────────────────────────────────

export function getAuditLogs(params = '') {
    return api(`/audit${params ? '?' + params : ''}`);
}

// ── Password ────────────────────────────────────────────────────────────────

export function changePassword(currentPassword, newPassword) {
    return api('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}

export function requestPasswordReset(email) {
    return api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export function resetPassword(email, token, newPassword) {
    return api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, newPassword }),
    });
}

import axios from "axios";

/**
 * API CLIENT (JWT AUTH FIXED)
 */
export const api = axios.create({
  baseURL: "/api/v1",
  timeout: 10000,
});

/**
 * Attach JWT automatically
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Handle auth failures + readable errors
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
    }

    const message =
      err?.response?.data?.error ||
      err?.message ||
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

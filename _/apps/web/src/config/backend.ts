const DEFAULT_BACKEND_BASE_URL = "/api";
const RAW_BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL ?? DEFAULT_BACKEND_BASE_URL;

export const BACKEND_BASE_URL = RAW_BACKEND_BASE_URL.replace(/\/$/, '') || '/';


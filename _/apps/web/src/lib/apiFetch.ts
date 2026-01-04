import { BACKEND_BASE_URL } from '../config/backend';

const normalizePath = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = BACKEND_BASE_URL.replace(/\/$/, '');

  if (!normalizedBase || normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath;
  }
  return `${normalizedBase}${normalizedPath}`;
};

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(normalizePath(path), init);
}


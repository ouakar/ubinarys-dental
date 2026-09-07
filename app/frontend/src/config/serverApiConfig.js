const ensureTrailingSlash = (url) => {
  if (!url) return '/';
  return url.endsWith('/') ? url : `${url}/`;
};

const getBackendServer = () => {
  const envServer = import.meta.env.VITE_BACKEND_SERVER;
  if (envServer) {
    return ensureTrailingSlash(envServer);
  }
  return '/';
};

const isRemoteOrProd = import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE === 'remote';

export const BASE_URL = isRemoteOrProd ? getBackendServer() : '/';
export const API_BASE_URL = isRemoteOrProd ? `${getBackendServer()}api/` : '/api/';
export const DOWNLOAD_BASE_URL = isRemoteOrProd ? `${getBackendServer()}download/` : '/download/';

export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL
  ? ensureTrailingSlash(import.meta.env.VITE_WEBSITE_URL)
  : isRemoteOrProd
    ? ensureTrailingSlash(typeof window !== 'undefined' ? window.location.origin : '')
    : 'http://localhost:3000/';

export const ACCESS_TOKEN_NAME = 'x-auth-token';

export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL
  ? ensureTrailingSlash(import.meta.env.VITE_FILE_BASE_URL)
  : isRemoteOrProd
    ? getBackendServer()
    : '/';

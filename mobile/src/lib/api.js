export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function cookie(name) {
  return document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? '';
}

async function request(path, options = {}) {
  const method = options.method ?? 'GET';
  const headers = { Accept: 'application/json', ...options.headers };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = cookie('XSRF-TOKEN') || cookie('CSRF-TOKEN');
    if (csrf) headers['X-CSRF-TOKEN'] = decodeURIComponent(csrf);
  }
  let body = options.body;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  const response = await fetch(`/api/v1${path}`, { method, credentials: 'include', headers, body });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || (response.status === 401 ? '로그인이 필요합니다.' : '요청을 처리하지 못했습니다.'), {
      status: response.status, code: payload?.code, errors: payload?.errors ?? [],
    });
  }
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, json, options = {}) => request(path, { ...options, method: 'POST', ...(json instanceof FormData ? { body: json } : { json }) }),
  patch: (path, json, options = {}) => request(path, { ...options, method: 'PATCH', json }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
};

export function errorMessage(error) {
  return error instanceof ApiError ? error.message : '네트워크 연결을 확인하고 다시 시도해 주세요.';
}

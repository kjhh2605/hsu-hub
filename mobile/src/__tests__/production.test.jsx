import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { AuthProvider } from '../auth/AuthContext.jsx';
import { api } from '../lib/api.js';

afterEach(() => vi.restoreAllMocks());

function response(data, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve(data) });
}

function renderRoute(route, session = null) {
  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    if (String(url).includes('/auth/session')) return response({ success: true, data: session });
    if (String(url).endsWith('/clubs')) return response({ success: true, data: [] });
    throw new Error(`unexpected ${url}`);
  });
  return render(<MemoryRouter initialEntries={[route]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}

const removedAuthRoutes = [
  `/${['sign', 'up'].join('')}`,
  `/${['verify', 'email'].join('-')}`,
  `/${['forgot', 'password'].join('-')}`,
  `/${['reset', 'password'].join('-')}`,
];

describe('applicant production contract', () => {
  it('sends cookies and CSRF on mutations and unwraps ApiResponse', async () => {
    document.cookie = '__Host-XSRF-TOKEN=csrf-value; Path=/; Secure';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { id: 'u1' } }),
    });
    await expect(api.post('/auth/logout')).resolves.toEqual({ id: 'u1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({
      credentials: 'include', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'csrf-value' }),
    }));
  });

  it('guards club content and preserves the requested destination', async () => {
    renderRoute('/clubs', null);
    expect(await screen.findByRole('heading', { name: '다시 만나 반가워요' })).toBeInTheDocument();
    expect(screen.getByText('로그인하면 동아리 목록으로 돌아갑니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute(
      'href',
      '/api/v1/auth/kakao/start?returnTo=%2Fclubs',
    );
  });

  it('explains when Kakao does not provide a verified email', async () => {
    renderRoute('/login?error=kakao_email_required', null);
    expect(await screen.findByRole('alert')).toHaveTextContent('유효하고 인증된 카카오계정 이메일이 필요해요.');
  });

  it('falls back when router state contains an unsafe destination', async () => {
    renderRoute({ pathname: '/login', state: { from: '//evil.example' } }, null);
    expect(await screen.findByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute(
      'href',
      '/api/v1/auth/kakao/start?returnTo=%2Fclubs',
    );
  });

  it.each(removedAuthRoutes)(
    'returns generic 404 for removed auth route %s',
    async (route) => {
      renderRoute(route, null);
      expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
    },
  );

  it('returns generic 404 for other removed flows', async () => {
    renderRoute('/applications', { id: 'u1', email: 'u@example.com', role: 'USER' });
    expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
  });

  it('loads clubs only for a verified session', async () => {
    renderRoute('/clubs', { id: 'u1', email: 'u@hansung.ac.kr', role: 'USER' });
    expect(await screen.findByRole('heading', { name: '동아리 찾기' })).toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/clubs', expect.any(Object)));
  });

});

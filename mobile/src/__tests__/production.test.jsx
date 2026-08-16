import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('applicant production contract', () => {
  it('sends cookies and CSRF on mutations and unwraps ApiResponse', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-value';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { id: 'u1' } }),
    });
    await expect(api.post('/auth/logout')).resolves.toEqual({ id: 'u1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({
      credentials: 'include', headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'csrf-value' }),
    }));
  });

  it('guards club content and preserves the requested destination', async () => {
    renderRoute('/clubs', null);
    expect(await screen.findByRole('heading', { name: '다시 만나 반가워요' })).toBeInTheDocument();
    expect(screen.getByText('로그인하면 동아리 목록으로 돌아갑니다.')).toBeInTheDocument();
  });

  it('allows only the approved route map and returns generic 404 for removed flows', async () => {
    renderRoute('/applications', { authenticated: true, emailVerified: true, user: { id: 'u1', email: 'u@hansung.ac.kr' } });
    expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeInTheDocument();
  });

  it('loads clubs only for a verified session', async () => {
    renderRoute('/clubs', { id: 'u1', email: 'u@hansung.ac.kr', role: 'USER' });
    expect(await screen.findByRole('heading', { name: '동아리 찾기' })).toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/clubs', expect.any(Object)));
  });

  it('offers a non-enumerating verification resend flow', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('/auth/session')) return response({ success: true, data: null });
      if (String(url).includes('/email-verifications/resend')) return response({ success: true, data: null });
      throw new Error(`unexpected ${url}`);
    });
    render(<MemoryRouter initialEntries={['/verify-email']}><AuthProvider><App /></AuthProvider></MemoryRouter>);
    const input = await screen.findByLabelText('학교 이메일');
    fireEvent.change(input, { target: { value: 'student@hansung.ac.kr' } });
    fireEvent.click(screen.getByRole('button', { name: '인증 메일 다시 받기' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/email-verifications/resend', expect.any(Object)));
  });
});

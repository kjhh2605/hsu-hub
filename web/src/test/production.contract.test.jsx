import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { OperatorProvider } from '@/production/OperatorContext';
import { api } from '@/production/api';
import { ResumeAnswer } from '@/production/Applicants';
import { buildPublishPayload } from '@/production/Wizard';

afterEach(() => vi.restoreAllMocks());
const json = (data, status = 200) => Promise.resolve({ ok: status < 400, status, headers: new Headers({ 'content-type': 'application/json' }), json: () => Promise.resolve(data) });

function mount(path, session = null, clubs = []) {
  vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    if (String(url).includes('/auth/session')) return json({ success: true, data: session });
    if (String(url).endsWith('/operator/clubs')) return json({ success: true, data: clubs });
    throw new Error(`unexpected request ${url}`);
  });
  return render(<MemoryRouter initialEntries={[path]}><OperatorProvider><App /></OperatorProvider></MemoryRouter>);
}

describe('operator production contract', () => {
  it('sends session cookies and CSRF for a publish mutation', async () => {
    document.cookie = 'XSRF-TOKEN=operator-csrf';
    const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 201, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ success: true, data: { id: 'r1' } }) });
    await api.post('/operator/clubs/c1/recruitments', { title: '모집' });
    expect(mock).toHaveBeenCalledWith('/api/v1/operator/clubs/c1/recruitments', expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'operator-csrf' }) }));
  });

  it('guards all operator pages behind the host-local login session', async () => {
    mount('/admin/club');
    expect(await screen.findByRole('heading', { name: '운영진 로그인' })).toBeInTheDocument();
  });

  it('does not route removed dashboard, settings, interview, or result pages', async () => {
    mount('/admin/settings', { authenticated: true, emailVerified: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeInTheDocument();
  });

  it('renders HTTPS links safely and PDFs through a sandboxed backend viewer', () => {
    const { rerender } = render(<ResumeAnswer applicationId="a1" resume={{ type: 'LINK', url: 'https://example.com/work' }} />);
    expect(screen.getByRole('link', { name: /새 탭/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /새 탭/ })).toHaveAttribute('rel', 'noopener noreferrer');
    rerender(<ResumeAnswer applicationId="a1" resume={{ pdf: true, url: null }} />);
    expect(screen.getByTitle('제출된 PDF')).toHaveAttribute('sandbox', 'allow-same-origin');
    expect(screen.getByTitle('제출된 PDF')).toHaveAttribute('src', '/api/v1/operator/applications/a1/resume');
  });

  it('uses the shared mobile renderer in the authoring preview', async () => {
    mount('/admin/recruitments/new/form', { authenticated: true, emailVerified: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '지원서 설계' })).toBeInTheDocument();
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '단계 추가' })).toBeInTheDocument();
  });

  it('serializes wizard memory to the exact Spring publish DTO', () => {
    const payload = buildPublishPayload({
      title: '14기 모집', quota: 3, openAt: '2026-08-17T09:00', closeAt: '2026-08-18T18:00', content: '함께해요',
      stages: [{ type: 'FINAL_RESULT', label: '최종 결과', enabled: true, startAt: '2026-08-20T12:00', endAt: '' }],
      steps: [{ title: '기본', questions: [{ type: 'DROPDOWN', label: '학년', required: true, options: [{ id: 'o1', label: '1학년' }] }] }],
    });
    expect(payload).toEqual(expect.objectContaining({ opensAt: expect.stringContaining('2026-08-17'), closesAt: expect.stringContaining('2026-08-18') }));
    expect(payload.stages[1]).toEqual(expect.objectContaining({ startsAt: expect.stringContaining('2026-08-20'), endsAt: null }));
    expect(payload.form.steps[0].questions[0].options).toEqual(['1학년']);
    expect(payload).not.toHaveProperty('openAt');
  });
});

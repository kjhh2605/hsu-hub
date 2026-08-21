import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    if (String(url).endsWith('/operator/clubs/c1')) return json({ success: true, data: { id: 'c1', name: '멋사', category: 'IT/개발', shortIntroduction: '짧은 소개', detailedIntroduction: '상세 소개', recruitmentStatus: 'CLOSED', introductionImages: [] } });
    throw new Error(`unexpected request ${url}`);
  });
  return render(<MemoryRouter initialEntries={[path]}><OperatorProvider><App /></OperatorProvider></MemoryRouter>);
}

describe('operator production contract', () => {
  it('sends session cookies and CSRF for a publish mutation', async () => {
    document.cookie = '__Host-XSRF-TOKEN=operator-csrf; Path=/; Secure';
    const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 201, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ success: true, data: { id: 'r1' } }) });
    await api.post('/operator/clubs/c1/recruitments', { title: '모집' });
    expect(mock).toHaveBeenCalledWith('/api/v1/operator/clubs/c1/recruitments', expect.objectContaining({ credentials: 'include', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'operator-csrf' }) }));
  });

  it('guards all operator pages behind the host-local login session', async () => {
    mount('/admin/club');
    expect(await screen.findByRole('heading', { name: '운영진 로그인' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute(
      'href',
      '/api/v1/auth/kakao/start?returnTo=%2Fadmin%2Fclub',
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
  });

  it('preserves the full internal operator destination', async () => {
    mount('/admin/club?tab=profile');
    expect(await screen.findByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute(
      'href',
      '/api/v1/auth/kakao/start?returnTo=%2Fadmin%2Fclub%3Ftab%3Dprofile',
    );
  });

  it('explains when Kakao does not provide a verified email', async () => {
    mount('/login?error=kakao_email_required');
    expect(await screen.findByRole('alert')).toHaveTextContent('유효하고 인증된 카카오계정 이메일이 필요해요.');
  });

  it('falls back when router state contains an unsafe destination', async () => {
    mount({ pathname: '/login', state: { from: '//evil.example' } });
    expect(await screen.findByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute(
      'href',
      '/api/v1/auth/kakao/start?returnTo=%2Fadmin%2Fclub',
    );
  });

  it('does not route removed dashboard, settings, interview, or result pages', async () => {
    mount('/admin/settings', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
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
    mount('/admin/recruitments/new/form', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '지원서 설계' })).toBeInTheDocument();
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '단계 추가' })).toBeInTheDocument();
  });

  it('keeps the required application stage in the normal document flow', async () => {
    mount('/admin/recruitments/new/stages', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '전형 일정 설정' })).toBeInTheDocument();
    expect(screen.getByText('지원서 접수').closest('article')).not.toHaveClass('fixed');
  });

  it('does not render a preview in the recruitment schedule step', async () => {
    mount('/admin/recruitments/new/page', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '모집 일정' })).toBeInTheDocument();
    expect(screen.queryByText('일정 미리보기')).not.toBeInTheDocument();
    expect(screen.getByLabelText('지원 시작')).toBeInTheDocument();
    expect(screen.getByLabelText('지원 마감')).toBeInTheDocument();
  });

  it('previews profile copy live and removes the old activity fields', async () => {
    mount('/admin/club', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    expect(await screen.findByRole('heading', { name: '동아리 프로필' })).toBeInTheDocument();
    expect(screen.queryByLabelText('활동 기간')).not.toBeInTheDocument();
    const detailedIntroduction = await screen.findByRole('textbox', { name: '상세 소개' });
    expect(detailedIntroduction).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '짧은 소개' }), { target: { value: '커버에 보이는 한 줄 소개' } });
    expect(screen.getByText('커버에 보이는 한 줄 소개', { selector: '.cover-preview-short' })).toBeInTheDocument();
    fireEvent.change(detailedIntroduction, { target: { value: '새로운 모집 소개글' } });
    expect(screen.getAllByText('새로운 모집 소개글').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('모집중')).toBeInTheDocument();
  });

  it('rejects an eleventh introduction image before upload', async () => {
    mount('/admin/club', { authenticated: true, user: { id: 'u1' } }, [{ id: 'c1', name: '멋사' }]);
    await screen.findByRole('heading', { name: '동아리 프로필' });
    const files = Array.from({ length: 11 }, (_, index) => new File([`image-${index}`], `image-${index}.png`, { type: 'image/png' }));
    fireEvent.change(screen.getByLabelText(/이미지 추가/), { target: { files } });
    expect(await screen.findByRole('alert')).toHaveTextContent('최대 10장');
  });

  it('refreshes the CSRF token and retries a publish after a forbidden mutation', async () => {
    const calls = [];
    document.cookie = '__Host-XSRF-TOKEN=stale-token; Path=/; Secure';
    const mock = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options = {}) => {
      calls.push({ url: String(url), options });
      if (calls.length === 1) return json({ success: false, code: 'FORBIDDEN', message: '접근 권한이 없습니다.' }, 403);
      if (String(url).endsWith('/auth/session')) {
        document.cookie = '__Host-XSRF-TOKEN=fresh-token; Path=/; Secure';
        return json({ success: true, data: { id: 'u1' } });
      }
      return json({ success: true, data: { id: 'r1' } }, 201);
    });

    await api.post('/operator/clubs/c1/recruitments', { title: '모집' });

    expect(mock).toHaveBeenCalledTimes(3);
    expect(calls[1].url).toContain('/auth/session');
    expect(calls[2].options.headers['X-XSRF-TOKEN']).toBe('fresh-token');
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
    expect(payload).not.toHaveProperty('title');
    expect(payload).not.toHaveProperty('quota');
    expect(payload).not.toHaveProperty('contentBlocks');
  });
});

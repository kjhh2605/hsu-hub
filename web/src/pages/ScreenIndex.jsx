import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Monitor, Search } from 'lucide-react';
import { ADMIN_SCREENS, FIGMA_DESKTOP_FRAME_COUNT } from '@/routes/screenMap';
import { Badge, Chip, TextInput, cx } from '@/components/ui';
import { BrandMark } from '@/components/layout/BrandMark';
import { matches } from '@/lib/utils';

const GROUPS = ['전체', ...Array.from(new Set(ADMIN_SCREENS.map((s) => s.group)))];

export default function ScreenIndex() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('전체');

  const filtered = useMemo(
    () =>
      ADMIN_SCREENS.filter((s) => group === '전체' || s.group === group).filter(
        (s) =>
          matches(s.title, q) ||
          matches(s.figma, q) ||
          matches(s.altFigma, q) ||
          matches(s.path, q) ||
          matches(s.desc, q),
      ),
    [q, group],
  );

  const grouped = useMemo(
    () =>
      filtered.reduce((acc, s) => {
        (acc[s.group] ??= []).push(s);
        return acc;
      }, {}),
    [filtered],
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line/40 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center gap-4 px-6 py-5">
          <BrandMark size={36} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-ink">UniClub Admin 프로토타입</h1>
            <p className="text-[13px] text-ink-3">
              Figma 데스크톱 프레임 {FIGMA_DESKTOP_FRAME_COUNT}개 · 화면 {ADMIN_SCREENS.length}개 구현
            </p>
          </div>
          <Link
            to="/admin"
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-grad-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-primary sm:inline-flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            대시보드로 이동
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:w-80">
            <TextInput
              placeholder="화면 이름, Figma 프레임, 경로 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              prefix={<Search className="h-4 w-4" />}
              aria-label="화면 검색"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(g)} icon={g === '전체' ? Monitor : undefined}>
                {g}
                {g === '전체' ? ` ${ADMIN_SCREENS.length}` : ''}
              </Chip>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-ink-3">검색 결과가 없습니다.</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([g, items]) => (
              <section key={g}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-2">
                  {g}
                  <span className="rounded-full bg-line/25 px-2 py-0.5 text-[11px] font-semibold text-ink-3">
                    {items.length}
                  </span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <li key={s.path + s.figma}>
                      <Link
                        to={s.path}
                        className={cx(
                          'group flex h-full flex-col gap-2 rounded-2xl border border-line/40 bg-surface p-4 shadow-xs transition-all',
                          'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[15px] font-bold leading-snug text-ink">{s.title}</span>
                          <Badge tone={s.node === '-' ? 'slate' : 'violet'}>
                            {s.node === '-' ? '추가' : '1280px'}
                          </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed text-ink-3">{s.desc}</p>
                        <p className="truncate text-[11px] text-ink-4">
                          Figma: {s.figma}
                          {s.altFigma ? ` + ${s.altFigma}` : ''}
                        </p>
                        <p className="mt-auto flex items-center gap-1 truncate font-mono text-[11px] text-primary">
                          {s.path}
                          <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

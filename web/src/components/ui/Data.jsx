import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cx } from './Primitives';

/* ------------------------------------------------------------------ */
/* Stepper (horizontal, dot + label)                                  */
/* ------------------------------------------------------------------ */

/** steps: [{ key, label, state: 'done'|'active'|'pending'|'failed' }] */
export function Stepper({ steps = [], tone = 'primary', className }) {
  const accent = tone === 'mint' ? 'text-success-ink' : 'text-primary';
  const accentBg = tone === 'mint' ? 'bg-success-ink' : 'bg-primary';
  const accentLine = tone === 'mint' ? 'bg-success-ink/40' : 'bg-primary/40';

  return (
    <ol className={cx('flex items-start', className)} aria-label="전형 진행 단계">
      {steps.map((s, i) => {
        const done = s.state === 'done';
        const active = s.state === 'active';
        const failed = s.state === 'failed';
        return (
          <li key={s.key ?? i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={cx('h-1 flex-1 rounded-full', i === 0 ? 'bg-transparent' : done || active ? accentLine : 'bg-line/40')} />
              <span
                aria-current={active ? 'step' : undefined}
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all',
                  failed
                    ? 'bg-danger text-white'
                    : done
                      ? cx(accentBg, 'text-white shadow-primary')
                      : active
                        ? cx(accentBg, 'text-white ring-4', tone === 'mint' ? 'ring-success-ink/20' : 'ring-primary/20')
                        : 'border border-line/60 bg-tint-400',
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                ) : active ? (
                  <span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />
                ) : failed ? (
                  <span className="text-[10px] font-bold">!</span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-2/30" aria-hidden="true" />
                )}
              </span>
              <span className={cx('h-1 flex-1 rounded-full', i === steps.length - 1 ? 'bg-transparent' : done ? accentLine : 'bg-line/40')} />
            </div>
            <span
              className={cx(
                'truncate text-[11px] tracking-wide',
                failed ? 'font-bold text-danger' : active ? cx('font-bold', accent) : done ? cx('font-semibold', accent) : 'font-semibold text-ink-3',
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* WizardSteps (numbered, for multi-step forms)                       */
/* ------------------------------------------------------------------ */

export function WizardSteps({ steps = [], current = 0, onJump, className }) {
  return (
    <nav className={cx('flex items-center gap-2', className)} aria-label="작성 단계">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = !!onJump && i <= current;
        return (
          <React.Fragment key={s.id ?? i}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              aria-current={active ? 'step' : undefined}
              className={cx(
                'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors',
                active ? 'bg-primary/10' : 'bg-transparent',
                clickable ? 'cursor-pointer hover:bg-primary/5' : 'cursor-default',
              )}
            >
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  done ? 'bg-primary text-white' : active ? 'bg-primary text-white' : 'bg-line/40 text-ink-3',
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cx('whitespace-nowrap text-xs font-semibold', active ? 'text-primary' : done ? 'text-ink-2' : 'text-ink-3')}>
                {s.title ?? s.label}
              </span>
            </button>
            {i < steps.length - 1 ? <span className={cx('h-px w-4 shrink-0', done ? 'bg-primary/50' : 'bg-line/50')} /> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                       */
/* ------------------------------------------------------------------ */

export function Progress({ value = 0, max = 100, label, tone = 'primary', size = 'md', showValue, className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = {
    primary: 'bg-grad-primary',
    mint: 'bg-mint-600',
    amber: 'bg-[#E8A100]',
    danger: 'bg-danger',
    slate: 'bg-ink-3',
  }[tone];

  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label ? <span className="text-xs font-semibold text-ink-2">{label}</span> : null}
          {showValue ? <span className="text-xs font-bold tabular-nums text-primary">{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? '진행률'}
        className={cx('w-full overflow-hidden rounded-full bg-line/30', size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2')}
      >
        <div className={cx('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                               */
/* ------------------------------------------------------------------ */

export function Tabs({ tabs = [], value, onChange, className, variant = 'underline' }) {
  return (
    <div
      role="tablist"
      className={cx(
        'flex items-center gap-1 overflow-x-auto no-scrollbar',
        variant === 'underline' && 'border-b border-line/40',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(t.value)}
            className={cx(
              'relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors',
              active ? 'text-primary' : 'text-ink-3 hover:text-ink',
            )}
          >
            {t.label}
            {t.count != null ? (
              <span className={cx('ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]', active ? 'bg-primary/10 text-primary' : 'bg-line/30 text-ink-3')}>
                {t.count}
              </span>
            ) : null}
            {active && variant === 'underline' ? (
              <span className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-primary" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable (sortable, selectable)                                   */
/* ------------------------------------------------------------------ */

/**
 * columns: [{ key, header, width, align, sortable, render(row), className }]
 */
export function DataTable({
  columns = [],
  rows = [],
  rowKey = (r) => r.id,
  selectable = false,
  selected = [],
  onSelectedChange,
  onRowClick,
  sort,
  onSortChange,
  emptyMessage = '표시할 데이터가 없습니다.',
  className,
  dense,
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) onSelectedChange?.([]);
    else onSelectedChange?.(rows.map(rowKey));
  };

  const toggleOne = (id) => {
    onSelectedChange?.(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const handleSort = (key) => {
    if (!onSortChange) return;
    if (sort?.key === key) onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else onSortChange({ key, dir: 'asc' });
  };

  const pad = dense ? 'px-3 py-2' : 'px-4 py-3.5';

  return (
    <div className={cx('overflow-x-auto rounded-xl border border-line/40 bg-surface', className)}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line/40 bg-tint-50">
            {selectable ? (
              <th scope="col" className={cx('w-10', pad)}>
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-[#0058BE]"
                />
              </th>
            ) : null}
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cx(
                  'text-[12px] font-bold uppercase tracking-wide text-ink-3',
                  pad,
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                )}
              >
                {c.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    {c.header}
                    {sort?.key === c.key ? (
                      sort.dir === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center text-sm text-ink-3">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = rowKey(row);
              const isSel = selected.includes(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cx(
                    'border-b border-line/25 transition-colors last:border-0',
                    isSel ? 'bg-primary/5' : 'hover:bg-tint-50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {selectable ? (
                    <td className={pad} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`${row.name ?? id} 선택`}
                        checked={isSel}
                        onChange={() => toggleOne(id)}
                        className="h-4 w-4 cursor-pointer accent-[#0058BE]"
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cx(
                        'text-sm text-ink',
                        pad,
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** 정렬 훅 */
export function useSortedRows(rows, sort, accessors = {}) {
  return useMemo(() => {
    if (!sort?.key) return rows;
    const get = accessors[sort.key] ?? ((r) => r[sort.key]);
    const sorted = [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), 'ko');
    });
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [rows, sort, accessors]);
}

/* ------------------------------------------------------------------ */
/* Charts — dependency-free inline SVG                                */
/* ------------------------------------------------------------------ */

export function BarChart({ data = [], height = 140, valueKey = 'count', labelKey = 'date', tone = '#0058BE', className }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const [hover, setHover] = useState(null);

  return (
    <div className={cx('w-full', className)}>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(4, (d[valueKey] / max) * (height - 24));
          const isHover = hover === i;
          return (
            <div
              key={d[labelKey] ?? i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {isHover ? (
                <span className="absolute -top-1 z-10 whitespace-nowrap rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {d[valueKey]}
                </span>
              ) : null}
              <div
                className="w-full rounded-t-[3px] transition-all duration-200"
                style={{
                  height: h,
                  background: isHover ? tone : `${tone}CC`,
                  minWidth: 3,
                }}
                role="presentation"
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {data.map((d, i) => (
          <span
            key={`l-${d[labelKey] ?? i}`}
            className="flex-1 truncate text-center text-[9px] text-ink-4"
          >
            {i % 3 === 0 ? d[labelKey] : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ data = [], valueKey = 'count', height = 40, tone = '#0058BE', className }) {
  const values = data.map((d) => (typeof d === 'number' ? d : d[valueKey]));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cx('w-full', className)} style={{ height }} aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={tone} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill={tone} opacity="0.1" />
    </svg>
  );
}

export function DonutChart({ data = [], size = 132, thickness = 16, className }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={cx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C2C6D6" strokeOpacity="0.25" strokeWidth={thickness} />
        {data.map((d) => {
          const len = (d.value / total) * c;
          const el = (
            <circle
              key={d.key ?? d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.tone ?? '#0058BE'}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-ink">{total}</span>
        <span className="text-[10px] font-medium text-ink-3">전체</span>
      </div>
    </div>
  );
}

export function FunnelChart({ data = [], className }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cx('space-y-2.5', className)}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const conv = i > 0 ? ((d.value / data[i - 1].value) * 100).toFixed(0) : null;
        return (
          <div key={d.key ?? d.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-ink-2">{d.label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold tabular-nums text-ink">{d.value.toLocaleString()}</span>
                {conv ? <span className="text-[10px] font-medium text-ink-4">{conv}%</span> : null}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line/20">
              <div
                className="h-full rounded-full bg-grad-primary transition-[width] duration-700"
                style={{ width: `${pct}%`, opacity: 1 - i * 0.11 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  primary: 'btn-primary',
  solid: 'btn-solid',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  tint: 'btn-tint',
  danger: 'btn-danger',
  white: 'btn bg-white text-primary shadow-xs hover:bg-tint-100 active:scale-[0.985]',
  navy: 'btn bg-navy text-white hover:brightness-125 active:scale-[0.985]',
};

const SIZES = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

export function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  block,
  loading = false,
  disabled,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...rest
}) {
  const cls = cx(
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size],
    block && 'w-full',
    className,
  );

  const inner = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled || undefined} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }
  const Comp = as ?? 'button';
  return (
    <Comp className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                               */
/* ------------------------------------------------------------------ */

export function Card({ as: Comp = 'div', tint, flat, className, children, ...rest }) {
  return (
    <Comp
      className={cx(
        'rounded-3xl border',
        tint ? 'border-line/30 bg-tint-100' : 'border-line/30 bg-surface',
        flat ? '' : 'shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function Panel({ as: Comp = 'div', className, children, ...rest }) {
  return (
    <Comp className={cx('rounded-xl border border-line/40 bg-surface shadow-xs', className)} {...rest}>
      {children}
    </Comp>
  );
}

export function SectionTitle({ title, desc, action, className }) {
  return (
    <div className={cx('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        {desc ? <p className="mt-1 text-sm text-ink-3">{desc}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                              */
/* ------------------------------------------------------------------ */

const TONES = {
  primary: 'bg-primary/10 text-primary border border-primary/10',
  mint: 'bg-mint/25 text-success-ink border border-mint/40',
  danger: 'bg-danger-soft text-danger-ink border border-danger/20',
  amber: 'bg-warn-soft text-warn border border-warn/20',
  slate: 'bg-line/25 text-ink-2 border border-line/40',
  neutral: 'bg-tint-400/60 text-ink-3 border border-line/30',
  violet: 'bg-accent-soft text-accent border border-accent/20',
  white: 'bg-white/40 text-success-ink border border-white/50 backdrop-blur-sm',
  rose: 'bg-[#FFE4EC] text-[#A21A48] border border-[#FFC8D8]',
  outline: 'bg-transparent text-ink-3 border border-line/60',
};

export function Badge({ tone = 'primary', icon: Icon, className, children, ...rest }) {
  return (
    <span className={cx('badge', TONES[tone] ?? TONES.primary, className)} {...rest}>
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function Dot({ tone = 'primary', className }) {
  const map = {
    primary: 'bg-primary',
    mint: 'bg-mint-600',
    danger: 'bg-danger',
    amber: 'bg-[#E8A100]',
    slate: 'bg-ink-3',
    neutral: 'bg-line',
  };
  return <span className={cx('inline-block h-2 w-2 rounded-full', map[tone] ?? map.primary, className)} />;
}

/* ------------------------------------------------------------------ */
/* Avatar                                                             */
/* ------------------------------------------------------------------ */

const AV_SIZES = { xs: 'h-6 w-6 text-xs', sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-12 w-12 text-xl', xl: 'h-20 w-20 text-3xl' };

export function Avatar({ emoji, name, size = 'md', ring, className }) {
  const initial = name ? name.slice(0, 1) : '?';
  return (
    <span
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-tint-400 font-semibold text-ink',
        AV_SIZES[size],
        ring && 'ring-2 ring-line/30',
        className,
      )}
      aria-hidden={!name}
      title={name}
    >
      {emoji ?? initial}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Chip (filter pill)                                                 */
/* ------------------------------------------------------------------ */

export function Chip({ active, icon: Icon, count, className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-white shadow-primary'
          : 'border-line/50 bg-surface text-ink-2 hover:border-primary/40 hover:bg-tint-100',
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
      {count != null ? (
        <span className={cx('ml-0.5 rounded-full px-1.5 text-[11px]', active ? 'bg-white/25' : 'bg-line/30')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton / EmptyState                                              */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-line/25', className)} />;
}

export function EmptyState({ icon: Icon, title, desc, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      {Icon ? (
        <span className="mb-1 inline-flex h-14 w-14 items-center justify-center rounded-full bg-tint-200 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-base font-bold text-ink">{title}</p>
      {desc ? <p className="max-w-[280px] text-sm leading-relaxed text-ink-3">{desc}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Divider                                                            */
/* ------------------------------------------------------------------ */

export function Divider({ className, label }) {
  if (label) {
    return (
      <div className={cx('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-line/40" />
        <span className="text-xs font-medium text-ink-3">{label}</span>
        <span className="h-px flex-1 bg-line/40" />
      </div>
    );
  }
  return <hr className={cx('border-0 border-t border-line/30', className)} />;
}

/* ------------------------------------------------------------------ */
/* KeyValue row                                                       */
/* ------------------------------------------------------------------ */

export function KeyValue({ label, value, icon: Icon, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 py-2.5', className)}>
      <span className="flex items-center gap-1.5 shrink-0 text-sm text-ink-3">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </span>
      <span className="min-w-0 text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

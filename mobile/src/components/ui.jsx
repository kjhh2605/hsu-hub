import { useEffect } from 'react';
import { Check, X } from './icons.jsx';
import { STEPS } from '../data/constants.js';

/* ── Button ── */
export function Button({
  variant = 'primary',
  size,
  block,
  children,
  className = '',
  ...rest
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, small, filled, className = '', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={['iconbtn', small ? 'iconbtn--sm' : '', filled ? 'iconbtn--filled' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Badge ── */
export function Badge({ tone = 'neutral', children, dot }) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="dot" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  );
}

/* ── Card ── */
export function Card({ variant, pad, className = '', as = 'div', ...rest }) {
  const Tag = as;
  const cls = [
    'card',
    variant ? `card--${variant}` : '',
    pad === true ? 'card--pad' : pad === 20 ? 'card--pad20' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={cls} {...rest} />;
}

/* ── Avatar ── */
export function Avatar({ name = '', size = 40, color, image, square }) {
  const initials = name.slice(0, 2);
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{
        background: image ? undefined : color || 'var(--c-primary)',
        backgroundImage: image ? `url(${image})` : undefined,
        borderRadius: square ? 'var(--r-2xl)' : undefined,
      }}
      aria-hidden
    >
      {!image && initials}
    </span>
  );
}

/* ── Field / Inputs ── */
export function Field({ label, required, help, error, children, htmlFor }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="field-req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        help && <p className="field-help">{help}</p>
      )}
    </div>
  );
}

export const Input = ({ error, ...rest }) => (
  <input className="input" aria-invalid={error ? 'true' : undefined} {...rest} />
);

export const Textarea = ({ error, ...rest }) => (
  <textarea className="textarea" aria-invalid={error ? 'true' : undefined} {...rest} />
);

export function Select({ error, options = [], placeholder, ...rest }) {
  return (
    <select className="select" aria-invalid={error ? 'true' : undefined} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  );
}

export function OptionCard({ checked, onClick, title, desc, box }) {
  return (
    <button
      type="button"
      role={box ? 'checkbox' : 'radio'}
      aria-checked={checked}
      className="opt"
      onClick={onClick}
    >
      <span className={`opt-mark${box ? ' opt-mark--box' : ''}`} />
      <span className="col g2 grow">
        <span className="t-label">{title}</span>
        {desc && <span className="t-cap ink3">{desc}</span>}
      </span>
    </button>
  );
}

export function CheckBox({ checked, onChange, children, error }) {
  return (
    <div className="col g4">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className="checkline"
        onClick={() => onChange(!checked)}
      >
        <span
          className="opt-mark opt-mark--box"
          style={{
            borderColor: checked ? 'var(--c-primary)' : undefined,
            background: checked ? 'var(--c-primary)' : undefined,
            color: '#fff',
            display: 'flex',
          }}
        >
          {checked && <Check size={12} />}
        </span>
        <span className="t-body-s ink2 grow" style={{ textAlign: 'left' }}>
          {children}
        </span>
      </button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!on)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

/* ── Stepper ── */
export function Stepper({ done = 0, active = -1, labels = STEPS }) {
  return (
    <div className="stepper">
      {labels.map((label, i) => {
        const isDone = i < done;
        const isActive = i === active && !isDone;
        return (
          <div
            key={label}
            className={[
              'stepper-item',
              isDone ? 'stepper-item--done' : '',
              isActive ? 'stepper-item--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="stepper-dot">{isDone && <Check size={12} />}</span>
            <span className="stepper-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Progress({ value = 0 }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ── Section title ── */
export function SectionTitle({ children, right, bar }) {
  return (
    <div className="row between full">
      <h2 className="section-title">
        {bar && <span className="section-bar" />}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function InfoRow({ icon, label, value, tone }) {
  return (
    <div className="row g12 full">
      {icon && (
        <span
          className="center shrink0"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: tone === 'mint' ? 'var(--c-mint)' : 'var(--c-tint-200)',
            color: tone === 'mint' ? 'var(--c-success-ink)' : 'var(--c-primary)',
            display: 'flex',
          }}
        >
          {icon}
        </span>
      )}
      <span className="col g2 grow">
        <span className="t-cap ink3">{label}</span>
        <span className="t-label ink">{value}</span>
      </span>
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty">
      {icon && <span className="empty-ico">{icon}</span>}
      <p className="t-h4 ink">{title}</p>
      {desc && <p className="t-body-s ink3 pre center-text">{desc}</p>}
      {action}
    </div>
  );
}

/* ── Sheet ── */
export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-scrim" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between mb16">
          <h3 className="t-h3">{title}</h3>
          <IconButton label="닫기" small onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
        {footer && <div className="mt16">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Toasts ── */
export function Toasts({ items, onDismiss }) {
  if (!items?.length) return null;
  return (
    <div className="toast-wrap" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast${t.tone === 'success' ? ' toast--success' : t.tone === 'error' ? ' toast--error' : ''}`}
          onClick={() => onDismiss?.(t.id)}
        >
          {t.tone === 'success' && <Check size={16} />}
          {t.tone === 'error' && <X size={16} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

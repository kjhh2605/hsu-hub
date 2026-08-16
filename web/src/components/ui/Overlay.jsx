import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx, Button } from './Primitives';
import { useStore } from '@/store/AppStore';

/* ------------------------------------------------------------------ */
/* useLockBody + Escape                                               */
/* ------------------------------------------------------------------ */

function useOverlay(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

/* ------------------------------------------------------------------ */
/* Modal (centered)                                                   */
/* ------------------------------------------------------------------ */

export function Modal({ open, onClose, title, desc, footer, size = 'md', children, className }) {
  useOverlay(open, onClose);
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-[340px]', md: 'max-w-[440px]', lg: 'max-w-[640px]', xl: 'max-w-[880px]' };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-navy/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        ref={ref}
        className={cx(
          'relative z-10 max-h-[88vh] w-full animate-scale-in overflow-hidden rounded-2xl bg-surface shadow-2xl outline-none',
          widths[size],
          className,
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-line/30 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink">{title}</h2>
              {desc ? <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{desc}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-ink-3 transition-colors hover:bg-line/20 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="max-h-[62vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line/30 bg-tint-50 px-5 py-3.5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* ConfirmDialog                                                      */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '확인이 필요합니다',
  desc,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'primary',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" block onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="md"
            block
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span
          className={cx(
            'inline-flex h-12 w-12 items-center justify-center rounded-full',
            tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-tint-200 text-primary',
          )}
        >
          {tone === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
        </span>
        <p className="text-base font-bold text-ink">{title}</p>
        {desc ? <p className="text-sm leading-relaxed text-ink-3">{desc}</p> : null}
      </div>
    </Modal>
  );
}

/** 확인 다이얼로그를 명령형으로 쓰기 위한 훅 */
export function useConfirm() {
  const [cfg, setCfg] = useState(null);
  const confirm = useCallback((options) => setCfg(options), []);
  const node = (
    <ConfirmDialog
      open={!!cfg}
      onClose={() => setCfg(null)}
      onConfirm={() => cfg?.onConfirm?.()}
      {...(cfg ?? {})}
    />
  );
  return { confirm, confirmNode: node };
}

/* ------------------------------------------------------------------ */
/* Toaster                                                            */
/* ------------------------------------------------------------------ */

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  default: Info,
};

const TOAST_TONES = {
  success: 'bg-navy text-white',
  error: 'bg-danger text-white',
  info: 'bg-navy text-white',
  default: 'bg-navy text-white',
};

export function Toaster() {
  const { state, dispatch } = useStore();
  const toasts = state.ui.toasts;
  if (!toasts.length) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.tone] ?? TOAST_ICONS.default;
        return (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex animate-toast-in items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl',
              TOAST_TONES[t.tone] ?? TOAST_TONES.default,
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'dismissToast', id: t.id })}
              aria-label="알림 닫기"
              className="shrink-0 rounded-full p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown menu                                                      */
/* ------------------------------------------------------------------ */

export function Dropdown({ trigger, items = [], align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={cx('relative', className)}>
      <span onClick={() => setOpen((v) => !v)} role="presentation">
        {typeof trigger === 'function' ? trigger({ open }) : trigger}
      </span>
      {open ? (
        <div
          role="menu"
          className={cx(
            'absolute z-50 mt-2 min-w-[180px] animate-scale-in overflow-hidden rounded-xl border border-line/40 bg-surface py-1 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) =>
            it.divider ? (
              <hr key={`d-${i}`} className="my-1 border-0 border-t border-line/30" />
            ) : (
              <button
                key={it.key ?? it.label}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  it.onClick?.();
                  setOpen(false);
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors disabled:opacity-40',
                  it.tone === 'danger' ? 'text-danger hover:bg-danger-soft/50' : 'text-ink hover:bg-tint-100',
                )}
              >
                {it.icon ? <it.icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="min-w-0 flex-1">{it.label}</span>
                {it.shortcut ? <span className="text-[11px] text-ink-4">{it.shortcut}</span> : null}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip (title-based, lightweight)                                 */
/* ------------------------------------------------------------------ */

export function Tooltip({ label, children, className }) {
  return (
    <span className={cx('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

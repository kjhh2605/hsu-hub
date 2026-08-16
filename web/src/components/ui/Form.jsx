import React, { useId, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, Upload, X, AlertCircle } from 'lucide-react';
import { cx } from './Primitives';

/* ------------------------------------------------------------------ */
/* Field wrapper                                                      */
/* ------------------------------------------------------------------ */

export function FieldShell({ id, label, required, helper, error, counter, className, children }) {
  // className 에 w-* 유틸이 있으면 기본 w-full 을 적용하지 않는다.
  // (Tailwind 는 클래스 작성 순서가 아닌 CSS 순서로 우선순위가 결정되므로
  //  둘을 함께 넣으면 의도한 폭이 무시될 수 있다.)
  const hasWidth = /(^|\s)(w-|min-w-|max-w-)/.test(className ?? '');
  return (
    <div className={cx(!hasWidth && 'w-full', className)}>
      {label ? (
        <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-ink">
            {label}
            {required ? <span className="ml-1 text-danger">*</span> : null}
          </span>
          {counter ? <span className="text-xs tabular-nums text-ink-4">{counter}</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-ink-3">{helper}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TextInput                                                          */
/* ------------------------------------------------------------------ */

export function TextInput({
  label,
  required,
  helper,
  error,
  type = 'text',
  prefix,
  suffix,
  className,
  inputClassName,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <FieldShell id={id} label={label} required={required} helper={helper} error={error} className={className}>
      <div className="relative flex items-center">
        {prefix ? <span className="pointer-events-none absolute left-3.5 text-ink-3">{prefix}</span> : null}
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-required={required || undefined}
          className={cx(
            'field',
            error && 'field-error',
            prefix && 'pl-10',
            (suffix || isPassword) && 'pr-11',
            inputClassName,
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? '비밀번호 숨기기' : '비밀번호 표시'}
            className="absolute right-3 text-ink-3 hover:text-ink"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : suffix ? (
          <span className="pointer-events-none absolute right-3.5 text-sm text-ink-3">{suffix}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* TextArea                                                           */
/* ------------------------------------------------------------------ */

export function TextArea({
  label,
  required,
  helper,
  error,
  maxLength,
  minLength,
  value = '',
  rows = 5,
  className,
  id: idProp,
  ...rest
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const len = String(value ?? '').length;
  const counter = maxLength ? `${len} / ${maxLength}` : undefined;
  const tooShort = minLength && len > 0 && len < minLength;

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      helper={helper ?? (minLength ? `최소 ${minLength}자 이상 작성해 주세요.` : undefined)}
      error={error ?? (tooShort ? `${minLength}자 이상 입력해 주세요. (현재 ${len}자)` : undefined)}
      counter={counter}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        aria-invalid={!!error || !!tooShort}
        className={cx('field resize-y leading-relaxed', (error || tooShort) && 'field-error')}
        {...rest}
      />
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Select                                                             */
/* ------------------------------------------------------------------ */

export function Select({ label, required, helper, error, options = [], placeholder, className, id: idProp, ...rest }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} required={required} helper={helper} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error}
          className={cx('field appearance-none pr-10', error && 'field-error')}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      </div>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox / CheckboxGroup                                           */
/* ------------------------------------------------------------------ */

export function Checkbox({ label, desc, checked = false, onChange, disabled, className, id: idProp, ...rest }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <label
      htmlFor={id}
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors',
        checked ? 'border-primary/50 bg-primary/5' : 'border-line/50 bg-surface hover:bg-tint-100',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked, e)}
        {...rest}
      />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all',
          checked ? 'border-primary bg-primary text-white' : 'border-line bg-white',
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug text-ink">{label}</span>
        {desc ? <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{desc}</span> : null}
      </span>
    </label>
  );
}

export function CheckboxGroup({ label, required, helper, error, options = [], value = [], onChange, columns = 1, className }) {
  const toggle = (v) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange?.(next);
  };
  return (
    <FieldShell label={label} required={required} helper={helper} error={error} className={className}>
      <div
        role="group"
        className={cx('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}
      >
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            desc={o.desc}
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
        ))}
      </div>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Radio group                                                        */
/* ------------------------------------------------------------------ */

export function RadioGroup({ label, required, helper, error, options = [], value, onChange, name, columns = 1, className }) {
  const autoName = useId();
  return (
    <FieldShell label={label} required={required} helper={helper} error={error} className={className}>
      <div role="radiogroup" className={cx('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <label
              key={o.value}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors',
                active ? 'border-primary bg-primary/5' : 'border-line/50 bg-surface hover:bg-tint-100',
              )}
            >
              <input
                type="radio"
                name={name ?? autoName}
                className="sr-only"
                checked={active}
                onChange={() => onChange?.(o.value)}
              />
              <span
                aria-hidden="true"
                className={cx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  active ? 'border-primary' : 'border-line',
                )}
              >
                {active ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{o.label}</span>
                {o.desc ? <span className="mt-0.5 block text-xs text-ink-3">{o.desc}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle                                                             */
/* ------------------------------------------------------------------ */

export function Toggle({ checked = false, onChange, label, desc, disabled, className, id: idProp }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const control = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? label : undefined}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-line',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className={cx('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {desc ? <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{desc}</p> : null}
      </div>
      {control}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SegmentedControl                                                   */
/* ------------------------------------------------------------------ */

export function SegmentedControl({ options = [], value, onChange, className, size = 'md' }) {
  return (
    <div
      role="tablist"
      className={cx(
        'inline-flex w-full items-center gap-1 rounded-xl bg-line/20 p-1',
        className,
      )}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(o.value)}
            className={cx(
              'flex-1 rounded-lg font-semibold transition-all',
              size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm',
              active ? 'bg-surface text-primary shadow-xs' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
            {o.count != null ? <span className="ml-1 text-[11px] opacity-70">{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FileDrop                                                           */
/* ------------------------------------------------------------------ */

export function FileDrop({ label, required, helper, accept, value, onChange, className }) {
  const [over, setOver] = useState(false);
  const inputId = useId();

  const pick = (files) => {
    const f = files?.[0];
    if (f) onChange?.({ name: f.name, size: f.size, type: f.type });
  };

  return (
    <FieldShell label={label} required={required} helper={helper} className={className}>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line/50 bg-surface px-4 py-3">
          <span className="min-w-0 truncate text-sm text-ink">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange?.(null)}
            aria-label="파일 삭제"
            className="shrink-0 rounded-full p-1 text-ink-3 hover:bg-line/20 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            pick(e.dataTransfer.files);
          }}
          className={cx(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            over ? 'border-primary bg-primary/5' : 'border-line/60 bg-surface hover:bg-tint-100',
          )}
        >
          <Upload className="h-5 w-5 text-ink-3" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">파일을 선택하거나 끌어다 놓으세요</span>
          {accept ? <span className="text-xs text-ink-3">{accept} 형식</span> : null}
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => pick(e.target.files)}
          />
        </label>
      )}
    </FieldShell>
  );
}

/* ------------------------------------------------------------------ */
/* Consent row                                                        */
/* ------------------------------------------------------------------ */

export function Consent({ label, detail, checked, onChange, required, error }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={cx(
          'flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors',
          checked ? 'border-primary/40 bg-primary/5' : error ? 'border-danger bg-danger-soft/30' : 'border-line/50 bg-surface',
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={!!checked}
          aria-label={label}
          onClick={() => onChange?.(!checked)}
          className={cx(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
            checked ? 'border-primary bg-primary text-white' : 'border-line bg-white',
          )}
        >
          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </button>
        <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{label}</span>
        {detail ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 text-xs font-medium text-primary underline underline-offset-2"
            aria-expanded={open}
          >
            {open ? '접기' : '보기'}
          </button>
        ) : null}
      </div>
      {open && detail ? (
        <p className="mt-1.5 rounded-lg bg-line/15 px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">{detail}</p>
      ) : null}
      {error && required && !checked ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          필수 동의 항목입니다.
        </p>
      ) : null}
    </div>
  );
}

import React, { useId } from 'react';

export const QUESTION_TYPES = Object.freeze({
  SHORT_TEXT: 'SHORT_TEXT',
  LONG_TEXT: 'LONG_TEXT',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  DROPDOWN: 'DROPDOWN',
  EMAIL: 'EMAIL',
  TELEPHONE: 'TELEPHONE',
  RESUME: 'RESUME',
  CONSENT: 'CONSENT',
});

const TYPE_ALIASES = {
  SHORT: QUESTION_TYPES.SHORT_TEXT,
  TEXT: QUESTION_TYPES.SHORT_TEXT,
  LONG: QUESTION_TYPES.LONG_TEXT,
  TEXTAREA: QUESTION_TYPES.LONG_TEXT,
  RADIO: QUESTION_TYPES.SINGLE_CHOICE,
  CHECKBOX: QUESTION_TYPES.MULTIPLE_CHOICE,
  SELECT: QUESTION_TYPES.DROPDOWN,
  PHONE: QUESTION_TYPES.TELEPHONE,
  REQUIRED_CONSENT: QUESTION_TYPES.CONSENT,
};

export function normalizeQuestion(question, index = 0) {
  const rawType = String(question.type ?? question.questionType ?? 'SHORT_TEXT').toUpperCase();
  return {
    ...question,
    id: String(question.id ?? question.questionId ?? `question-${index + 1}`),
    type: TYPE_ALIASES[rawType] ?? rawType,
    label: question.label ?? question.title ?? `질문 ${index + 1}`,
    helpText: question.helpText ?? question.description ?? '',
    placeholder: question.placeholder ?? '',
    required: Boolean(question.required ?? question.isRequired),
    options: (question.options ?? []).map((option, optionIndex) => typeof option === 'object' ? ({
      id: String(option.id ?? option.value ?? `option-${optionIndex + 1}`),
      label: option.label ?? option.text ?? String(option.value ?? ''),
    }) : ({ id: String(option), label: String(option) })),
  };
}

export function normalizeFormSchema(schema) {
  const source = schema?.data ?? schema ?? {};
  const steps = source.steps ?? source.formSteps ?? [];
  return {
    id: source.id ?? source.formId ?? null,
    title: source.title ?? '지원서',
    steps: steps.map((step, index) => ({
      id: String(step.id ?? step.stepId ?? `step-${index + 1}`),
      title: step.title ?? step.label ?? `${index + 1}단계`,
      description: step.description ?? '',
      questions: (step.questions ?? step.fields ?? []).map(normalizeQuestion),
    })),
  };
}

function isBlank(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function validateAnswers(questions, answers) {
  const errors = {};
  for (const raw of questions) {
    const question = normalizeQuestion(raw);
    const value = answers?.[question.id];
    if (question.type === QUESTION_TYPES.CONSENT) {
      if (question.required && value !== true) errors[question.id] = '필수 항목에 동의해 주세요.';
      continue;
    }
    if (question.type === QUESTION_TYPES.RESUME) {
      const hasFile = Boolean(value?.file || value?.fileName);
      const hasUrl = Boolean(value?.url?.trim());
      if (hasFile && hasUrl) errors[question.id] = 'PDF 파일과 링크 중 하나만 선택해 주세요.';
      else if (question.required && !hasFile && !hasUrl) errors[question.id] = 'PDF 파일 또는 HTTPS 링크를 입력해 주세요.';
      else if (hasUrl) {
        try {
          const url = new URL(value.url);
          if (url.protocol !== 'https:' || !url.hostname) throw new Error('unsafe');
        } catch {
          errors[question.id] = 'https://로 시작하는 안전한 링크를 입력해 주세요.';
        }
      }
      continue;
    }
    if (question.required && isBlank(value)) {
      errors[question.id] = '필수 질문에 답변해 주세요.';
      continue;
    }
    if (isBlank(value)) continue;
    if (typeof value === 'string' && question.maxLength && value.length > question.maxLength) {
      errors[question.id] = `${question.maxLength}자 이하로 입력해 주세요.`;
    } else if (typeof value === 'string' && question.minLength && value.length < question.minLength) {
      errors[question.id] = `${question.minLength}자 이상 입력해 주세요.`;
    } else if (question.type === QUESTION_TYPES.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[question.id] = '올바른 이메일 주소를 입력해 주세요.';
    } else if (question.type === QUESTION_TYPES.TELEPHONE && !/^\+?[0-9][0-9 -]{7,19}$/.test(value)) {
      errors[question.id] = '올바른 전화번호를 입력해 주세요.';
    } else if (question.type === QUESTION_TYPES.SINGLE_CHOICE || question.type === QUESTION_TYPES.DROPDOWN) {
      if (!question.options.some((option) => option.id === value)) errors[question.id] = '목록에 있는 항목을 선택해 주세요.';
    } else if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      if (!Array.isArray(value) || value.some((item) => !question.options.some((option) => option.id === item))) {
        errors[question.id] = '목록에 있는 항목만 선택해 주세요.';
      }
    }
  }
  return errors;
}

export function createTextDraft(answers) {
  return Object.fromEntries(Object.entries(answers ?? {}).filter(([, value]) => {
    if (value instanceof File || value instanceof Blob) return false;
    if (value && typeof value === 'object' && !Array.isArray(value) && (value.file || value.fileName)) return false;
    return ['string', 'boolean', 'number'].includes(typeof value) || Array.isArray(value) || (value?.url && !value.file);
  }).map(([key, value]) => [key, value?.url ? { url: value.url } : value]));
}

export function draftStorageKey(userId, recruitmentId) {
  return `hsu-hub:draft:${String(userId)}:${String(recruitmentId)}`;
}

function FieldFrame({ question, error, children }) {
  return (
    <fieldset className="hsu-form__field" aria-describedby={error ? `${question.id}-error` : undefined}>
      <legend className="hsu-form__label">
        {question.label} {question.required && <span aria-label="필수" className="hsu-form__required">*</span>}
      </legend>
      {question.helpText && <p className="hsu-form__help">{question.helpText}</p>}
      {children}
      {error && <p id={`${question.id}-error`} role="alert" className="hsu-form__error">{error}</p>}
    </fieldset>
  );
}

function ResumeField({ question, value = {}, onChange, disabled }) {
  const uid = useId();
  const mode = value.url ? 'url' : 'file';
  return (
    <div className="hsu-form__resume">
      <div className="hsu-form__segmented" role="group" aria-label={`${question.label} 제출 방식`}>
        <button type="button" aria-pressed={mode === 'file'} onClick={() => onChange({})} disabled={disabled}>PDF 파일</button>
        <button type="button" aria-pressed={mode === 'url'} onClick={() => onChange({ url: '' })} disabled={disabled}>HTTPS 링크</button>
      </div>
      {mode === 'url' ? (
        <input id={`${uid}-url`} aria-label={`${question.label} 링크`} type="url" inputMode="url" placeholder="https://example.com/portfolio" value={value.url ?? ''} onChange={(event) => onChange({ url: event.target.value })} disabled={disabled} />
      ) : (
        <label className="hsu-form__file" htmlFor={`${uid}-file`}>
          <span>{value.fileName || 'PDF 파일 선택 (최대 10MB)'}</span>
          <input id={`${uid}-file`} aria-label={`${question.label} PDF 파일`} type="file" accept="application/pdf,.pdf" onChange={(event) => {
            const file = event.target.files?.[0];
            onChange(file ? { file, fileName: file.name } : {});
          }} disabled={disabled} />
        </label>
      )}
    </div>
  );
}

export function FormRenderer({ questions = [], answers = {}, errors = {}, onChange = () => {}, disabled = false }) {
  return (
    <div className="hsu-form">
      {questions.map((raw, index) => {
        const question = normalizeQuestion(raw, index);
        const value = answers[question.id];
        const common = { disabled, 'aria-invalid': Boolean(errors[question.id]) };
        let control;
        if ([QUESTION_TYPES.SHORT_TEXT, QUESTION_TYPES.EMAIL, QUESTION_TYPES.TELEPHONE].includes(question.type)) {
          const type = question.type === QUESTION_TYPES.EMAIL ? 'email' : question.type === QUESTION_TYPES.TELEPHONE ? 'tel' : 'text';
          control = <input aria-label={question.label} type={type} placeholder={question.placeholder} maxLength={question.maxLength} value={value ?? ''} onChange={(event) => onChange(question.id, event.target.value)} {...common} />;
        } else if (question.type === QUESTION_TYPES.LONG_TEXT) {
          control = <textarea aria-label={question.label} placeholder={question.placeholder} maxLength={question.maxLength} rows={5} value={value ?? ''} onChange={(event) => onChange(question.id, event.target.value)} {...common} />;
        } else if (question.type === QUESTION_TYPES.DROPDOWN) {
          control = <select aria-label={question.label} value={value ?? ''} onChange={(event) => onChange(question.id, event.target.value)} {...common}><option value="">선택해 주세요</option>{question.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>;
        } else if (question.type === QUESTION_TYPES.SINGLE_CHOICE) {
          control = <div className="hsu-form__options">{question.options.map((option) => <label key={option.id}><input type="radio" name={question.id} value={option.id} checked={value === option.id} onChange={() => onChange(question.id, option.id)} disabled={disabled} /> {option.label}</label>)}</div>;
        } else if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
          control = <div className="hsu-form__options">{question.options.map((option) => <label key={option.id}><input type="checkbox" checked={(value ?? []).includes(option.id)} onChange={(event) => onChange(question.id, event.target.checked ? [...(value ?? []), option.id] : (value ?? []).filter((item) => item !== option.id))} disabled={disabled} /> {option.label}</label>)}</div>;
        } else if (question.type === QUESTION_TYPES.CONSENT) {
          control = <label className="hsu-form__consent"><input type="checkbox" checked={value === true} onChange={(event) => onChange(question.id, event.target.checked)} disabled={disabled} /> {question.label}</label>;
          return <div className="hsu-form__field" key={question.id}>{control}{errors[question.id] && <p role="alert" className="hsu-form__error">{errors[question.id]}</p>}</div>;
        } else if (question.type === QUESTION_TYPES.RESUME) {
          control = <ResumeField question={question} value={value} onChange={(next) => onChange(question.id, next)} disabled={disabled} />;
        } else {
          control = <p role="alert">지원하지 않는 질문 유형입니다.</p>;
        }
        return <FieldFrame question={question} error={errors[question.id]} key={question.id}>{control}</FieldFrame>;
      })}
    </div>
  );
}

export function answerLabel(question, value) {
  const normalized = normalizeQuestion(question);
  if (normalized.type === QUESTION_TYPES.CONSENT) return value ? '동의함' : '동의하지 않음';
  if (normalized.type === QUESTION_TYPES.RESUME) return value?.fileName ?? value?.url ?? '제출하지 않음';
  if ([QUESTION_TYPES.SINGLE_CHOICE, QUESTION_TYPES.DROPDOWN].includes(normalized.type)) return normalized.options.find((option) => option.id === value)?.label ?? String(value ?? '');
  if (normalized.type === QUESTION_TYPES.MULTIPLE_CHOICE) return (value ?? []).map((item) => normalized.options.find((option) => option.id === item)?.label ?? item).join(', ');
  return String(value ?? '');
}

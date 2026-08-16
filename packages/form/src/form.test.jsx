import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  QUESTION_TYPES,
  FormRenderer,
  createTextDraft,
  validateAnswers,
  normalizeQuestion,
} from './index.jsx';

const questions = [
  { id: 'short', type: 'SHORT_TEXT', label: '이름', required: true, maxLength: 5 },
  { id: 'long', type: 'LONG_TEXT', label: '지원 동기', required: true, minLength: 3 },
  { id: 'single', type: 'SINGLE_CHOICE', label: '트랙', required: true, options: [{ id: 'a', label: '기획' }, { id: 'b', label: '개발' }] },
  { id: 'multiple', type: 'MULTIPLE_CHOICE', label: '관심 분야', options: [{ id: 'x', label: '웹' }, { id: 'y', label: '앱' }] },
  { id: 'dropdown', type: 'DROPDOWN', label: '학년', required: true, options: [{ id: '1', label: '1학년' }] },
  { id: 'email', type: 'EMAIL', label: '연락 이메일', required: true },
  { id: 'telephone', type: 'TELEPHONE', label: '전화번호', required: true },
  { id: 'resume', type: 'RESUME', label: '포트폴리오', required: true },
  { id: 'consent', type: 'CONSENT', label: '개인정보 수집에 동의합니다', required: true },
];

describe('shared form contract', () => {
  it('exposes every approved question type', () => {
    expect(Object.values(QUESTION_TYPES)).toEqual([
      'SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN',
      'EMAIL', 'TELEPHONE', 'RESUME', 'CONSENT',
    ]);
  });

  it('normalizes the backend string option DTO for applicant controls', () => {
    expect(normalizeQuestion({ id: 1, type: 'DROPDOWN', label: '학년', options: ['1학년', '2학년'] }).options).toEqual([
      { id: '1학년', label: '1학년' }, { id: '2학년', label: '2학년' },
    ]);
  });

  it('renders the same accessible controls from a published schema', () => {
    const onChange = vi.fn();
    render(<FormRenderer questions={questions} answers={{}} onChange={onChange} />);
    expect(screen.getByLabelText(/이름/).getAttribute('maxlength')).toBe('5');
    expect(screen.getByLabelText(/지원 동기/).tagName).toBe('TEXTAREA');
    expect(screen.getByRole('radio', { name: '기획' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: '웹' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /학년/ })).toBeTruthy();
    expect(screen.getByLabelText(/연락 이메일/).getAttribute('type')).toBe('email');
    expect(screen.getByLabelText(/전화번호/).getAttribute('type')).toBe('tel');
    expect(screen.getByRole('checkbox', { name: /개인정보 수집/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: '한성인' } });
    expect(onChange).toHaveBeenCalledWith('short', '한성인');
  });

  it('validates every answer and resume exclusivity in Korean', () => {
    const answers = {
      short: '너무긴이름입니다', long: 'ok', single: 'z', multiple: ['x', 'bad'], dropdown: '',
      email: 'invalid', telephone: '12', consent: false, resume: { url: 'http://unsafe.example', fileName: 'resume.pdf' },
    };
    const errors = validateAnswers(questions, answers);
    expect(errors.short).toContain('5자');
    expect(errors.long).toContain('3자');
    expect(errors.single).toContain('선택');
    expect(errors.multiple).toContain('선택');
    expect(errors.email).toContain('이메일');
    expect(errors.telephone).toContain('전화번호');
    expect(errors.resume).toContain('하나만');
    expect(errors.consent).toContain('동의');
  });

  it('keeps safe text draft values and excludes file objects', () => {
    const pdf = new File(['%PDF-1.7'], 'private.pdf', { type: 'application/pdf' });
    expect(createTextDraft({ short: '안전', multiple: ['x'], consent: true, resume: { file: pdf, fileName: pdf.name } })).toEqual({
      short: '안전', multiple: ['x'], consent: true,
    });
  });
});

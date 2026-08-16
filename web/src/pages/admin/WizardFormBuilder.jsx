import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Copy, GripVertical, Eye,
  Type, AlignLeft, CircleDot, CheckSquare, ChevronDown as SelectIcon,
  Upload, Link2, ShieldCheck, X, Lock, Phone, Mail,
} from 'lucide-react';
import WizardLayout from './_components/WizardLayout';
import { Panel, Button, Badge, Toggle, Modal, cx } from '@/components/ui';
import { TextInput, TextArea } from '@/components/ui/Form';
import { useStore, useToast } from '@/store/AppStore';
import { FIELD_TYPES, fieldTypeLabel } from '@/data/applications';

const ICON_MAP = {
  Type, AlignLeft, CircleDot, CheckSquare, ChevronDown: SelectIcon,
  Upload, Link: Link2, Shield: ShieldCheck, Phone, Mail,
};

const FIELD_PALETTE = FIELD_TYPES.map((ft) => ({
  type: ft.type,
  label: ft.label,
  icon: ICON_MAP[ft.icon] ?? Type,
  desc: ft.desc,
}));

// Fixed student info fields (from Figma)
const FIXED_FIELDS = [
  { label: '이름', desc: 'name' },
  { label: '학과', desc: 'department' },
  { label: '학번', desc: 'studentId' },
  { label: '연락처', desc: 'phone' },
];

let fieldSeq = 100;

export default function WizardFormBuilder() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const formSteps = state.recruitmentDraft.formSteps;

  const [activeStep, setActiveStep] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const currentStep = formSteps[activeStep] ?? { fields: [] };
  const fields = currentStep.fields ?? [];
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  // Stats
  const totalFields = useMemo(
    () => formSteps.reduce((s, st) => s + (st.fields?.length ?? 0), 0),
    [formSteps],
  );
  const estimatedMinutes = useMemo(() => Math.max(1, Math.ceil(totalFields * 1.5)), [totalFields]);

  const updateSteps = (newSteps) => {
    dispatch({ type: 'setFormSteps', steps: newSteps });
  };

  const updateCurrentFields = (newFields) => {
    const steps = formSteps.map((s, i) => (i === activeStep ? { ...s, fields: newFields } : s));
    updateSteps(steps);
  };

  // Add field
  const addField = (type) => {
    fieldSeq += 1;
    const fp = FIELD_PALETTE.find((p) => p.type === type);
    const newField = {
      id: `field-${fieldSeq}`,
      type,
      label: fp?.label ?? '필드',
      placeholder: '',
      helper: '',
      required: false,
      ...(type === 'radio' || type === 'checkbox' || type === 'select'
        ? { options: [{ value: 'opt1', label: '옵션 1' }] }
        : {}),
      ...(type === 'textarea' ? { maxLength: 500 } : {}),
      ...(type === 'consent' ? { detail: '개인정보 처리 방침 내용' } : {}),
    };
    updateCurrentFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    toast.show(`${newField.label} 필드 추가됨`);
  };

  // Update field
  const updateField = (id, patch) => {
    updateCurrentFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  // Delete field
  const deleteField = (id) => {
    updateCurrentFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // Duplicate field
  const duplicateField = (id) => {
    const src = fields.find((f) => f.id === id);
    if (!src) return;
    fieldSeq += 1;
    const newF = { ...JSON.parse(JSON.stringify(src)), id: `field-${fieldSeq}` };
    const idx = fields.findIndex((f) => f.id === id);
    const newFields = [...fields];
    newFields.splice(idx + 1, 0, newF);
    updateCurrentFields(newFields);
    setSelectedFieldId(newF.id);
  };

  // Move field
  const moveField = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const newFields = [...fields];
    [newFields[idx], newFields[target]] = [newFields[target], newFields[idx]];
    updateCurrentFields(newFields);
  };

  // Step management
  const addStep = () => {
    updateSteps([...formSteps, { title: `스텝 ${formSteps.length + 1}`, fields: [] }]);
    setActiveStep(formSteps.length);
  };

  const deleteStep = (idx) => {
    if (formSteps.length <= 1) return;
    const next = formSteps.filter((_, i) => i !== idx);
    updateSteps(next);
    setActiveStep(Math.min(activeStep, next.length - 1));
  };

  // Options management for selected field
  const addOption = () => {
    if (!selectedField) return;
    const opts = [...(selectedField.options ?? [])];
    opts.push({ value: `opt${opts.length + 1}`, label: `옵션 ${opts.length + 1}` });
    updateField(selectedField.id, { options: opts });
  };

  const removeOption = (optIdx) => {
    if (!selectedField) return;
    const opts = (selectedField.options ?? []).filter((_, i) => i !== optIdx);
    updateField(selectedField.id, { options: opts });
  };

  const updateOption = (optIdx, label) => {
    if (!selectedField) return;
    const opts = [...(selectedField.options ?? [])];
    opts[optIdx] = { ...opts[optIdx], label, value: label.toLowerCase().replace(/\s+/g, '_') || `opt${optIdx}` };
    updateField(selectedField.id, { options: opts });
  };

  return (
    <WizardLayout title="모집 생성 · 폼 빌더">
      <div className="grid h-[calc(100vh-260px)] min-h-[500px] grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Field Palette */}
        <div className="lg:col-span-2">
          <Panel className="h-full p-3">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-3">필드 팔레트</h4>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {FIELD_PALETTE.map((fp) => (
                <button
                  key={fp.type}
                  type="button"
                  onClick={() => addField(fp.type)}
                  className="flex items-center gap-2 rounded-lg border border-line/40 bg-surface px-3 py-2.5 text-left text-xs font-medium text-ink-2 transition-colors hover:border-primary/40 hover:bg-tint-100 hover:text-primary"
                  aria-label={fp.label}
                >
                  <fp.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {fp.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Center: Form Canvas */}
        <div className="overflow-y-auto lg:col-span-6">
          <Panel className="h-full p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              {/* Step Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {formSteps.map((step, i) => (
                  <div key={i} className="group flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={cx(
                        'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                        activeStep === i ? 'bg-primary text-white' : 'text-ink-3 hover:bg-line/20',
                      )}
                    >
                      {step.title ?? `스텝 ${i + 1}`}
                    </button>
                    {formSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteStep(i)}
                        aria-label={`스텝 ${i + 1} 삭제`}
                        className="hidden rounded p-0.5 text-ink-3 hover:text-danger group-hover:block"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  aria-label="스텝 추가"
                  className="shrink-0 rounded-lg p-1.5 text-ink-3 hover:bg-line/20 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button variant="tint" size="sm" icon={Eye} onClick={() => setPreviewOpen(true)}>
                미리보기
              </Button>
            </div>

            {/* Fixed Student Info Section */}
            <div className="mb-4 rounded-xl border border-line/40 bg-surface p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wide text-primary">기본 인적사항 (고정)</span>
                </div>
                <span className="text-[10px] italic text-ink-3">수정하거나 삭제할 수 없습니다.</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FIXED_FIELDS.map((ff) => (
                  <div key={ff.label} className="rounded-lg border border-line/20 bg-tint-100/70 p-3 opacity-70">
                    <p className="text-xs font-semibold text-ink-3">{ff.label}</p>
                    <div className="mt-1.5 h-4 w-3/4 rounded bg-line/20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Field cards */}
            <div className="space-y-2">
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <p className="text-sm font-medium text-ink-3">필드가 없습니다</p>
                  <p className="text-xs text-ink-4">왼쪽 팔레트에서 필드를 추가하세요</p>
                </div>
              )}
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFieldId(field.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedFieldId(field.id)}
                  className={cx(
                    'group flex items-center gap-2 rounded-lg border p-3 transition-all',
                    selectedFieldId === field.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-line/40 bg-surface hover:border-primary/30',
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-ink-4" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{field.label}</span>
                      <Badge tone="slate" className="text-[9px]">
                        {fieldTypeLabel(field.type)}
                      </Badge>
                      {field.required && <Badge tone="danger" className="text-[9px]">필수</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveField(idx, -1); }} disabled={idx === 0} aria-label="위로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveField(idx, 1); }} disabled={idx === fields.length - 1} aria-label="아래로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }} aria-label="복제" className="rounded p-1 text-ink-3 hover:bg-line/30">
                      <Copy className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} aria-label="삭제" className="rounded p-1 text-danger/70 hover:bg-danger-soft">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Buttons (from Figma) */}
            <div className="mt-4 flex flex-wrap gap-3">
              {FIELD_PALETTE.slice(0, 4).map((fp) => (
                <button
                  key={fp.type}
                  type="button"
                  onClick={() => addField(fp.type)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#DCE9FF] px-6 py-5 text-xs font-semibold text-ink transition-colors hover:bg-tint-200"
                  aria-label={`${fp.label} 추가`}
                >
                  <fp.icon className="h-5 w-5 text-ink" />
                  {fp.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addField('file')}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#DCE9FF] px-6 py-5 text-xs font-semibold text-ink transition-colors hover:bg-tint-200"
                aria-label="파일/URL 추가"
              >
                <Upload className="h-5 w-5 text-ink" />
                파일/URL
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center justify-end gap-4 text-xs text-ink-3">
              <span className="font-semibold">총 {totalFields}개 문항</span>
              <span className="font-semibold text-primary">예상 소요 시간: {estimatedMinutes}분</span>
            </div>
          </Panel>
        </div>

        {/* Right: Properties Panel */}
        <div className="overflow-y-auto lg:col-span-4">
          <Panel className="h-full p-4">
            {selectedField ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-ink-3">필드 속성</h4>
                <TextInput
                  label="라벨"
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
                <TextInput
                  label="플레이스홀더"
                  value={selectedField.placeholder ?? ''}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                />
                <TextInput
                  label="도움말"
                  value={selectedField.helper ?? ''}
                  onChange={(e) => updateField(selectedField.id, { helper: e.target.value })}
                />
                <Toggle
                  label="필수 항목"
                  checked={selectedField.required}
                  onChange={(v) => updateField(selectedField.id, { required: v })}
                />
                {selectedField.type === 'textarea' && (
                  <TextInput
                    label="최대 글자수"
                    type="number"
                    value={selectedField.maxLength ?? ''}
                    onChange={(e) => updateField(selectedField.id, { maxLength: Number(e.target.value) || undefined })}
                  />
                )}
                {/* Options for radio/checkbox/select */}
                {(selectedField.type === 'radio' || selectedField.type === 'checkbox' || selectedField.type === 'select') && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-ink">선택지</label>
                    <div className="space-y-1.5">
                      {(selectedField.options ?? []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            className="field h-8 flex-1 text-xs"
                            value={opt.label}
                            onChange={(e) => updateOption(i, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            aria-label="선택지 삭제"
                            className="text-ink-3 hover:text-danger"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" icon={Plus} onClick={addOption} className="mt-2">
                      선택지 추가
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-sm font-medium text-ink-3">필드를 선택하세요</p>
                <p className="text-xs text-ink-4">캔버스에서 필드를 클릭하면 속성을 편집할 수 있습니다</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="지원서 미리보기"
        size="lg"
      >
        <div className="space-y-4">
          {formSteps.map((step, si) => (
            <div key={si}>
              <h4 className="mb-3 text-sm font-bold text-ink">{step.title ?? `스텝 ${si + 1}`}</h4>
              <div className="space-y-3">
                {(step.fields ?? []).map((f) => (
                  <div key={f.id}>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      {f.label}
                      {f.required && <span className="ml-1 text-danger">*</span>}
                    </label>
                    {f.type === 'text' || f.type === 'url' ? (
                      <input className="field" placeholder={f.placeholder} disabled />
                    ) : f.type === 'textarea' ? (
                      <textarea className="field" rows={3} placeholder={f.placeholder} disabled />
                    ) : f.type === 'radio' ? (
                      <div className="space-y-1.5">
                        {(f.options ?? []).map((o, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm text-ink-2">
                            <input type="radio" disabled name={f.id} /> {o.label}
                          </label>
                        ))}
                      </div>
                    ) : f.type === 'checkbox' ? (
                      <div className="space-y-1.5">
                        {(f.options ?? []).map((o, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm text-ink-2">
                            <input type="checkbox" disabled /> {o.label}
                          </label>
                        ))}
                      </div>
                    ) : f.type === 'select' ? (
                      <select className="field" disabled>
                        <option>{f.placeholder || '선택하세요'}</option>
                        {(f.options ?? []).map((o, i) => <option key={i}>{o.label}</option>)}
                      </select>
                    ) : f.type === 'file' ? (
                      <div className="rounded-lg border-2 border-dashed border-line/60 bg-tint-50 px-4 py-6 text-center text-xs text-ink-3">
                        파일 업로드 영역
                      </div>
                    ) : f.type === 'consent' ? (
                      <label className="flex items-center gap-2 text-sm text-ink-2">
                        <input type="checkbox" disabled /> {f.label}
                      </label>
                    ) : (
                      <input className="field" disabled />
                    )}
                    {f.helper && <p className="mt-1 text-xs text-ink-3">{f.helper}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </WizardLayout>
  );
}

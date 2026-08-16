import React, { useMemo, useState } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, AlertCircle, GripVertical,
  FileText, Users, CalendarDays, Award,
} from 'lucide-react';
import WizardLayout from './_components/WizardLayout';
import { Panel, Button, Badge, Toggle, RadioGroup, Progress, SegmentedControl, cx } from '@/components/ui';
import { TextInput, Select } from '@/components/ui/Form';
import { useStore, useToast } from '@/store/AppStore';

const STAGE_TYPES = [
  { value: 'document', label: '서류 전형' },
  { value: 'docResult', label: '서류 발표' },
  { value: 'interview', label: '면접 전형' },
  { value: 'finalResult', label: '최종 발표' },
];

const STAGE_ICON = {
  document: FileText,
  docResult: Award,
  interview: Users,
  finalResult: Award,
};

const RESCHEDULE_OPTIONS = [
  { value: '6', label: '6시간 전까지' },
  { value: '12', label: '12시간 전까지' },
  { value: '24', label: '24시간 전까지' },
  { value: '48', label: '48시간 전까지' },
];

export default function WizardStages() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const draft = state.recruitmentDraft;
  const stages = draft.stages;

  const patchStage = (id, patch) => dispatch({ type: 'patchRecruitmentStage', id, patch });
  const patchDraft = (p) => dispatch({ type: 'patchRecruitmentDraft', patch: p });

  // Local state for policies (persisted to draft)
  const policies = {
    allowEdit: draft.allowEdit ?? true,
    rescheduleHours: draft.rescheduleHours ?? '24',
    maxApplications: draft.maxApplications ?? 1,
    interviewBookingFrom: draft.interviewBookingFrom ?? '',
    interviewBookingTo: draft.interviewBookingTo ?? '',
    docResultDate: draft.docResultDate ?? '',
    finalResultDate: draft.finalResultDate ?? '',
  };

  const setPolicies = (p) => patchDraft(p);

  // Validation errors
  const errors = useMemo(() => {
    const errs = {};
    stages.forEach((s, i) => {
      if (!s.from || !s.to) {
        errs[s.id] = '날짜를 입력해 주세요.';
      } else if (s.from > s.to) {
        errs[s.id] = '시작일이 종료일보다 늦습니다.';
      }
      if (i > 0 && stages[i - 1].to && s.from && s.from < stages[i - 1].to) {
        errs[s.id] = (errs[s.id] ? errs[s.id] + ' / ' : '') + '이전 단계와 날짜가 겹칩니다.';
      }
    });
    return errs;
  }, [stages]);

  const moveStage = (idx, dir) => {
    const list = [...stages];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    patchDraft({ stages: list });
  };

  const addStage = () => {
    const newStage = {
      id: `st-${Date.now()}`,
      type: 'document',
      label: '새 단계',
      from: '',
      to: '',
      enabled: true,
    };
    patchDraft({ stages: [...stages, newStage] });
  };

  const deleteStage = (id) => {
    patchDraft({ stages: stages.filter((s) => s.id !== id) });
    toast.success('단계가 삭제되었습니다.');
  };

  // Gantt timeline visualization
  const timelineRange = useMemo(() => {
    const dates = stages.filter((s) => s.from && s.to).flatMap((s) => [s.from, s.to]);
    if (dates.length === 0) return { min: '', max: '', span: 1 };
    dates.sort();
    const min = dates[0];
    const max = dates[dates.length - 1];
    const span = Math.max(1, Math.round((new Date(max) - new Date(min)) / 86400000));
    return { min, max, span };
  }, [stages]);

  const getBarStyle = (from, to) => {
    if (!from || !to || !timelineRange.min) return { left: '0%', width: '0%' };
    const start = Math.round((new Date(from) - new Date(timelineRange.min)) / 86400000);
    const len = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000));
    const left = (start / timelineRange.span) * 100;
    const width = (len / timelineRange.span) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%` };
  };

  const enabledStages = stages.filter((s) => s.enabled);

  return (
    <WizardLayout title="모집 생성 · 전형 설정">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Stage Summary */}
        <div className="lg:col-span-3">
          <Panel className="sticky top-24 p-5">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-ink-3">전형 요약</h4>
            <div className="space-y-3">
              {enabledStages.map((stage) => {
                const Icon = STAGE_ICON[stage.type] ?? CalendarDays;
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-medium text-ink">{stage.label}</span>
                  </div>
                );
              })}
              {enabledStages.length === 0 && (
                <p className="text-xs text-ink-3">활성화된 단계가 없습니다.</p>
              )}
            </div>
          </Panel>
        </div>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-9">
          {/* Section 1: Process Toggles */}
          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">전형 단계 활성화</h3>
                <p className="text-sm text-ink-3">모집 프로세스에 포함할 단계를 선택하세요.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stages.map((stage) => {
                const Icon = STAGE_ICON[stage.type] ?? CalendarDays;
                return (
                  <div
                    key={stage.id}
                    className={cx(
                      'rounded-xl border p-5 transition-all',
                      stage.enabled
                        ? 'border-transparent bg-tint-100'
                        : 'border-line/30 bg-surface opacity-60',
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <Icon className={cx('h-5 w-5', stage.enabled ? 'text-primary' : 'text-ink-3')} />
                      <Toggle
                        checked={stage.enabled}
                        onChange={(v) => patchStage(stage.id, { enabled: v })}
                      />
                    </div>
                    <p className="text-sm font-semibold text-ink">{stage.label}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {stage.type === 'document' && '지원서 내용을 바탕으로 1차 합격자를 선발합니다.'}
                      {stage.type === 'interview' && '대면 또는 비대면 면접을 통해 최종 후보를 검증합니다.'}
                      {stage.type === 'docResult' && '서류 합격자를 발표합니다.'}
                      {stage.type === 'finalResult' && '필수 단계입니다. 최종 합격자를 발표합니다.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Section 2: Schedules */}
          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-success-ink">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">주요 일정 설정</h3>
                <p className="text-sm text-ink-3">각 전형의 결과 발표 및 예약 일정을 입력하세요.</p>
              </div>
            </div>

            {/* Stage Date Rows */}
            <div className="space-y-3">
              {stages.filter((s) => s.enabled).map((stage, idx) => (
                <div
                  key={stage.id}
                  className={cx(
                    'rounded-xl border p-4 transition-colors',
                    errors[stage.id] ? 'border-danger/40 bg-danger-soft/20' : 'border-line/40 bg-tint-50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <input
                        className="field h-9 w-[140px] text-sm font-semibold"
                        value={stage.label}
                        onChange={(e) => patchStage(stage.id, { label: e.target.value })}
                        aria-label="단계명"
                      />
                      <select
                        className="field h-9 w-[120px] text-xs"
                        value={stage.type}
                        onChange={(e) => patchStage(stage.id, { type: e.target.value })}
                        aria-label="유형"
                      >
                        {STAGE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="field h-9 text-xs"
                        value={stage.from}
                        onChange={(e) => patchStage(stage.id, { from: e.target.value })}
                        aria-label="시작일"
                      />
                      <span className="text-xs text-ink-3">~</span>
                      <input
                        type="date"
                        className="field h-9 text-xs"
                        value={stage.to}
                        onChange={(e) => patchStage(stage.id, { to: e.target.value })}
                        aria-label="종료일"
                      />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => moveStage(idx, -1)} disabled={idx === 0} aria-label="위로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveStage(idx, 1)} disabled={idx === enabledStages.length - 1} aria-label="아래로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteStage(stage.id)} aria-label="삭제" className="rounded p-1 text-danger/70 hover:bg-danger-soft">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {errors[stage.id] && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
                      <AlertCircle className="h-3 w-3" />
                      {errors[stage.id]}
                    </p>
                  )}
                </div>
              ))}
              <Button variant="tint" size="sm" icon={Plus} onClick={addStage}>
                단계 추가
              </Button>
            </div>

            {/* Key Dates */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">서류 결과 발표일</label>
                <input
                  type="datetime-local"
                  className="field h-10 w-full text-sm"
                  value={policies.docResultDate}
                  onChange={(e) => setPolicies({ docResultDate: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-3">최종 결과 발표일</label>
                <input
                  type="datetime-local"
                  className="field h-10 w-full text-sm"
                  value={policies.finalResultDate}
                  onChange={(e) => setPolicies({ finalResultDate: e.target.value })}
                />
              </div>
            </div>

            {/* Interview Booking Period */}
            <div className="mt-5 rounded-xl border-l-4 border-primary bg-tint-100 p-5">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">면접 예약 가능 기간</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-3">시작 일시</label>
                  <input
                    type="datetime-local"
                    className="field h-10 w-full text-sm"
                    value={policies.interviewBookingFrom}
                    onChange={(e) => setPolicies({ interviewBookingFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-3">종료 일시</label>
                  <input
                    type="datetime-local"
                    className="field h-10 w-full text-sm"
                    value={policies.interviewBookingTo}
                    onChange={(e) => setPolicies({ interviewBookingTo: e.target.value })}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-3">* 서류 합격자들이 해당 기간 내에 직접 면접 시간대를 선택할 수 있습니다.</p>
            </div>
          </Panel>

          {/* Gantt Timeline */}
          <Panel className="p-6">
            <h3 className="mb-4 text-sm font-bold text-ink">일정 타임라인</h3>
            <div className="space-y-3">
              {enabledStages.map((stage) => {
                const style = getBarStyle(stage.from, stage.to);
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="w-[100px] shrink-0 truncate text-xs font-medium text-ink-2">{stage.label}</span>
                    <div className="relative h-6 flex-1 rounded-full bg-line/20">
                      <div
                        className="absolute top-0.5 h-5 rounded-full bg-grad-primary"
                        style={style}
                      />
                    </div>
                    <span className="w-[140px] shrink-0 text-right text-[10px] text-ink-3">
                      {stage.from} ~ {stage.to}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Section 3: Policies */}
          <Panel className="p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6063EE] text-white">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">운영 정책</h3>
                <p className="text-sm text-ink-3">예외 상황 처리를 위한 세부 규칙을 정의합니다.</p>
              </div>
            </div>
            <div className="divide-y divide-line/30">
              {/* Policy Row 1: 지원서 수정 허용 */}
              <div className="flex items-center justify-between gap-4 py-6">
                <div>
                  <p className="text-sm font-semibold text-ink">지원서 수정 허용</p>
                  <p className="mt-0.5 text-sm text-ink-3">제출 완료 후 모집 마감 전까지 지원자가 내용을 수정할 수 있도록 허용합니다.</p>
                </div>
                <SegmentedControl
                  options={[
                    { value: 'allow', label: '허용함' },
                    { value: 'deny', label: '불허' },
                  ]}
                  value={policies.allowEdit ? 'allow' : 'deny'}
                  onChange={(v) => setPolicies({ allowEdit: v === 'allow' })}
                />
              </div>
              {/* Policy Row 2: 면접 일정 변경 기한 */}
              <div className="flex items-center justify-between gap-4 py-6">
                <div>
                  <p className="text-sm font-semibold text-ink">면접 일정 변경 기한</p>
                  <p className="mt-0.5 text-sm text-ink-3">면접 시작 몇 시간 전까지 지원자가 스스로 일정을 변경할 수 있는지 설정합니다.</p>
                </div>
                <div className="w-[160px]">
                  <select
                    className="field h-10 w-full text-sm"
                    value={policies.rescheduleHours}
                    onChange={(e) => setPolicies({ rescheduleHours: e.target.value })}
                    aria-label="면접 일정 변경 기한"
                  >
                    {RESCHEDULE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Policy Row 3: 중복 지원 제한 */}
              <div className="flex items-center justify-between gap-4 py-6">
                <div>
                  <p className="text-sm font-semibold text-ink">중복 지원 제한</p>
                  <p className="mt-0.5 text-sm text-ink-3">동일한 사용자가 여러 개의 지원서를 제출하는 것을 방지합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-3">최대</span>
                  <input
                    type="number"
                    className="field h-10 w-[80px] text-center text-sm"
                    value={policies.maxApplications}
                    min={1}
                    onChange={(e) => setPolicies({ maxApplications: Math.max(1, Number(e.target.value) || 1) })}
                    aria-label="최대 지원 횟수"
                  />
                  <span className="text-xs text-ink-3">회</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </WizardLayout>
  );
}

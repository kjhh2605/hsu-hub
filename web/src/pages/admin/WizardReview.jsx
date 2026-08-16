import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Rocket, Calendar,
  FileText, Users, Shield, Eye, Pencil,
} from 'lucide-react';
import WizardLayout from './_components/WizardLayout';
import { Panel, Button, Badge, ConfirmDialog, Progress, RadioGroup, cx } from '@/components/ui';
import { TextInput } from '@/components/ui/Form';
import { useStore, useToast } from '@/store/AppStore';

export default function WizardReview() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const draft = state.recruitmentDraft;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishMode, setPublishMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');

  // Validation checklist
  const checks = useMemo(() => {
    const items = [];
    items.push({
      key: 'title',
      label: '모집 제목',
      pass: !!draft.title?.trim(),
      step: 0,
    });
    items.push({
      key: 'summary',
      label: '모집 요약',
      pass: !!draft.summary?.trim(),
      step: 0,
    });
    items.push({
      key: 'quota',
      label: '정원 설정',
      pass: Number(draft.quota) > 0,
      step: 0,
    });
    items.push({
      key: 'stages',
      label: '전형 단계 (1개 이상)',
      pass: (draft.stages ?? []).filter((s) => s.enabled).length >= 1,
      step: 1,
    });
    const allFields = (draft.formSteps ?? []).flatMap((s) => s.fields ?? []);
    items.push({
      key: 'questions',
      label: '필수 질문 (1개 이상)',
      pass: allFields.filter((f) => f.required).length >= 1,
      step: 2,
    });
    items.push({
      key: 'consent',
      label: '개인정보 동의 항목',
      pass: allFields.some((f) => f.type === 'consent'),
      step: 2,
    });
    return items;
  }, [draft]);

  const allPassed = checks.every((c) => c.pass);
  const passCount = checks.filter((c) => c.pass).length;

  const handlePublish = () => {
    dispatch({ type: 'publishRecruitment', mode: publishMode === 'schedule' ? 'schedule' : 'now' });
    setConfirmOpen(false);
    setPublished(true);
    toast.success(publishMode === 'schedule' ? '게시가 예약되었습니다.' : '모집이 게시되었습니다!');
  };

  const allFields = useMemo(() => (draft.formSteps ?? []).flatMap((s) => s.fields ?? []), [draft.formSteps]);
  const enabledStages = (draft.stages ?? []).filter((s) => s.enabled);

  // Success screen
  if (published) {
    return (
      <WizardLayout title="모집 생성 · 게시 완료">
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <span className="flex h-20 w-20 animate-scale-in items-center justify-center rounded-full bg-mint/30 text-success-ink">
            <CheckCircle2 className="h-10 w-10" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">모집이 게시되었습니다!</h2>
            <p className="mt-2 text-sm text-ink-3">지원자들이 이제 모집 공고를 확인할 수 있습니다.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={() => navigate('/admin/recruitments')}>
              모집 목록으로
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/admin')}>
              대시보드로
            </Button>
          </div>
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout title="모집 생성 · 검토 및 게시">
      {/* Progress bar */}
      <div className="mb-6 rounded-xl bg-tint-100/50 p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">마지막 단계: 최종 검토</span>
          <span className="text-xs text-ink-3">Step 4 of 4</span>
        </div>
        <Progress value={passCount} max={checks.length} tone={allPassed ? 'mint' : 'amber'} showValue />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Review Content (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-ink">작성한 내용을 확인해주세요</h2>
            <p className="mt-2 text-base text-ink-3">모집 공고가 게시된 후에는 일부 항목의 수정이 제한될 수 있습니다.</p>
          </div>

          {/* Section: Basic Info */}
          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-ink">기본 정보</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Pencil}
                onClick={() => navigate('/admin/recruitments/new/page')}
              >
                수정
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">모집 제목</p>
                <p className="mt-1 text-base text-ink">{draft.title || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">모집 분야</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(draft.tags ?? []).length > 0 ? (
                    draft.tags.map((t) => (
                      <Badge key={t} tone="slate" className="text-xs">{t}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-ink-3">-</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">학기</p>
                <p className="mt-1 text-sm text-ink">{draft.semester || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">정원</p>
                <p className="mt-1 text-sm text-ink">{draft.quota}명</p>
              </div>
            </div>
          </Panel>

          {/* Section: Recruitment Page Preview */}
          <Panel className="overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(70,72,212,0.1)]">
                    <Eye className="h-5 w-5 text-[#4648D4]" />
                  </div>
                  <h3 className="text-lg font-semibold text-ink">모집 상세 페이지</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  onClick={() => navigate('/admin/recruitments/new/page')}
                >
                  수정
                </Button>
              </div>
            </div>
            <div className="relative h-[200px] overflow-hidden rounded-b-lg">
              <div className={cx('flex h-full items-end p-6', draft.cover === 'grad-mint' ? 'bg-grad-mint' : 'bg-grad-primary')}>
                <div>
                  <p className="text-xs font-semibold text-white/80">커버 이미지 미리보기</p>
                  <p className="mt-1 text-lg font-semibold text-white">{draft.summary || '한 줄 소개가 여기에 표시됩니다.'}</p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Section: Application Form Questions */}
          <Panel className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(0,108,73,0.1)]">
                  <FileText className="h-5 w-5 text-[#006C49]" />
                </div>
                <h3 className="text-lg font-semibold text-ink">지원서 문항 (총 {allFields.length}개)</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Pencil}
                onClick={() => navigate('/admin/recruitments/new/form')}
              >
                수정
              </Button>
            </div>
            <div className="space-y-3">
              {allFields.slice(0, 3).map((f, i) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-tint-100 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-base text-ink">{f.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-ink-3">{f.type === 'textarea' ? '서술형' : f.type === 'text' ? '단답형' : f.type}</span>
                </div>
              ))}
              {allFields.length > 3 && (
                <div className="py-2 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/recruitments/new/form')}
                    className="text-sm font-medium text-ink hover:text-primary"
                  >
                    문항 전체 보기
                  </button>
                </div>
              )}
            </div>
          </Panel>

          {/* Section: Schedule & Policy side-by-side */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Schedule */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-ink">주요 일정</h3>
              </div>
              <div className="space-y-4">
                {enabledStages.map((stage) => (
                  <div key={stage.id} className="flex items-start gap-4">
                    <div className="mt-1 h-[48px] w-1 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{stage.label}</p>
                      <p className="mt-0.5 text-base text-ink">{stage.from} - {stage.to}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Policy */}
            <Panel className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFDAD6]">
                  <Shield className="h-5 w-5 text-danger" />
                </div>
                <h3 className="text-lg font-semibold text-ink">운영 정책</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-ink-3">
                    지원서 수정 {draft.allowEdit !== false ? '허용' : '허용 안 함'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-ink-3">
                    {draft.notifyPush !== false ? '합격자 자동 알림 통보' : '수동 알림'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-ink-3">
                    중복 지원 제한 (최대 {draft.maxApplications ?? 1}회)
                  </span>
                </div>
              </div>
            </Panel>
          </div>

          {/* Validation Checklist */}
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">게시 전 검증</h3>
              <Badge tone={allPassed ? 'mint' : 'amber'}>
                {passCount}/{checks.length} 통과
              </Badge>
            </div>
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-3 rounded-lg border border-line/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {c.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-success-ink" />
                    ) : (
                      <XCircle className="h-4 w-4 text-danger" />
                    )}
                    <span className={cx('text-sm font-medium', c.pass ? 'text-ink' : 'text-danger')}>{c.label}</span>
                  </div>
                  {!c.pass && (
                    <button
                      type="button"
                      onClick={() => {
                        const paths = [
                          '/admin/recruitments/new/page',
                          '/admin/recruitments/new/stages',
                          '/admin/recruitments/new/form',
                        ];
                        navigate(paths[c.step] ?? paths[0]);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      수정하기 <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Sticky Publish Panel (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            {/* Publish CTA */}
            <div className="rounded-2xl bg-primary p-8 shadow-lg">
              <h3 className="text-2xl font-semibold text-white">준비가 되셨나요?</h3>
              <p className="mt-2 text-base text-white/90">
                게시하기 버튼을 누르면 즉시 동아리 페이지에 공고가 노출되며, 지원을 받을 수 있습니다.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  variant="white"
                  size="lg"
                  block
                  icon={Rocket}
                  disabled={!allPassed}
                  onClick={() => setConfirmOpen(true)}
                >
                  게시하기
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  block
                  icon={Eye}
                  className="border border-white/30 text-white hover:bg-white/10"
                  onClick={() => toast.show('미리보기 페이지로 이동합니다.')}
                >
                  미리보기
                </Button>
              </div>
            </div>

            {/* Notices */}
            <div className="rounded-xl bg-tint-100 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-ink" />
                <span className="text-sm font-semibold text-ink">주의사항</span>
              </div>
              <ul className="space-y-2 text-sm text-ink-3">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>공고 게시 후 모집 기간은 단축할 수 없습니다.</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>이미 지원한 사용자가 있을 경우 문항 삭제가 제한됩니다.</span>
                </li>
              </ul>
            </div>

            {/* Publish Mode Options */}
            <Panel className="p-5">
              <h4 className="mb-3 text-sm font-bold text-ink">게시 옵션</h4>
              <RadioGroup
                options={[
                  { value: 'now', label: '즉시 게시', desc: '저장 즉시 공개되어 지원자가 확인할 수 있습니다.' },
                  { value: 'schedule', label: '예약 게시', desc: '지정한 날짜와 시간에 자동으로 공개됩니다.' },
                ]}
                value={publishMode}
                onChange={setPublishMode}
              />
              {publishMode === 'schedule' && (
                <div className="mt-3">
                  <TextInput
                    type="datetime-local"
                    label="게시 예정 일시"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              )}
            </Panel>

            {!allPassed && (
              <p className="text-xs text-danger">
                <AlertCircle className="mr-1 inline h-3 w-3" />
                검증 항목을 모두 통과해야 게시할 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handlePublish}
        title="모집을 게시하시겠습니까?"
        desc="게시 후에는 지원자들이 바로 확인할 수 있습니다."
        confirmLabel="게시하기"
      />
    </WizardLayout>
  );
}

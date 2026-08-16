import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { WizardSteps, Button } from '@/components/ui';
import { useStore, useToast } from '@/store/AppStore';

const STEPS = [
  { id: 'page', label: '페이지 편집', path: '/admin/recruitments/new/page' },
  { id: 'stages', label: '전형 설정', path: '/admin/recruitments/new/stages' },
  { id: 'form', label: '폼 빌더', path: '/admin/recruitments/new/form' },
  { id: 'review', label: '검토 및 게시', path: '/admin/recruitments/new/review' },
];

export default function WizardLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useStore();
  const toast = useToast();

  const currentIdx = STEPS.findIndex((s) => location.pathname === s.path);
  const current = Math.max(0, currentIdx);

  const handleJump = (idx) => {
    navigate(STEPS[idx].path);
  };

  const handlePrev = () => {
    if (current > 0) navigate(STEPS[current - 1].path);
  };

  const handleNext = () => {
    if (current < STEPS.length - 1) navigate(STEPS[current + 1].path);
  };

  const handleSave = () => {
    toast.success('임시 저장되었습니다.');
  };

  return (
    <AdminShell
      title={title ?? `모집 생성 · ${STEPS[current].label}`}
      breadcrumb="모집 관리"
      backTo="/admin/recruitments"
      compact
      footer={
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-3">
          <Button variant="ghost" size="md" icon={Save} onClick={handleSave}>
            임시저장
          </Button>
          <div className="flex items-center gap-2">
            {current > 0 && (
              <Button variant="secondary" size="md" onClick={handlePrev}>
                이전
              </Button>
            )}
            {current < STEPS.length - 1 && (
              <Button variant="primary" size="md" onClick={handleNext}>
                다음
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-[1080px]">
        <WizardSteps steps={STEPS} current={current} onJump={handleJump} className="mb-6" />
        {children}
      </div>
    </AdminShell>
  );
}

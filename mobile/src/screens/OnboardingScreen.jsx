import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { TopBar, Screen } from '../components/layout.jsx';
import { Button, Field, Input, Progress, Select } from '../components/ui.jsx';
import { ArrowRight, Sparkle, User } from '../components/icons.jsx';
import { DEPARTMENTS } from '../data/constants.js';
import { validateProfile } from '../store/logic.js';

export default function OnboardingScreen() {
  const { state, actions } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: state.user.name || '',
    department: state.user.department || '',
    studentId: state.user.studentId || '',
    phone: state.user.phone || '',
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const filled = Object.values(form).filter((v) => String(v).trim()).length;

  const submit = () => {
    const e = validateProfile(form);
    setErrors(e);
    if (Object.keys(e).length) {
      actions.toast('입력값을 확인해주세요.', 'error');
      return;
    }
    actions.completeProfile(form);
    actions.toast('프로필이 저장되었습니다.', 'success');
    const to = state.auth.redirectTo || '/explore';
    actions.setRedirect(null);
    nav(to, { replace: true });
  };

  return (
    <>
      <TopBar title="프로필 설정" over="STEP 1 OF 1" />
      <Screen>
        <div className="col g8 mb16">
          <div className="row between">
            <span className="t-label c-primary">기본 인적사항</span>
            <span className="t-cap ink3">{filled} / 4 완료</span>
          </div>
          <Progress value={(filled / 4) * 100} />
        </div>

        <div className="card card--tint card--flat card--pad row g12 mb24">
          <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--c-primary-10)', color: 'var(--c-primary)', display: 'flex' }}>
            <Sparkle size={20} />
          </span>
          <div className="col g2">
            <p className="t-label">자동 완성 안내</p>
            <p className="t-cap ink2">
              입력하신 정보는 <b className="c-primary">지원서에 자동으로 입력</b>되어, 매번 번거롭게 작성할 필요가 없어요!
            </p>
          </div>
        </div>

        <div className="col g20">
          <Field label="이름" required error={errors.name} htmlFor="p-name">
            <Input id="p-name" value={form.name} onChange={set('name')} placeholder="홍길동" error={errors.name} />
          </Field>
          <Field label="학과" required error={errors.department} htmlFor="p-dept">
            <Select
              id="p-dept"
              value={form.department}
              onChange={set('department')}
              placeholder="학과를 선택해주세요"
              options={DEPARTMENTS}
              error={errors.department}
            />
          </Field>
          <Field label="학번" required error={errors.studentId} help="숫자 8~9자리" htmlFor="p-sid">
            <Input
              id="p-sid"
              value={form.studentId}
              onChange={set('studentId')}
              inputMode="numeric"
              placeholder="20240001"
              error={errors.studentId}
            />
          </Field>
          <Field label="연락처" required error={errors.phone} htmlFor="p-phone">
            <Input
              id="p-phone"
              value={form.phone}
              onChange={set('phone')}
              inputMode="tel"
              placeholder="010-1234-5678"
              error={errors.phone}
            />
          </Field>
        </div>

        <div className="card card--tint card--flat card--pad row g16 mt24">
          <div className="col g4 grow">
            <p className="t-h4">거의 다 왔어요!</p>
            <p className="t-cap ink2 pre">{'프로필을 등록하면 동아리 지원이\n훨씬 빠르고 간편해집니다.'}</p>
          </div>
          <span className="center shrink0" style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--c-primary-10)', color: 'var(--c-primary)', display: 'flex' }}>
            <User size={34} />
          </span>
        </div>

        <p className="t-cap ink3 center-text mt24">
          계속 진행함으로써 개인정보 처리방침에 동의하게 됩니다
        </p>
      </Screen>

      <div className="actionbar">
        <Button variant="primary" size="lg" block onClick={submit}>
          저장하고 계속하기 <ArrowRight size={18} />
        </Button>
      </div>
    </>
  );
}

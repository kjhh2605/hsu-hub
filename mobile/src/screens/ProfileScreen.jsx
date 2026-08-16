import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { BottomNav, Screen, TopBar } from '../components/layout.jsx';
import { Badge, Button, Card, Field, Input, Select, Sheet, Toggle } from '../components/ui.jsx';
import {
  Award, Check, ChevronRight, FileText, Grid, LogOut, Refresh, Settings, Shield, User,
} from '../components/icons.jsx';
import { AppStatus, DEPARTMENTS } from '../data/constants.js';
import { validateProfile } from '../store/logic.js';

export default function ProfileScreen() {
  const { state, sel, actions } = useApp();
  const nav = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notiOn, setNotiOn] = useState(true);
  const [form, setForm] = useState({ ...state.user });
  const [errors, setErrors] = useState({});

  const apps = sel.myApplications();
  const joined = apps.filter((a) => a.status === AppStatus.FINAL_PASSED).length;
  const inProgress = apps.filter(
    (a) => ![AppStatus.FINAL_PASSED, AppStatus.REJECTED].includes(a.status)
  ).length;

  const isAdmin = state.user.role === 'admin';
  const managed = sel.club(state.user.managedClubId);

  const saveProfile = () => {
    const e = validateProfile(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    actions.completeProfile(form);
    actions.toast('프로필이 수정되었습니다.', 'success');
    setEditOpen(false);
  };

  const toggleRole = () => {
    const next = isAdmin ? 'applicant' : 'admin';
    actions.setRole(next);
    nav(next === 'admin' ? '/admin/applicants' : '/explore');
  };

  return (
    <>
      <TopBar brand />
      <Screen pad={false}>
        {/* 프로필 헤더 */}
        <div
          className="col center g12"
          style={{
            background: 'var(--c-surface-alt)',
            borderRadius: '0 0 32px 32px',
            padding: '24px 16px 32px',
          }}
        >
          <span
            className="center"
            style={{
              width: 96, height: 96, borderRadius: 999, display: 'flex',
              background: state.user.avatarColor, color: '#fff',
              fontSize: 30, fontWeight: 800,
              boxShadow: '0 0 0 4px #fff, 0 10px 20px -6px rgba(0,0,0,.2)',
            }}
            aria-hidden
          >
            {state.user.name.slice(0, 2)}
          </span>
          <div className="col center g4">
            <h1 className="t-h2">{state.user.name}</h1>
            <div className="row g8">
              <Badge tone="primary">{state.user.department}</Badge>
              <span className="t-cap ink2">{state.user.studentId}</span>
            </div>
          </div>

          <div className="row g24 mt12">
            <Stat n={joined} label="가입 동아리" />
            <Divider />
            <Stat n={inProgress} label="진행 중 지원" />
            <Divider />
            <Stat n={sel.unreadCount()} label="새 알림" />
          </div>
        </div>

        {/* 계정 관리 */}
        <Group title="계정 관리">
          <Row icon={<User size={18} />} label="내 정보 수정" onClick={() => { setForm({ ...state.user }); setEditOpen(true); }} />
          <Row icon={<FileText size={18} />} label="내 지원 내역" desc={`${apps.length}건`} onClick={() => nav('/applications')} />
          <Row
            icon={<Settings size={18} />}
            label="알림 수신"
            right={<Toggle on={notiOn} onChange={(v) => { setNotiOn(v); actions.toast(v ? '알림을 받습니다.' : '알림을 끊었습니다.'); }} label="알림 수신" />}
          />
        </Group>

        {/* 사용자 모드 */}
        <Group title="사용자 모드">
          <div className="list-row" style={{ background: 'var(--c-primary-05)' }}>
            <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-primary-10)', color: 'var(--c-primary)', display: 'flex' }}>
              {isAdmin ? <Shield size={18} /> : <User size={18} />}
            </span>
            <span className="col g2 grow">
              <span className="t-label">{isAdmin ? '운영진 모드' : '지원자 모드'}</span>
              <span className="t-cap c-primary">현재 활성화됨</span>
            </span>
            <span className="c-primary"><Check size={18} /></span>
          </div>
          <button type="button" className="list-row" onClick={toggleRole}>
            <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
              {isAdmin ? <User size={18} /> : <Shield size={18} />}
            </span>
            <span className="col g2 grow" style={{ textAlign: 'left' }}>
              <span className="t-label">{isAdmin ? '지원자 모드로 전환' : '운영진 모드로 전환'}</span>
              {!isAdmin && managed && <span className="t-cap ink3">{managed.name} 관리</span>}
            </span>
            <span className="ink4"><ChevronRight size={18} /></span>
          </button>
        </Group>

        {/* 운영진 메뉴 */}
        {isAdmin && (
          <Group title="운영진 메뉴">
            <Row icon={<Grid size={18} />} label="지원자 명단 관리" onClick={() => nav('/admin/applicants')} />
            <Row icon={<Award size={18} />} label="면접 세션 관리" onClick={() => nav('/admin/sessions')} />
          </Group>
        )}

        {/* 시스템 */}
        <Group title="시스템">
          <Row icon={<Refresh size={18} />} label="데모 데이터 초기화" onClick={() => { actions.reset(); nav('/explore'); }} />
          <button type="button" className="list-row" onClick={() => setLogoutOpen(true)}>
            <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-danger-10)', color: 'var(--c-danger)', display: 'flex' }}>
              <LogOut size={18} />
            </span>
            <span className="t-label c-danger grow" style={{ textAlign: 'left' }}>로그아웃</span>
          </button>
        </Group>

        <p className="t-cap ink3 center-text mt24" style={{ opacity: 0.6 }}>
          CampusConnect v2.4.1 · 이용약관 · 개인정보 처리방침
        </p>
      </Screen>
      <BottomNav />

      {/* 프로필 수정 시트 */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="내 정보 수정"
        footer={<Button variant="primary" size="lg" block onClick={saveProfile}>저장하기</Button>}
      >
        <div className="col g16">
          <Field label="이름" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          </Field>
          <Field label="학과" required error={errors.department}>
            <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={DEPARTMENTS} placeholder="학과 선택" error={errors.department} />
          </Field>
          <Field label="학번" required error={errors.studentId}>
            <Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} inputMode="numeric" error={errors.studentId} />
          </Field>
          <Field label="연락처" required error={errors.phone}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" error={errors.phone} />
          </Field>
        </div>
      </Sheet>

      {/* 로그아웃 확인 */}
      <Sheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="로그아웃 하시겠어요?"
        footer={
          <div className="row g8">
            <Button variant="soft" block onClick={() => setLogoutOpen(false)}>취소</Button>
            <Button variant="danger" block onClick={() => { actions.logout(); nav('/login', { replace: true }); }}>
              로그아웃
            </Button>
          </div>
        }
      >
        <p className="t-body-s ink2">데모 앱이므로 로그아웃 시 입력한 데이터가 초기화됩니다.</p>
      </Sheet>
    </>
  );
}

function Stat({ n, label }) {
  return (
    <div className="col center g2">
      <span className="t-h2 c-primary">{n}</span>
      <span className="t-cap ink3">{label}</span>
    </div>
  );
}
const Divider = () => <span style={{ width: 1, height: 32, background: 'var(--c-line-soft)' }} />;

function Group({ title, children }) {
  return (
    <div className="px16 mt24 col g8">
      <span className="t-over ink3">{title}</span>
      <Card className="col" style={{ overflow: 'hidden' }}>{children}</Card>
    </div>
  );
}

function Row({ icon, label, desc, right, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className="list-row" onClick={onClick}>
      <span className="center shrink0" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-tint-200)', color: 'var(--c-primary)', display: 'flex' }}>
        {icon}
      </span>
      <span className="col g2 grow" style={{ textAlign: 'left' }}>
        <span className="t-label">{label}</span>
        {desc && <span className="t-cap ink3">{desc}</span>}
      </span>
      {right ?? <span className="ink4"><ChevronRight size={18} /></span>}
    </Tag>
  );
}

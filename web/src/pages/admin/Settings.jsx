import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2, UserPlus } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import { Button, Badge, Avatar, Panel, Divider, EmptyState, cx } from '@/components/ui';
import { Tabs } from '@/components/ui/Data';
import { TextInput, TextArea, Select, Toggle } from '@/components/ui/Form';
import { Modal, ConfirmDialog } from '@/components/ui/Overlay';
import { SETTINGS_SCHEMA, ADMIN_ROLES, PERMISSION_MATRIX } from '@/data/user';
import { CATEGORIES } from '@/data/clubs';
import { formatDateTime } from '@/lib/utils';

const TABS = [
  { value: 'club', label: '동아리 정보' },
  { value: 'members', label: '운영진 관리' },
  { value: 'notifications', label: '알림' },
  { value: 'permissions', label: '권한' },
];

const roleLabel = (v) => ADMIN_ROLES.find((r) => r.value === v)?.label ?? v;

export default function Settings() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('club');

  /* ---------- 동아리 정보 (store 초기값, 저장 시 patchClub) ---------- */
  const { club, members, settings } = state;
  const [form, setForm] = useState({
    name: club.name,
    category: club.category,
    intro: club.intro,
    location: club.location,
    email: club.contact?.email ?? '',
    instagram: club.contact?.instagram ?? '',
  });
  const [errors, setErrors] = useState({});

  const dirty = useMemo(
    () =>
      form.name !== club.name ||
      form.category !== club.category ||
      form.intro !== club.intro ||
      form.location !== club.location ||
      form.email !== (club.contact?.email ?? '') ||
      form.instagram !== (club.contact?.instagram ?? ''),
    [form, club],
  );

  const setField = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleSaveClub = () => {
    const next = {};
    if (!form.name.trim()) next.name = '동아리 이름을 입력해 주세요.';
    if (!form.intro.trim()) next.intro = '소개를 입력해 주세요.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = '이메일 형식이 올바르지 않습니다.';
    }
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('입력값을 확인해 주세요.');
      return;
    }
    dispatch({
      type: 'patchClub',
      patch: {
        name: form.name,
        category: form.category,
        intro: form.intro,
        location: form.location,
        contact: { email: form.email, instagram: form.instagram },
      },
    });
    toast.success('동아리 정보가 저장되었습니다.');
  };

  /* ---------- 운영진 관리 ---------- */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('reviewer');
  const [inviteError, setInviteError] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);

  const handleInvite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      setInviteError('올바른 이메일을 입력해 주세요.');
      return;
    }
    if (members.some((m) => m.email === inviteEmail.trim())) {
      setInviteError('이미 초대된 이메일입니다.');
      return;
    }
    dispatch({ type: 'inviteMember', email: inviteEmail.trim(), role: inviteRole });
    toast.success(`${inviteEmail.trim()} 님에게 초대를 발송했습니다.`);
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('reviewer');
    setInviteError('');
  };

  /* ---------- 권한 매트릭스 ---------- */
  const [matrix, setMatrix] = useState(() =>
    PERMISSION_MATRIX.reduce((acc, p) => {
      acc[p.key] = { owner: p.owner, manager: p.manager, reviewer: p.reviewer, viewer: p.viewer };
      return acc;
    }, {}),
  );
  const [matrixDirty, setMatrixDirty] = useState(false);

  const toggleMatrix = (key, role) => {
    setMatrix((m) => ({ ...m, [key]: { ...m[key], [role]: !m[key][role] } }));
    setMatrixDirty(true);
  };

  return (
    <AdminShell title="설정" subtitle={`${club.name} · 운영진 ${members.length}명`}>
      <div className="mx-auto max-w-[980px]">
        <Tabs tabs={TABS} value={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* ---------------- 동아리 정보 ---------------- */}
        {activeTab === 'club' && (
          <Panel className="space-y-5 p-6">
            <TextInput
              label="동아리 이름"
              required
              value={form.name}
              onChange={setField('name')}
              error={errors.name}
            />
            <Select
              label="카테고리"
              options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
              value={form.category}
              onChange={setField('category')}
            />
            <TextArea
              label="소개"
              required
              rows={4}
              maxLength={500}
              value={form.intro}
              onChange={setField('intro')}
              error={errors.intro}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput label="활동 장소" value={form.location} onChange={setField('location')} />
              <TextInput
                label="연락처 (이메일)"
                type="email"
                value={form.email}
                onChange={setField('email')}
                error={errors.email}
              />
            </div>
            <TextInput label="인스타그램" value={form.instagram} onChange={setField('instagram')} placeholder="@club_id" />
            <Divider />
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-3">
                {dirty ? '저장하지 않은 변경사항이 있습니다.' : '모든 변경사항이 저장되었습니다.'}
              </p>
              <Button variant="primary" size="md" icon={Save} disabled={!dirty} onClick={handleSaveClub}>
                저장
              </Button>
            </div>
          </Panel>
        )}

        {/* ---------------- 운영진 관리 ---------------- */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{members.length}명의 운영진</p>
              <Button variant="tint" size="sm" icon={Plus} onClick={() => setInviteOpen(true)}>
                운영진 초대
              </Button>
            </div>

            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-line/40 bg-tint-50">
                    <th className="px-4 py-3 text-xs font-bold text-ink-3">이름</th>
                    <th className="px-4 py-3 text-xs font-bold text-ink-3">이메일</th>
                    <th className="px-4 py-3 text-xs font-bold text-ink-3">역할</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-ink-3">검토 건수</th>
                    <th className="px-4 py-3 text-xs font-bold text-ink-3">최근 접속</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-line/25 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar emoji={m.avatar} name={m.name} size="sm" />
                          <span className="text-sm font-semibold text-ink">{m.name}</span>
                          {m.pending ? <Badge tone="amber">초대중</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-2">{m.email}</td>
                      <td className="px-4 py-3">
                        <div className="w-[130px]">
                          <Select
                            options={ADMIN_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                            value={m.role}
                            aria-label={`${m.name} 역할`}
                            disabled={m.role === 'owner'}
                            onChange={(e) => {
                              dispatch({ type: 'setMemberRole', id: m.id, role: e.target.value });
                              toast.success(`${m.name} 님의 역할을 ${roleLabel(e.target.value)}로 변경했습니다.`);
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm tabular-nums text-ink">{m.reviewCount}</td>
                      <td className="px-4 py-3 text-xs text-ink-3">
                        {m.lastActiveAt ? formatDateTime(m.lastActiveAt) : '미접속'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={m.role === 'owner'}
                          onClick={() => setRemoveTarget(m)}
                          aria-label={`${m.name} 운영진에서 제외`}
                          className="rounded p-1 text-ink-4 transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ADMIN_ROLES.map((r) => (
                <div key={r.value} className="rounded-xl border border-line/40 bg-surface p-3.5">
                  <p className="text-[13px] font-bold text-ink">{r.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-3">{r.desc}</p>
                  <p className="mt-2 text-[11px] font-semibold text-primary">
                    {members.filter((m) => m.role === r.value).length}명
                  </p>
                </div>
              ))}
            </div>

            <Modal
              open={inviteOpen}
              onClose={() => setInviteOpen(false)}
              title="운영진 초대"
              desc="초대 링크가 이메일로 발송됩니다."
              footer={
                <div className="flex gap-2">
                  <Button variant="secondary" size="md" block onClick={() => setInviteOpen(false)}>
                    취소
                  </Button>
                  <Button variant="primary" size="md" block icon={UserPlus} onClick={handleInvite}>
                    초대하기
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <TextInput
                  label="이메일"
                  type="email"
                  required
                  placeholder="example@campus.ac.kr"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                  }}
                  error={inviteError}
                />
                <Select
                  label="권한"
                  options={ADMIN_ROLES.filter((r) => r.value !== 'owner').map((r) => ({
                    value: r.value,
                    label: `${r.label} — ${r.desc}`,
                  }))}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                />
              </div>
            </Modal>

            <ConfirmDialog
              open={!!removeTarget}
              onClose={() => setRemoveTarget(null)}
              onConfirm={() => {
                dispatch({ type: 'removeMember', id: removeTarget.id });
                toast.success(`${removeTarget.name} 님을 운영진에서 제외했습니다.`);
              }}
              title="운영진에서 제외할까요?"
              desc={`${removeTarget?.name ?? ''} 님은 더 이상 콘솔에 접근할 수 없습니다.`}
              confirmLabel="제외하기"
              tone="danger"
            />
          </div>
        )}

        {/* ---------------- 알림 ---------------- */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {SETTINGS_SCHEMA.map((section) => (
              <Panel key={section.section} className="p-6">
                <h3 className="mb-4 text-base font-bold text-ink">{section.section}</h3>
                <div className="space-y-4">
                  {section.items.map((item) =>
                    item.type === 'toggle' ? (
                      <Toggle
                        key={item.key}
                        label={item.label}
                        desc={item.desc}
                        checked={!!settings[item.key]}
                        onChange={(v) => {
                          dispatch({ type: 'setSetting', key: item.key, value: v });
                          toast.success(`${item.label} 설정을 ${v ? '켰' : '껐'}습니다.`);
                        }}
                      />
                    ) : (
                      <div key={item.key} className="w-[220px]">
                        <Select
                          label={item.label}
                          options={item.options}
                          value={settings[item.key]}
                          onChange={(e) => {
                            dispatch({ type: 'setSetting', key: item.key, value: e.target.value });
                            toast.success(`${item.label}을 변경했습니다.`);
                          }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* ---------------- 권한 ---------------- */}
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-line/40 bg-tint-50">
                    <th className="px-4 py-3 text-xs font-bold text-ink-3">권한</th>
                    {ADMIN_ROLES.map((r) => (
                      <th key={r.value} className="px-3 py-3 text-center text-xs font-bold text-ink-3">
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MATRIX.map((p) => (
                    <tr key={p.key} className="border-b border-line/25 last:border-0">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{p.label}</td>
                      {ADMIN_ROLES.map((r) => (
                        <td key={r.value} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!matrix[p.key][r.value]}
                            disabled={r.value === 'owner'}
                            onChange={() => toggleMatrix(p.key, r.value)}
                            className={cx(
                              'h-4 w-4 accent-[#0058BE]',
                              r.value === 'owner' && 'cursor-not-allowed opacity-40',
                            )}
                            aria-label={`${r.label} — ${p.label}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <p className="text-xs text-ink-3">대표(owner) 권한은 변경할 수 없습니다.</p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                icon={Save}
                disabled={!matrixDirty}
                onClick={() => {
                  setMatrixDirty(false);
                  toast.success('권한 설정이 저장되었습니다.');
                }}
              >
                저장
              </Button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <EmptyState icon={Plus} title="운영진이 없습니다" desc="운영진을 초대해 주세요." />
        ) : null}
      </div>
    </AdminShell>
  );
}

import { describe, it, expect } from 'vitest';
import { APPLICANTS, INTERVIEW_SESSIONS, DASHBOARD, RESULT_BATCH, EVALUATION_CRITERIA } from '@/data/admin';
import { RECRUITMENTS, CLUBS, CATEGORIES } from '@/data/clubs';
import { FORM_SCHEMAS, FIELD_TYPES, fieldTypeLabel, findFieldLabel } from '@/data/applications';
import { ADMIN_MEMBERS, ADMIN_ROLES, PERMISSION_MATRIX, NOTIFICATIONS, SETTINGS_SCHEMA } from '@/data/user';

/**
 * 더미데이터 정합성 — 화면 간에 서로 모순되는 수치가 노출되지 않도록 고정한다.
 * (대시보드가 187명이라고 하는데 명단에는 40명만 있는 상황을 방지)
 */

const count = (fn) => APPLICANTS.filter(fn).length;

describe('더미데이터 정합성 · 지원자 수치', () => {
  it('대시보드 총 지원자 = 실제 지원자 배열 길이', () => {
    const kpi = DASHBOARD.kpis.find((k) => k.key === 'applicants');
    expect(kpi.value).toBe(APPLICANTS.length);
  });

  it('대시보드 미검토 건수 = status==="pending" 개수', () => {
    const kpi = DASHBOARD.kpis.find((k) => k.key === 'unreviewed');
    expect(kpi.value).toBe(count((a) => a.status === 'pending'));
  });

  it('면접 예약 KPI = 실제 슬롯 예약 합계 / 전체 슬롯 수', () => {
    const kpi = DASHBOARD.kpis.find((k) => k.key === 'interviewBooked');
    const booked = INTERVIEW_SESSIONS.reduce(
      (n, s) => n + s.slots.reduce((m, sl) => m + sl.booked, 0),
      0,
    );
    const total = INTERVIEW_SESSIONS.reduce((n, s) => n + s.slots.length, 0);
    expect(kpi.value).toBe(booked);
    expect(kpi.suffix).toBe(`/ ${total}`);
  });

  it('경쟁률 = 총 지원자 / 정원', () => {
    const kpi = DASHBOARD.kpis.find((k) => k.key === 'competition');
    expect(kpi.value).toBeCloseTo(APPLICANTS.length / DASHBOARD.quota, 1);
  });

  it('퍼널의 지원 완료 = 총 지원자, 서류 합격/면접 완료/최종 합격 = 실제 상태 집계', () => {
    const f = (k) => DASHBOARD.funnel.find((x) => x.key === k).value;
    expect(f('submit')).toBe(APPLICANTS.length);
    expect(f('docPass')).toBe(
      count((a) => ['docPass', 'interviewScheduled', 'interviewDone', 'finalPass'].includes(a.status)),
    );
    expect(f('interview')).toBe(count((a) => ['interviewDone', 'finalPass'].includes(a.status)));
    expect(f('final')).toBe(count((a) => a.status === 'finalPass'));
  });

  it('퍼널은 단계마다 값이 줄어든다', () => {
    const vals = DASHBOARD.funnel.map((f) => f.value);
    for (let i = 1; i < vals.length; i += 1) {
      expect(vals[i]).toBeLessThanOrEqual(vals[i - 1]);
    }
  });

  it('일별 접수 추이 합계 = 총 지원자', () => {
    const sum = DASHBOARD.dailyApplications.reduce((n, d) => n + d.count, 0);
    expect(sum).toBe(APPLICANTS.length);
    expect(DASHBOARD.dailyApplications.every((d) => d.count >= 0)).toBe(true);
  });

  it('트랙 분포 합계 = 총 지원자', () => {
    const sum = DASHBOARD.trackDistribution.reduce((n, t) => n + t.value, 0);
    expect(sum).toBe(APPLICANTS.length);
  });

  it('모집 공고의 지원자 수 = 실제 지원자 배열 길이', () => {
    const rec = RECRUITMENTS.find((r) => r.id === 'rec-likelion-12');
    expect(rec.applicantCount).toBe(APPLICANTS.length);
  });

  it('결과 발표 대상 3분류 합계 = 총 지원자, 중복 없음', () => {
    const { passIds, failIds, holdIds } = RESULT_BATCH;
    const all = [...passIds, ...failIds, ...holdIds];
    expect(all).toHaveLength(APPLICANTS.length);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('더미데이터 정합성 · 문자열이 온전히 렌더된다', () => {
  /** 객체 트리를 훑어 모든 문자열을 모은다 */
  function allStrings(v, out = []) {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
    return out;
  }

  const SOURCES = {
    APPLICANTS,
    INTERVIEW_SESSIONS,
    DASHBOARD,
    RESULT_BATCH,
    RECRUITMENTS,
    CLUBS,
    NOTIFICATIONS,
    SETTINGS_SCHEMA,
    ADMIN_MEMBERS,
    FORM_SCHEMAS,
  };

  it('보간되지 않은 ${...} 자리표시자가 남아 있지 않다', () => {
    const bad = [];
    Object.entries(SOURCES).forEach(([name, src]) => {
      allStrings(src).forEach((s) => {
        if (s.includes('${')) bad.push(`${name}: ${s.slice(0, 80)}`);
      });
    });
    expect(bad).toEqual([]);
  });

  it('undefined / NaN / [object Object] 가 문자열에 섞이지 않는다', () => {
    const bad = [];
    Object.entries(SOURCES).forEach(([name, src]) => {
      allStrings(src).forEach((s) => {
        if (/undefined|NaN|\[object Object\]/.test(s)) bad.push(`${name}: ${s.slice(0, 80)}`);
      });
    });
    expect(bad).toEqual([]);
  });

  it('발표 문구는 {이름} 치환자를 포함한다', () => {
    expect(RESULT_BATCH.passTemplate).toContain('{이름}');
    expect(RESULT_BATCH.failTemplate).toContain('{이름}');
  });

  it('빈 문자열 라벨이 없다', () => {
    const bad = [];
    RECRUITMENTS.forEach((r) => {
      if (!r.title?.trim()) bad.push(`recruitment ${r.id}`);
      if (!r.highlight?.trim()) bad.push(`highlight ${r.id}`);
    });
    DASHBOARD.kpis.forEach((k) => {
      if (!k.label?.trim()) bad.push(`kpi ${k.key}`);
    });
    DASHBOARD.todos.forEach((t) => {
      if (!t.label?.trim()) bad.push(`todo ${t.id}`);
    });
    expect(bad).toEqual([]);
  });
});

describe('더미데이터 정합성 · 날짜와 상태가 모순되지 않는다', () => {
  const KNOWN_STATUS = ['open', 'screening', 'closed', 'scheduled', 'draft'];
  const now = Date.now();

  it('모집 상태는 정의된 값 중 하나다', () => {
    RECRUITMENTS.forEach((r) => expect(KNOWN_STATUS).toContain(r.status));
  });

  it("접수 마감이 지난 공고는 'open'(접수중)이 아니다", () => {
    RECRUITMENTS.filter((r) => new Date(r.closeAt).getTime() < now).forEach((r) => {
      expect(r.status).not.toBe('open');
    });
  });

  it("'scheduled'(게시 예정) 공고는 게시일이 미래다", () => {
    RECRUITMENTS.filter((r) => r.status === 'scheduled').forEach((r) => {
      expect(new Date(r.openAt).getTime()).toBeGreaterThan(now);
    });
  });

  it('모든 공고에서 openAt < closeAt 이다', () => {
    RECRUITMENTS.forEach((r) => {
      expect(new Date(r.openAt).getTime()).toBeLessThan(new Date(r.closeAt).getTime());
    });
  });

  it('전형 단계는 시간 순서대로 정렬되어 있고 from <= to 다', () => {
    RECRUITMENTS.forEach((r) => {
      r.stages.forEach((s) => expect(s.from <= s.to).toBe(true));
      for (let i = 1; i < r.stages.length; i += 1) {
        expect(r.stages[i].from >= r.stages[i - 1].from).toBe(true);
      }
    });
  });

  it('면접 세션 날짜는 미래이고, 활성 모집의 면접 단계 기간 안에 있다', () => {
    const rec = RECRUITMENTS.find((r) => r.id === 'rec-likelion-12');
    const iv = rec.stages.find((s) => s.type === 'interview');
    INTERVIEW_SESSIONS.forEach((s) => {
      expect(s.date >= iv.from).toBe(true);
      expect(s.date <= iv.to).toBe(true);
    });
  });

  it('지원자 제출 시각은 접수 기간 안에 있다', () => {
    const rec = RECRUITMENTS.find((r) => r.id === 'rec-likelion-12');
    const open = new Date(rec.openAt).getTime();
    const close = new Date(rec.closeAt).getTime();
    APPLICANTS.forEach((a) => {
      const t = new Date(a.submittedAt).getTime();
      expect(t).toBeGreaterThanOrEqual(open);
      expect(t).toBeLessThanOrEqual(close);
    });
  });

  it('결과 발표 예정 시각은 미래다', () => {
    expect(new Date(RESULT_BATCH.scheduledAt).getTime()).toBeGreaterThan(now);
  });

  it('알림 생성 시각은 모두 과거다', () => {
    NOTIFICATIONS.forEach((n) => {
      expect(new Date(n.createdAt).getTime()).toBeLessThanOrEqual(now + 1000);
    });
  });
});

describe('더미데이터 정합성 · 참조 무결성', () => {
  it('모든 지원자 id 가 고유하다', () => {
    const ids = APPLICANTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 슬롯 id 가 세션 전체에서 고유하다', () => {
    const ids = INTERVIEW_SESSIONS.flatMap((s) => s.slots.map((sl) => sl.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('슬롯에 배정된 applicantId 는 모두 실제 지원자다', () => {
    const known = new Set(APPLICANTS.map((a) => a.id));
    INTERVIEW_SESSIONS.forEach((s) =>
      s.slots.forEach((sl) => sl.applicantIds.forEach((id) => expect(known).toContain(id))),
    );
  });

  it('슬롯의 booked 는 배정 인원과 일치하고 정원을 넘지 않는다', () => {
    INTERVIEW_SESSIONS.forEach((s) =>
      s.slots.forEach((sl) => {
        expect(sl.booked).toBe(sl.applicantIds.length);
        expect(sl.booked).toBeLessThanOrEqual(sl.capacity);
      }),
    );
  });

  it('모집 공고의 clubId 는 모두 실제 동아리다', () => {
    const known = new Set(CLUBS.map((c) => c.id));
    RECRUITMENTS.forEach((r) => expect(known).toContain(r.clubId));
  });

  it('동아리의 category 는 모두 정의된 카테고리다', () => {
    const known = new Set(CATEGORIES.map((c) => c.id));
    CLUBS.forEach((c) => expect(known).toContain(c.category));
  });

  it('결과 발표 대상 id 는 모두 실제 지원자다', () => {
    const known = new Set(APPLICANTS.map((a) => a.id));
    [...RESULT_BATCH.passIds, ...RESULT_BATCH.failIds, ...RESULT_BATCH.holdIds].forEach((id) =>
      expect(known).toContain(id),
    );
  });
});

describe('더미데이터 정합성 · 폼 스키마', () => {
  it('폼 스키마가 쓰는 모든 필드 타입이 팔레트에 정의되어 있다', () => {
    const used = new Set();
    Object.values(FORM_SCHEMAS).forEach((s) =>
      s.steps.forEach((st) => st.fields.forEach((f) => used.add(f.type))),
    );
    const defined = new Set(FIELD_TYPES.map((t) => t.type));
    const missing = [...used].filter((t) => !defined.has(t));
    expect(missing).toEqual([]);
  });

  it('fieldTypeLabel 은 알 수 없는 타입에도 빈 문자열을 반환하지 않는다', () => {
    expect(fieldTypeLabel('text')).toBe('단문');
    expect(fieldTypeLabel('tel')).toBe('연락처');
    expect(fieldTypeLabel('unknown-type')).toBe('unknown-type');
  });

  it('findFieldLabel 이 폼 스키마에서 라벨을 찾는다', () => {
    expect(findFieldLabel('rec-likelion-12', 'motivation')).toMatch(/지원한 이유/);
    expect(findFieldLabel('rec-likelion-12', 'nope')).toBe('nope');
  });

  it('모든 필드 id 가 스키마 내에서 고유하다', () => {
    Object.values(FORM_SCHEMAS).forEach((s) => {
      const ids = s.steps.flatMap((st) => st.fields.map((f) => f.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('선택형 필드는 options 를 가진다', () => {
    Object.values(FORM_SCHEMAS).forEach((s) =>
      s.steps.forEach((st) =>
        st.fields
          .filter((f) => ['radio', 'checkbox', 'select'].includes(f.type))
          .forEach((f) => expect(f.options?.length ?? 0).toBeGreaterThan(0)),
      ),
    );
  });
});

describe('더미데이터 정합성 · 운영진/평가', () => {
  it('평가 기준 가중치 합계가 100 이다', () => {
    expect(EVALUATION_CRITERIA.reduce((n, c) => n + c.weight, 0)).toBe(100);
  });

  it('모든 지원자가 평가 기준별 점수 필드를 갖는다', () => {
    const keys = EVALUATION_CRITERIA.map((c) => c.id);
    APPLICANTS.forEach((a) => keys.forEach((k) => expect(typeof a.scores[k]).toBe('number')));
  });

  it('운영진 role 은 정의된 역할 중 하나이며 owner 는 정확히 1명이다', () => {
    const known = new Set(ADMIN_ROLES.map((r) => r.value));
    ADMIN_MEMBERS.forEach((m) => expect(known).toContain(m.role));
    expect(ADMIN_MEMBERS.filter((m) => m.role === 'owner')).toHaveLength(1);
  });

  it('권한 매트릭스가 모든 역할 컬럼을 정의한다', () => {
    PERMISSION_MATRIX.forEach((p) => {
      ADMIN_ROLES.forEach((r) => expect(typeof p[r.value]).toBe('boolean'));
    });
  });

  it('콘솔 알림은 모두 유효한 콘솔 경로를 가진다', () => {
    NOTIFICATIONS.forEach((n) => {
      expect(n.consoleTo).toMatch(/^\/(admin|screens)/);
    });
  });

  it('설정 스키마의 key 가 전체에서 고유하다', () => {
    const keys = SETTINGS_SCHEMA.flatMap((s) => s.items.map((i) => i.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

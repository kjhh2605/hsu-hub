import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * 코드베이스 위생 검사 — 이번 작업에서 실제로 발견된 문제들의 재발 방지.
 */

const SRC = path.resolve(__dirname, '..');

function collect(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const FILES = collect(SRC);
const rel = (f) => path.relative(SRC, f);

describe('코드베이스 위생', () => {
  it('스캔 대상 파일이 존재한다', () => {
    expect(FILES.length).toBeGreaterThan(25);
  });

  it('lucide-react 를 namespace(import * as) 로 가져오지 않는다 (트리셰이킹 방지)', () => {
    const bad = FILES.filter((f) =>
      /import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/.test(fs.readFileSync(f, 'utf8')),
    ).map(rel);
    expect(bad).toEqual([]);
  });

  it('아이콘 전용 button 에는 접근성 레이블이 있다', () => {
    const bad = [];
    for (const f of FILES) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;
      let m;
      while ((m = re.exec(src))) {
        const [, attrs, inner] = m;
        const stripped = inner.replace(/<[^>]*>/g, '');
        const text = stripped.replace(/\{[^}]*\}/g, '').trim();
        const hasDynamicText = /\{[^}]*\}/.test(stripped);
        if (!text && !hasDynamicText && !/aria-label|aria-labelledby/.test(attrs)) {
          bad.push(`${rel(f)}:${src.slice(0, m.index).split('\n').length}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('native <button> 에는 클릭 핸들러 또는 submit 타입이 있다 (죽은 버튼 금지)', () => {
    const bad = [];
    for (const f of FILES) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<button\b[\s\S]*?>/g;
      let m;
      while ((m = re.exec(src))) {
        const tag = m[0];
        // 직접 핸들러 / submit / props 스프레드(재사용 컴포넌트가 onClick 을 전달)
        if (/onClick|onSubmit|type="submit"|\{\.\.\.\w+\}/.test(tag)) continue;
        // Dropdown/Tooltip 의 trigger 로 넘겨지는 버튼은 래퍼가 핸들러를 붙인다.
        const before = src.slice(Math.max(0, m.index - 400), m.index);
        if (/trigger\s*=\s*\{[\s\S]*$/.test(before)) continue;
        bad.push(`${rel(f)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('기본 Tailwind 스케일에 없는 분수 유틸리티를 쓰지 않는다', () => {
    // 기본 스케일의 .5 단계는 0.5 / 1.5 / 2.5 / 3.5 뿐이다.
    const bad = [];
    for (const f of FILES) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /\b(?:h|w|p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|top|left|right|bottom|inset)-(\d+)\.5\b/g;
      let m;
      while ((m = re.exec(src))) {
        if (!['0', '1', '2', '3'].includes(m[1])) {
          bad.push(`${rel(f)}:${src.slice(0, m.index).split('\n').length} → ${m[0]}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('모든 <img> 에 alt 속성이 있다', () => {
    const bad = [];
    for (const f of FILES) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<img\b[\s\S]*?>/g;
      let m;
      while ((m = re.exec(src))) {
        if (!/\balt=/.test(m[0])) bad.push(`${rel(f)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('페이지가 더미 데이터 배열을 직접 변형하지 않는다 (스토어 경유 필수)', () => {
    const bad = FILES.filter((f) => /\/pages\//.test(f))
      .filter((f) =>
        /\b(APPLICANTS|INTERVIEW_SESSIONS|MY_APPLICATIONS|RECRUITMENTS|NOTIFICATIONS)\s*\.\s*(push|splice|pop|shift|sort|reverse)\s*\(/.test(
          fs.readFileSync(f, 'utf8'),
        ),
      )
      .map(rel);
    expect(bad).toEqual([]);
  });

  it('모든 페이지가 default export 를 가진다', () => {
    const bad = FILES.filter((f) => /\/pages\/.*\.jsx$/.test(f) && !/_components/.test(f))
      .filter((f) => !/export\s+default/.test(fs.readFileSync(f, 'utf8')))
      .map(rel);
    expect(bad).toEqual([]);
  });
});

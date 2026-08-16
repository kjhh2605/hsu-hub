import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Type, ListOrdered, AlertCircle, AlignLeft, Tag,
  Image as ImageIcon, HelpCircle,
} from 'lucide-react';
import WizardLayout from './_components/WizardLayout';
import { Panel, Button, Badge, Toggle, cx } from '@/components/ui';
import { TextInput, TextArea, Select } from '@/components/ui/Form';
import { useStore, useToast } from '@/store/AppStore';

const COVER_OPTIONS = [
  { value: 'grad-primary', label: '블루 그라디언트' },
  { value: 'grad-mint', label: '민트 그라디언트' },
  { value: 'grad-navy', label: '네이비' },
  { value: 'solid-white', label: '화이트' },
];

const BLOCK_TYPES = [
  { type: 'heading', label: '제목', icon: Type },
  { type: 'list', label: '목록', icon: ListOrdered },
  { type: 'callout', label: '콜아웃', icon: AlertCircle },
  { type: 'paragraph', label: '본문', icon: AlignLeft },
];

export default function WizardPageEditor() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const draft = state.recruitmentDraft;

  const patch = (p) => dispatch({ type: 'patchRecruitmentDraft', patch: p });

  const [tagInput, setTagInput] = useState('');

  // Block operations
  const updateBlock = (id, update) => {
    patch({ blocks: draft.blocks.map((b) => (b.id === id ? { ...b, ...update } : b)) });
  };

  const deleteBlock = (id) => {
    patch({ blocks: draft.blocks.filter((b) => b.id !== id) });
  };

  const moveBlock = (idx, dir) => {
    const blocks = [...draft.blocks];
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
    patch({ blocks });
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `b-${Date.now()}`,
      type,
      ...(type === 'list' ? { items: [''] } : { text: '' }),
    };
    patch({ blocks: [...draft.blocks, newBlock] });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = draft.tags ?? [];
    if (!current.includes(tag)) {
      patch({ tags: [...current, tag] });
    }
    setTagInput('');
  };

  const removeTag = (t) => {
    patch({ tags: (draft.tags ?? []).filter((x) => x !== t) });
  };

  // Benefits
  const benefits = draft.benefits ?? [];
  const addBenefit = () => {
    patch({ benefits: [...benefits, ''] });
  };
  const updateBenefit = (idx, val) => {
    const next = [...benefits];
    next[idx] = val;
    patch({ benefits: next });
  };
  const removeBenefit = (idx) => {
    patch({ benefits: benefits.filter((_, i) => i !== idx) });
  };

  // FAQ toggle
  const faqEnabled = draft.faqEnabled ?? false;

  return (
    <WizardLayout title="모집 생성 · 페이지 편집">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Edit Form */}
        <div className="space-y-5 lg:col-span-3">
          {/* Section: Representative Image */}
          <Panel className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">대표 이미지</h3>
                <p className="mt-0.5 text-xs text-ink-3">지원 공고 상단에 노출될 메인 이미지입니다. (권장 16:9)</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-line/60 bg-tint-50 px-4 py-12">
              <ImageIcon className="mb-2 h-9 w-9 text-primary" />
              <p className="text-sm font-medium text-primary">이미지 업로드</p>
              <p className="mt-1 text-xs text-ink-3">클릭하거나 파일을 드래그하세요</p>
            </div>
          </Panel>

          {/* Section: Basic Info */}
          <Panel className="space-y-4 p-5">
            <h3 className="text-base font-semibold text-ink">기본 정보</h3>
            <TextInput
              label="모집 제목"
              required
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="모집 공고 제목을 입력하세요"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="학기"
                value={draft.semester}
                onChange={(e) => patch({ semester: e.target.value })}
              />
              <TextInput
                label="정원"
                type="number"
                suffix="명"
                value={draft.quota}
                onChange={(e) => patch({ quota: Number(e.target.value) })}
              />
            </div>
            <TextArea
              label="한 줄 소개"
              value={draft.summary}
              onChange={(e) => patch({ summary: e.target.value })}
              rows={2}
              maxLength={100}
              placeholder="동아리를 한 마디로 정의해주세요."
            />
            <Select
              label="커버 스타일"
              options={COVER_OPTIONS}
              value={draft.cover}
              onChange={(e) => patch({ cover: e.target.value })}
            />
            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">태그</label>
              <div className="flex flex-wrap items-center gap-2">
                {(draft.tags ?? []).map((t) => (
                  <Badge key={t} tone="primary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`${t} 삭제`} className="ml-0.5 text-primary/60 hover:text-primary">×</button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    className="field h-8 w-[100px] text-xs"
                    placeholder="태그 추가"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="ghost" size="sm" icon={Tag} onClick={addTag} aria-label="태그 추가" />
                </div>
              </div>
            </div>
          </Panel>

          {/* Section: Detailed Description */}
          <Panel className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">상세 소개</h3>
              <div className="flex gap-1">
                {BLOCK_TYPES.map((bt) => (
                  <Button
                    key={bt.type}
                    variant="ghost"
                    size="sm"
                    icon={bt.icon}
                    onClick={() => addBlock(bt.type)}
                    aria-label={`${bt.label} 블록 추가`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {draft.blocks.map((block, idx) => (
                <div key={block.id} className="group relative rounded-lg border border-line/40 bg-tint-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge tone="slate" className="text-[10px]">{BLOCK_TYPES.find((b) => b.type === block.type)?.label ?? block.type}</Badge>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0} aria-label="위로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === draft.blocks.length - 1} aria-label="아래로" className="rounded p-1 text-ink-3 hover:bg-line/30 disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteBlock(block.id)} aria-label="삭제" className="rounded p-1 text-danger/70 hover:bg-danger-soft">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'list' ? (
                    <div className="space-y-1.5">
                      {(block.items ?? []).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-ink-3">{i + 1}.</span>
                          <input
                            className="field h-8 flex-1 text-xs"
                            value={item}
                            onChange={(e) => {
                              const items = [...block.items];
                              items[i] = e.target.value;
                              updateBlock(block.id, { items });
                            }}
                          />
                          <button
                            type="button"
                            aria-label="항목 삭제"
                            onClick={() => updateBlock(block.id, { items: block.items.filter((_, j) => j !== i) })}
                            className="text-ink-3 hover:text-danger"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Plus}
                        onClick={() => updateBlock(block.id, { items: [...(block.items ?? []), ''] })}
                      >
                        항목 추가
                      </Button>
                    </div>
                  ) : (
                    <textarea
                      className="field w-full resize-y text-xs leading-relaxed"
                      rows={block.type === 'heading' ? 1 : 2}
                      value={block.text ?? ''}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder={`${BLOCK_TYPES.find((b) => b.type === block.type)?.label ?? ''} 내용 입력`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* Section: Benefits */}
          <Panel className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">활동 혜택</h3>
              <Toggle
                checked={benefits.length > 0}
                onChange={(v) => {
                  if (v && benefits.length === 0) patch({ benefits: [''] });
                  else if (!v) patch({ benefits: [] });
                }}
              />
            </div>
            {benefits.length > 0 && (
              <div className="space-y-2">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="field h-9 flex-1 text-sm"
                      value={b}
                      onChange={(e) => updateBenefit(i, e.target.value)}
                      placeholder="혜택 내용을 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(i)}
                      aria-label="혜택 삭제"
                      className="rounded p-1 text-ink-3 opacity-40 hover:text-danger hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" icon={Plus} onClick={addBenefit}>
                  혜택 추가
                </Button>
              </div>
            )}
          </Panel>

          {/* Section: FAQ */}
          <Panel className={cx('p-5', !faqEnabled && 'opacity-60')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-ink">자주 묻는 질문 (FAQ)</h3>
                {!faqEnabled && (
                  <Badge tone="slate" className="text-[10px]">숨김 처리됨</Badge>
                )}
              </div>
              <Toggle
                checked={faqEnabled}
                onChange={(v) => patch({ faqEnabled: v })}
              />
            </div>
            {faqEnabled && (
              <p className="mt-3 text-xs text-ink-3">
                <HelpCircle className="mr-1 inline h-3 w-3" />
                FAQ 항목은 동아리 설정에서 관리할 수 있습니다.
              </p>
            )}
          </Panel>
        </div>

        {/* Right: 지원자에게 보이는 공고 페이지 미리보기 */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h3 className="mb-3 text-xs font-bold text-ink-3">모바일 미리보기</h3>
            <div className="mx-auto w-[320px] overflow-hidden rounded-[32px] border-2 border-line/60 bg-surface shadow-lg">
              {/* Phone status bar */}
              <div className="flex h-7 items-center justify-center bg-ink/5 text-[10px] text-ink-3">
                미리보기
              </div>
              {/* Cover */}
              <div
                className={cx(
                  'flex h-32 items-end p-4',
                  draft.cover === 'grad-mint' ? 'bg-grad-mint' : draft.cover === 'grad-navy' ? 'bg-navy' : 'bg-grad-primary',
                )}
              >
                <div>
                  <p className="text-[10px] font-medium text-white/70">{draft.semester}</p>
                  <h4 className="mt-0.5 text-sm font-bold leading-tight text-white">{draft.title || '모집 제목'}</h4>
                </div>
              </div>
              {/* Body */}
              <div className="max-h-[400px] overflow-y-auto p-4 text-xs leading-relaxed text-ink">
                <p className="mb-3 text-[11px] text-ink-2">{draft.summary || '요약이 여기에 표시됩니다.'}</p>
                {/* Benefits preview */}
                {benefits.length > 0 && (
                  <div className="mb-3">
                    <h5 className="mb-1.5 text-[13px] font-bold text-ink">활동 혜택</h5>
                    <div className="space-y-1.5">
                      {benefits.filter(Boolean).map((b, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-tint-100 p-2 text-[11px] text-ink-2">
                          ✨ {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {draft.blocks.map((block) => (
                  <div key={block.id} className="mb-3">
                    {block.type === 'heading' && (
                      <h5 className="text-[13px] font-bold text-ink">{block.text || '제목'}</h5>
                    )}
                    {block.type === 'paragraph' && (
                      <p className="text-[11px] text-ink-2">{block.text}</p>
                    )}
                    {block.type === 'list' && (
                      <ul className="ml-3 list-disc space-y-0.5 text-[11px] text-ink-2">
                        {(block.items ?? []).map((item, i) => (
                          <li key={i}>{item || '...'}</li>
                        ))}
                      </ul>
                    )}
                    {block.type === 'callout' && (
                      <div className="rounded-lg bg-tint-100 p-2 text-[11px] text-primary">
                        💡 {block.text || '콜아웃'}
                      </div>
                    )}
                  </div>
                ))}
                {(draft.tags ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {draft.tags.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{t}</span>
                    ))}
                  </div>
                )}
                <div className="mt-4 rounded-lg bg-primary p-3 text-center text-[11px] font-bold text-white">
                  지원하기 (정원 {draft.quota}명)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}

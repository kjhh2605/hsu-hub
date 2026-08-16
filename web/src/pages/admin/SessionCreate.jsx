import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock, MapPin } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useStore, useToast } from '@/store/AppStore';
import {
  cx, Button, Badge, Panel, Chip,
} from '@/components/ui';
import { TextInput, RadioGroup, SegmentedControl, Select } from '@/components/ui/Form';

const SLOT_DURATIONS = [
  { value: '15', label: '15분' },
  { value: '20', label: '20분' },
  { value: '30', label: '30분' },
  { value: '40', label: '40분' },
  { value: '60', label: '60분' },
];

export default function SessionCreate() {
  const { dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [placeType, setPlaceType] = useState('offline');
  const [placeValue, setPlaceValue] = useState('');
  const [interviewerInput, setInterviewerInput] = useState('');
  const [interviewers, setInterviewers] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');
  const [capacityPerSlot, setCapacityPerSlot] = useState('1');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [excludedSlots, setExcludedSlots] = useState(new Set());
  const [errors, setErrors] = useState({});

  // Compute slots
  const computedSlots = useMemo(() => {
    if (!startTime || !endTime) return [];
    const dur = Number(slotDuration);
    const brk = Number(breakMinutes) || 0;

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMin = (m) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };

    const startMin = toMin(startTime);
    const endMin = toMin(endTime);
    if (endMin <= startMin) return [];

    const slots = [];
    let cursor = startMin;
    let idx = 0;
    while (cursor + dur <= endMin) {
      slots.push({
        idx,
        start: fromMin(cursor),
        end: fromMin(cursor + dur),
      });
      cursor += dur + brk;
      idx++;
    }
    return slots;
  }, [startTime, endTime, slotDuration, breakMinutes]);

  const activeSlots = computedSlots.filter((_, i) => !excludedSlots.has(i));

  const toggleSlotExclude = (idx) => {
    setExcludedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addInterviewer = () => {
    const trimmed = interviewerInput.trim();
    if (trimmed && !interviewers.includes(trimmed)) {
      setInterviewers([...interviewers, trimmed]);
      setInterviewerInput('');
    }
  };

  const removeInterviewer = (name) => {
    setInterviewers(interviewers.filter((n) => n !== name));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = '세션명을 입력해 주세요.';
    if (!date) errs.date = '날짜를 선택해 주세요.';
    if (!placeValue.trim()) errs.place = '장소를 입력해 주세요.';
    if (!startTime) errs.startTime = '시작 시간을 입력해 주세요.';
    if (!endTime) errs.endTime = '종료 시간을 입력해 주세요.';
    if (startTime && endTime && endTime <= startTime) errs.endTime = '종료 시간은 시작 시간보다 뒤여야 합니다.';
    if (activeSlots.length === 0) errs.slots = '슬롯이 1개 이상 있어야 합니다.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const session = {
      id: `ses-${Date.now()}`,
      recruitmentId: 'rec-likelion-12',
      name,
      date,
      dayLabel: date,
      place: placeValue,
      status: 'open',
      slotMinutes: Number(slotDuration),
      capacityPerSlot: Number(capacityPerSlot),
      interviewers,
      slots: activeSlots.map((s, i) => ({
        id: `slot-new-${Date.now()}-${i}`,
        start: s.start,
        end: s.end,
        capacity: Number(capacityPerSlot) || 1,
        booked: 0,
        applicantIds: [],
      })),
    };

    dispatch({ type: 'createSession', session });
    toast.success('면접 세션이 생성되었습니다.');
    navigate('/admin/interviews');
  };

  return (
    <AdminShell
      title="면접 세션 생성"
      backTo="/admin/interviews"
      footer={
        <div className="flex items-center justify-end gap-3 max-w-[1080px] mx-auto">
          <Button variant="secondary" size="md" onClick={() => navigate('/admin/interviews')}>취소</Button>
          <Button variant="primary" size="md" onClick={handleSubmit}>세션 만들기</Button>
        </div>
      }
    >
      <div className="mx-auto max-w-[720px] space-y-6">
        <Panel className="p-5 space-y-5">
          <TextInput
            label="세션명"
            required
            placeholder="예: 1차 면접 · 3월 15일"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <TextInput
            label="날짜"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />

          <div>
            <p className="text-sm font-semibold text-ink mb-2">장소 유형</p>
            <RadioGroup
              options={[
                { value: 'offline', label: '오프라인', desc: '실제 장소에서 진행합니다' },
                { value: 'online', label: '온라인', desc: 'Zoom/Meet 링크를 입력합니다' },
              ]}
              value={placeType}
              onChange={setPlaceType}
              columns={2}
            />
          </div>

          <TextInput
            label={placeType === 'offline' ? '장소 주소' : '회의 링크'}
            required
            placeholder={placeType === 'offline' ? '예: 학생회관 302호' : 'https://zoom.us/...'}
            value={placeValue}
            onChange={(e) => setPlaceValue(e.target.value)}
            error={errors.place}
          />

          {/* Interviewers */}
          <div>
            <p className="text-sm font-semibold text-ink mb-2">면접관</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {interviewers.map((iv) => (
                <span key={iv} className="inline-flex items-center gap-1 rounded-full bg-tint-200 px-3 py-1 text-sm font-medium text-ink">
                  {iv}
                  <button type="button" onClick={() => removeInterviewer(iv)} aria-label={`${iv} 삭제`} className="ml-0.5 text-ink-3 hover:text-danger">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="면접관 이름 입력"
                value={interviewerInput}
                onChange={(e) => setInterviewerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterviewer(); } }}
                className="field flex-1"
              />
              <Button variant="tint" size="md" icon={Plus} onClick={addInterviewer}>추가</Button>
            </div>
          </div>
        </Panel>

        <Panel className="p-5 space-y-5">
          <h3 className="text-base font-bold text-ink">시간 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="시작 시간" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} error={errors.startTime} />
            <TextInput label="종료 시간" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} error={errors.endTime} />
          </div>

          <div>
            <p className="text-sm font-semibold text-ink mb-2">슬롯 길이</p>
            <SegmentedControl
              options={SLOT_DURATIONS}
              value={slotDuration}
              onChange={setSlotDuration}
              size="sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="슬롯당 인원"
              type="number"
              value={capacityPerSlot}
              onChange={(e) => setCapacityPerSlot(e.target.value)}
            />
            <TextInput
              label="쉬는 시간 (분)"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
        </Panel>

        {/* Slot preview */}
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-ink">슬롯 미리보기</h3>
            <Badge tone="primary">{activeSlots.length}개 슬롯</Badge>
          </div>
          {errors.slots && <p className="text-xs text-danger mb-2">{errors.slots}</p>}
          {computedSlots.length === 0 ? (
            <p className="text-sm text-ink-3 py-4 text-center">시작/종료 시간을 설정하면 슬롯이 표시됩니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {computedSlots.map((slot) => {
                const excluded = excludedSlots.has(slot.idx);
                return (
                  <button
                    key={slot.idx}
                    type="button"
                    onClick={() => toggleSlotExclude(slot.idx)}
                    className={cx(
                      'rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                      excluded
                        ? 'border-line/30 bg-line/10 text-ink-4 line-through'
                        : 'border-primary/40 bg-primary/10 text-primary',
                    )}
                  >
                    {slot.start} ~ {slot.end}
                  </button>
                );
              })}
            </div>
          )}
          {computedSlots.length > 0 && (
            <p className="mt-2 text-xs text-ink-3">클릭하여 개별 슬롯을 제외/포함할 수 있습니다.</p>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}

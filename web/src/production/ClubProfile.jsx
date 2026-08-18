import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useOperator } from './OperatorContext';
import { api, messageOf } from './api';
import { ErrorNotice, PageHeader } from './Shell';

const statusLabels = { RECRUITING: '모집중', CLOSED: '모집완료' };

function galleryOf(profile, clubId) {
  return (profile?.introductionImages ?? []).map((image, index) => ({
    kind: 'existing', id: image.id, url: `/api/v1/clubs/${clubId}/introduction-images/${image.id}`, index,
  }));
}

function DetailPreview({ profile, gallery }) {
  return <section className="profile-preview-card detail-profile-preview">
    <header><span>상세 화면 미리보기</span><b>{statusLabels[profile.recruitmentStatus] ?? '모집완료'}</b></header>
    <div className="detail-preview-body">
      <small>{profile.category || '동아리'}</small>
      <h3>{profile.name || '동아리 이름'}</h3>
      <p className="detail-preview-short">{profile.shortIntroduction || '짧은 소개가 여기에 표시됩니다.'}</p>
      <div className="detail-preview-copy">
        <strong>ABOUT THE CLUB</strong>
        <p>{profile.detailedIntroduction || '소개글이 여기에 표시됩니다. 작성한 내용이 사용자 상세 화면에 곧바로 반영됩니다.'}</p>
      </div>
      {gallery.length > 0 && <div className="preview-image-strip">{gallery.map((item, index) => <img src={item.url} alt={`소개 이미지 ${index + 1}`} key={item.kind === 'existing' ? item.id : item.key} />)}</div>}
      <button type="button" className={`preview-apply-button ${profile.recruitmentStatus !== 'RECRUITING' ? 'disabled' : ''}`}>{profile.recruitmentStatus === 'RECRUITING' ? '지원서 작성하기' : '모집완료'}</button>
    </div>
  </section>;
}

export default function ClubProfile() {
  const { clubId, selectedClub } = useOperator();
  const [form, setForm] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cover, setCover] = useState(null);
  const galleryRef = useRef(gallery);
  galleryRef.current = gallery;

  useEffect(() => {
    if (!clubId) return;
    setForm(null); setGallery([]); setCover(null); setError('');
    api.get(`/operator/clubs/${clubId}`).then((data) => { setForm(data); setGallery(galleryOf(data, clubId)); }).catch((reason) => setError(messageOf(reason)));
  }, [clubId]);

  useEffect(() => () => galleryRef.current.filter((item) => item.kind === 'new').forEach((item) => URL.revokeObjectURL(item.url)), []);
  const coverPreview = useMemo(() => cover ? URL.createObjectURL(cover) : `/api/v1/clubs/${clubId}/cover`, [cover, clubId]);
  useEffect(() => () => { if (cover) URL.revokeObjectURL(coverPreview); }, [cover, coverPreview]);

  function change(patch) { setForm((value) => ({ ...value, ...patch })); setNotice(''); }

  function addImages(event) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;
    if (gallery.length + files.length > 10) return setError('소개 이미지는 최대 10장까지 등록할 수 있습니다.');
    setError('');
    setGallery((items) => [...items, ...files.map((file) => ({ kind: 'new', key: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))]);
  }

  function removeImage(index) {
    const target = gallery[index];
    if (target?.kind === 'new') URL.revokeObjectURL(target.url);
    setGallery((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveImage(index, direction) {
    const next = index + direction;
    if (next < 0 || next >= gallery.length) return;
    setGallery((items) => { const copy = [...items]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy; });
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const retainedIds = gallery.filter((item) => item.kind === 'existing').map((item) => item.id);
      let saved = await api.patch(`/operator/clubs/${clubId}`, {
        shortIntroduction: form.shortIntroduction ?? '', detailedIntroduction: form.detailedIntroduction ?? '',
        recruitmentStatus: form.recruitmentStatus ?? 'CLOSED', introductionImageIds: retainedIds,
      });
      const newItems = gallery.filter((item) => item.kind === 'new');
      let newIds = [];
      if (newItems.length) {
        const data = new FormData();
        newItems.forEach((item) => data.append('files', item.file));
        saved = await api.post(`/operator/clubs/${clubId}/introduction-images`, data);
        newIds = saved.introductionImages.slice(-newItems.length).map((item) => item.id);
        const idsByKey = new Map(newItems.map((item, index) => [item.key, newIds[index]]));
        const orderedIds = gallery.map((item) => item.kind === 'existing' ? item.id : idsByKey.get(item.key));
        saved = await api.patch(`/operator/clubs/${clubId}`, {
          shortIntroduction: form.shortIntroduction ?? '', detailedIntroduction: form.detailedIntroduction ?? '',
          recruitmentStatus: form.recruitmentStatus ?? 'CLOSED', introductionImageIds: orderedIds,
        });
      }
      if (cover) {
        const data = new FormData(); data.append('file', cover);
        saved = await api.put(`/operator/clubs/${clubId}/cover`, data);
      }
      setForm(saved); setGallery(galleryOf(saved, clubId)); setCover(null);
      setNotice('동아리 프로필을 저장했습니다. 상세 화면에 바로 반영됩니다.');
    } catch (reason) { setError(messageOf(reason)); } finally { setBusy(false); }
  }

  return <main className="prod-page">
    <PageHeader eyebrow="CLUB PROFILE" title="동아리 프로필" description="목록 미리보기와 상세 소개, 모집상태를 한 곳에서 관리합니다." />
    {!form ? <div className="prod-loading inline"><span /><p>{error || '프로필을 불러오는 중입니다'}</p></div> : <form className="profile-layout" onSubmit={save}>
      <section className="prod-panel profile-form">
        <div className="section-title"><span>01</span><div><h2>소개 정보</h2><p>작성한 소개글이 사용자 상세 화면의 모집글로 표시됩니다.</p></div></div>
        <label>짧은 소개 <small>{(form.shortIntroduction ?? '').length}/240</small><input aria-label="짧은 소개" maxLength="240" value={form.shortIntroduction ?? ''} onChange={(e) => change({ shortIntroduction: e.target.value })} placeholder="예: 아이디어를 현실로 만드는 IT 동아리" /></label>
        <label>상세 소개 <small>{(form.detailedIntroduction ?? '').length}/10000</small><textarea aria-label="상세 소개" rows="10" maxLength="10000" value={form.detailedIntroduction ?? ''} onChange={(e) => change({ detailedIntroduction: e.target.value })} placeholder="동아리 활동과 함께할 사람을 소개해 주세요." /></label>
        <div className="status-field"><strong>모집상태</strong><div className="status-options">{Object.entries(statusLabels).map(([value, label]) => <label key={value}><input type="radio" name="recruitmentStatus" value={value} checked={form.recruitmentStatus === value} onChange={() => change({ recruitmentStatus: value })} />{label}</label>)}</div><small>모집중일 때만 사용자 상세 화면의 지원 버튼이 활성화됩니다.</small></div>
        <div className="intro-gallery-editor"><div className="gallery-heading"><div><strong>소개 이미지</strong><small>{gallery.length}/10장 · 상세 소개 하단에 가로로 표시됩니다.</small></div><label className="gallery-upload"><ImagePlus size={16} /> 이미지 추가<input aria-label="이미지 추가" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} /></label></div><div className="gallery-editor-list">{gallery.length ? gallery.map((item, index) => <div className="gallery-editor-item" key={item.kind === 'existing' ? item.id : item.key}><img src={item.url} alt={`소개 이미지 ${index + 1}`} /><span>{index + 1}</span><div><button type="button" aria-label={`${index + 1}번 이미지 위로 이동`} disabled={index === 0} onClick={() => moveImage(index, -1)}><ArrowLeft size={14} /></button><button type="button" aria-label={`${index + 1}번 이미지 아래로 이동`} disabled={index === gallery.length - 1} onClick={() => moveImage(index, 1)}><ArrowRight size={14} /></button><button type="button" aria-label={`${index + 1}번 이미지 삭제`} onClick={() => removeImage(index)}><Trash2 size={14} /></button></div></div>) : <p className="gallery-empty">소개글과 함께 보여줄 이미지를 추가해 주세요.</p>}</div></div>
      </section>
      <aside className="profile-preview-column">
        <section className="prod-panel cover-panel"><div className="section-title"><span>02</span><div><h2>대표 커버</h2><p>동아리 목록 카드에 표시되는 미리보기입니다.</p></div></div><div className="cover-preview" style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(4,15,31,.78)),url(${coverPreview})` }}><small>{form.category ?? selectedClub?.category}</small><strong>{form.name ?? selectedClub?.name}</strong><span className="cover-preview-short">{form.shortIntroduction || '짧은 소개가 여기에 표시됩니다.'}</span></div><label className="upload-button"><Camera size={17} />{cover ? cover.name : 'JPG, PNG, WebP 선택'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] ?? null)} /></label><p>최대 5MB · 가로형 이미지 권장</p></section>
        <DetailPreview profile={form} gallery={gallery} />
      </aside>
      <div className="save-bar"><div><ErrorNotice>{error}</ErrorNotice>{notice && <p className="prod-success" role="status">{notice}</p>}</div><button className="prod-button primary" disabled={busy}><Save size={17} />{busy ? '저장 중…' : '변경사항 저장'}</button></div>
    </form>}
  </main>;
}

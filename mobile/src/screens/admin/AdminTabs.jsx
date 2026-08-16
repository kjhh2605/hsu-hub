import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'applicants', label: '지원자 명단', to: '/admin/applicants' },
  { id: 'sessions', label: '면접 세션', to: '/admin/sessions' },
];

export default function AdminTabs({ active }) {
  const nav = useNavigate();
  return (
    <div className="px16 mt12">
      <div className="pill-tabs" role="tablist" aria-label="운영진 메뉴">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="pill-tab"
            aria-pressed={active === t.id}
            aria-selected={active === t.id}
            onClick={() => nav(t.to)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

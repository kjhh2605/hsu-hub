const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
});

export const Compass = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

export const FileText = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const Bell = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M18 8a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M13.7 20a2 2 0 01-3.4 0" />
  </svg>
);

export const User = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Users = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="3.4" />
    <path d="M22 20v-2a4 4 0 00-3-3.87M16.5 3.6a4 4 0 010 7.75" />
  </svg>
);

export const ChevronLeft = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ChevronRight = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevronDown = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ChevronUp = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);

export const ArrowRight = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const Check = ({ size = 20 }) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const CheckCircle = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21.5 11.1V12a9.5 9.5 0 11-5.6-8.7" />
    <path d="M8.5 11.8l3.2 3.2 9-9.4" />
  </svg>
);

export const X = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const Calendar = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 3v3M16 3v3" />
  </svg>
);

export const Clock = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3.2 2" />
  </svg>
);

export const MapPin = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M20 10.5c0 6-8 11.5-8 11.5S4 16.5 4 10.5a8 8 0 1116 0z" />
    <circle cx="12" cy="10.3" r="2.7" />
  </svg>
);

export const Search = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

export const Paperclip = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21 12.5l-8.6 8.6a5.5 5.5 0 01-7.8-7.8l8.7-8.7a3.7 3.7 0 015.2 5.2l-8.7 8.7a1.8 1.8 0 01-2.6-2.6l8-8" />
  </svg>
);

export const Link = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M10 13.5a4.5 4.5 0 006.4 0l2.8-2.8a4.5 4.5 0 00-6.4-6.4L11.4 5.6" />
    <path d="M14 10.5a4.5 4.5 0 00-6.4 0l-2.8 2.8a4.5 4.5 0 006.4 6.4l1.3-1.3" />
  </svg>
);

export const Upload = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21 15v3.5A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5V15" />
    <path d="M7.5 8.5L12 4l4.5 4.5M12 4v12" />
  </svg>
);

export const Sparkle = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
);

export const Rocket = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M13.5 4.5c3.5-2 6.5-1.5 6.5-1.5s.5 3-1.5 6.5c-1.6 2.8-6 7-6 7l-3.5-3.5s4.2-4.4 4.5-8.5z" />
    <path d="M9 14l-4 4M6.5 11.5L4 12l1.5 3M12.5 17.5L12 20l3-1.5" />
    <circle cx="15.5" cy="8.5" r="1.3" />
  </svg>
);

export const Cloud = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M17.5 19H7a4.5 4.5 0 01-.6-8.96A5.5 5.5 0 0117.4 10a4.5 4.5 0 01.1 9z" />
  </svg>
);

export const Award = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M8.5 13.8L7 22l5-3 5 3-1.5-8.2" />
  </svg>
);

export const Edit = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);

export const Trash = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M3.5 6.5h17M8.5 6.5V4.8A1.3 1.3 0 019.8 3.5h4.4a1.3 1.3 0 011.3 1.3v1.7" />
    <path d="M5.5 6.5l1 13a1.5 1.5 0 001.5 1.4h8a1.5 1.5 0 001.5-1.4l1-13" />
  </svg>
);

export const Info = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4.5M12 8.2h.01" />
  </svg>
);

export const Alert = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M10.3 3.9L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 16.8h.01" />
  </svg>
);

export const Shield = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 21s7.5-3.5 7.5-9.5V5.5L12 3 4.5 5.5v6c0 6 7.5 9.5 7.5 9.5z" />
  </svg>
);

export const LogOut = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M9 21H6a2 2 0 01-2-2V5a2 2 0 012-2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const Settings = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.56V21a2 2 0 11-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.87.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.56-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.33-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3.04V3a2 2 0 114 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.87-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9v0a1.7 1.7 0 001.56 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51 1z" />
  </svg>
);

export const Grid = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);

export const Ticket = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M3 9.5V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v3a2.5 2.5 0 000 5v3a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-3a2.5 2.5 0 000-5z" />
    <path d="M12 8v8" strokeDasharray="2 2.5" />
  </svg>
);

export const Sun = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </svg>
);

export const Moon = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M20.5 15.3A8.5 8.5 0 118.7 3.5a7 7 0 1011.8 11.8z" />
  </svg>
);

export const Star = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.5 6.6 20.4l1-6.1L3.2 10l6.1-.9z" />
  </svg>
);

export const Download = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21 15v3.5A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5V15" />
    <path d="M7.5 11.5L12 16l4.5-4.5M12 4v12" />
  </svg>
);

export const Send = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21.5 2.5L11 13" />
    <path d="M21.5 2.5l-6.6 19-3.9-8.5L2.5 9.1z" />
  </svg>
);

export const Filter = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M3.5 5.5h17M6.5 12h11M10 18.5h4" />
  </svg>
);

export const Camera = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M3.5 8.8A2 2 0 015.4 7h1.9l1.2-2h6.9l1.2 2h1.9a2 2 0 011.9 1.8v9.4A1.8 1.8 0 0118.6 20H5.4a1.8 1.8 0 01-1.9-1.8z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
);

export const Refresh = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M20.5 11a8.5 8.5 0 10-2.6 6.2" />
    <path d="M20.5 4.5V11h-6" />
  </svg>
);

export const Save = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M5 3.5h11L20.5 8v12.5A1 1 0 0119.5 21h-15a1 1 0 01-1-1V4.5a1 1 0 011-1z" />
    <path d="M8 3.5v6h8M8 15h8" />
  </svg>
);

export const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden focusable="false">
    <rect width="32" height="32" rx="10" fill="url(#ccg)" />
    <path
      d="M22 12.4a6.6 6.6 0 100 7.2"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="22.4" cy="16" r="2" fill="#6CF8BB" />
    <defs>
      <linearGradient id="ccg" x1="0" y1="0" x2="32" y2="32">
        <stop stopColor="#0058BE" />
        <stop offset="1" stopColor="#2170E4" />
      </linearGradient>
    </defs>
  </svg>
);

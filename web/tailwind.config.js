/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: '#0058BE',
          600: '#2170E4',
          700: '#005AC2',
          ink: '#07006C',
        },
        // Blue tints
        tint: {
          50: '#F8F9FF',
          100: '#EFF4FF',
          200: '#E5EEFF',
          300: '#DCE9FF',
          400: '#D3E4FE',
          500: '#ADC6FF',
        },
        // Neutrals
        bg: '#F8F9FF',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#0B1C30',
          2: '#424754',
          3: '#727785',
          4: '#9CA3AF',
        },
        line: {
          DEFAULT: '#C2C6D6',
        },
        navy: '#213145',
        // Success / mint
        mint: {
          DEFAULT: '#6CF8BB',
          600: '#4EDEA3',
        },
        success: {
          DEFAULT: '#006C49',
          ink: '#00714D',
        },
        // Danger
        danger: {
          DEFAULT: '#BA1A1A',
          ink: '#93000A',
          soft: '#FFDAD6',
        },
        // Accent indigo
        accent: {
          DEFAULT: '#4648D4',
          2: '#6063EE',
          soft: '#E1E0FF',
        },
        // Warning
        warn: {
          DEFAULT: '#8A5A00',
          soft: '#FFF2D6',
        },
        kakao: '#FEE500',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0,0,0,0.05)',
        sm: '0 2px 8px 0 rgba(0,0,0,0.03)',
        md: '0 2px 12px 0 rgba(0,0,0,0.04)',
        lg: '0 4px 12px -2px rgba(0,0,0,0.05)',
        xl: '0 8px 24px -4px rgba(0,0,0,0.08)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
        primary: '0 4px 12px -2px rgba(0,88,190,0.3)',
        nav: '0 -2px 16px 0 rgba(0,0,0,0.06)',
        top: '0 1px 8px 0 rgba(0,0,0,0.04)',
        card: '0 2px 4px -2px rgba(0,0,0,0.03), 0 4px 12px -2px rgba(0,0,0,0.05)',
        float: '0 -4px 24px 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(90deg, #0058BE 0%, #0066DD 100%)',
        'grad-primary-diag': 'linear-gradient(165deg, #2170E4 0%, #0058BE 100%)',
        'grad-mint': 'linear-gradient(155deg, #6CF8BB 0%, #4EDEA3 100%)',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      spacing: {
        sidebar: '288px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'toast-in': {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.22,0.61,0.36,1)',
        'slide-up': 'slide-up 260ms cubic-bezier(0.22,0.61,0.36,1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.22,0.61,0.36,1)',
        'toast-in': 'toast-in 200ms cubic-bezier(0.22,0.61,0.36,1)',
      },
    },
  },
  plugins: [],
};

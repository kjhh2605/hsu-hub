import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** 라우트 변경 시 window 스크롤을 최상단으로 복원 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);
  return null;
}

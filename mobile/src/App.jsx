import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useApp } from './store/AppContext.jsx';
import { Toasts } from './components/ui.jsx';
import { RequireAdmin, RequireAuth } from './components/layout.jsx';

import LoginScreen from './screens/LoginScreen.jsx';
import OnboardingScreen from './screens/OnboardingScreen.jsx';
import ExploreScreen from './screens/ExploreScreen.jsx';
import ClubDetailScreen from './screens/ClubDetailScreen.jsx';
import ApplyScreen from './screens/ApplyScreen.jsx';
import ApplyDoneScreen from './screens/ApplyDoneScreen.jsx';
import MyApplicationsScreen from './screens/MyApplicationsScreen.jsx';
import ApplicationDetailScreen from './screens/ApplicationDetailScreen.jsx';
import InterviewPickScreen from './screens/InterviewPickScreen.jsx';
import InterviewBookedScreen from './screens/InterviewBookedScreen.jsx';
import InterviewDetailScreen from './screens/InterviewDetailScreen.jsx';
import NotificationsScreen from './screens/NotificationsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import AdminApplicantsScreen from './screens/admin/AdminApplicantsScreen.jsx';
import AdminReviewScreen from './screens/admin/AdminReviewScreen.jsx';
import AdminSessionsScreen from './screens/admin/AdminSessionsScreen.jsx';
import AdminSlotDetailScreen from './screens/admin/AdminSlotDetailScreen.jsx';
import NotFoundScreen from './screens/NotFoundScreen.jsx';

/** 라우트 전환 시 스크롤 상단 복귀 */
function ScrollReset() {
  const { pathname } = useLocation();
  const ref = useRef(null);
  useEffect(() => {
    const el = document.querySelector('.screen');
    if (el) el.scrollTop = 0;
    ref.current = pathname;
  }, [pathname]);
  return null;
}

export default function App() {
  const { state, actions } = useApp();

  return (
    <div className="device-stage">
      <div className="device">
        <ScrollReset />
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingScreen />
              </RequireAuth>
            }
          />

          {/* 지원자 흐름 */}
          <Route path="/explore" element={<ExploreScreen />} />
          <Route path="/clubs/:clubId" element={<ClubDetailScreen />} />
          <Route
            path="/apply/:recruitmentId"
            element={
              <RequireAuth>
                <ApplyScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/apply/:recruitmentId/done"
            element={
              <RequireAuth>
                <ApplyDoneScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/applications"
            element={
              <RequireAuth>
                <MyApplicationsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/applications/:appId"
            element={
              <RequireAuth>
                <ApplicationDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/applications/:appId/interview/pick"
            element={
              <RequireAuth>
                <InterviewPickScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/applications/:appId/interview/booked"
            element={
              <RequireAuth>
                <InterviewBookedScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/applications/:appId/interview"
            element={
              <RequireAuth>
                <InterviewDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfileScreen />
              </RequireAuth>
            }
          />

          {/* 운영진 흐름 */}
          <Route
            path="/admin/applicants"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminApplicantsScreen />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/applicants/:id"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminReviewScreen />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminSessionsScreen />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/sessions/:slotId"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminSlotDetailScreen />
                </RequireAdmin>
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundScreen />} />
        </Routes>

        <Toasts items={state.toasts} onDismiss={actions.dismissToast} />
      </div>
    </div>
  );
}

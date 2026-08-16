import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireVerified, NotFound } from './production/Layout.jsx';
import { ForgotPassword, Login, ResetPassword, Signup, VerifyEmail } from './production/AuthPages.jsx';
import Home from './production/Home.jsx';
import { ClubDetail, ClubList } from './production/Clubs.jsx';
import { Apply, ApplyDone, ApplyReview } from './production/Application.jsx';

/** 라우트 전환 시 스크롤 상단 복귀 */
export default function App() {
  return (
    <div className="device-stage">
      <div className="device">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/clubs" element={<RequireVerified><ClubList /></RequireVerified>} />
          <Route path="/clubs/:clubId" element={<RequireVerified><ClubDetail /></RequireVerified>} />
          <Route path="/apply/:recruitmentId" element={<RequireVerified><Apply /></RequireVerified>} />
          <Route path="/apply/:recruitmentId/review" element={<RequireVerified><ApplyReview /></RequireVerified>} />
          <Route path="/apply/:recruitmentId/done" element={<RequireVerified><ApplyDone /></RequireVerified>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireAuth, NotFound } from './production/Layout.jsx';
import { Login } from './production/AuthPages.jsx';
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
          <Route path="/clubs" element={<RequireAuth><ClubList /></RequireAuth>} />
          <Route path="/clubs/:clubId" element={<RequireAuth><ClubDetail /></RequireAuth>} />
          <Route path="/apply/:recruitmentId" element={<RequireAuth><Apply /></RequireAuth>} />
          <Route path="/apply/:recruitmentId/review" element={<RequireAuth><ApplyReview /></RequireAuth>} />
          <Route path="/apply/:recruitmentId/done" element={<RequireAuth><ApplyDone /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

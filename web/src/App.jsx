import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui';
import ScrollToTop from '@/components/layout/ScrollToTop';

/* ---------- 운영진 콘솔 (데스크톱 1280px) ---------- */
import AdminDashboard from '@/pages/admin/Dashboard';
import RecruitmentList from '@/pages/admin/RecruitmentList';
import WizardPageEditor from '@/pages/admin/WizardPageEditor';
import WizardStages from '@/pages/admin/WizardStages';
import WizardFormBuilder from '@/pages/admin/WizardFormBuilder';
import WizardReview from '@/pages/admin/WizardReview';
import ApplicantList from '@/pages/admin/ApplicantList';
import ApplicantDetail from '@/pages/admin/ApplicantDetail';
import ResultReview from '@/pages/admin/ResultReview';
import InterviewSessions from '@/pages/admin/InterviewSessions';
import SessionCreate from '@/pages/admin/SessionCreate';
import SlotDetail from '@/pages/admin/SlotDetail';
import Evaluate from '@/pages/admin/Evaluate';
import AdminSettings from '@/pages/admin/Settings';

/* ---------- meta ---------- */
import ScreenIndex from '@/pages/ScreenIndex';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/recruitments" element={<RecruitmentList />} />
        <Route path="/admin/recruitments/new" element={<Navigate to="/admin/recruitments/new/page" replace />} />
        <Route path="/admin/recruitments/new/page" element={<WizardPageEditor />} />
        <Route path="/admin/recruitments/new/stages" element={<WizardStages />} />
        <Route path="/admin/recruitments/new/form" element={<WizardFormBuilder />} />
        <Route path="/admin/recruitments/new/review" element={<WizardReview />} />
        <Route path="/admin/applicants" element={<ApplicantList />} />
        <Route path="/admin/applicants/:applicantId" element={<ApplicantDetail />} />
        <Route path="/admin/results" element={<ResultReview />} />
        <Route path="/admin/interviews" element={<InterviewSessions />} />
        <Route path="/admin/interviews/new" element={<SessionCreate />} />
        <Route path="/admin/interviews/:sessionId/slots/:slotId" element={<SlotDetail />} />
        <Route path="/admin/interviews/evaluate/:applicantId" element={<Evaluate />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* 프로토타입 화면 목록 */}
        <Route path="/screens" element={<ScreenIndex />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

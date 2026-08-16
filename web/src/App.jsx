import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/layout/ScrollToTop';

/* ---------- 운영진 콘솔 (데스크톱 1280px) ---------- */
import { AdminShell, NotFound, RequireOperator } from '@/production/Shell';
import OperatorLogin from '@/production/Login';
import ClubProfile from '@/production/ClubProfile';
import RecruitmentList from '@/production/Recruitments';
import { WizardForm, WizardPage, WizardProvider, WizardReview, WizardStages } from '@/production/Wizard';
import { ApplicantDetail, ApplicantList } from '@/production/Applicants';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/club" replace />} />
        <Route path="/login" element={<OperatorLogin />} />
        <Route element={<RequireOperator><WizardProvider><AdminShell /></WizardProvider></RequireOperator>}>
          <Route path="/admin/club" element={<ClubProfile />} />
          <Route path="/admin/recruitments" element={<RecruitmentList />} />
          <Route path="/admin/recruitments/new/page" element={<WizardPage />} />
          <Route path="/admin/recruitments/new/stages" element={<WizardStages />} />
          <Route path="/admin/recruitments/new/form" element={<WizardForm />} />
          <Route path="/admin/recruitments/new/review" element={<WizardReview />} />
          <Route path="/admin/applicants" element={<ApplicantList />} />
          <Route path="/admin/applicants/:applicationId" element={<ApplicantDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

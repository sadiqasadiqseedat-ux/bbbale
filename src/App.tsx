import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './components/public/PublicLayout';
import { HomePage } from './components/public/HomePage';
import { AboutPage, PracticeAreasPage } from './components/public/PracticeAreasPage';
import { LeadershipPage, CounselPage } from './components/public/CounselPage';
import { BookConsultationPage } from './components/public/BookConsultationPage';
import { TrackingCentrePage } from './components/public/TrackingCentrePage';
import { InternshipPage } from './components/public/InternshipPage';
import { NoticeBoardPage, BranchesPage, ContactPage } from './components/public/ContactPage';

import { InternalLayout } from './components/internal/InternalLayout';
import { DashboardView } from './components/internal/DashboardView';
import { ClientsView } from './components/internal/ClientsView';
import { ConsultationsView } from './components/internal/ConsultationsView';
import { MattersAndCasesView } from './components/internal/MattersAndCasesView';
import { CourtDiaryView } from './components/internal/CourtDiaryView';
import { TasksView } from './components/internal/TasksView';
import { PropertiesView } from './components/internal/PropertiesView';
import { BillingView } from './components/internal/BillingView';
import { InternshipsView } from './components/internal/InternshipsView';
import { LegalResearchView } from './components/internal/LegalResearchView';
import { DocumentsView } from './components/internal/DocumentsView';
import { AdministrationView } from './components/internal/AdministrationView';
import { CloudflareD1Manager } from './components/internal/CloudflareD1Manager';
import { UserManagementView } from './components/internal/UserManagementView';
import { WebsiteManagementView } from './components/internal/WebsiteManagementView';
import { LoginPage } from './components/auth/LoginPage';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';

function MainApp() {
  const { isAuthenticated, requiresPasswordChange } = useAuth();
  const [isInternalMode, setIsInternalMode] = useState<boolean>(false);
  const [publicView, setPublicView] = useState<string>('home');
  const [internalSection, setInternalSection] = useState<string>('dashboard');
  const [initialTrackingCode, setInitialTrackingCode] = useState<string>('');

  const handleNavigatePublic = (view: string) => {
    setPublicView(view);
    setIsInternalMode(false);
  };

  const handleNavigateToTrackingWithCode = (code: string) => {
    setInitialTrackingCode(code);
    setPublicView('tracking');
    setIsInternalMode(false);
  };

  const handleNavigateInternal = (section: string) => {
    setInternalSection(section);
    setIsInternalMode(true);
  };

  // If in internal mode but NOT authenticated, present the professional Chambers LoginPage
  if (isInternalMode && !isAuthenticated) {
    return (
      <LoginPage
        onSuccessLogin={(needsPasswordChange) => {
          setIsInternalMode(true);
          setInternalSection('dashboard');
        }}
        onReturnToPublic={() => setIsInternalMode(false)}
      />
    );
  }

  // If authenticated and in internal mode
  if (isInternalMode && isAuthenticated) {
    return (
      <>
        {/* Enforce First Login Password Change Modal before allowing normal access */}
        {requiresPasswordChange && (
          <ChangePasswordModal
            isOpen={true}
            onSuccess={() => {
              // Once changed, continue to dashboard
              setInternalSection('dashboard');
            }}
            canDismiss={false}
          />
        )}

        <InternalLayout
          currentSection={internalSection}
          onNavigateSection={handleNavigateInternal}
          onOpenPublicSite={() => setIsInternalMode(false)}
        >
          {internalSection === 'dashboard' && <DashboardView onNavigateSection={handleNavigateInternal} />}
          {internalSection === 'users' && <UserManagementView />}
          {internalSection === 'website_content' && <WebsiteManagementView />}
          {internalSection === 'clients' && <ClientsView />}
          {internalSection === 'consultations' && <ConsultationsView />}
          {internalSection === 'matters_cases' && <MattersAndCasesView />}
          {internalSection === 'court_diary' && <CourtDiaryView />}
          {internalSection === 'tasks' && <TasksView />}
          {internalSection === 'properties' && <PropertiesView />}
          {internalSection === 'billing' && <BillingView />}
          {internalSection === 'internships' && <InternshipsView />}
          {internalSection === 'legal_research' && <LegalResearchView />}
          {internalSection === 'documents' && <DocumentsView />}
          {internalSection === 'administration' && <AdministrationView />}
          {internalSection === 'cloudflare_d1' && <CloudflareD1Manager />}
        </InternalLayout>
      </>
    );
  }

  return (
    <PublicLayout
      currentView={publicView}
      onNavigate={handleNavigatePublic}
      onOpenInternal={() => setIsInternalMode(true)}
    >
      {publicView === 'home' && <HomePage onNavigate={handleNavigatePublic} />}
      {publicView === 'about' && <AboutPage />}
      {publicView === 'leadership' && <LeadershipPage />}
      {publicView === 'counsel' && <CounselPage />}
      {publicView === 'practice' && <PracticeAreasPage />}
      {publicView === 'consultation' && (
        <BookConsultationPage onNavigateToTracking={handleNavigateToTrackingWithCode} />
      )}
      {publicView === 'tracking' && <TrackingCentrePage />}
      {publicView === 'internship' && (
        <InternshipPage onNavigateToTracking={handleNavigateToTrackingWithCode} />
      )}
      {publicView === 'notices' && <NoticeBoardPage />}
      {publicView === 'branches' && <BranchesPage />}
      {publicView === 'contact' && <ContactPage />}
    </PublicLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

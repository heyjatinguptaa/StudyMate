/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navbar } from './components/Navbar';
import { CitationModal } from './components/CitationModal';
import { DashboardView } from './components/DashboardView';
import { DocumentManagerView } from './components/DocumentManagerView';
import { AiTutorView } from './components/AiTutorView';
import { PracticeQuizView } from './components/PracticeQuizView';
import { VivaModeView } from './components/VivaModeView';
import { ExamAnswerView } from './components/ExamAnswerView';
import { WeakAreasView } from './components/WeakAreasView';
import { RevisionPlannerView } from './components/RevisionPlannerView';
import { SettingsView } from './components/SettingsView';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}
        {currentTab === 'documents' && <DocumentManagerView />}
        {currentTab === 'tutor' && <AiTutorView />}
        {currentTab === 'quiz' && (
          <PracticeQuizView onNavigateToTutor={() => setCurrentTab('tutor')} />
        )}
        {currentTab === 'viva' && (
          <VivaModeView onNavigateToWeakAreas={() => setCurrentTab('weak_areas')} />
        )}
        {currentTab === 'exam' && <ExamAnswerView />}
        {currentTab === 'weak_areas' && (
          <WeakAreasView
            onNavigateToTutor={() => setCurrentTab('tutor')}
            onNavigateToQuiz={() => setCurrentTab('quiz')}
          />
        )}
        {currentTab === 'revision' && (
          <RevisionPlannerView onNavigateToTutor={() => setCurrentTab('tutor')} />
        )}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Excerpt inspection modal */}
      <CitationModal />

      {/* Quiet Academic Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span>StudyMate AI</span>
            <span>·</span>
            <span className="text-slate-500 font-normal">
              Privacy-First Local AI Study Companion
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Local Open-Weight / RAG Architecture</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">100% Student Data Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}

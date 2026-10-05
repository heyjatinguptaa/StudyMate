import React, { useState } from 'react';
import {
  BookOpen,
  MessageSquare,
  FileQuestion,
  Mic,
  FileText,
  AlertTriangle,
  Clock,
  Settings,
  FolderOpen,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Plus,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EngineMode } from '../types/studymate';
import { SubjectModal } from './SubjectModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    subjects,
    activeSubjectId,
    setActiveSubjectId,
    engineMode,
    setEngineMode,
    weakTopics,
  } = useStudy();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'My Subjects', icon: FolderOpen },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
    { id: 'quiz', label: 'Practice Quiz', icon: FileQuestion },
    { id: 'viva', label: 'Viva Mode', icon: Mic },
    { id: 'exam', label: 'Exam Answer', icon: FileText },
    {
      id: 'weak_areas',
      label: 'Weak Areas',
      icon: AlertTriangle,
      badgeCount: weakTopics.length,
    },
    { id: 'revision', label: 'Revision Planner', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Pitch */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  StudyMate AI
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  v1.0 Local RAG
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Private, local AI study companion & exam coach
              </p>
            </div>
          </div>

          {/* Controls: Subject Filter + Engine Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Subject Selector + Add Subject Button */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="hidden md:inline font-medium">Subject:</span>
              <select
                aria-label="Filter by subject"
                value={activeSubjectId}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setIsSubjectModalOpen(true);
                  } else {
                    setActiveSubjectId(e.target.value);
                  }
                }}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200/70 text-slate-800 rounded-lg px-2.5 py-1.5 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
              >
                <option value="all">
                  {subjects.length === 0 ? 'No Subjects Added Yet' : 'All Subjects (All Notes)'}
                </option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code ? `${sub.code}: ` : ''}{sub.name}
                  </option>
                ))}
                <option value="__add_new__">+ Create New Subject...</option>
              </select>

              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors shrink-0"
                title="Create or manage course subjects"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subject</span>
              </button>
            </div>

            {/* Engine Mode Toggle (Local Privacy vs Cloud Speed) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setEngineMode('local')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  engineMode === 'local'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="100% Private local inference and client-side vector search"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Local AI</span>
              </button>

              <button
                type="button"
                onClick={() => setEngineMode('cloud')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  engineMode === 'cloud'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Accelerated Studio AI powered by Gemini 3.8 Flash"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Fast AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav
          aria-label="Main navigation"
          className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Privacy Banner Indicator */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1 px-4 text-center flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {engineMode === 'local'
              ? '🔒 Local AI Mode active: Your documents are processed and searched on your device.'
              : '⚡ Fast AI Mode active: Grounded in your uploaded notes via private proxy.'}
          </span>
        </div>
      </div>
      {/* Subject Management Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
    </header>
  );
};

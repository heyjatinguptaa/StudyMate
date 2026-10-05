import React, { useState } from 'react';
import {
  MessageSquare,
  FileQuestion,
  Mic,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  CheckCircle2,
  Sparkles,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { SubjectModal } from './SubjectModal';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    subjects,
    documents,
    weakTopics,
    activities,
    quizAttempts,
    vivaSessions,
    setActiveSubjectId,
  } = useStudy();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const topWeakTopic = weakTopics.length > 0 ? weakTopics[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Performance Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back to StudyMate 👋
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {subjects.length === 0
              ? 'No courses added yet · All starting scores begin at 0% · Give your subjects a name to get started.'
              : `${documents.length} study documents indexed locally across ${subjects.length} course${subjects.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('tutor')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI Tutor</span>
          </button>
          <button
            onClick={() => onNavigate('quiz')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
            <span>Practice Quiz</span>
          </button>
          <button
            onClick={() => onNavigate('viva')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Mic className="w-3.5 h-3.5 text-amber-600" />
            <span>Viva Mode</span>
          </button>
          <button
            onClick={() => onNavigate('revision')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick 30m Sprint</span>
          </button>
        </div>
      </div>

      {/* Recommended Next Action Banner / Starting Slate */}
      {topWeakTopic ? (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 tracking-wide uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Priority Revision Recommended</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                🎯 Target Weak Concept: {topWeakTopic.topic} ({topWeakTopic.subject})
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl">
                Recent quizzes and viva evaluations show an error rate of {topWeakTopic.errorRate}% in this topic.
                {topWeakTopic.notesContext ? ` "${topWeakTopic.notesContext}"` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('tutor')}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Revise with AI Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/50 border border-indigo-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 tracking-wide uppercase">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Starting Scores at 0% · Ready For Your Notes</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                📚 Setup Your Courses & Upload Your College PDFs
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl">
                You can give any custom names to your subjects, upload different semester PDFs or notes, and start practicing. Your scores, accuracy, and weak concepts will update automatically as you take quizzes and viva exams.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Give Subject Name</span>
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Upload PDFs & Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Mastery Cards Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Course Mastery & Subject Progress
            </h2>
            <p className="text-xs text-slate-500">
              Starting at 0% · Calculated from your diagnostic quiz and viva results
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Give Subject Name</span>
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Notes & PDFs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">
                No Course Subjects Added Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Give your subject a name (e.g., Computer Architecture, Biochemistry, Macroeconomics) and upload your study PDFs so StudyMate can evaluate and coach you.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Your First Subject</span>
              </button>
              <button
                onClick={() => onNavigate('documents')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Go to Document Manager
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjects.map((sub) => {
              const subjectDocs = documents.filter((d) => d.subject === sub.name);
              return (
                <div
                  key={sub.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {sub.code}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {sub.masteryPercent}% Mastery
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {sub.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${sub.masteryPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{subjectDocs.length} Documents</span>
                        <span>Target: 90%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveSubjectId(sub.id);
                        onNavigate('quiz');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Take Quiz
                    </button>
                    <button
                      onClick={() => {
                        setActiveSubjectId(sub.id);
                        onNavigate('tutor');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <span>Open Notes</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two Column Grid: Weak Areas & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weak Areas Panel (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Detected Weak Areas & Concepts
                </h3>
                <p className="text-xs text-slate-500">
                  Continuously updated from your quiz results and viva evaluations
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('weak_areas')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Full Analytics
            </button>
          </div>

          <div className="space-y-3">
            {weakTopics.length === 0 ? (
              <div className="p-6 text-center bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-xs text-slate-800">
                  Clean Slate: Zero Weak Areas Detected
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All starting scores are at 0. Take a practice quiz or oral viva to diagnose your concepts and identify topics requiring revision.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('quiz')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Take Diagnostic Quiz
                  </button>
                </div>
              </div>
            ) : (
              weakTopics.slice(0, 3).map((w, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {w.topic}
                      </span>
                      <span className="text-[11px] text-slate-500">· {w.subject}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {w.notesContext || 'Identified during diagnostic testing.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {w.errorRate}% error rate
                    </span>
                    <button
                      onClick={() => onNavigate('tutor')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Revise
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60 flex items-center justify-between text-xs text-indigo-950">
            <span>
              💡 <strong>Exam Strategy Tip:</strong> Start by uploading your semester PDFs and testing yourself with 5-minute quizzes.
            </span>
            <button
              onClick={() => onNavigate('exam')}
              className="ml-2 font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
            >
              Generate Exam Answer
            </button>
          </div>
        </div>

        {/* Recent Activity Timeline (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Recent Activity</h3>
            <span className="text-xs text-slate-400">
              {quizAttempts.length + vivaSessions.length} sessions
            </span>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="p-6 text-center bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-1">
                <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-medium text-xs text-slate-700">No activity yet</p>
                <p className="text-[11px] text-slate-400">
                  Scores start at zero. Attempt a quiz or viva to log progress.
                </p>
              </div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-medium text-slate-900 leading-snug">
                      {act.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{act.subject}</span>
                      <span>·</span>
                      <span>{act.timestamp}</span>
                      {act.scoreSnippet && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-emerald-600">
                            {act.scoreSnippet}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('revision')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Plan Today's Revision</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
    </div>
  );
};

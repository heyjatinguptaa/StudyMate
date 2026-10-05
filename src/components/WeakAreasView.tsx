import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  MessageSquare,
  FileQuestion,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { TopicPriority } from '../types/studymate';

interface WeakAreasViewProps {
  onNavigateToTutor: () => void;
  onNavigateToQuiz: () => void;
}

export const WeakAreasView: React.FC<WeakAreasViewProps> = ({
  onNavigateToTutor,
  onNavigateToQuiz,
}) => {
  const {
    weakTopics,
    subjects,
    activeSubjectId,
    quizAttempts,
    vivaSessions,
    resolveWeakTopic,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<'weak_areas' | 'priorities'>('weak_areas');
  const [analyzingPriorities, setAnalyzingPriorities] = useState(false);
  const [topicPriorities, setTopicPriorities] = useState<TopicPriority[]>([]);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const filteredWeakTopics =
    activeSubjectId === 'all'
      ? weakTopics
      : weakTopics.filter((w) => w.subject === activeSubject?.name);

  // Compute stats (Starting strictly at 0)
  const totalQuizzes = quizAttempts.length;
  const totalVivas = vivaSessions.length;
  const avgAccuracy =
    totalQuizzes > 0
      ? Math.round(
          quizAttempts.reduce((acc, q) => acc + q.accuracy, 0) / totalQuizzes
        )
      : 0;

  const handleRunTopicAnalysis = async () => {
    setAnalyzingPriorities(true);
    try {
      const res = await fetch('/api/analyze-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject ? activeSubject.name : 'Engineering Courses',
          weakAreas: weakTopics,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.priorities && data.priorities.length > 0) {
          setTopicPriorities(data.priorities);
        }
      }
    } catch {
      // keep current priorities
    } finally {
      setAnalyzingPriorities(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Diagnostic Learning Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Weak-Area Tracking & Important Topic Priorities
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          StudyMate logs mistakes and points of hesitation during quizzes and viva exams to synthesize personalized revision priorities.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('weak_areas')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'weak_areas'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Weak Areas & Misconceptions ({filteredWeakTopics.length})
        </button>

        <button
          onClick={() => setActiveTab('priorities')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'priorities'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Important Topic Analyzer (Exam Priorities)
        </button>
      </div>

      {/* Tab 1: Weak Areas */}
      {activeTab === 'weak_areas' && (
        <div className="space-y-6">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Overall Accuracy
              </span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{avgAccuracy}%</p>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3 h-3" />
                Across all practice
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tracked Weak Spots
              </span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {filteredWeakTopics.length}
              </p>
              <span className="text-[10px] text-rose-500 mt-1 block font-medium">
                Requires focused review
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quizzes Attempted
              </span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuizzes}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Continuous diagnosis</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Viva Voce Rounds
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalVivas}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Oral examinations</span>
            </div>
          </div>

          {/* Personalized Recommendations Callout */}
          {filteredWeakTopics.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50/50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Personalized Diagnostic Recommendation</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                🎯 Target Next: Study {filteredWeakTopics[0].topic}
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                Your recent practice sessions indicate that <strong>{filteredWeakTopics[0].topic}</strong> has an error rate of {filteredWeakTopics[0].errorRate}%. Reviewing its fundamental definition and practicing 1-2 sample decomposition traces will directly improve your examination readiness.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={onNavigateToTutor}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open in AI Tutor</span>
                </button>
                <button
                  onClick={onNavigateToQuiz}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quiz on this Concept</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Weak Topics */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Identified Concepts Requiring Attention ({filteredWeakTopics.length})
            </h3>

            {filteredWeakTopics.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">
                  Zero Weak Areas Detected
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All starting scores begin at 0. Take a practice quiz or viva on your course notes to run diagnostics and identify concepts to strengthen.
                </p>
                <div className="pt-2">
                  <button
                    onClick={onNavigateToQuiz}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Start a Practice Quiz
                  </button>
                </div>
              </div>
            ) : (
              filteredWeakTopics.map((w, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{w.topic}</span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {w.subject}
                    </span>
                  </div>
                  {w.notesContext && (
                    <p className="text-xs text-slate-600 italic">
                      "{w.notesContext}"
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{w.attempts} Diagnostic attempts</span>
                    <span>·</span>
                    <span className="text-rose-600 font-semibold">
                      {w.errorRate}% Error Rate
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => resolveWeakTopic(w.topic)}
                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    title="Mark concept as mastered"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onNavigateToTutor}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Revise Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Tab 2: Important Topic Analyzer (Exam Priorities) */}
      {activeTab === 'priorities' && (
        <div className="space-y-6">
          {/* Important Disclaimer Notice required by PRD */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mandatory Academic Advisory</span>
            </span>
            <p className="leading-relaxed">
              These priority rankings are AI-generated study recommendations synthesized from your uploaded syllabus, recurring university question models, and individual weak-area metrics. <strong>These are not predictions of actual examination questions.</strong>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exam Preparation Priority Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Categorized into High, Medium, and Low priority study tiers
              </p>
            </div>

            <button
              onClick={handleRunTopicAnalysis}
              disabled={analyzingPriorities}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzingPriorities ? 'Analyzing...' : 'Re-Analyze Syllabus'}</span>
            </button>
          </div>

          {/* Priority Cards */}
          {topicPriorities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">
                No Exam Priorities Analyzed Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                StudyMate will automatically scan your course notes and quiz diagnostics to rank concepts by exam weightage and difficulty.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunTopicAnalysis}
                  disabled={analyzingPriorities}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{analyzingPriorities ? 'Analyzing...' : 'Analyze My Course Notes'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {topicPriorities.map((item, idx) => {
              const isHigh = item.priority === 'high';
              const isMed = item.priority === 'medium';

              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3 ${
                    isHigh
                      ? 'border-rose-200'
                      : isMed
                      ? 'border-amber-200'
                      : 'border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800'
                            : isMed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isHigh ? '🔴 High Priority' : isMed ? '🟡 Medium Priority' : '🟢 Quick Revision'}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{item.topic}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      Weightage: <strong className="text-slate-800">{item.scorePercent}%</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.reason}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                    <div className="text-indigo-900 bg-indigo-50/70 p-2 rounded-lg text-[11px] flex-1">
                      💡 <strong>Recommended Action:</strong> {item.recommendedAction}
                    </div>

                    <button
                      onClick={onNavigateToTutor}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1"
                    >
                      <span>Study Topic</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

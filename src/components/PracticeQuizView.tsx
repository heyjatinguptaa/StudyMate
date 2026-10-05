import React, { useState } from 'react';
import {
  FileQuestion,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import {
  PracticeQuestion,
  QuestionType,
  DifficultyLevel,
  QuizAttempt,
} from '../types/studymate';

export const PracticeQuizView: React.FC<{ onNavigateToTutor?: () => void }> = ({
  onNavigateToTutor,
}) => {
  const {
    subjects,
    activeSubjectId,
    vectorStore,
    recordQuizAttempt,
    addSubject,
  } = useStudy();

  const currentSubjectObj = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  // Configuration Form State
  const [selectedSubject, setSelectedSubject] = useState(currentSubjectObj?.name || '');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [topic, setTopic] = useState('Core Concepts & Examination Problems');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz State
  const [activeQuestions, setActiveQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastAttemptSummary, setLastAttemptSummary] = useState<QuizAttempt | null>(null);

  const defaultTopicsBySubject: Record<string, string[]> = {
    'Database Management Systems': [
      'Normalization and Normal Forms',
      'ACID Properties and Transactions',
      'Functional Dependencies and Decompositions',
      'SQL Joins and Indexing',
    ],
    'Design & Analysis of Algorithms': [
      '0/1 Knapsack & Dynamic Programming',
      'Greedy Algorithms vs Dynamic Programming',
      'Longest Common Subsequence (LCS)',
      'Asymptotic Notation & Master Theorem',
    ],
    'Operating Systems': [
      'Deadlocks & Coffman Conditions',
      'Process Synchronization & Critical Section',
      'Semaphores and Mutexes',
      'CPU Scheduling Algorithms',
    ],
    'Computer Networks': [
      'OSI 7 Layers vs TCP/IP',
      'Sliding Window Protocols (Go-Back-N vs SR)',
      'Error Detection and CRC',
      'Routing Protocols and IP Addressing',
    ],
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setRevealedAnswers({});
    setCurrentIdx(0);
    setLastAttemptSummary(null);

    try {
      let subjectToUse = selectedSubject.trim();
      if (customSubjectInput.trim()) {
        subjectToUse = customSubjectInput.trim();
        const existing = subjects.find(
          (s) => s.name.toLowerCase() === subjectToUse.toLowerCase()
        );
        if (!existing) {
          addSubject(subjectToUse);
        }
      }
      if (!subjectToUse) {
        subjectToUse = 'General Course Material';
      }

      // 1. Retrieve grounded context from local vector store
      const relevantChunks = vectorStore.search(`${subjectToUse} ${topic}`, subjectToUse !== 'General Course Material' ? subjectToUse : undefined, 3);
      const contextText = relevantChunks.map((r) => r.chunk.content).join('\n---\n');

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          topic,
          difficulty,
          questionType,
          count: questionCount,
          contextText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate questions from server');
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setActiveQuestions(data.questions);
      } else {
        // Fallback pre-crafted question set
        setActiveQuestions(getFallbackQuestions(subjectToUse, topic));
      }
    } catch {
      const fallbackSub = (customSubjectInput || selectedSubject || 'General Course').trim();
      setActiveQuestions(getFallbackQuestions(fallbackSub, topic));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleCheckCurrent = (questionId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleFinishQuiz = () => {
    let correctCount = 0;
    const weakConcepts: string[] = [];

    const answerLogs = activeQuestions.map((q) => {
      const studentAns = selectedAnswers[q.id] || '(Unanswered)';
      const isCorrect =
        q.type === 'mcq'
          ? studentAns.trim().startsWith(String(q.correctAnswer).slice(0, 2)) ||
            studentAns.toLowerCase().includes(String(q.correctAnswer).toLowerCase().slice(0, 10))
          : true;

      if (isCorrect) {
        correctCount++;
      } else {
        weakConcepts.push(q.topic);
      }

      return {
        questionId: q.id,
        questionText: q.question,
        selectedAnswer: studentAns,
        correctAnswer: String(q.correctAnswer),
        isCorrect,
        explanation: q.explanation,
      };
    });

    const accuracy = (correctCount / activeQuestions.length) * 100;
    const uniqueWeak = Array.from(new Set(weakConcepts));

    const attempt: QuizAttempt = {
      id: `quiz-${Date.now()}`,
      timestamp: new Date().toISOString(),
      subject: selectedSubject,
      topic,
      totalQuestions: activeQuestions.length,
      score: correctCount,
      accuracy,
      answers: answerLogs,
      weakConcepts: uniqueWeak,
    };

    recordQuizAttempt(attempt);
    setLastAttemptSummary(attempt);
    setIsSubmitted(true);
  };

  function getFallbackQuestions(subj: string, top: string): PracticeQuestion[] {
    return [
      {
        id: 'fb-1',
        subject: subj,
        topic: top,
        type: 'mcq',
        difficulty: 'medium',
        marks: 5,
        question:
          'Which normal form guarantees both Lossless Join decomposition and Functional Dependency Preservation?',
        options: [
          'A) First Normal Form (1NF)',
          'B) Second Normal Form (2NF)',
          'C) Third Normal Form (3NF)',
          'D) Boyce-Codd Normal Form (BCNF)',
        ],
        correctAnswer: 'C) Third Normal Form (3NF)',
        explanation:
          '3NF decomposes relations while preserving both lossless join and all functional dependencies. BCNF guarantees lossless join, but does NOT always preserve functional dependencies.',
        sourceHint: 'Page 7 - DBMS Notes',
      },
      {
        id: 'fb-2',
        subject: subj,
        topic: top,
        type: 'mcq',
        difficulty: 'medium',
        marks: 5,
        question:
          'In a 0/1 Knapsack problem with capacity W and n items, why does the Greedy approach fail?',
        options: [
          'A) Sorting takes O(n log n) time',
          'B) Items cannot be divided into fractional parts, causing sub-optimal capacity utilization',
          'C) Overlapping subproblems do not exist',
          'D) Dynamic programming is always faster than greedy',
        ],
        correctAnswer:
          'B) Items cannot be divided into fractional parts, causing sub-optimal capacity utilization',
        explanation:
          'Since items cannot be fractioned, taking an item with the highest value-to-weight ratio may fill the knapsack and block a combination of two other items with higher cumulative value.',
        sourceHint: 'Page 10 - DAA Notes',
      },
      {
        id: 'fb-3',
        subject: subj,
        topic: top,
        type: 'mcq',
        difficulty: 'medium',
        marks: 5,
        question:
          'Which of the following is NOT one of the 4 Coffman conditions required for a Deadlock?',
        options: [
          'A) Mutual Exclusion',
          'B) Hold and Wait',
          'C) Preemptive Resource Reclaim',
          'D) Circular Wait',
        ],
        correctAnswer: 'C) Preemptive Resource Reclaim',
        explanation:
          'The condition is "No Preemption" (resources cannot be forcibly taken away). If preemption is allowed, deadlocks can be avoided or resolved.',
        sourceHint: 'Page 8 - OS Notes',
      },
    ];
  }

  const currentQ = activeQuestions[currentIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
          <FileQuestion className="w-3.5 h-3.5" />
          <span>Interactive Exam Simulator</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Practice Questions & Diagnostic Quizzes
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Generate exam-style questions strictly from your indexed course material. Answers directly update your Weak-Area tracking profile.
        </p>
      </div>

      {/* Generator Configuration Card */}
      {activeQuestions.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Generate New Practice Set</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Subject Name
              </label>
              {subjects.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setSelectedSubject('');
                      } else {
                        setSelectedSubject(e.target.value);
                        setCustomSubjectInput('');
                        const topics = defaultTopicsBySubject[e.target.value];
                        if (topics && topics[0]) setTopic(topics[0]);
                      }
                    }}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter custom subject name...</option>
                  </select>
                  {(!selectedSubject || selectedSubject === '__custom__') && (
                    <input
                      type="text"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      placeholder="Type your course name (e.g. Operating Systems)"
                      className="w-full text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => {
                      setCustomSubjectInput(e.target.value);
                      setSelectedSubject(e.target.value);
                    }}
                    placeholder="Give your subject a name (e.g. Computer Architecture)"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    No subjects added yet. Give your subject any name to practice!
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Normalization, 0/1 Knapsack, Deadlocks"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="short">Short Answer (Conceptual)</option>
                <option value="long">Long Answer (Exam Oriented)</option>
                <option value="numerical">Problem-Solving / Numerical</option>
                <option value="viva">Viva Style Quick-Fire</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                >
                  <option value="easy">Easy (Fundamentals)</option>
                  <option value="medium">Medium (Standard Exam)</option>
                  <option value="hard">Hard (University Tricky)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick topic suggestion chips */}
          {defaultTopicsBySubject[selectedSubject] && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Suggested High-Yield Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {defaultTopicsBySubject[selectedSubject].map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md px-2.5 py-1 border border-slate-200 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Synthesizing questions from your notes...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Generate Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Quiz Taker */}
      {activeQuestions.length > 0 && !isSubmitted && currentQ && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Header progress */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Question {currentIdx + 1} of {activeQuestions.length}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{selectedSubject}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] capitalize">
                {currentQ.difficulty} Difficulty
              </span>
              <button
                onClick={() => setActiveQuestions([])}
                className="text-slate-400 hover:text-slate-600 font-medium"
              >
                Quit Quiz
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
            {currentQ.sourceHint && (
              <span className="text-[11px] text-slate-400 font-mono">
                📌 {currentQ.sourceHint}
              </span>
            )}
          </div>

          {/* MCQ Options */}
          {currentQ.type === 'mcq' && currentQ.options && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt;
                const isRevealed = revealedAnswers[currentQ.id];
                const isCorrect = opt
                  .trim()
                  .startsWith(String(currentQ.correctAnswer).slice(0, 2));

                let optionStyle =
                  'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                if (isSelected) {
                  optionStyle = 'bg-indigo-50 border-indigo-400 text-indigo-950 font-medium';
                }

                if (isRevealed) {
                  if (isCorrect) {
                    optionStyle =
                      'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                  >
                    <span>{opt}</span>
                    {isRevealed && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {isRevealed && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Non-MCQ Answer Input */}
          {currentQ.type !== 'mcq' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Your Answer / Notes Recall:
              </label>
              <textarea
                rows={4}
                value={selectedAnswers[currentQ.id] || ''}
                onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                placeholder="Write your explanation or key conditions here..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          )}

          {/* Instant feedback explanation */}
          {revealedAnswers[currentQ.id] && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <span>Model Answer & Explanation:</span>
              </div>
              <p className="text-slate-800 leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => handleCheckCurrent(currentQ.id)}
              disabled={!selectedAnswers[currentQ.id]}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Check Answer
            </button>

            <div className="flex items-center gap-2">
              {currentIdx > 0 && (
                <button
                  onClick={() => setCurrentIdx((i) => i - 1)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Previous
                </button>
              )}

              {currentIdx < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinishQuiz}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Submit Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Results Summary */}
      {isSubmitted && lastAttemptSummary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Quiz Completed!
            </h2>
            <p className="text-xs text-slate-500">
              {lastAttemptSummary.subject} · {lastAttemptSummary.topic}
            </p>

            <div className="pt-2 flex items-center justify-center gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {lastAttemptSummary.score}/{lastAttemptSummary.totalQuestions}
                </span>
                <span className="block text-[11px] text-slate-400 font-medium">
                  Score
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-2xl font-bold text-emerald-600">
                  {Math.round(lastAttemptSummary.accuracy)}%
                </span>
                <span className="block text-[11px] text-slate-400 font-medium">
                  Accuracy
                </span>
              </div>
            </div>
          </div>

          {/* Weak areas detected banner */}
          {lastAttemptSummary.weakConcepts.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Weak Area Recorded to Your Profile</span>
              </div>
              <p className="text-xs text-amber-800">
                You missed questions on: <strong>{lastAttemptSummary.weakConcepts.join(', ')}</strong>.
                This has been logged in your Weak-Area Tracking engine to help prioritize your revision.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setActiveQuestions([]);
                setIsSubmitted(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create Another Quiz</span>
            </button>

            {onNavigateToTutor && (
              <button
                onClick={onNavigateToTutor}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Revise Weak Concepts with AI Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

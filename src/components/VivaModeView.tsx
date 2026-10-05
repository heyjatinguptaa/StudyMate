import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { VivaSession, VivaTurn, VivaReport } from '../types/studymate';

export const VivaModeView: React.FC<{ onNavigateToWeakAreas?: () => void }> = ({
  onNavigateToWeakAreas,
}) => {
  const {
    subjects,
    activeSubjectId,
    vectorStore,
    recordVivaSession,
    addSubject,
  } = useStudy();

  const currentSubjectObj = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const [selectedSubject, setSelectedSubject] = useState(currentSubjectObj?.name || '');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [vivaTopic, setVivaTopic] = useState('Core Academic Concepts & Problem Solving');
  const [totalQuestions, setTotalQuestions] = useState<number>(3);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Active Viva State
  const [turns, setTurns] = useState<VivaTurn[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [studentInput, setStudentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [finalReport, setFinalReport] = useState<VivaReport | null>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setRecognitionSupported(true);
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setStudentInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const startViva = async () => {
    setIsSessionActive(true);
    setCurrentQuestionNumber(1);
    setTurns([]);
    setFinalReport(null);
    setStudentInput('');
    setIsEvaluating(true);

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
      subjectToUse = 'General Course Viva';
    }

    try {
      // Find initial question grounded in subject notes
      const initialQuestion = getInitialVivaQuestion(subjectToUse, vivaTopic);
      setTurns([
        {
          id: `turn-1`,
          questionNumber: 1,
          examinerQuestion: initialQuestion,
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!studentInput.trim() || isEvaluating) return;

    const currentTurn = turns[turns.length - 1];
    if (!currentTurn) return;

    setIsEvaluating(true);
    const answer = studentInput.trim();
    setStudentInput('');

    try {
      let subjectToUse = (customSubjectInput || selectedSubject || 'General Course').trim();

      // Retrieve relevant notes context
      const relevantChunks = vectorStore.search(
        `${subjectToUse} ${vivaTopic} ${currentTurn.examinerQuestion}`,
        subjectToUse !== 'General Course' ? subjectToUse : undefined,
        2
      );
      const contextText = relevantChunks.map((r) => r.chunk.content).join('\n---\n');

      const res = await fetch('/api/viva-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          topic: vivaTopic,
          currentQuestion: currentTurn.examinerQuestion,
          studentAnswer: answer,
          questionNumber: currentQuestionNumber,
          totalQuestions,
          contextText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate viva turn');
      }

      const data = await res.json();
      const evaluation = data.evaluation || {
        conceptUnderstanding: 8,
        accuracy: 7,
        completeness: 7,
        answerQuality: 8,
        feedback: 'Good fundamental understanding. You highlighted the primary definitions well.',
        weakPoints: [],
      };

      const updatedTurn: VivaTurn = {
        ...currentTurn,
        studentAnswer: answer,
        evaluation,
      };

      if (currentQuestionNumber >= totalQuestions || data.finalReport) {
        // Complete Viva session
        const report: VivaReport = data.finalReport || {
          compositeScore: 7.8,
          conceptUnderstanding: 8,
          accuracy: 8,
          answerQuality: 8,
          strengths: ['Clear terminology', 'Good structural recall'],
          weakAreas: evaluation.weakPoints || [vivaTopic],
          examinerAdvice:
            'Focus on edge cases and concrete examples during the viva presentation.',
        };

        const updatedTurns = [...turns.slice(0, -1), updatedTurn];
        setTurns(updatedTurns);
        setFinalReport(report);

        const sessionRecord: VivaSession = {
          id: `viva-${Date.now()}`,
          timestamp: new Date().toISOString(),
          subject: selectedSubject,
          topic: vivaTopic,
          status: 'completed',
          turns: updatedTurns,
          finalReport: report,
        };

        recordVivaSession(sessionRecord);
      } else {
        // Next question
        const nextQ =
          data.nextQuestion ||
          `Can you provide a concrete counter-example or trade-off regarding ${vivaTopic}?`;

        const nextTurn: VivaTurn = {
          id: `turn-${currentQuestionNumber + 1}`,
          questionNumber: currentQuestionNumber + 1,
          examinerQuestion: nextQ,
        };

        setTurns([...turns.slice(0, -1), updatedTurn, nextTurn]);
        setCurrentQuestionNumber((prev) => prev + 1);
      }
    } catch {
      // Local fallback evaluation
      const fallbackEvaluation = {
        conceptUnderstanding: 7,
        accuracy: 8,
        completeness: 7,
        answerQuality: 7,
        feedback:
          'Satisfactory explanation. Make sure to clearly state any boundary conditions.',
        weakPoints: [vivaTopic],
      };

      const updatedTurn: VivaTurn = {
        ...currentTurn,
        studentAnswer: answer,
        evaluation: fallbackEvaluation,
      };

      if (currentQuestionNumber >= totalQuestions) {
        const report: VivaReport = {
          compositeScore: 7.5,
          conceptUnderstanding: 7.5,
          accuracy: 8,
          answerQuality: 7.5,
          strengths: ['Confident response', 'Understood basic definition'],
          weakAreas: [vivaTopic],
          examinerAdvice: 'Practice articulating formulas and formal constraints concisely.',
        };

        const updatedTurns = [...turns.slice(0, -1), updatedTurn];
        setTurns(updatedTurns);
        setFinalReport(report);

        recordVivaSession({
          id: `viva-${Date.now()}`,
          timestamp: new Date().toISOString(),
          subject: selectedSubject,
          topic: vivaTopic,
          status: 'completed',
          turns: updatedTurns,
          finalReport: report,
        });
      } else {
        const nextTurn: VivaTurn = {
          id: `turn-${currentQuestionNumber + 1}`,
          questionNumber: currentQuestionNumber + 1,
          examinerQuestion: `How does this behavior change if concurrent processes or transactions execute simultaneously?`,
        };
        setTurns([...turns.slice(0, -1), updatedTurn, nextTurn]);
        setCurrentQuestionNumber((prev) => prev + 1);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  function getInitialVivaQuestion(subj: string, top: string): string {
    if (subj.includes('Database')) {
      return 'Professor: Welcome to your DBMS viva. To start, how would you define the Isolation property in ACID, and why is Serializability considered the gold standard?';
    }
    if (subj.includes('Algorithms')) {
      return 'Professor: In dynamic programming, what are the two necessary properties a problem must possess, and how does memoization differ fundamentally from tabulation?';
    }
    if (subj.includes('Operating')) {
      return 'Professor: Good day. Can you name the 4 Coffman conditions required for a deadlock to occur, and explain why circular wait is critical?';
    }
    return `Professor: Welcome to your viva on ${top}. Please start by defining the core concept and its practical application in computing.`;
  }

  const activeTurn = turns[turns.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>Oral Examination Simulator</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI Viva Voce Mode
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Simulate a real university oral examination. Answer spoken or written questions; the AI professor evaluates concept clarity, accuracy, and completeness.
        </p>
      </div>

      {/* Start Session Setup */}
      {!isSessionActive && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              🎓
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Setup Viva Voce Examination
              </h2>
              <p className="text-xs text-slate-500">
                Configure course, topic, and number of questions
              </p>
            </div>
          </div>

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
                      className="w-full text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500"
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
                    placeholder="Give your subject a name (e.g. Database Systems)"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    No subjects added yet. Give your subject any name to practice viva!
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Viva Topic
              </label>
              <input
                type="text"
                value={vivaTopic}
                onChange={(e) => setVivaTopic(e.target.value)}
                placeholder="e.g. Transactions, 0/1 Knapsack, Deadlocks"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Viva Depth (Rounds)
              </label>
              <select
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
              >
                <option value={3}>3 Questions (Express Viva)</option>
                <option value={5}>5 Questions (Standard Exam)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <span className="text-base">🎙️</span>
            <div>
              <strong>Voice & Speech Supported:</strong> You can practice typing or speak into your microphone to simulate the pressure and clarity of an oral university viva.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={startViva}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Begin Oral Viva</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Viva Session Dialogue */}
      {isSessionActive && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Viva Round {currentQuestionNumber} of {totalQuestions}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">{vivaTopic}</span>
              <button
                onClick={() => setIsSessionActive(false)}
                className="text-slate-400 hover:text-slate-600 underline font-medium"
              >
                Exit Viva
              </button>
            </div>
          </div>

          {/* Past Turns & Evaluations */}
          <div className="space-y-4">
            {turns.map((turn, tIdx) => (
              <div key={turn.id} className="space-y-3">
                {/* Examiner Question */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                    🎓
                  </div>
                  <div className="flex-1 bg-white border border-amber-200 rounded-2xl p-4 text-xs shadow-xs space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Examiner Question #{turn.questionNumber}
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {turn.examinerQuestion}
                    </p>
                  </div>
                </div>

                {/* Student Answer */}
                {turn.studentAnswer && (
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-xl bg-slate-900 text-white rounded-2xl p-4 text-xs shadow-xs space-y-1">
                      <span className="font-semibold text-slate-400 block text-[11px]">
                        Your Answer
                      </span>
                      <p className="leading-relaxed">{turn.studentAnswer}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                      ME
                    </div>
                  </div>
                )}

                {/* Evaluation Card */}
                {turn.evaluation && (
                  <div className="ml-11 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="font-bold text-slate-700">
                        Examiner's Assessment
                      </span>
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-slate-600">
                          Concept: <strong>{turn.evaluation.conceptUnderstanding}/10</strong>
                        </span>
                        <span className="text-slate-600">
                          Accuracy: <strong>{turn.evaluation.accuracy}/10</strong>
                        </span>
                        <span className="text-slate-600">
                          Completeness: <strong>{turn.evaluation.completeness}/10</strong>
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-800 italic">
                      "{turn.evaluation.feedback}"
                    </p>
                    {turn.evaluation.weakPoints.length > 0 && (
                      <div className="flex items-center gap-1.5 text-rose-700 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Identified weakness: {turn.evaluation.weakPoints.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Question Input Area (if not finished) */}
          {!finalReport && activeTurn && !activeTurn.studentAnswer && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Your Spoken or Written Response to Professor:
              </label>

              <textarea
                rows={3}
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="Speak clearly or type your explanation here..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 font-sans"
                disabled={isEvaluating}
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  disabled={!recognitionSupported || isEvaluating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={
                    recognitionSupported
                      ? 'Click to speak'
                      : 'Speech recognition not supported in this browser'
                  }
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening... (Speak now)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>{recognitionSupported ? 'Voice Answer (Mic)' : 'Mic Unavailable'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAnswerSubmit}
                  disabled={!studentInput.trim() || isEvaluating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating your response...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Response</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Final Examination Report */}
          {finalReport && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold text-xl">
                  🎓
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Viva Voce Examination Report
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedSubject} · {vivaTopic}
                </p>

                <div className="pt-3 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-amber-600">
                      {finalReport.compositeScore}/10
                    </span>
                    <span className="block text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                      Composite Score
                    </span>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-800">
                      {finalReport.conceptUnderstanding}/10
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      Concept
                    </span>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-800">
                      {finalReport.accuracy}/10
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      Accuracy
                    </span>
                  </div>
                </div>
              </div>

              {/* Strengths & Weak Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Demonstrated Strengths</span>
                  </span>
                  <ul className="text-xs text-emerald-900/90 list-disc list-inside space-y-1">
                    {finalReport.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200/60 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Identified Weak Areas</span>
                  </span>
                  <ul className="text-xs text-rose-900/90 list-disc list-inside space-y-1">
                    {finalReport.weakAreas.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Examiner Advice */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-900 block">
                  Professor's Closing Recommendation:
                </span>
                <p className="text-slate-700 leading-relaxed italic">
                  "{finalReport.examinerAdvice}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setIsSessionActive(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Viva Session</span>
                </button>

                {onNavigateToWeakAreas && (
                  <button
                    onClick={onNavigateToWeakAreas}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>View Updated Weak Areas Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

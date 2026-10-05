import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Flame,
  Volume2,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { RevisionPlan, RevisionSlot } from '../types/studymate';

export const RevisionPlannerView: React.FC<{ onNavigateToTutor?: () => void }> = ({
  onNavigateToTutor,
}) => {
  const {
    subjects,
    activeSubjectId,
    weakTopics,
    saveRevisionPlan,
    addSubject,
  } = useStudy();

  const currentSubjectObj = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const [selectedSubject, setSelectedSubject] = useState(currentSubjectObj?.name || '');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Plan & Live Timer State
  const [activePlan, setActivePlan] = useState<RevisionPlan | null>(() => {
    return getDefault30MinPlan(selectedSubject || 'Exam Revision Sprint');
  });
  const [completedSlotIds, setCompletedSlotIds] = useState<number[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handleGeneratePlan = async () => {
    const mins = customMinutes ? Number(customMinutes) : durationMinutes;
    if (!mins || mins <= 0 || isGenerating) return;

    setIsGenerating(true);
    setTimerRunning(false);
    setCompletedSlotIds([]);

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
      subjectToUse = 'General Course Revision';
    }

    try {
      const res = await fetch('/api/revision-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectToUse,
          durationMinutes: mins,
          weakTopics: weakTopics.map((w) => w.topic),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate revision plan');
      }

      const data = await res.json();
      const plan: RevisionPlan = {
        id: `rev-${Date.now()}`,
        subject: subjectToUse,
        durationMinutes: mins,
        summary: data.summary || `${mins}-minute tactical revision sprint for ${subjectToUse}`,
        createdAt: new Date().toISOString(),
        slots: data.slots || generateFallbackSlots(mins, subjectToUse),
      };

      setActivePlan(plan);
      setSecondsRemaining(mins * 60);
      saveRevisionPlan(plan);
    } catch {
      const plan: RevisionPlan = {
        id: `rev-${Date.now()}`,
        subject: subjectToUse,
        durationMinutes: mins,
        summary: `${mins}-minute high-yield timetable for ${subjectToUse}`,
        createdAt: new Date().toISOString(),
        slots: generateFallbackSlots(mins, subjectToUse),
      };
      setActivePlan(plan);
      setSecondsRemaining(mins * 60);
      saveRevisionPlan(plan);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSlotCompleted = (slotId: number) => {
    setCompletedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  function getDefault30MinPlan(subj: string): RevisionPlan {
    return {
      id: 'default-30m',
      subject: subj,
      durationMinutes: 30,
      summary: 'Tactical 30-minute exam sprint dividing theory, practice, and weak-area drills.',
      createdAt: new Date().toISOString(),
      slots: generateFallbackSlots(30, subj),
    };
  }

  function generateFallbackSlots(mins: number, subj: string): RevisionSlot[] {
    if (mins <= 15) {
      return [
        {
          id: 1,
          timeRange: '00–04 min',
          minutes: 4,
          topic: 'Essential Definitions & Formulas',
          description: 'Quickly scan definitions, constraints, and core notation cards.',
          keyAction: 'Memorize formal statements',
          type: 'reading',
        },
        {
          id: 2,
          timeRange: '04–10 min',
          minutes: 6,
          topic: 'High-Yield Concept Walkthrough',
          description: 'Step through 1 high-weightage university decomposition or algorithm.',
          keyAction: 'Review state transition diagram',
          type: 'reading',
        },
        {
          id: 3,
          timeRange: '10–15 min',
          minutes: 5,
          topic: 'Rapid Recall & Weak Area Check',
          description: 'Self-test on candidate keys, conditions, and past mistakes.',
          keyAction: 'Run 3 diagnostic mental checks',
          type: 'weak_area',
        },
      ];
    }

    if (mins <= 30) {
      return [
        {
          id: 1,
          timeRange: '00–05 min',
          minutes: 5,
          topic: 'Course Fundamentals & Formal Definitions',
          description: 'Review core properties, terminology, and invariants.',
          keyAction: 'Review formula sheet',
          type: 'reading',
        },
        {
          id: 2,
          timeRange: '05–12 min',
          minutes: 7,
          topic: 'High-Yield Primary Concept (e.g. Normalization / DP)',
          description: 'Review step-by-step algorithms and standard 10-mark proof structure.',
          keyAction: 'Trace 1 complete university example',
          type: 'reading',
        },
        {
          id: 3,
          timeRange: '12–18 min',
          minutes: 6,
          topic: 'Secondary Important Concept',
          description: 'Review trade-offs, advantages, and limitations.',
          keyAction: 'Study comparison table',
          type: 'reading',
        },
        {
          id: 4,
          timeRange: '18–24 min',
          minutes: 6,
          topic: 'Personal Weak-Area Drill-Down',
          description: 'Direct focus on topics where you previously made errors.',
          keyAction: 'Target weak spots in AI Tutor',
          type: 'weak_area',
        },
        {
          id: 5,
          timeRange: '24–28 min',
          minutes: 4,
          topic: 'Rapid-Fire Practice Quiz',
          description: 'Attempt 3-5 quick diagnostic practice questions.',
          keyAction: 'Test recall under time pressure',
          type: 'practice',
        },
        {
          id: 6,
          timeRange: '28–30 min',
          minutes: 2,
          topic: 'Final Mental Checklist',
          description: 'Breathe, verify keywords, and consolidate memory.',
          keyAction: 'Review flash points',
          type: 'recap',
        },
      ];
    }

    // 60+ minutes
    return [
      {
        id: 1,
        timeRange: '00–10 min',
        minutes: 10,
        topic: 'Foundations & Architecture Overview',
        description: 'Comprehensive review of course syllabus, modules, and formula cards.',
        keyAction: 'Outline all major units',
        type: 'reading',
      },
      {
        id: 2,
        timeRange: '10–25 min',
        minutes: 15,
        topic: 'Unit 1 & Unit 2 Core Algorithms',
        description: 'Deep dive into derivations, proofs, and working mechanisms.',
        keyAction: 'Write out pseudo-code and state steps',
        type: 'reading',
      },
      {
        id: 3,
        timeRange: '25–40 min',
        minutes: 15,
        topic: 'Complex & Weak-Area Problem Solving',
        description: 'Solve past university exam questions on your weakest topics.',
        keyAction: 'Step through full numericals',
        type: 'weak_area',
      },
      {
        id: 4,
        timeRange: '40–52 min',
        minutes: 12,
        topic: 'Diagnostic Mock Quiz & Viva Practice',
        description: 'Answer 10 practice questions and conduct a 3-turn oral viva.',
        keyAction: 'Simulate examination conditions',
        type: 'practice',
      },
      {
        id: 5,
        timeRange: '52–60 min',
        minutes: 8,
        topic: 'Summary & Revision Wrap-Up',
        description: 'Recap highest-yield diagrams and exam scoring pointers.',
        keyAction: 'Lock in memory cards',
        type: 'recap',
      },
    ];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Tactical Time-Boxed Revision</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Personalized Revision Planner
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Only have 15 or 30 minutes before an exam? Generate a minute-by-minute timetable optimized for high-yield recall, and execute it with an interactive live timer.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
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
                    placeholder="Type course name (e.g. Operating Systems)"
                    className="w-full text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
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
                  placeholder="Give your subject a name (e.g. Computer Networks)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  No subjects added yet. Give your subject any name to create a timed plan!
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Preparation Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDurationMinutes(m);
                    setCustomMinutes('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    durationMinutes === m && !customMinutes
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Prioritizes your <strong>{weakTopics.length} weak areas</strong> for highest scoring efficiency.
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Building time-budgeted sprint...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Generate Revision Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Timer & Revision Timetable */}
      {activePlan && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Top Live Timer Widget */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400">
                {formatTimer(secondsRemaining)}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                  Live Revision Session
                </span>
                <p className="text-xs text-slate-300">
                  {completedSlotIds.length} of {activePlan.slots.length} checkpoints completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimerRunning((prev) => !prev)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsRemaining(activePlan.durationMinutes * 60);
                  setCompletedSlotIds([]);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Reset session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Time Slots Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Sprint Timetable ({activePlan.durationMinutes} Minutes)</span>
              <span className="text-xs font-normal text-slate-500">
                Click checkpoint to mark complete
              </span>
            </h3>

            <div className="space-y-2.5">
              {activePlan.slots.map((slot) => {
                const isCompleted = completedSlotIds.includes(slot.id);
                const isWeak = slot.type === 'weak_area';

                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlotCompleted(slot.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isCompleted
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : isWeak
                        ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {slot.timeRange}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isCompleted
                                ? 'line-through text-slate-500'
                                : 'text-slate-900'
                            }`}
                          >
                            {slot.topic}
                          </span>
                          {isWeak && (
                            <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                              Weak Area Focus
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600">
                          {slot.description}
                        </p>

                        <div className="text-[11px] font-semibold text-indigo-700 pt-0.5">
                          🎯 Key action: {slot.keyAction}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {slot.minutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action when finished */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Finished all blocks? Check your concepts with the AI Tutor.
            </span>
            {onNavigateToTutor && (
              <button
                onClick={onNavigateToTutor}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Ask AI Tutor Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

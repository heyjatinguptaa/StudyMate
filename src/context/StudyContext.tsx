import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DocumentMeta,
  DocumentChunk,
  Subject,
  ChatMessage,
  QuizAttempt,
  VivaSession,
  ExamAnswer,
  RevisionPlan,
  WeakTopic,
  ActivityItem,
  EngineMode,
  LocalEngineConfig,
  Citation,
} from '../types/studymate';
import {
  DEFAULT_DOCUMENTS,
  DEFAULT_CHUNKS,
  DEFAULT_SUBJECTS,
  SAMPLE_SUBJECTS,
  SAMPLE_DOCUMENTS,
  SAMPLE_CHUNKS,
} from '../data/defaultCourses';
import { LocalVectorStore } from '../utils/ragEngine';

interface StudyContextType {
  documents: DocumentMeta[];
  chunks: DocumentChunk[];
  subjects: Subject[];
  activeSubjectId: string;
  engineMode: EngineMode;
  ollamaConfig: LocalEngineConfig;
  chatMessages: ChatMessage[];
  quizAttempts: QuizAttempt[];
  vivaSessions: VivaSession[];
  savedExamAnswers: ExamAnswer[];
  revisionPlans: RevisionPlan[];
  weakTopics: WeakTopic[];
  activities: ActivityItem[];
  selectedCitation: Citation | null;
  vectorStore: LocalVectorStore;
  setActiveSubjectId: (id: string) => void;
  setEngineMode: (mode: EngineMode) => void;
  setOllamaConfig: React.Dispatch<React.SetStateAction<LocalEngineConfig>>;
  addSubject: (name: string, code?: string, description?: string) => string;
  editSubject: (id: string, name: string, code?: string, description?: string) => void;
  deleteSubject: (id: string) => void;
  addDocument: (doc: DocumentMeta, docChunks: DocumentChunk[]) => void;
  deleteDocument: (docId: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  recordVivaSession: (session: VivaSession) => void;
  saveExamAnswer: (answer: ExamAnswer) => void;
  saveRevisionPlan: (plan: RevisionPlan) => void;
  recordWeakTopic: (topic: string, subject: string, notesSnippet?: string) => void;
  resolveWeakTopic: (topic: string) => void;
  openCitation: (citation: Citation) => void;
  closeCitation: () => void;
  resetToDefaults: () => void;
  loadSamplePack: () => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DOCS: 'studymate_docs_v4',
  CHUNKS: 'studymate_chunks_v4',
  SUBJECTS: 'studymate_subjects_v4',
  CHAT: 'studymate_chat_v4',
  QUIZZES: 'studymate_quizzes_v4',
  VIVA: 'studymate_viva_v4',
  EXAM_ANSWERS: 'studymate_exam_answers_v4',
  REVISION: 'studymate_revision_v4',
  WEAK_TOPICS: 'studymate_weak_topics_v4',
  ACTIVITIES: 'studymate_activities_v4',
  ENGINE_MODE: 'studymate_engine_mode_v4',
};

// All scores at starting MUST be zero, with NO subjects added initially as requested
const INITIAL_WEAK_TOPICS: WeakTopic[] = [];
const INITIAL_ACTIVITIES: ActivityItem[] = [];

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Documents & Chunks start completely empty
  const [documents, setDocuments] = useState<DocumentMeta[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [chunks, setChunks] = useState<DocumentChunk[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHUNKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Subjects start completely empty: user gives names of subjects!
  const [rawSubjects, setRawSubjects] = useState<Subject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  const [activeSubjectId, setActiveSubjectId] = useState<string>('all');
  const [engineMode, setEngineModeState] = useState<EngineMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.ENGINE_MODE) as EngineMode) || 'cloud';
    } catch {
      return 'cloud';
    }
  });

  const [ollamaConfig, setOllamaConfig] = useState<LocalEngineConfig>({
    ollamaUrl: 'http://localhost:11434',
    modelName: 'llama3.2',
    isAvailable: false,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'init-1',
              role: 'assistant',
              content: `👋 **Welcome to StudyMate AI!**

I am your private, exam-oriented study companion. All scores start at 0% and update dynamically as you practice.

**Get started:**
- 📚 Create your own custom courses and subjects in **My Subjects**.
- 📄 Upload your college PDFs or lecture notes.
- 💡 Ask me to explain concepts in any mode (**Beginner**, **Simple**, **College**, **Detailed**, or **Exam-Oriented**).
- 🔒 *Your documents stay private on your device.*`,
              timestamp: new Date().toISOString(),
              explanationMode: 'college',
            },
          ];
    } catch {
      return [];
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [vivaSessions, setVivaSessions] = useState<VivaSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIVA);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedExamAnswers, setSavedExamAnswers] = useState<ExamAnswer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXAM_ANSWERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [revisionPlans, setRevisionPlans] = useState<RevisionPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVISION);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEAK_TOPICS);
      return saved ? JSON.parse(saved) : INITIAL_WEAK_TOPICS;
    } catch {
      return INITIAL_WEAK_TOPICS;
    }
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Dynamic mastery computation for all subjects:
  // Starts strictly at 0% until student takes quizzes or viva exams!
  const subjects = useMemo<Subject[]>(() => {
    return rawSubjects.map((sub) => {
      const subjectDocs = documents.filter(
        (d) => d.subject.toLowerCase() === sub.name.toLowerCase()
      );
      const subjectQuizzes = quizAttempts.filter(
        (q) => q.subject.toLowerCase() === sub.name.toLowerCase()
      );
      const subjectVivas = vivaSessions.filter(
        (v) => v.subject.toLowerCase() === sub.name.toLowerCase()
      );

      let totalScoreSum = 0;
      let totalEvaluations = 0;

      subjectQuizzes.forEach((q) => {
        totalScoreSum += q.accuracy;
        totalEvaluations++;
      });

      subjectVivas.forEach((v) => {
        if (v.finalReport?.compositeScore) {
          totalScoreSum += v.finalReport.compositeScore * 10;
          totalEvaluations++;
        }
      });

      const calculatedMastery =
        totalEvaluations > 0 ? Math.round(totalScoreSum / totalEvaluations) : 0;

      return {
        ...sub,
        docCount: subjectDocs.length,
        masteryPercent: calculatedMastery, // 0 at starting!
      };
    });
  }, [rawSubjects, documents, quizAttempts, vivaSessions]);

  // Initialize and maintain local vector store instance
  const vectorStore = useMemo(() => {
    return new LocalVectorStore(chunks);
  }, [chunks]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
    } catch (e) {
      console.warn('Failed to save docs to localStorage', e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
    } catch (e) {
      console.warn('Failed to save chunks to localStorage', e);
    }
  }, [chunks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('Failed to save chat to localStorage', e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(rawSubjects));
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizAttempts));
      localStorage.setItem(STORAGE_KEYS.VIVA, JSON.stringify(vivaSessions));
      localStorage.setItem(STORAGE_KEYS.EXAM_ANSWERS, JSON.stringify(savedExamAnswers));
      localStorage.setItem(STORAGE_KEYS.REVISION, JSON.stringify(revisionPlans));
      localStorage.setItem(STORAGE_KEYS.WEAK_TOPICS, JSON.stringify(weakTopics));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      localStorage.setItem(STORAGE_KEYS.ENGINE_MODE, engineMode);
    } catch (e) {
      console.warn('Failed to save data to localStorage', e);
    }
  }, [rawSubjects, quizAttempts, vivaSessions, savedExamAnswers, revisionPlans, weakTopics, activities, engineMode]);

  const addSubject = (name: string, code?: string, description?: string): string => {
    const cleanName = name.trim();
    if (!cleanName) return '';
    const newId = `sub-${Date.now()}`;
    const newSubject: Subject = {
      id: newId,
      name: cleanName,
      code: code?.trim() || cleanName.slice(0, 4).toUpperCase(),
      description: description?.trim() || `Course notes and study materials for ${cleanName}`,
      icon: 'BookOpen',
      color: 'indigo',
      docCount: 0,
      masteryPercent: 0, // Starts at 0!
    };
    setRawSubjects((prev) => [...prev, newSubject]);
    return newId;
  };

  const editSubject = (id: string, name: string, code?: string, description?: string) => {
    setRawSubjects((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              name: name.trim() || sub.name,
              code: code?.trim() || sub.code,
              description: description?.trim() || sub.description,
            }
          : sub
      )
    );
  };

  const deleteSubject = (id: string) => {
    setRawSubjects((prev) => prev.filter((s) => s.id !== id));
    if (activeSubjectId === id) {
      setActiveSubjectId('all');
    }
  };

  const setEngineMode = (mode: EngineMode) => {
    setEngineModeState(mode);
  };

  const addDocument = (doc: DocumentMeta, docChunks: DocumentChunk[]) => {
    setDocuments((prev) => [doc, ...prev]);
    setChunks((prev) => [...prev, ...docChunks]);
    vectorStore.addChunks(docChunks);

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'tutor',
      title: `Indexed document: ${doc.title} (${doc.pageCount} pages)`,
      timestamp: 'Just now',
      subject: doc.subject,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setChunks((prev) => prev.filter((c) => c.docId !== docId));
    vectorStore.removeByDocId(docId);
  };

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const recordQuizAttempt = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);

    // Update weak areas from quiz mistakes
    if (attempt.weakConcepts && attempt.weakConcepts.length > 0) {
      attempt.weakConcepts.forEach((concept) => {
        recordWeakTopic(concept, attempt.subject);
      });
    }

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'quiz',
      title: `Attempted ${attempt.subject} Quiz (${attempt.score}/${attempt.totalQuestions})`,
      timestamp: 'Just now',
      subject: attempt.subject,
      scoreSnippet: `${Math.round(attempt.accuracy)}% Score`,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const recordVivaSession = (session: VivaSession) => {
    setVivaSessions((prev) => [session, ...prev]);

    if (session.finalReport?.weakAreas) {
      session.finalReport.weakAreas.forEach((concept) => {
        recordWeakTopic(concept, session.subject);
      });
    }

    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'viva',
      title: `Completed ${session.subject} Oral Viva Voce`,
      timestamp: 'Just now',
      subject: session.subject,
      scoreSnippet: session.finalReport
        ? `${session.finalReport.compositeScore}/10 Score`
        : 'Completed',
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const saveExamAnswer = (answer: ExamAnswer) => {
    setSavedExamAnswers((prev) => [answer, ...prev]);
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'exam_answer',
      title: `Generated ${answer.marks}-Mark Answer: ${answer.topic}`,
      timestamp: 'Just now',
      subject: answer.subject,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const saveRevisionPlan = (plan: RevisionPlan) => {
    setRevisionPlans((prev) => [plan, ...prev]);
    const newAct: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'revision',
      title: `Created ${plan.durationMinutes}m Revision Sprint for ${plan.subject}`,
      timestamp: 'Just now',
      subject: plan.subject,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const recordWeakTopic = (topic: string, subject: string, notesSnippet?: string) => {
    setWeakTopics((prev) => {
      const existing = prev.find(
        (w) => w.topic.toLowerCase() === topic.toLowerCase()
      );
      if (existing) {
        return prev.map((w) =>
          w.topic.toLowerCase() === topic.toLowerCase()
            ? {
                ...w,
                attempts: w.attempts + 1,
                errorRate: Math.min(100, w.errorRate + 10),
                lastTested: new Date().toISOString(),
              }
            : w
        );
      }
      return [
        {
          topic,
          subject,
          attempts: 1,
          errorRate: 70,
          lastTested: new Date().toISOString(),
          notesContext: notesSnippet,
        },
        ...prev,
      ];
    });
  };

  const resolveWeakTopic = (topic: string) => {
    setWeakTopics((prev) => prev.filter((w) => w.topic.toLowerCase() !== topic.toLowerCase()));
  };

  const openCitation = (citation: Citation) => {
    setSelectedCitation(citation);
  };

  const closeCitation = () => {
    setSelectedCitation(null);
  };

  const resetToDefaults = () => {
    setDocuments([]);
    setChunks([]);
    setRawSubjects([]);
    setActiveSubjectId('all');
    setWeakTopics([]);
    setActivities([]);
    setQuizAttempts([]);
    setVivaSessions([]);
    setSavedExamAnswers([]);
    setRevisionPlans([]);
    localStorage.clear();
  };

  const loadSamplePack = () => {
    setRawSubjects(SAMPLE_SUBJECTS);
    setDocuments(SAMPLE_DOCUMENTS);
    setChunks(SAMPLE_CHUNKS);
    setActiveSubjectId('all');
  };

  return (
    <StudyContext.Provider
      value={{
        documents,
        chunks,
        subjects,
        activeSubjectId,
        engineMode,
        ollamaConfig,
        chatMessages,
        quizAttempts,
        vivaSessions,
        savedExamAnswers,
        revisionPlans,
        weakTopics,
        activities,
        selectedCitation,
        vectorStore,
        setActiveSubjectId,
        setEngineMode,
        setOllamaConfig,
        addSubject,
        editSubject,
        deleteSubject,
        addDocument,
        deleteDocument,
        addChatMessage,
        clearChat,
        recordQuizAttempt,
        recordVivaSession,
        saveExamAnswer,
        saveRevisionPlan,
        recordWeakTopic,
        resolveWeakTopic,
        openCitation,
        closeCitation,
        resetToDefaults,
        loadSamplePack,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

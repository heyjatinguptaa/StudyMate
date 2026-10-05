export type ExplanationMode = 'beginner' | 'simple' | 'college' | 'detailed' | 'exam';

export type QuestionType = 'mcq' | 'short' | 'long' | 'conceptual' | 'numerical' | 'viva';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type EngineMode = 'local' | 'cloud';

export interface Citation {
  docId: string;
  docTitle: string;
  pageNumber: number;
  excerpt: string;
  similarityScore?: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  subject: string;
  pageNumber: number;
  content: string;
  sectionTitle?: string;
  tokensCount?: number;
}

export interface DocumentMeta {
  id: string;
  title: string;
  fileName: string;
  subject: string;
  uploadDate: string;
  pageCount: number;
  fileSize: string;
  status: 'uploading' | 'processing' | 'extracting' | 'indexing' | 'indexed' | 'error';
  chunkCount: number;
  previewExcerpt?: string;
  isDefault?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  docCount: number;
  masteryPercent: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Citation[];
  explanationMode?: ExplanationMode;
  confidence?: 'high' | 'medium' | 'extrapolated';
  outsideNotes?: boolean;
}

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks?: number;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  sourceHint?: string;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  score: number;
  accuracy: number;
  answers: {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  weakConcepts: string[];
}

export interface VivaTurn {
  id: string;
  questionNumber: number;
  examinerQuestion: string;
  studentAnswer?: string;
  evaluation?: {
    conceptUnderstanding: number; // 1-10
    accuracy: number; // 1-10
    completeness: number; // 1-10
    answerQuality: number; // 1-10
    feedback: string;
    weakPoints: string[];
  };
}

export interface VivaReport {
  compositeScore: number;
  conceptUnderstanding: number;
  accuracy: number;
  answerQuality: number;
  strengths: string[];
  weakAreas: string[];
  examinerAdvice: string;
}

export interface VivaSession {
  id: string;
  timestamp: string;
  subject: string;
  topic: string;
  status: 'active' | 'completed';
  turns: VivaTurn[];
  finalReport?: VivaReport;
}

export interface ExamAnswerSection {
  title: string;
  content: string;
}

export interface ExamAnswer {
  id: string;
  topic: string;
  subject: string;
  marks: 2 | 5 | 10 | 11 | 15;
  style: 'academic' | 'bulleted' | 'diagrammatic';
  content: string;
  sections?: ExamAnswerSection[];
  generatedAt: string;
  citations?: Citation[];
}

export interface TopicPriority {
  topic: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  scorePercent: number;
  reason: string;
  recommendedAction: string;
}

export interface RevisionSlot {
  id: number;
  timeRange: string;
  minutes: number;
  topic: string;
  description: string;
  keyAction: string;
  type: 'reading' | 'practice' | 'recap' | 'weak_area';
}

export interface RevisionPlan {
  id: string;
  subject: string;
  durationMinutes: number;
  summary: string;
  createdAt: string;
  slots: RevisionSlot[];
}

export interface WeakTopic {
  topic: string;
  subject: string;
  attempts: number;
  errorRate: number; // 0 to 100
  lastTested: string;
  notesContext?: string;
}

export interface ActivityItem {
  id: string;
  type: 'quiz' | 'viva' | 'tutor' | 'exam_answer' | 'revision';
  title: string;
  timestamp: string;
  subject: string;
  scoreSnippet?: string;
}

export interface LocalEngineConfig {
  ollamaUrl: string;
  modelName: string;
  isAvailable: boolean;
  lastChecked?: string;
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { ExplanationMode, ChatMessage, Citation } from '../types/studymate';
import { synthesizeLocalAnswer } from '../utils/ragEngine';
import { queryOllama } from '../utils/ollamaClient';

export const AiTutorView: React.FC = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    activeSubjectId,
    subjects,
    vectorStore,
    engineMode,
    ollamaConfig,
    openCitation,
  } = useStudy();

  const [inputQuery, setInputQuery] = useState('');
  const [explanationMode, setExplanationMode] = useState<ExplanationMode>('college');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const subjectName = activeSubject ? activeSubject.name : 'All Subjects';

  const explanationModes: { id: ExplanationMode; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'No jargon, friendly analogies' },
    { id: 'simple', label: 'Simple', desc: 'Clear everyday language' },
    { id: 'college', label: 'College Level', desc: 'University lecture depth' },
    { id: 'detailed', label: 'Detailed', desc: 'Theoretical proofs & edge cases' },
    { id: 'exam', label: 'Exam-Oriented', desc: 'Definitions, key points & marks scoring' },
  ];

  const quickPrompts = [
    'Explain normalization in simple language.',
    'What is the difference between 3NF and BCNF?',
    'Give a real-world analogy for ACID properties in DBMS.',
    'Explain 0/1 Knapsack recurrence with an example.',
    'What are the 4 Coffman deadlock conditions?',
    'Compare Go-Back-N vs Selective Repeat sliding window.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanSpeech = text
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\[Page.*?\]/g, '')
      .replace(/>/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
      explanationMode,
    };
    addChatMessage(userMessage);

    setIsLoading(true);

    try {
      // Step 1: Local RAG Retrieval from Vector Store
      const searchResults = vectorStore.search(
        q,
        activeSubjectId !== 'all' ? subjectName : undefined,
        4
      );

      const citations: Citation[] = searchResults.map((r) => r.citation);

      let assistantAnswer = '';
      let confidence: 'high' | 'medium' | 'extrapolated' = 'medium';

      if (engineMode === 'cloud') {
        // Fast AI server proxy via Gemini 3.8 Flash
        const response = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            chunks: searchResults.map((r) => r.chunk),
            explanationMode,
            subject: subjectName,
            history: chatMessages.slice(-4),
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Server tutor generation failed');
        }

        const data = await response.json();
        assistantAnswer = data.answer;
        confidence = searchResults.length > 0 ? 'high' : 'extrapolated';
      } else {
        // Local Mode
        if (ollamaConfig.isAvailable) {
          try {
            const contextText = searchResults.map((r) => r.chunk.content).join('\n---\n');
            const ollamaPrompt = `Context from student notes:
${contextText || 'No direct notes found.'}

Student Question: ${q}
Explanation Mode: ${explanationMode} (Format appropriately: ${
              explanationModes.find((m) => m.id === explanationMode)?.desc
            })

Please answer clearly and cite page numbers if given.`;

            assistantAnswer = await queryOllama(
              ollamaConfig.ollamaUrl,
              ollamaConfig.modelName,
              ollamaPrompt,
              'You are StudyMate AI, an academic tutor assisting a student with their course material.'
            );
            confidence = 'high';
          } catch {
            // Fallback to local synthesizer
            const localResult = synthesizeLocalAnswer(q, searchResults, explanationMode);
            assistantAnswer = localResult.answer;
            confidence = localResult.confidence;
          }
        } else {
          // Local In-Memory Synthesizer
          const localResult = synthesizeLocalAnswer(q, searchResults, explanationMode);
          assistantAnswer = localResult.answer;
          confidence = localResult.confidence;
        }
      }

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: assistantAnswer,
        timestamp: new Date().toISOString(),
        citations,
        explanationMode,
        confidence,
      };

      addChatMessage(assistantMessage);
    } catch (err: any) {
      // Fallback response so user is never stranded
      const fallbackSearchResult = vectorStore.search(q, undefined, 3);
      const fallbackResult = synthesizeLocalAnswer(q, fallbackSearchResult, explanationMode);

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: `${fallbackResult.answer}\n\n*(Synthesized via local in-browser engine)*`,
        timestamp: new Date().toISOString(),
        citations: fallbackResult.citations,
        explanationMode,
        confidence: 'medium',
      };
      addChatMessage(assistantMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header & Mode Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                AI Academic Tutor
              </h2>
              <p className="text-xs text-slate-500">
                {vectorStore.getChunksCount() === 0
                  ? 'No documents uploaded yet · Ask any subject concept or upload your notes'
                  : `Grounded in ${subjectName} · ${vectorStore.getChunksCount()} note sections indexed`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Explanation Mode Tabs */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Explanation Mode:
          </label>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            {explanationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setExplanationMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  explanationMode === mode.id
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs mt-1">
                  AI
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs space-y-3 ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                {/* Meta indicator */}
                <div className="flex items-center justify-between gap-3 text-[11px] opacity-75 border-b border-black/5 pb-1">
                  <span>{isUser ? 'You' : 'StudyMate AI Tutor'}</span>
                  <div className="flex items-center gap-2">
                    {msg.explanationMode && (
                      <span className="capitalize font-medium">
                        [{msg.explanationMode} Mode]
                      </span>
                    )}
                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className="p-1 hover:opacity-100 transition-opacity"
                        title={speakingMsgId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingMsgId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-xs max-w-none text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Grounding Source Citations Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Grounded In Uploaded Notes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => openCitation(c)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-[11px] font-medium rounded-md border border-indigo-200/60 transition-colors"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>
                            Page {c.pageNumber} · {c.docTitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs mt-1">
                  ME
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
              AI
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing notes & synthesizing pedagogical explanation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {chatMessages.length <= 3 && (
        <div className="py-2">
          <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Quick Prompts based on your college notes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[11px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-1 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            vectorStore.getChunksCount() === 0
              ? 'Ask any academic question or concept (or upload your notes in My Subjects)...'
              : `Ask anything about ${subjectName} (e.g., "Explain key definitions and exam answers")...`
          }
          className="flex-1 text-xs px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

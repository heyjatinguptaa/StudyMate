import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Lock,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { checkOllamaHealth } from '../utils/ollamaClient';

export const SettingsView: React.FC = () => {
  const {
    engineMode,
    setEngineMode,
    ollamaConfig,
    setOllamaConfig,
    documents,
    chunks,
    quizAttempts,
    vivaSessions,
    resetToDefaults,
  } = useStudy();

  const [ollamaUrl, setOllamaUrl] = useState(ollamaConfig.ollamaUrl);
  const [modelName, setModelName] = useState(ollamaConfig.modelName);
  const [isChecking, setIsChecking] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    models: string[];
    msg: string;
  } | null>(null);

  const [exportNotice, setExportNotice] = useState(false);

  const handleTestOllama = async () => {
    setIsChecking(true);
    setPingResult(null);

    const result = await checkOllamaHealth(ollamaUrl);

    setOllamaConfig({
      ollamaUrl,
      modelName,
      isAvailable: result.isAvailable,
      lastChecked: new Date().toISOString(),
    });

    if (result.isAvailable) {
      setPingResult({
        success: true,
        models: result.models,
        msg: `Connected! Found ${result.models.length} local models in Ollama (${result.models.slice(0, 3).join(', ')}${result.models.length > 3 ? '...' : ''}).`,
      });
    } else {
      setPingResult({
        success: false,
        models: [],
        msg: `Could not connect to Ollama at ${ollamaUrl}. Ensure Ollama is running ('ollama serve') or use the built-in local vector synthesizer.`,
      });
    }

    setIsChecking(false);
  };

  const handleExportData = () => {
    const studyData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      documents,
      chunks,
      quizAttempts,
      vivaSessions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(studyData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `studymate_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Privacy Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Settings & Local AI Runtime
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure local open-weight model endpoints (Ollama), verify offline status, inspect privacy policies, and manage your local vector store.
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              🔒 Privacy-First Architecture Commitment
            </h2>
            <p className="text-xs text-slate-400">
              Zero telemetry · Zero data retention · Local by default
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          StudyMate AI is designed so students never have to upload proprietary textbooks, professor slides, or private notes to third-party databases. Vector indexing, tokenization, and semantic search execute directly in your browser's local memory and can be powered entirely by local open-weight models like Llama 3.2, Mistral, or Qwen via Ollama.
        </p>

        <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-emerald-400 font-semibold">
          <span>✓ Documents Stored in Browser LocalStorage</span>
          <span>✓ Zero Model Training on Student Notes</span>
          <span>✓ Works 100% Offline with Local Engine</span>
        </div>
      </div>

      {/* AI Engine Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Active Intelligence Engine</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setEngineMode('local')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              engineMode === 'local'
                ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>🔒 Local AI Engine</span>
              </span>
              {engineMode === 'local' && (
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              All queries and chunk searches execute locally in browser memory or via your local Ollama runtime. 100% private.
            </p>
          </div>

          <div
            onClick={() => setEngineMode('cloud')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              engineMode === 'cloud'
                ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>⚡ Accelerated Studio AI</span>
              </span>
              {engineMode === 'cloud' && (
                <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Fast pedagogical reasoning grounded strictly in your retrieved notes via server-side proxy (Gemini 3.8 Flash).
            </p>
          </div>
        </div>
      </div>

      {/* Ollama Local Configuration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Ollama Local Model Configuration (Optional)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Default: http://localhost:11434
          </span>
        </div>

        <p className="text-xs text-slate-600">
          If you have Ollama installed on your laptop, StudyMate can send your RAG prompts directly to your local open-weight model (e.g. <code>llama3.2</code>, <code>mistral</code>, <code>deepseek-r1</code>).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ollama Endpoint URL
            </label>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Local Model Name
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. llama3.2, mistral, qwen2.5"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
            />
          </div>
        </div>

        {pingResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              pingResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {pingResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{pingResult.msg}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleTestOllama}
            disabled={isChecking}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Testing connection...' : 'Test Ollama Connection'}</span>
          </button>
        </div>
      </div>

      {/* Local Storage & Data Maintenance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Local Storage & Backup
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Indexed Documents</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {documents.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Semantic Chunks</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {chunks.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Completed Quizzes</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {quizAttempts.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Viva Examinations</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {vivaSessions.length}
            </span>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
            ✓ Study data exported to JSON file!
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Study Profile (JSON)</span>
          </button>

          <button
            onClick={() => {
              resetToDefaults();
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Reset to 0 subjects, 0 documents, and 0% scores"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset to Clean Slate (0 Subjects & Scores)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

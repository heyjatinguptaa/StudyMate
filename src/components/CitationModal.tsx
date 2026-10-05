import React from 'react';
import { FileText, X, CheckCircle, ExternalLink } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export const CitationModal: React.FC = () => {
  const { selectedCitation, closeCitation } = useStudy();

  if (!selectedCitation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Source Document Reference
              </h3>
              <p className="text-xs text-slate-500">
                Verified excerpt from student study material
              </p>
            </div>
          </div>
          <button
            onClick={closeCitation}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
            <div>
              <span className="text-indigo-900 font-semibold">
                {selectedCitation.docTitle}
              </span>
              <div className="text-indigo-700/80">
                Document Page: <span className="font-bold">{selectedCitation.pageNumber}</span>
              </div>
            </div>
            {selectedCitation.similarityScore !== undefined && (
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200/60">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{(selectedCitation.similarityScore * 100).toFixed(0)}% Relevance</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Extracted Academic Excerpt
            </label>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
              {selectedCitation.excerpt}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded-lg">
            🔒 <strong>Grounding verification:</strong> The AI synthesized the answer based directly on this text passage from your notes to prevent hallucinations.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={closeCitation}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Excerpt
          </button>
        </div>
      </div>
    </div>
  );
};

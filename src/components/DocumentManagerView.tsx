import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle,
  RefreshCw,
  Plus,
  AlertCircle,
  BookOpen,
  Layers,
  Sparkles,
  Edit2,
  FolderPlus,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { DocumentMeta, DocumentChunk, Subject } from '../types/studymate';
import { DEFAULT_DOCUMENTS, DEFAULT_CHUNKS } from '../data/defaultCourses';
import { SubjectModal } from './SubjectModal';

export const DocumentManagerView: React.FC = () => {
  const {
    documents,
    chunks,
    subjects,
    addSubject,
    addDocument,
    deleteDocument,
    setActiveSubjectId,
    loadSamplePack,
  } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '');
  const [customSubject, setCustomSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  // Direct paste tab or file upload
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');

  // Filter documents in view
  const [documentSubjectFilter, setDocumentSubjectFilter] = useState<string>('all');

  // Chunk inspection modal state
  const [inspectingDoc, setInspectingDoc] = useState<DocumentMeta | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps = [
    'Reading file streams...',
    'Extracting text & page markers...',
    'Cleaning & generating overlapping chunks...',
    'Indexing into local in-memory vector store...',
    'Ready for grounded RAG queries!',
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);

    let subjectToUse = selectedSubject.trim();
    if (customSubject.trim()) {
      const trimmed = customSubject.trim();
      const existing = subjects.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (!existing) {
        addSubject(trimmed);
      }
      subjectToUse = trimmed;
    } else if (!subjectToUse) {
      if (subjects.length > 0) {
        subjectToUse = subjects[0].name;
      } else {
        const cleanName =
          files[0]?.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .trim() || 'General Studies';
        addSubject(cleanName);
        subjectToUse = cleanName;
      }
    }

    try {
      let processedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePrefix = `[${i + 1}/${files.length}] "${file.name}": `;

        setActiveStep(0);
        setUploadProgress(`${filePrefix}Reading file stream...`);

        if (file.name.toLowerCase().endsWith('.pdf')) {
          setActiveStep(1);
          setUploadProgress(`${filePrefix}Extracting text and page boundaries...`);

          const base64Data = await readFileAsDataURL(file);

          const res = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data,
              fileName: file.name,
              subject: subjectToUse,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Failed to extract text from ${file.name}`);
          }

          const data = await res.json();

          setActiveStep(2);
          setUploadProgress(`${filePrefix}Generating overlapping semantic chunks...`);
          await new Promise((r) => setTimeout(r, 200));

          setActiveStep(3);
          setUploadProgress(`${filePrefix}Indexing into local vector database...`);

          const docId = `doc-${Date.now()}-${i}`;
          const newDocMeta: DocumentMeta = {
            id: docId,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            fileName: file.name,
            subject: subjectToUse,
            uploadDate: new Date().toISOString().split('T')[0],
            pageCount: data.pageCount || 1,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            status: 'indexed',
            chunkCount: data.chunks?.length || 1,
            previewExcerpt: data.chunks?.[0]?.content?.slice(0, 180) + '...',
          };

          const newDocChunks: DocumentChunk[] = (data.chunks || []).map((c: any) => ({
            id: `${docId}-${c.id}`,
            docId,
            docTitle: file.name,
            subject: subjectToUse,
            pageNumber: c.pageNumber || 1,
            content: c.content,
            sectionTitle: c.sectionTitle,
          }));

          addDocument(newDocMeta, newDocChunks);
          processedCount++;
        } else {
          // Plain text file
          setActiveStep(1);
          setUploadProgress(`${filePrefix}Reading text notes...`);
          const text = await file.text();

          setActiveStep(2);
          setUploadProgress(`${filePrefix}Chunking text notes...`);

          const docId = `doc-${Date.now()}-${i}`;
          const generatedChunks = createChunksFromText(text, docId, file.name, subjectToUse);

          const newDocMeta: DocumentMeta = {
            id: docId,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            fileName: file.name,
            subject: subjectToUse,
            uploadDate: new Date().toISOString().split('T')[0],
            pageCount: Math.max(1, Math.ceil(text.length / 2500)),
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            status: 'indexed',
            chunkCount: generatedChunks.length,
            previewExcerpt: text.slice(0, 180) + '...',
          };

          addDocument(newDocMeta, generatedChunks);
          processedCount++;
        }
      }

      setActiveStep(4);
      setUploadProgress(processingSteps[4]);
      setSuccessMsg(`Successfully processed and indexed ${processedCount} study document(s) for "${subjectToUse}"!`);
      setCustomSubject('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing uploaded files');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handlePasteSubmit = () => {
    if (!pastedTitle.trim() || !pastedText.trim()) {
      setErrorMsg('Please enter both a document title and notes content.');
      return;
    }

    let subjectToUse = selectedSubject.trim();
    if (customSubject.trim()) {
      const trimmed = customSubject.trim();
      const existing = subjects.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (!existing) {
        addSubject(trimmed);
      }
      subjectToUse = trimmed;
    } else if (!subjectToUse) {
      if (subjects.length > 0) {
        subjectToUse = subjects[0].name;
      } else {
        const cleanName = pastedTitle.trim() || 'General Course';
        addSubject(cleanName);
        subjectToUse = cleanName;
      }
    }

    const docId = `doc-${Date.now()}`;
    const generatedChunks = createChunksFromText(pastedText, docId, `${pastedTitle}.txt`, subjectToUse);

    const newDocMeta: DocumentMeta = {
      id: docId,
      title: pastedTitle.trim(),
      fileName: `${pastedTitle.trim().replace(/\s+/g, '_')}.txt`,
      subject: subjectToUse,
      uploadDate: new Date().toISOString().split('T')[0],
      pageCount: Math.max(1, Math.ceil(pastedText.length / 2500)),
      fileSize: `${(pastedText.length / 1024).toFixed(1)} KB`,
      status: 'indexed',
      chunkCount: generatedChunks.length,
      previewExcerpt: pastedText.slice(0, 180) + '...',
    };

    addDocument(newDocMeta, generatedChunks);
    setSuccessMsg(`Pasted notes "${pastedTitle}" indexed successfully for ${subjectToUse}!`);
    setPastedTitle('');
    setPastedText('');
    setCustomSubject('');
  };

  function createChunksFromText(
    text: string,
    docId: string,
    docTitle: string,
    subject: string
  ): DocumentChunk[] {
    const chunkSize = 750;
    const overlap = 150;
    const results: DocumentChunk[] = [];
    let start = 0;
    let idx = 1;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const slice = text.slice(start, end).trim();
      const pageNumber = Math.max(1, Math.floor(start / 2500) + 1);

      if (slice.length > 25) {
        results.push({
          id: `${docId}-chunk-${idx}`,
          docId,
          docTitle,
          subject,
          pageNumber,
          content: slice,
          sectionTitle: `Section ${idx} (Page ${pageNumber})`,
        });
      }
      start += chunkSize - overlap;
      idx++;
    }

    return results;
  }

  const chunksForInspecting = inspectingDoc
    ? chunks.filter((c) => c.docId === inspectingDoc.id)
    : [];

  const filteredDocuments =
    documentSubjectFilter === 'all'
      ? documents
      : documents.filter((d) => d.subject.toLowerCase() === documentSubjectFilter.toLowerCase());

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Document Management & Local Vector Store</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Course Subjects & Study Materials
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create custom subjects, give them your own names, and upload different lecture PDFs so StudyMate can tutor and examine you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSubjectToEdit(null);
              setIsSubjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Create Custom Subject</span>
          </button>

          <button
            onClick={() => {
              loadSamplePack();
              setSuccessMsg('Sample college packs loaded! All scores start at 0% until tested.');
              setTimeout(() => setSuccessMsg(null), 3000);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Load standard CS sample notes"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Load Sample College Notes</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Course Subjects Grid (User-given subject names) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Your Course Subjects ({subjects.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Give your own names to your courses. All scores start at 0% and calculate from your quiz and viva results.
            </p>
          </div>

          <button
            onClick={() => {
              setSubjectToEdit(null);
              setIsSubjectModalOpen(true);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{subjects.length === 0 ? 'Give Subject Name' : 'Add Another Subject'}</span>
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                No Course Subjects Added Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You have the full right to give any custom names to your subjects and courses. All scores start at 0% until you take practice quizzes or viva exams.
              </p>
            </div>
            <button
              onClick={() => {
                setSubjectToEdit(null);
                setIsSubjectModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Give Your Subject A Name</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {subjects.map((sub) => {
              const docCount = documents.filter(
                (d) => d.subject.toLowerCase() === sub.name.toLowerCase()
              ).length;

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                        {sub.code || 'COURSE'}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {sub.masteryPercent}% Mastery
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {sub.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {docCount} PDF{docCount === 1 ? '' : 's'}
                    </span>

                    <button
                      onClick={() => {
                        setSubjectToEdit(sub);
                        setIsSubjectModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Rename</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PDF Upload Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                uploadMode === 'file'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Upload Different PDFs & Notes
            </button>
            <button
              onClick={() => setUploadMode('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                uploadMode === 'paste'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Paste Notes Text
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Supports: <strong>Multiple PDFs, TXT, Markdown</strong>
          </div>
        </div>

        {/* Subject Assignment & On-the-fly Custom Subject Name */}
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Subject for these PDFs:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.code ? `${sub.code}: ` : ''}{sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Type a Brand New Subject Name on the fly:
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Systems, Environmental Engineering"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {customSubject.trim() && (
                <span className="text-[11px] text-indigo-600 mt-1 block">
                  ✨ Will automatically create subject: <strong>"{customSubject.trim()}"</strong> with 0% starting score
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
            <label className="block text-xs font-bold text-indigo-900">
              Give Your Subject A Name for these Uploaded PDFs:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Database Management Systems, Biology, Thermodynamics"
                value={customSubject}
                onChange={(e) => {
                  setCustomSubject(e.target.value);
                  setSelectedSubject(e.target.value);
                }}
                className="flex-1 text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  if (customSubject.trim()) {
                    addSubject(customSubject.trim());
                    setSelectedSubject(customSubject.trim());
                    setSuccessMsg(`Subject "${customSubject.trim()}" created with 0% initial score.`);
                    setTimeout(() => setSuccessMsg(null), 2500);
                  }
                }}
                disabled={!customSubject.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                + Save Subject
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              All starting scores begin at 0%. You can upload multiple lecture PDFs or notes under this course name.
            </p>
          </div>
        )}

        {/* Upload Mode: File Dropzone (Supports Multiple PDFs) */}
        {uploadMode === 'file' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.md"
              multiple={true}
              className="hidden"
              disabled={isUploading}
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Click to browse or drop your different PDF notes (Select multiple at once!)
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Upload course textbooks, professor handouts, or lecture transcripts
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              🔒 100% confidential. Analyzed locally in browser memory.
            </span>
          </div>
        )}

        {/* Upload Mode: Paste Text */}
        {uploadMode === 'paste' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document / Chapter Title
              </label>
              <input
                type="text"
                placeholder="e.g. Unit 2 - Process Scheduling & CPU Algorithms"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes Content (Markdown or Raw Text)
              </label>
              <textarea
                rows={6}
                placeholder="Paste definitions, formulas, algorithms, or lecture summaries here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={handlePasteSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Index Pasted Notes</span>
            </button>
          </div>
        )}

        {/* Real-time Processing Pipeline Progress Indicator */}
        {isUploading && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                {uploadProgress}
              </span>
              <span className="text-indigo-700 font-semibold">
                Step {activeStep + 1} of 5
              </span>
            </div>
            <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((activeStep + 1) / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-indigo-700/80">
              <span>PDF Parsing</span>
              <span>Chunking & Overlap</span>
              <span>Vector Database</span>
            </div>
          </div>
        )}
      </div>

      {/* Indexed Documents Library with Subject Filter */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Indexed Documents ({filteredDocuments.length})
            </h2>
            <p className="text-xs text-slate-500">
              {chunks.length} total semantic passages ready for vector search & exam answering
            </p>
          </div>

          {/* Subject Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setDocumentSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                documentSubjectFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setDocumentSubjectFilter(sub.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  documentSubjectFilter.toLowerCase() === sub.name.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">
              No documents indexed for this subject yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload your semester PDF notes or chapter slides using the upload box above so StudyMate can index them for you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => {
              const docChunks = chunks.filter((c) => c.docId === doc.id);
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {doc.subject} · {doc.uploadDate}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="Delete document and remove chunks"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {doc.previewExcerpt && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 line-clamp-2 italic">
                        "{doc.previewExcerpt}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>{doc.pageCount} Pages</span>
                      <span>·</span>
                      <span>{docChunks.length} Chunks</span>
                      <span>·</span>
                      <span>{doc.fileSize}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Indexed
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setInspectingDoc(doc)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Inspect Chunks ({docChunks.length})</span>
                    </button>

                    {doc.isDefault && (
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Standard Course
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Chunks Inspection Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Chunk Inspector: {inspectingDoc.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {chunksForInspecting.length} semantic chunks generated for vector retrieval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {chunksForInspecting.map((chk, i) => (
                <div
                  key={chk.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-semibold text-slate-700 border-b border-slate-200/60 pb-1.5">
                    <span>
                      Chunk #{i + 1} — {chk.sectionTitle || `Page ${chk.pageNumber}`}
                    </span>
                    <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Page {chk.pageNumber}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                    {chk.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        initialSubjectToEdit={subjectToEdit}
      />
    </div>
  );
};

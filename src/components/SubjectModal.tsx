import React, { useState } from 'react';
import { BookOpen, X, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { Subject } from '../types/studymate';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubjectToEdit?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  initialSubjectToEdit,
}) => {
  const { subjects, addSubject, editSubject, deleteSubject, setActiveSubjectId } = useStudy();

  const [name, setName] = useState(initialSubjectToEdit ? initialSubjectToEdit.name : '');
  const [code, setCode] = useState(initialSubjectToEdit ? initialSubjectToEdit.code : '');
  const [description, setDescription] = useState(
    initialSubjectToEdit ? initialSubjectToEdit.description : ''
  );
  const [editingId, setEditingId] = useState<string | null>(
    initialSubjectToEdit ? initialSubjectToEdit.id : null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a subject name (e.g. Operating Systems, Macroeconomics, Physics).');
      return;
    }

    if (editingId) {
      editSubject(editingId, name, code, description);
      setSuccessMsg(`Subject "${name.trim()}" updated successfully!`);
    } else {
      const newId = addSubject(name, code, description);
      setActiveSubjectId(newId);
      setSuccessMsg(`Subject "${name.trim()}" created! Score starts at 0%.`);
    }

    setName('');
    setCode('');
    setDescription('');
    setEditingId(null);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const startEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setName(sub.name);
    setCode(sub.code);
    setDescription(sub.description);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Manage Course Subjects
              </h3>
              <p className="text-xs text-slate-500">
                Give your own custom names to subjects and courses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Form to Add or Edit Subject */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              {editingId ? 'Edit Subject Name & Info' : 'Create New Course Subject'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, Thermodynamics, Law"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS-401"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Topics Overview
              </label>
              <input
                type="text"
                placeholder="e.g. Semester 5 curriculum on neural networks and gradient descent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Starting score: <strong>0% Mastery</strong> (updates as you practice)
              </span>

              <div className="flex items-center gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update Subject' : 'Save Subject'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing Subjects List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Your Course Subjects ({subjects.length})
            </h4>

            <div className="space-y-2">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sub.name}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {sub.code}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {sub.masteryPercent}% Mastery
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {sub.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Rename / Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        deleteSubject(sub.id);
                        setSuccessMsg(`Subject "${sub.name}" removed.`);
                        setTimeout(() => setSuccessMsg(null), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

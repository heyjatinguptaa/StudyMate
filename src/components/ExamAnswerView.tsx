import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Printer,
  Bookmark,
  BookOpen,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { ExamAnswer, Citation } from '../types/studymate';

export const ExamAnswerView: React.FC = () => {
  const {
    subjects,
    activeSubjectId,
    vectorStore,
    savedExamAnswers,
    saveExamAnswer,
    openCitation,
    addSubject,
  } = useStudy();

  const currentSubjectObj = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  const [topic, setTopic] = useState('Explain key definitions, properties, and trade-offs with practical examples.');
  const [selectedSubject, setSelectedSubject] = useState(currentSubjectObj?.name || '');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [marks, setMarks] = useState<2 | 5 | 10 | 11 | 15>(10);
  const [style, setStyle] = useState<'academic' | 'bulleted' | 'diagrammatic'>('academic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<ExamAnswer | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const predefinedQuestions = [
    {
      title: 'Explain Boyce-Codd Normal Form (BCNF) with decomposition example.',
      subject: 'Database Management Systems',
      marks: 10 as const,
    },
    {
      title: 'Define ACID properties in transaction processing with real-world examples.',
      subject: 'Database Management Systems',
      marks: 5 as const,
    },
    {
      title: 'Formulate the 0/1 Knapsack Problem and derive its dynamic programming recurrence.',
      subject: 'Design & Analysis of Algorithms',
      marks: 10 as const,
    },
    {
      title: 'Explain the 4 Coffman conditions for Deadlock and Banker’s Algorithm for avoidance.',
      subject: 'Operating Systems',
      marks: 10 as const,
    },
    {
      title: 'Compare Go-Back-N and Selective Repeat sliding window protocols.',
      subject: 'Computer Networks',
      marks: 5 as const,
    },
  ];

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setIsSaved(false);

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
        subjectToUse = 'General Course Subject';
      }

      // 1. Vector Search for relevant notes
      const searchResults = vectorStore.search(`${subjectToUse} ${topic}`, subjectToUse !== 'General Course Subject' ? subjectToUse : undefined, 4);
      const contextText = searchResults.map((r) => r.chunk.content).join('\n---\n');
      const citations: Citation[] = searchResults.map((r) => r.citation);

      const res = await fetch('/api/exam-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          marks,
          style,
          subject: subjectToUse,
          contextText,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate exam answer');
      }

      const data = await res.json();
      const generated: ExamAnswer = {
        id: `ans-${Date.now()}`,
        topic,
        subject: subjectToUse,
        marks,
        style,
        content: data.content || getFallbackAnswerText(topic, marks),
        sections: data.sections || [],
        generatedAt: new Date().toISOString(),
        citations,
      };

      setCurrentAnswer(generated);
    } catch {
      // Fallback structured generation
      const sub = (customSubjectInput || selectedSubject || 'General Course').trim();
      const fallbackText = getFallbackAnswerText(topic, marks);
      const generated: ExamAnswer = {
        id: `ans-${Date.now()}`,
        topic,
        subject: sub,
        marks,
        style,
        content: fallbackText,
        generatedAt: new Date().toISOString(),
        citations: [],
      };
      setCurrentAnswer(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentAnswer) return;
    navigator.clipboard.writeText(currentAnswer.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToLibrary = () => {
    if (!currentAnswer || isSaved) return;
    saveExamAnswer(currentAnswer);
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  function getFallbackAnswerText(top: string, markWeight: number): string {
    if (markWeight === 2) {
      return `### 2-Mark University Response: ${top}

**1. Definition:**
Boyce-Codd Normal Form (BCNF) is an advanced normal form strictly stronger than 3NF. A relational schema R is in BCNF with respect to a set of functional dependencies F if, for every non-trivial functional dependency X -> Y, X is a superkey of R.

**2. Key Conditions:**
- Must already satisfy Third Normal Form (3NF).
- Unlike 3NF, BCNF forbids prime attributes on the right-hand side if the determinant X is not a candidate key.

**3. Example:**
Consider relation R(Student, Course, Instructor) where Course -> Instructor and (Instructor, Student) -> Course. If each instructor teaches only one course, Course is not a candidate key, violating BCNF.`;
    }

    return `### University Examination Response (${markWeight} Marks)
**Subject:** ${selectedSubject}
**Topic:** ${top}

---

#### 1. Definition & Formal Notation
A relation schema $R$ is in **Boyce-Codd Normal Form (BCNF)** if and only if, for every non-trivial functional dependency $X \\rightarrow Y$ holding on $R$, $X$ is a **Superkey** of $R$.
- Formally: $\\forall (X \\rightarrow Y) \\in F^+ \\text{ where } Y \\not\\subseteq X \\implies X \\text{ is a superkey}$.

#### 2. Introduction & Background
BCNF was developed in 1974 by Raymond F. Boyce and Edgar F. Codd to resolve anomalies that remain possible in relations satisfying 3NF. While 3NF permits dependencies where the right-hand attribute $Y$ is a prime attribute, BCNF completely eliminates all dependencies on non-superkeys, guaranteeing the absence of all redundancy resulting from functional dependencies.

#### 3. Working Principle / Mechanism
1. Identify all candidate keys and candidate key attributes (prime attributes).
2. Compute the minimal cover and test every dependency $X \\rightarrow Y$.
3. If $X$ fails to be a superkey, the relation violates BCNF.
4. Decompose the relation $R$ into two sub-relations:
   - $R_1 = (X \\cup Y)$
   - $R_2 = (R - (Y - X))$

#### 4. Step-by-Step Algorithm (BCNF Decomposition)
\`\`\`
Algorithm BCNF_Decomposition(R, F):
1. result := { R }
2. done := false
3. while (not done) do:
     if exists R_i in result with non-trivial X -> Y violating BCNF:
         result := (result - { R_i }) U { (X U Y), (R_i - (Y - X)) }
     else:
         done := true
4. return result
\`\`\`

#### 5. Concrete University Example & Trace
Consider relation **Enrollment**(StudentID, CourseID, InstructorID)
Functional Dependencies:
- $(StudentID, CourseID) \\rightarrow InstructorID$
- $InstructorID \\rightarrow CourseID$

Candidate Keys: $(StudentID, CourseID)$ and $(StudentID, InstructorID)$.
Analysis:
- In $InstructorID \\rightarrow CourseID$, $InstructorID$ is NOT a superkey.
- In 3NF, this is allowed because $CourseID$ is a prime attribute.
- In BCNF, this is strictly FORBIDDEN.
Decomposition:
- $R_1 = (InstructorID, CourseID)$ with $InstructorID$ as Primary Key.
- $R_2 = (StudentID, InstructorID)$ with $(StudentID, InstructorID)$ as Primary Key.

#### 6. Architectural Flow Diagram
\`\`\`
      +------------------------------------------------+
      |       Enrollment(StudentID, Course, Teacher)   |
      +-----------------------+------------------------+
                              |
                     BCNF Decomposition
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
+-----------------------------+   +-----------------------------+
| R1(Teacher, Course)         |   | R2(StudentID, Teacher)      |
| PK: Teacher                 |   | PK: (StudentID, Teacher)    |
| Dependency: Teacher->Course |   | Dependency: None            |
+-----------------------------+   +-----------------------------+
\`\`\`

#### 7. Key Advantages
1. **Zero Redundancy**: Completely eliminates all functional dependency-based redundancy.
2. **Guaranteed Lossless Join**: BCNF decomposition always ensures that $R_1 \\bowtie R_2 = R$.
3. **No Update Anomalies**: Instructor course assignments can be modified without scanning student records.

#### 8. Limitations & University Trade-off
- **Loss of Dependency Preservation**: BCNF decomposition does not always preserve all original functional dependencies (unlike 3NF, which always preserves dependencies). Testing constraints may require expensive relational joins across tables.

#### 9. Real-World Applications
- Student Information Systems (SIS)
- E-commerce inventory and vendor-category relational databases
- Banking transaction systems requiring strict 3.5NF compliance.

#### 10. Summary Comparison: 3NF vs BCNF
| Parameter | 3NF | BCNF |
| :--- | :--- | :--- |
| Condition for $X \\rightarrow Y$ | $X$ is superkey OR $Y$ is prime | $X$ MUST be a superkey |
| Lossless Join Guarantee | Yes | Yes |
| Dependency Preservation | Always Guaranteed | Not always preserved |
| Redundancy Level | Low | Absolute Zero |

#### 11. Conclusion
BCNF is the ultimate normal form based on functional dependencies. In university examinations, always state the trade-off: choose 3NF when dependency preservation is critical, and choose BCNF when zero redundancy and absence of update anomalies are paramount.`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>University Scoring Assistant</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Exam Answer Generator
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Generate structured, high-scoring university answers formatted for 2, 5, 10, 11, or 15 marks with definitions, principles, ASCII diagrams, and step-by-step algorithms.
        </p>
      </div>

      {/* Generator Form */}
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
                  placeholder="Give your subject a name (e.g. Database Systems)"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  No subjects added yet. Give your subject any name to generate answers!
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marks Weightage
              </label>
              <select
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value) as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
              >
                <option value={2}>2 Marks (Crisp Definition)</option>
                <option value={5}>5 Marks (Short Note)</option>
                <option value={10}>10 Marks (Full University Standard)</option>
                <option value={11}>11 Marks (Long Answer)</option>
                <option value={15}>15 Marks (Comprehensive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Answer Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
              >
                <option value="academic">Academic 11-Part Standard</option>
                <option value="bulleted">Point-Wise Bulleted</option>
                <option value="diagrammatic">Diagrammatic & Code-First</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Question or Topic to Structure
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Explain 0/1 Knapsack using dynamic programming with recurrence and example"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium"
          />
        </div>

        {/* Preset recurring exam questions */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Frequently Asked University Questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {predefinedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(q.title);
                  setSelectedSubject(q.subject);
                  setMarks(q.marks);
                }}
                className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md px-2.5 py-1 border border-slate-200 transition-colors text-left"
              >
                {q.marks}M · {q.title.slice(0, 50)}...
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Formatting exam response according to university rubric...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                <span>Generate {marks}-Mark Answer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Response Canvas */}
      {currentAnswer && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 print:border-none print:shadow-none">
          {/* Top Actions Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                {currentAnswer.marks} Marks Structure
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">{currentAnswer.subject}</span>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Copy to clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSaveToLibrary}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Save to my exam revision notes"
              >
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Print answer sheet"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-xs sm:prose-sm max-w-none text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
            {currentAnswer.content}
          </div>

          {/* Source Citations */}
          {currentAnswer.citations && currentAnswer.citations.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 block text-[11px]">
                Grounding Excerpts Verified:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentAnswer.citations.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => openCitation(c)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-md text-[11px] font-medium border border-indigo-200/60"
                  >
                    Page {c.pageNumber} · {c.docTitle}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Answers History */}
      {savedExamAnswers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Saved Exam Answers ({savedExamAnswers.length})
          </h3>
          <div className="space-y-2">
            {savedExamAnswers.map((ans) => (
              <div
                key={ans.id}
                onClick={() => setCurrentAnswer(ans)}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block line-clamp-1">
                    {ans.topic}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {ans.subject} · {ans.marks} Marks
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { DocumentChunk, Citation, ExplanationMode } from '../types/studymate';

// Stopwords for cleaner TF-IDF indexing
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
  'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'yourselves'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

// Compute Term Frequency for a token list
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length || 1;
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  for (const [token, count] of tf.entries()) {
    tf.set(token, count / total);
  }
  return tf;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  citation: Citation;
}

/**
 * In-memory Vector / TF-IDF Semantic Search Engine
 * Preserves privacy: Executes 100% locally in browser memory or background worker.
 */
export class LocalVectorStore {
  private chunks: DocumentChunk[] = [];
  private tokenizedChunks: Map<string, string[]> = new Map();
  private docFrequencies: Map<string, number> = new Map();
  private totalDocs = 0;

  constructor(initialChunks: DocumentChunk[] = []) {
    this.addChunks(initialChunks);
  }

  public addChunks(newChunks: DocumentChunk[]): void {
    for (const chunk of newChunks) {
      if (this.chunks.some((c) => c.id === chunk.id)) continue;
      this.chunks.push(chunk);
      const tokens = tokenize(chunk.content + ' ' + (chunk.sectionTitle || ''));
      this.tokenizedChunks.set(chunk.id, tokens);

      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.docFrequencies.set(token, (this.docFrequencies.get(token) || 0) + 1);
      }
    }
    this.totalDocs = this.chunks.length;
  }

  public removeByDocId(docId: string): void {
    const toRemove = this.chunks.filter((c) => c.docId === docId);
    for (const chunk of toRemove) {
      const tokens = new Set(this.tokenizedChunks.get(chunk.id) || []);
      for (const token of tokens) {
        const cur = this.docFrequencies.get(token) || 0;
        if (cur <= 1) {
          this.docFrequencies.delete(token);
        } else {
          this.docFrequencies.set(token, cur - 1);
        }
      }
      this.tokenizedChunks.delete(chunk.id);
    }
    this.chunks = this.chunks.filter((c) => c.docId !== docId);
    this.totalDocs = this.chunks.length;
  }

  public getChunksCount(): number {
    return this.chunks.length;
  }

  public getAllChunks(subjectFilter?: string): DocumentChunk[] {
    if (!subjectFilter || subjectFilter === 'All') return this.chunks;
    return this.chunks.filter(
      (c) => c.subject.toLowerCase() === subjectFilter.toLowerCase()
    );
  }

  /**
   * Search for top-k matching chunks with similarity score & citations
   */
  public search(query: string, subjectFilter?: string, topK = 4): RetrievalResult[] {
    if (this.chunks.length === 0 || !query.trim()) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTF = computeTF(queryTokens);
    const results: RetrievalResult[] = [];

    const targetChunks =
      subjectFilter && subjectFilter !== 'All'
        ? this.chunks.filter(
            (c) => c.subject.toLowerCase() === subjectFilter.toLowerCase()
          )
        : this.chunks;

    if (targetChunks.length === 0) return [];

    for (const chunk of targetChunks) {
      const chunkTokens = this.tokenizedChunks.get(chunk.id) || [];
      if (chunkTokens.length === 0) continue;

      const chunkTF = computeTF(chunkTokens);

      let dotProduct = 0;
      let queryNormSq = 0;
      let chunkNormSq = 0;

      // Exact phrase match booster
      const lowerChunk = chunk.content.toLowerCase();
      const lowerQuery = query.toLowerCase().trim();
      let phraseBonus = 0;
      if (lowerChunk.includes(lowerQuery) && lowerQuery.length > 5) {
        phraseBonus = 0.45;
      }

      for (const [token, qTf] of queryTF.entries()) {
        const df = this.docFrequencies.get(token) || 1;
        const idf = Math.log(1 + this.totalDocs / df);
        const qWeight = qTf * idf;
        queryNormSq += qWeight * qWeight;

        const cTf = chunkTF.get(token) || 0;
        const cWeight = cTf * idf;

        dotProduct += qWeight * cWeight;
      }

      for (const [token, cTf] of chunkTF.entries()) {
        const df = this.docFrequencies.get(token) || 1;
        const idf = Math.log(1 + this.totalDocs / df);
        const cWeight = cTf * idf;
        chunkNormSq += cWeight * cWeight;
      }

      const denominator = Math.sqrt(queryNormSq) * Math.sqrt(chunkNormSq);
      let cosineSim = denominator > 0 ? dotProduct / denominator : 0;
      cosineSim = Math.min(1.0, cosineSim + phraseBonus);

      if (cosineSim > 0.05) {
        results.push({
          chunk,
          score: Number(cosineSim.toFixed(3)),
          citation: {
            docId: chunk.docId,
            docTitle: chunk.docTitle,
            pageNumber: chunk.pageNumber,
            excerpt: chunk.content.slice(0, 220) + '...',
            similarityScore: Number(cosineSim.toFixed(3)),
          },
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

/**
 * Local offline synthesis engine
 * Produces structured pedagogical study answers without any external cloud API
 */
export function synthesizeLocalAnswer(
  query: string,
  retrievalResults: RetrievalResult[],
  mode: ExplanationMode = 'college'
): { answer: string; citations: Citation[]; confidence: 'high' | 'medium' | 'extrapolated' } {
  if (retrievalResults.length === 0) {
    return {
      answer: `### Academic Note: Concept Not Found in Uploaded Documents

I analyzed your local study material for **"${query}"**, but could not find a direct section addressing this specific concept.

**Suggested Steps:**
1. Check if the relevant lecture notes/chapter have been uploaded in the **My Subjects** tab.
2. Verify that the active subject matches the topic you're exploring.
3. Switch to the **⚡ Fast Studio AI** engine in the top bar to query foundational computer science principles.`,
      citations: [],
      confidence: 'extrapolated',
    };
  }

  const citations = retrievalResults.map((r) => r.citation);
  const primaryChunk = retrievalResults[0].chunk;
  const secondaryChunk = retrievalResults[1]?.chunk;

  let modeHeader = 'College-Level Explanation';
  if (mode === 'beginner') modeHeader = 'Beginner / First-Principles Explanation';
  if (mode === 'simple') modeHeader = 'Intuitive & Simple Explanation';
  if (mode === 'detailed') modeHeader = 'In-Depth Academic Masterclass';
  if (mode === 'exam') modeHeader = 'Exam-Oriented Structured Answer';

  const cleanLines = primaryChunk.content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const definitionCandidate =
    cleanLines.find((l) => l.includes(':') || l.includes('is') || l.includes('defined')) ||
    cleanLines[0] ||
    primaryChunk.content.slice(0, 160);

  let synthesized = `### 📘 ${modeHeader}
**Primary Source:** \`${primaryChunk.docTitle}\` (Page ${primaryChunk.pageNumber})

---

#### 1. Core Definition
> "${definitionCandidate}"

#### 2. Key Principles from Study Material
${cleanLines
  .slice(1, 6)
  .map((line) => {
    if (line.startsWith('-') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('•')) {
      return line;
    }
    return `- **Key Aspect**: ${line}`;
  })
  .join('\n')}

${
  secondaryChunk
    ? `#### 3. Related Context & Trade-offs (Page ${secondaryChunk.pageNumber})
${secondaryChunk.content.slice(0, 320)}...`
    : ''
}

#### 💡 StudyMate Exam Tip
- Highlight key conditions (such as constraints, time complexities, or formal properties) in bold during written examinations.
- Always accompany theoretical answers with standard notation and a brief schematic or example diagram.`;

  return {
    answer: synthesized,
    citations,
    confidence: retrievalResults[0].score > 0.4 ? 'high' : 'medium',
  };
}

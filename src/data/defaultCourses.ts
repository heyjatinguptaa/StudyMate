import { DocumentMeta, DocumentChunk, Subject } from '../types/studymate';

// At initial starting state, NO subjects or documents are added as requested by user
export const DEFAULT_SUBJECTS: Subject[] = [];
export const DEFAULT_DOCUMENTS: DocumentMeta[] = [];
export const DEFAULT_CHUNKS: DocumentChunk[] = [];

// Optional sample packs if user clicks "Load Sample Notes"
export const SAMPLE_SUBJECTS: Subject[] = [
  {
    id: 'dbms',
    name: 'Database Management Systems',
    code: 'CS-302',
    description: 'Relational algebra, normal forms (1NF–BCNF), ACID properties, transactions, and indexing.',
    icon: 'Database',
    color: 'indigo',
    docCount: 1,
    masteryPercent: 0,
  },
  {
    id: 'daa',
    name: 'Design & Analysis of Algorithms',
    code: 'CS-304',
    description: 'Dynamic programming, greedy paradigms, divide & conquer, asymptotic complexity, and graph algorithms.',
    icon: 'Cpu',
    color: 'emerald',
    docCount: 1,
    masteryPercent: 0,
  },
  {
    id: 'os',
    name: 'Operating Systems',
    code: 'CS-301',
    description: 'Process synchronization, CPU scheduling, deadlocks, virtual memory, and page replacement.',
    icon: 'Server',
    color: 'amber',
    docCount: 1,
    masteryPercent: 0,
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    code: 'CS-306',
    description: 'OSI and TCP/IP stack, flow & error control, routing protocols, and IP addressing.',
    icon: 'Network',
    color: 'rose',
    docCount: 1,
    masteryPercent: 0,
  },
];

export const SAMPLE_DOCUMENTS: DocumentMeta[] = [
  {
    id: 'doc-dbms-normalization',
    title: 'DBMS Lecture Notes - Normalization & Transactions',
    fileName: 'DBMS_Unit3_Normalization_Transactions.pdf',
    subject: 'Database Management Systems',
    uploadDate: '2026-09-28',
    pageCount: 14,
    fileSize: '2.4 MB',
    status: 'indexed',
    chunkCount: 4,
    isDefault: true,
    previewExcerpt:
      'Covers functional dependencies, anomalies (insertion, deletion, update), 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), and ACID transaction properties.',
  },
  {
    id: 'doc-daa-dp-greedy',
    title: 'DAA Lecture Notes - Dynamic Programming & Greedy',
    fileName: 'DAA_Unit4_Dynamic_Programming.pdf',
    subject: 'Design & Analysis of Algorithms',
    uploadDate: '2026-09-30',
    pageCount: 16,
    fileSize: '3.1 MB',
    status: 'indexed',
    chunkCount: 3,
    isDefault: true,
    previewExcerpt:
      'Covers 0/1 Knapsack problem using dynamic programming vs fractional knapsack greedy approach, Longest Common Subsequence (LCS), and Optimal Substructure.',
  },
  {
    id: 'doc-os-deadlocks-sync',
    title: 'OS Lecture Notes - Synchronization & Deadlocks',
    fileName: 'OS_Unit2_Deadlocks_Sync.pdf',
    subject: 'Operating Systems',
    uploadDate: '2026-10-02',
    pageCount: 11,
    fileSize: '1.8 MB',
    status: 'indexed',
    chunkCount: 2,
    isDefault: true,
    previewExcerpt:
      'Critical section problem, Peterson solution, Semaphores (wait/signal), Banker’s Algorithm for deadlock avoidance, and Resource Allocation Graphs.',
  },
  {
    id: 'doc-cn-osi-layers',
    title: 'Computer Networks - OSI & Flow Control',
    fileName: 'CN_Unit1_OSI_FlowControl.pdf',
    subject: 'Computer Networks',
    uploadDate: '2026-10-03',
    pageCount: 9,
    fileSize: '1.5 MB',
    status: 'indexed',
    chunkCount: 2,
    isDefault: true,
    previewExcerpt:
      'OSI 7 Layers functions, TCP vs UDP differences, Sliding Window Protocols: Stop-and-Wait, Go-Back-N, and Selective Repeat ARQ comparison.',
  },
];

export const SAMPLE_CHUNKS: DocumentChunk[] = [
  // DBMS Chunks
  {
    id: 'dbms-chk-1',
    docId: 'doc-dbms-normalization',
    docTitle: 'DBMS_Unit3_Normalization_Transactions.pdf',
    subject: 'Database Management Systems',
    pageNumber: 2,
    sectionTitle: 'Database Anomalies & Need for Normalization',
    content: `Database Normalization is the systematic approach of decomposing tables to eliminate data redundancy and undesirable anomalies:
1. Insertion Anomaly: Cannot insert a student record without enrolling them in a course if Course_ID is part of the primary key.
2. Deletion Anomaly: Deleting the only student enrolled in a course unintentionally deletes the entire course record.
3. Update/Modification Anomaly: If instructor phone number is repeated across 50 records, updating it in only one record leaves the database in an inconsistent state.
Purpose of Normalization: Minimizes redundancy, prevents update anomalies, ensures data integrity, and produces lossless decompositions.`,
  },
  {
    id: 'dbms-chk-2',
    docId: 'doc-dbms-normalization',
    docTitle: 'DBMS_Unit3_Normalization_Transactions.pdf',
    subject: 'Database Management Systems',
    pageNumber: 4,
    sectionTitle: '1NF, 2NF and Functional Dependencies',
    content: `First Normal Form (1NF):
- Each column must contain atomic (indivisible) values.
- No multi-valued attributes or repeating groups (e.g. Courses: "Math, CS, Physics" violates 1NF; must split into separate rows).

Second Normal Form (2NF):
- Table must already be in 1NF.
- No Partial Dependency: No non-prime attribute should be functionally dependent on a proper subset of any candidate key.
- A candidate key with a single attribute is automatically in 2NF if in 1NF.
- Remedy: Decompose the relation so that dependent attributes are segregated into a new table with the partial key as primary key.`,
  },
  {
    id: 'dbms-chk-3',
    docId: 'doc-dbms-normalization',
    docTitle: 'DBMS_Unit3_Normalization_Transactions.pdf',
    subject: 'Database Management Systems',
    pageNumber: 7,
    sectionTitle: '3NF vs BCNF (Boyce-Codd Normal Form)',
    content: `Third Normal Form (3NF):
- Table must be in 2NF.
- No Transitive Dependency: For every functional dependency X -> Y, either:
  1. X is a super key, OR
  2. Y is a prime attribute (part of some candidate key).
3NF guarantees both Lossless Join and Dependency Preservation.

Boyce-Codd Normal Form (BCNF / 3.5NF):
- Strictly stronger than 3NF.
- For EVERY non-trivial functional dependency X -> Y, X MUST BE A SUPER KEY.
- Unlike 3NF, BCNF does not allow Y to be a prime attribute if X is not a super key.
- Important exam trade-off: A BCNF decomposition is always lossless, but may NOT always preserve functional dependencies. 3NF always preserves dependencies.`,
  },
  {
    id: 'dbms-chk-4',
    docId: 'doc-dbms-normalization',
    docTitle: 'DBMS_Unit3_Normalization_Transactions.pdf',
    subject: 'Database Management Systems',
    pageNumber: 11,
    sectionTitle: 'Transaction Processing & ACID Properties',
    content: `A transaction is a logical unit of database processing that includes one or more database access operations.
ACID Properties:
1. Atomicity: "All or nothing" execution. Either all transaction operations execute successfully, or the entire transaction is rolled back (managed by Recovery Manager using Write-Ahead Logging / WAL).
2. Consistency: Execution of a transaction must preserve database invariants (e.g., total account balance before and after a transfer remains constant).
3. Isolation: Concurrent transactions must execute without interfering with one another. Each transaction behaves as if it runs in isolation (enforced by Concurrency Control / 2-Phase Locking / Serializability).
4. Durability: Once a transaction commits, its updates persist permanently even in the event of power loss or system crash (ensured by log flushes to non-volatile disk).`,
  },

  // DAA Chunks
  {
    id: 'daa-chk-1',
    docId: 'doc-daa-dp-greedy',
    docTitle: 'DAA_Unit4_Dynamic_Programming.pdf',
    subject: 'Design & Analysis of Algorithms',
    pageNumber: 3,
    sectionTitle: 'Dynamic Programming Fundamentals',
    content: `Dynamic Programming (DP) is an algorithm design paradigm applied to optimization problems with two essential properties:
1. Optimal Substructure: An optimal solution to the overall problem incorporates optimal solutions to subproblems.
2. Overlapping Subproblems: The recursive algorithm visits the same subproblems repeatedly rather than generating new subproblems.`,
  },
  {
    id: 'daa-chk-2',
    docId: 'doc-daa-dp-greedy',
    docTitle: 'DAA_Unit4_Dynamic_Programming.pdf',
    subject: 'Design & Analysis of Algorithms',
    pageNumber: 6,
    sectionTitle: '0/1 Knapsack Problem Formulation & Recurrence',
    content: `In 0/1 Knapsack, given n items where item i has weight w[i] and value v[i], and a knapsack of capacity W:
Each item can either be taken (1) or left behind (0).
Recurrence:
If w[i-1] <= w:
  DP[i][w] = max( v[i-1] + DP[i-1][w - w[i-1]], DP[i-1][w] )
Else:
  DP[i][w] = DP[i-1][w]`,
  },

  // OS Chunks
  {
    id: 'os-chk-1',
    docId: 'doc-os-deadlocks-sync',
    docTitle: 'OS_Unit2_Deadlocks_Sync.pdf',
    subject: 'Operating Systems',
    pageNumber: 3,
    sectionTitle: 'Critical Section & Synchronization',
    content: `Critical Section Problem: A segment of code where processes access shared resources.
Three Criteria: Mutual Exclusion, Progress, Bounded Waiting.
Deadlock Coffman Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.`,
  },

  // CN Chunks
  {
    id: 'cn-chk-1',
    docId: 'doc-cn-osi-layers',
    docTitle: 'CN_Unit1_OSI_FlowControl.pdf',
    subject: 'Computer Networks',
    pageNumber: 2,
    sectionTitle: 'OSI 7-Layer Reference Model vs TCP/IP',
    content: `The OSI 7-Layer Architecture: Application, Presentation, Session, Transport, Network, Data Link, Physical.
Sliding Window: Stop-and-Wait, Go-Back-N (cumulative ACK, retransmit window), Selective Repeat (independent ACK, receiver buffer).`,
  },
];

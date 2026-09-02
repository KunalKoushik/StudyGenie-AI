import crypto from 'crypto';
import { db } from './db';
import { RAGSource } from '../src/types';
import { cosineSimilarity } from './cache';

export interface RAGChunk {
  id: string;
  namespace: string;
  board: string;
  stage: string;
  subject: string;
  subtopic: string;
  chapter: string;
  title: string;
  content: string;
  embedding: number[];
  sourceUrl?: string;
  lastUpdated: string;
}

// Generates a mock/real vector embedding array for semantic matching
export function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const vec = new Array(32).fill(0);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    for (let j = 0; j < w.length; j++) {
      const idx = (w.charCodeAt(j) * (i + 1)) % 32;
      vec[idx] += 1;
    }
  }
  // Normalize vector
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map((val) => Number((val / norm).toFixed(6)));
}

export function seedCorpusIfEmpty(): void {
  try {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM rag_chunks').get() as { cnt: number };
    if (count && count.cnt > 0) return;

    const initialChunks = [
      // 1. UPSC Polity - Constitutional Framework
      {
        namespace: 'upsc_cse',
        board: 'N/A',
        stage: 'competitive_exam',
        subject: 'Indian Polity & Governance',
        subtopic: 'Preamble & Fundamental Rights',
        chapter: 'Chapter 7: Fundamental Rights',
        title: 'Article 21 - Protection of Life and Personal Liberty',
        content: 'Article 21 states that no person shall be deprived of his life or personal liberty except according to procedure established by law. In Maneka Gandhi vs Union of India (1978), the Supreme Court expanded Article 21 to mandate due process of law, including the Right to Privacy (Puttaswamy 2017), Right to Clean Environment, and Right to Education (Article 21A).',
        sourceUrl: 'https://legislative.gov.in/constitution-of-india',
        lastUpdated: '2026-08-01'
      },
      {
        namespace: 'upsc_cse',
        board: 'N/A',
        stage: 'competitive_exam',
        subject: 'Indian Polity & Governance',
        subtopic: 'Judiciary & Supreme Court',
        chapter: 'Basic Structure Doctrine',
        title: 'Kesavananda Bharati Case (1973)',
        content: 'The Supreme Court held in Kesavananda Bharati v. State of Kerala (1973) that while Parliament has wide powers to amend the Constitution under Article 368, it cannot alter or destroy the Basic Structure of the Constitution (such as Judicial Review, Federalism, Secularism, and Rule of Law).',
        sourceUrl: 'https://main.sci.gov.in/judgments',
        lastUpdated: '2026-08-01'
      },

      // 2. UPSC Current Affairs 2026
      {
        namespace: 'upsc_cse',
        board: 'N/A',
        stage: 'competitive_exam',
        subject: 'Current Affairs',
        subtopic: 'Government Schemes & Reports',
        chapter: 'Economic & Governance Updates 2026',
        title: 'Digital Public Infrastructure (DPI) & India Stack 2.0',
        content: 'India Stack 2.0 integrates AI-driven governance, open credit enablement networks (OCEN), and sovereign identity verification, boosting digital inclusion and financial access across Tier-2 and Tier-3 cities.',
        sourceUrl: 'https://pib.gov.in',
        lastUpdated: new Date().toISOString().split('T')[0]
      },

      // 3. NCERT Class 10 Science - Chemistry
      {
        namespace: 'school_core',
        board: 'CBSE',
        stage: 'secondary_10',
        subject: 'Chemistry',
        subtopic: 'Carbon & Its Compounds',
        chapter: 'Chapter 4: Carbon and its Compounds',
        title: 'Polymers & Addition Polymerization',
        content: 'Polymers are high-molecular-mass compounds formed by joining together small repeating units called monomers. Synthetic polymers like polyethylene are formed by addition polymerization of ethylene molecules ($n CH_2=CH_2 \\rightarrow [-CH_2-CH_2-]_n$). Natural polymers include proteins and cellulose.',
        sourceUrl: 'https://ncert.nic.in/textbook.php',
        lastUpdated: '2026-01-01'
      },

      // 4. NCERT Class 10 Science - Biology
      {
        namespace: 'school_core',
        board: 'CBSE',
        stage: 'secondary_10',
        subject: 'Biology',
        subtopic: 'Life Processes',
        chapter: 'Chapter 6: Life Processes',
        title: 'Photosynthesis & Chloroplast Mechanism',
        content: 'Photosynthesis equation: $6CO_2 + 6H_2O \\xrightarrow{\\text{Light}} C_6H_{12}O_6 + 6O_2$. Occurs in two main stages: (1) Light-dependent reactions in thylakoid membranes generating ATP and NADPH, and (2) Calvin cycle carbon fixation in stroma converting $CO_2$ into glucose.',
        sourceUrl: 'https://ncert.nic.in/textbook.php',
        lastUpdated: '2026-01-01'
      },

      // 5. Undergraduate CS & Data Structures
      {
        namespace: 'undergraduate',
        board: 'University',
        stage: 'undergraduate_y2',
        subject: 'Computer Science & IT',
        subtopic: 'Data Structures & Algorithms',
        chapter: 'Graph Algorithms',
        title: 'Breadth-First Search (BFS) vs Depth-First Search (DFS)',
        content: 'BFS traverses graph level-by-level using a Queue data structure (FIFO), guaranteeing shortest paths in unweighted graphs. DFS traverses deeply along each branch using a Stack or recursion (LIFO). Both execute in $\\mathcal{O}(V + E)$ time complexity.',
        sourceUrl: 'https://openstax.org/details/books/computer-science',
        lastUpdated: '2026-01-01'
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO rag_chunks (id, namespace, board, stage, subject, subtopic, chapter, title, content, embedding_json, source_url, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const chunk of initialChunks) {
      const id = crypto.randomUUID();
      const emb = generateSimpleEmbedding(`${chunk.subject} ${chunk.subtopic} ${chunk.title} ${chunk.content}`);
      stmt.run(
        id,
        chunk.namespace,
        chunk.board,
        chunk.stage,
        chunk.subject,
        chunk.subtopic,
        chunk.chapter,
        chunk.title,
        chunk.content,
        JSON.stringify(emb),
        chunk.sourceUrl,
        chunk.lastUpdated
      );
    }
  } catch (e) {
    console.error('Corpus seeding error:', e);
  }
}

export function retrieveRelevantChunks(
  query: string,
  subject: string,
  stage: string,
  topK: number = 4,
  minSimilarity: number = 0.45
): { chunks: RAGChunk[]; sources: RAGSource[] } {
  try {
    seedCorpusIfEmpty();

    const queryEmb = generateSimpleEmbedding(query);
    const rows = db.prepare('SELECT * FROM rag_chunks').all() as any[];

    const scored: { chunk: RAGChunk; score: number }[] = [];

    for (const row of rows) {
      const emb = JSON.parse(row.embedding_json);
      let score = cosineSimilarity(queryEmb, emb);

      // Boost similarity if subject matches
      if (row.subject.toLowerCase() === subject.toLowerCase()) {
        score += 0.25;
      }

      if (score >= minSimilarity) {
        scored.push({
          chunk: {
            id: row.id,
            namespace: row.namespace,
            board: row.board,
            stage: row.stage,
            subject: row.subject,
            subtopic: row.subtopic,
            chapter: row.chapter,
            title: row.title,
            content: row.content,
            embedding: emb,
            sourceUrl: row.source_url,
            lastUpdated: row.last_updated
          },
          score
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const topChunks = scored.slice(0, topK).map((s) => s.chunk);
    const sources: RAGSource[] = topChunks.map((c) => ({
      title: `${c.title} (${c.chapter})`,
      reference: c.sourceUrl || `${c.board} ${c.subject}`,
      sourceUrl: c.sourceUrl,
      lastUpdated: c.lastUpdated
    }));

    return { chunks: topChunks, sources };
  } catch (e) {
    console.error('RAG retrieval error:', e);
    return { chunks: [], sources: [] };
  }
}

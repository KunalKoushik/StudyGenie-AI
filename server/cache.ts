import crypto from 'crypto';
import { db } from './db';
import { QueryClassification, RAGSource } from '../src/types';

// Helper to compute a normalized hash key
export function computeCacheKey(
  subject: string,
  stage: string,
  intent: string,
  normalizedMessage: string
): string {
  const normalized = normalizedMessage
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
  const raw = `${subject}:${stage}:${intent}:${normalized}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// 1. Exact-Match Cache
export function getExactCache(key: string): { data: any; cacheType: 'exact' } | null {
  try {
    const row = db.prepare('SELECT response_json, ttl_timestamp FROM response_cache WHERE hash_key = ?').get(key) as any;
    if (!row) return null;

    if (row.ttl_timestamp && Date.now() > row.ttl_timestamp) {
      db.prepare('DELETE FROM response_cache WHERE hash_key = ?').run(key);
      return null;
    }

    return {
      data: JSON.parse(row.response_json),
      cacheType: 'exact'
    };
  } catch (e) {
    return null;
  }
}

export function setExactCache(key: string, data: any, ttlMs: number = 7 * 24 * 60 * 60 * 1000): void {
  try {
    const ttlTimestamp = Date.now() + ttlMs;
    const jsonStr = JSON.stringify(data);
    db.prepare(`
      INSERT INTO response_cache (hash_key, response_json, ttl_timestamp, content_type)
      VALUES (?, ?, ?, 'exact')
      ON CONFLICT(hash_key) DO UPDATE SET
        response_json = excluded.response_json,
        ttl_timestamp = excluded.ttl_timestamp
    `).run(key, jsonStr, ttlTimestamp);
  } catch (e) {
    console.error('Exact cache set error:', e);
  }
}

// 2. Cosine Similarity for Semantic Vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 3. Semantic Cache Search
export function getSemanticCache(
  queryEmbedding: number[],
  subject: string,
  stage: string,
  minThreshold: number = 0.92
): { data: any; cacheType: 'semantic' } | null {
  try {
    const rows = db.prepare('SELECT embedding_json, response_json FROM query_embeddings WHERE subject = ? AND stage = ?').all(subject, stage) as any[];
    for (const row of rows) {
      const storedEmb = JSON.parse(row.embedding_json);
      const sim = cosineSimilarity(queryEmbedding, storedEmb);
      if (sim >= minThreshold) {
        return {
          data: JSON.parse(row.response_json),
          cacheType: 'semantic'
        };
      }
    }
  } catch (e) {
    console.error('Semantic cache search error:', e);
  }
  return null;
}

export function setSemanticCache(
  queryText: string,
  queryEmbedding: number[],
  subject: string,
  stage: string,
  data: any
): void {
  try {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO query_embeddings (id, query_text, embedding_json, stage, subject, response_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, queryText, JSON.stringify(queryEmbedding), stage, subject, JSON.stringify(data), new Date().toISOString());
  } catch (e) {
    console.error('Semantic cache set error:', e);
  }
}

// 4. Cache Invalidation Helper
export function purgeCorpusCache(namespace?: string): void {
  try {
    if (namespace) {
      db.prepare('DELETE FROM response_cache WHERE content_type = ?').run(namespace);
    } else {
      db.prepare('DELETE FROM response_cache').run();
      db.prepare('DELETE FROM query_embeddings').run();
    }
  } catch (e) {
    console.error('Cache purge error:', e);
  }
}

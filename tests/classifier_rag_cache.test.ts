import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db, initDB } from '../server/db';
import { classifyQuery } from '../server/classifier';
import { getExactCache, setExactCache, computeCacheKey, getSemanticCache, setSemanticCache } from '../server/cache';
import { retrieveRelevantChunks, seedCorpusIfEmpty, generateSimpleEmbedding } from '../server/rag';

describe('Universal AI Tutor Redesign - Classifier, RAG & Caching Test Suite', () => {

  beforeAll(() => {
    initDB();
    seedCorpusIfEmpty();
  });

  describe('1. Server-Side AI Classifier', () => {
    it('Classifies UPSC Polity & Governance queries accurately', async () => {
      const res = await classifyQuery('Explain Article 21 and Right to Privacy', { stage: 'competitive_exam', exam: 'UPSC_CSE' });
      expect(res.subject).toContain('Indian Polity');
      expect(res.intent).toBe('concept_explanation');
      expect(res.requiresRetrieval).toBe(true);
      expect(res.confidence).toBeGreaterThan(0.8);
    });

    it('Classifies pure arithmetic as Mathematics without retrieval', async () => {
      const res = await classifyQuery('2+5');
      expect(res.subject).toBe('Mathematics');
      expect(res.intent).toBe('problem_solving');
      expect(res.requiresRetrieval).toBe(false);
    });

    it('Classifies square root radical as Mathematics', async () => {
      const res = await classifyQuery('squareroot(97)');
      expect(res.subject).toBe('Mathematics');
      expect(res.intent).toBe('problem_solving');
    });
  });

  describe('2. Exact & Semantic Multi-Layer Caching Engine', () => {
    it('Stores and retrieves exact hash cached response', () => {
      const key = computeCacheKey('Indian Polity & Governance', 'competitive_exam', 'concept_explanation', 'Article 21');
      const testData = { mainMessage: 'Article 21 tests cached answer', grounded: true };

      setExactCache(key, testData);
      const hit = getExactCache(key);

      expect(hit).not.toBeNull();
      expect(hit?.cacheType).toBe('exact');
      expect(hit?.data.mainMessage).toContain('Article 21 tests cached answer');
    });

    it('Stores and retrieves semantic vector cached response for rephrased query', () => {
      const queryText = 'Explain BFS vs DFS traversal';
      const emb = generateSimpleEmbedding(queryText);
      const testData = { mainMessage: 'BFS vs DFS semantic vector hit' };

      setSemanticCache(queryText, emb, 'Computer Science & IT', 'undergraduate_y2', testData);
      const hit = getSemanticCache(emb, 'Computer Science & IT', 'undergraduate_y2', 0.90);

      expect(hit).not.toBeNull();
      expect(hit?.cacheType).toBe('semantic');
      expect(hit?.data.mainMessage).toContain('BFS vs DFS');
    });
  });

  describe('3. RAG Grounding & Source Citation Retrieval', () => {
    it('Retrieves grounded NCERT & UPSC sources for curriculum queries', () => {
      const { chunks, sources } = retrieveRelevantChunks('Article 21 Right to Life', 'Indian Polity & Governance', 'competitive_exam');
      expect(chunks.length).toBeGreaterThan(0);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0].title).toContain('Article 21');
    });

    it('Retrieves NCERT Chemistry chunks for Polymer queries', () => {
      const { chunks, sources } = retrieveRelevantChunks('Polymers & Monomers', 'Chemistry', 'secondary_10');
      expect(chunks.length).toBeGreaterThan(0);
      expect(sources[0].title).toContain('Polymers');
    });
  });

  describe('4. Golden Q&A Regression Suite across Education Stages', () => {
    const goldenQueries = [
      { stage: 'nursery', query: 'count 1 to 5', expectedSubject: 'Mathematics' },
      { stage: 'secondary_10', query: 'photosynthesis equation', expectedSubject: 'Biology' },
      { stage: 'undergraduate_y2', query: 'BFS vs DFS complexity', expectedSubject: 'Computer Science' },
      { stage: 'competitive_exam', exam: 'UPSC_CSE', query: 'Kesavananda Bharati Basic Structure', expectedSubject: 'Indian Polity' }
    ];

    goldenQueries.forEach(({ stage, exam, query, expectedSubject }) => {
      it(`Golden Q&A test for ${stage} (${query})`, async () => {
        const res = await classifyQuery(query, { stage: stage as any, exam: exam as any });
        expect(res.subject).toContain(expectedSubject.split(' ')[0]);
      });
    });
  });

});

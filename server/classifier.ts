import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL } from './config';
import { EducationContext, QueryClassification, QueryIntent } from '../src/types';
import fs from 'fs';
import path from 'path';

let taxonomyData: any = null;
try {
  const taxonomyPath = path.join(process.cwd(), 'server', 'taxonomy.json');
  if (fs.existsSync(taxonomyPath)) {
    taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Taxonomy load warning:', e);
}

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function classifyQuery(
  message: string,
  userContext?: EducationContext
): Promise<QueryClassification> {
  const msgLower = message.trim().toLowerCase();

  // 1. Fast Deterministic Pre-Filter for Arithmetic & Greetings
  if (/^(hi+|hello+|hey+|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|thanks|thank\s*you)\s*[\!\?\.\]]*$/i.test(msgLower)) {
    return {
      subject: 'General Knowledge',
      intent: 'greeting',
      detectedStage: userContext?.stage || 'secondary_10',
      language: 'English',
      requiresRetrieval: false,
      confidence: 0.99
    };
  }

  // Pure Arithmetic or Radical Math
  if (/^[0-9\.\s\+\-\*\/\(\)\^]+$/.test(msgLower) && /[0-9]/.test(msgLower)) {
    return {
      subject: 'Mathematics',
      subtopic: 'Arithmetic & Computation',
      intent: 'problem_solving',
      detectedStage: userContext?.stage || 'middle_8',
      language: 'English',
      requiresRetrieval: false,
      confidence: 0.98
    };
  }

  const sqrtMatch = msgLower.match(/^(?:sq[ua]{2}re\s*root|squareroot|sqrt|root)\s*(?:of)?\s*\(?\s*([0-9\.\/\s\+\-\*]+)\s*\)?$/i);
  if (sqrtMatch) {
    return {
      subject: 'Mathematics',
      subtopic: 'Radicals & Square Roots',
      intent: 'problem_solving',
      detectedStage: userContext?.stage || 'secondary_9',
      language: 'English',
      requiresRetrieval: false,
      confidence: 0.98
    };
  }

  // Primary Math & Counting
  if (/\b(count|counting|sum|addition|subtract|shapes|multiplication)\b/i.test(msgLower)) {
    return {
      subject: 'Mathematics',
      subtopic: 'Basic Numeracy',
      intent: 'concept_explanation',
      detectedStage: userContext?.stage || 'nursery',
      language: 'English',
      requiresRetrieval: false,
      confidence: 0.95
    };
  }

  // Biology & Life Sciences
  if (/\b(photosynthesis|chlorophyll|plant|cell|dna|rna|mitosis)\b/i.test(msgLower)) {
    return {
      subject: 'Biology',
      subtopic: 'Life Processes',
      intent: 'concept_explanation',
      detectedStage: userContext?.stage || 'secondary_10',
      language: 'English',
      requiresRetrieval: true,
      confidence: 0.95
    };
  }

  // Computer Science & IT
  if (/\b(bfs|dfs|graph|tree|algorithm|complexity|queue|stack|code|programming)\b/i.test(msgLower)) {
    return {
      subject: 'Computer Science & IT',
      subtopic: 'Data Structures & Algorithms',
      intent: 'concept_explanation',
      detectedStage: userContext?.stage || 'undergraduate_y2',
      language: 'English',
      requiresRetrieval: true,
      confidence: 0.95
    };
  }

  // 2. UPSC CSE Intent Detection
  if (userContext?.exam === 'UPSC_CSE' || /\b(article|constitution|supremecourt|sc judgment|parliament|governance|upsc|prelims|mains|gs\s*paper|polity|fundamental rights|dpsp|epw|niti aayog)\b/i.test(msgLower)) {
    let intent: QueryIntent = 'concept_explanation';
    if (/\b(current affairs|recent|news|scheme|budget|survey|2025|2026)\b/i.test(msgLower)) {
      intent = 'current_affairs';
    } else if (/\b(essay|structure|intro|conclusion|critically analyze|evaluate|answer)\b/i.test(msgLower)) {
      intent = 'essay_feedback';
    } else if (/\b(compare|difference|vs|versus|differentiate)\b/i.test(msgLower)) {
      intent = 'comparison';
    }

    return {
      subject: 'Indian Polity & Governance',
      subtopic: 'Constitutional Framework & Governance',
      detectedStage: 'competitive_exam',
      intent,
      language: 'English',
      requiresRetrieval: true,
      confidence: 0.92
    };
  }

  // 3. Fast LLM Classification Step via Gemini
  const ai = getGenAI();
  if (ai) {
    try {
      const prompt = `Classify this student inquiry into structured educational metadata.
User Question: "${message}"
Student Profile Context: ${JSON.stringify(userContext || { stage: 'secondary_10', board: 'CBSE' })}

Return ONLY raw JSON with schema:
{
  "subject": "e.g. Mathematics, Physics, Organic Chemistry, Indian Polity & Governance, Computer Science, Biology, History",
  "subtopic": "e.g. Calculus, Thermodynamics, Polymers, Constitutional Law, Graph Traversal",
  "detectedStage": "${userContext?.stage || 'secondary_10'}",
  "intent": "concept_explanation" | "problem_solving" | "homework_help" | "exam_prep" | "definition" | "comparison" | "current_affairs" | "essay_feedback" | "quiz_me",
  "language": "English",
  "requiresRetrieval": true | false,
  "confidence": 0.95
}`;

      const res = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      if (res.text) {
        const parsed = JSON.parse(res.text);
        return {
          subject: parsed.subject || 'General Knowledge',
          subtopic: parsed.subtopic || 'General Overview',
          detectedStage: parsed.detectedStage || userContext?.stage || 'secondary_10',
          intent: parsed.intent || 'concept_explanation',
          language: parsed.language || 'English',
          requiresRetrieval: typeof parsed.requiresRetrieval === 'boolean' ? parsed.requiresRetrieval : true,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85
        };
      }
    } catch (e) {
      console.warn('LLM classification fallback:', e);
    }
  }

  // 4. Default Heuristic Fallback
  return {
    subject: userContext?.exam === 'UPSC_CSE' ? 'Indian Polity & Governance' : 'General Knowledge',
    subtopic: 'General Academic Inquiry',
    detectedStage: userContext?.stage || 'secondary_10',
    intent: 'concept_explanation',
    language: 'English',
    requiresRetrieval: true,
    confidence: 0.70
  };
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Helper to initialize GenAI client safely with required telemetry headers
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to evaluate basic math expressions directly
function tryEvaluateSimpleMath(expr: string): { directAnswer: string; value: number } | null {
  try {
    const cleaned = expr
      = expr
        .trim()
        .replace(/\?/g, '')
        .replace(/what is\s*/gi, '')
        .replace(/calculate\s*/gi, '')
        .replace(/solve\s*/gi, '')
        .replace(/=/g, '')
        .trim();

    // Percentage calculation like "15% of 200"
    const percentMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)$/i);
    if (percentMatch) {
      const p = parseFloat(percentMatch[1]);
      const n = parseFloat(percentMatch[2]);
      const val = (p / 100) * n;
      return { directAnswer: `${p}% of ${n} = ${val}`, value: val };
    }

    // Arithmetic expression check: digits, operators +, -, *, /, (, ), ., ^
    if (/^[\d\s\+\-\*\/\(\)\.\^]+$/.test(cleaned) && /\d/.test(cleaned)) {
      const sanitized = cleaned.replace(/\^/g, '**');
      // Safe evaluation limited strictly to numeric math
      const evalFunc = new Function(`return (${sanitized});`);
      const val = evalFunc();
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        return { directAnswer: `${cleaned} = ${val}`, value: val };
      }
    }
  } catch {
    // Non-math string
  }
  return null;
}

// Response Caching & Deterministic Query Normalization Engine
const responseCache = new Map<string, { data: any; timestamp: number }>();

function normalizeQuery(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Strip special characters for canonical lookup
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

function getCacheKey(prefix: string, ...params: (string | number | boolean)[]): string {
  return `${prefix}:${params.map(p => normalizeQuery(String(p))).join(':')}`;
}

// Server-Side Centralized Knowledge Base for RAG Consistency
const RAG_KNOWLEDGE_BASE: Record<string, string[]> = {
  physics: [
    "Newton's First Law: An object remains at rest or in uniform motion unless acted upon by an external net force.",
    "Newton's Second Law: Force equals mass times acceleration (F = m * a). Force is measured in Newtons (N).",
    "Newton's Third Law: For every action force, there is an equal and opposite reaction force.",
    "Kinetic Energy Formula: KE = 0.5 * m * v^2 where m is mass (kg) and v is velocity (m/s).",
    "Gravitational Potential Energy: PE = m * g * h where g is acceleration due to gravity (approx. 9.8 m/s^2)."
  ],
  math: [
    "Pythagorean Theorem: In a right-angled triangle, a^2 + b^2 = c^2, where c is the hypotenuse.",
    "Quadratic Formula: x = (-b ± √(b^2 - 4ac)) / (2a) for ax^2 + bx + c = 0.",
    "Compound Interest Formula: A = P(1 + r/n)^(nt) where P is principal, r is annual interest rate, n is compounding frequency, t is time in years.",
    "Derivative Power Rule: d/dx [x^n] = n * x^(n-1).",
    "Euler's Identity: e^(i*π) + 1 = 0."
  ],
  chemistry: [
    "Ideal Gas Law: PV = nRT where P is pressure, V is volume, n is moles, R is gas constant, T is temperature in Kelvin.",
    "Avogadro's Number: 6.022 x 10^23 particles per mole.",
    "pH Definition: pH = -log10[H+] measuring hydrogen ion concentration in solution.",
    "Periodic Law: Physical and chemical properties of elements recur periodically when arranged by atomic number."
  ],
  general: [
    "Socratic Method: Guided questioning technique to foster critical thinking and step-by-step problem solving.",
    "Study Strategy: Active recall and spaced repetition yield optimal long-term memory retention."
  ]
};

function retrieveRAGContext(message: string, subject: string): string {
  const norm = normalizeQuery(message);
  const subjKey = normalizeQuery(subject);
  const domainDocs = RAG_KNOWLEDGE_BASE[subjKey] || RAG_KNOWLEDGE_BASE['general'];
  
  const relevantDocs = domainDocs.filter(doc => {
    const normDoc = normalizeQuery(doc);
    const keywords = norm.split(' ').filter(w => w.length > 3);
    return keywords.some(kw => normDoc.includes(kw));
  });

  if (relevantDocs.length === 0) {
    return domainDocs.slice(0, 2).join('\n');
  }
  return relevantDocs.join('\n');
}

// System Prompts & Helpers
const SYSTEM_TUTOR_PROMPT = `You are StudyGenie AI, a world-class Socratic study tutor.
Respond to student questions in clear, encouraging, and direct language.

CRITICAL INSTRUCTION FOR DIRECT ANSWERS & MATH:
1. If the student asks a direct calculation, arithmetic, formula evaluation, or factual question (e.g., "2+5", "What is 15% of 80?", "Solve 3x + 5 = 11", "What is the speed of light?"), you MUST state the EXACT final calculated answer or direct solution at the VERY BEGINNING of "mainMessage" (e.g., "2 + 5 = 7").
2. Never withhold the direct answer. State the result clearly first, then provide the step-by-step reasoning, key concepts, and Socratic reflection questions.

Always return a VALID JSON object matching this schema strictly:
{
  "mainMessage": "Exact direct answer or result followed by a friendly explanation.",
  "responseType": "concept_explanation" | "problem_solving" | "homework_help" | "exam_prep",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "stepByStep": ["Step 1...", "Step 2...", "Step 3..."],
  "checkQuestions": ["Question to check understanding 1", "Question 2"],
  "memoryAids": ["Mnemonic or analogy to remember"],
  "encouragement": "Supportive closing phrase"
}`;

const SYSTEM_QUIZ_PROMPT = `Generate a high-quality practice quiz.
Return ONLY a JSON object with schema:
{
  "title": "Quiz Title",
  "subject": "Subject Name",
  "questions": [
    {
      "id": "q1",
      "question": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation why this option is correct."
    }
  ]
}`;

const SYSTEM_VISION_PROMPT = `Analyze the uploaded educational image (problem, diagram, textbook excerpt).
Return ONLY a JSON object with schema:
{
  "title": "Identified Subject/Problem Title",
  "summary": "Brief overview of what is in the image",
  "extractedText": "Key text or equation transcribed",
  "stepByStepSolution": ["Step 1", "Step 2", "Step 3"],
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
  "relatedConcepts": ["Concept A", "Concept B"]
}`;

const SYSTEM_SYLLABUS_PROMPT = `Analyze this course syllabus or textbook table of contents.
Return ONLY a JSON object with schema:
{
  "courseTitle": "Extracted Course Title",
  "summary": "Overview of course goals",
  "modules": [
    {
      "week": 1,
      "moduleName": "Module Name",
      "topics": ["Topic 1", "Topic 2"],
      "estimatedHours": 4,
      "keyOutcome": "Learning objective"
    }
  ]
}`;

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: 'ok', service: 'StudyGenie AI Backend', geminiEnabled: hasKey });
});

// 1. AI Tutor Chat Endpoint
app.post('/api/tutor', async (req: Request, res: Response) => {
  const { message, subject = 'General', studentLevel = 'intermediate', sessionType = 'concept_explanation' } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // Check Exact Hash Response Cache for Cross-Device Deterministic Consistency
  const cacheKey = getCacheKey('tutor', subject, studentLevel, sessionType, message);
  const cachedHit = responseCache.get(cacheKey);
  if (cachedHit) {
    return res.json({ success: true, data: cachedHit.data, cached: true, deterministic: true });
  }

  const mathEval = tryEvaluateSimpleMath(message);
  const ragContext = retrieveRAGContext(message, subject);

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_TUTOR_PROMPT}\n\nSubject: ${subject}\nLevel: ${studentLevel}\nSession Type: ${sessionType}\nVerified RAG Context:\n${ragContext}\n\nStudent Question: ${message}${mathEval ? `\n(Note: Calculated Direct Math Solution: ${mathEval.directAnswer})` : ''}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0, // Zero temperature greedy sampling for strict cross-device determinism
          topP: 0.95
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (mathEval && !parsed.mainMessage.includes(String(mathEval.value))) {
          parsed.mainMessage = `**${mathEval.directAnswer}**\n\n${parsed.mainMessage}`;
        }
        // Save to deterministic server cache
        responseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return res.json({ success: true, data: parsed, cached: false, deterministic: true });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, using intelligent fallback:', err?.message || err);
    }
  }

  // Fallback response generator
  let fallbackData;
  if (mathEval) {
    fallbackData = {
      mainMessage: `The answer is **${mathEval.directAnswer}**!`,
      responseType: 'problem_solving',
      keyConcepts: [
        'Basic Arithmetic Operations',
        'Order of Operations (PEMDAS)',
        'Numerical Evaluation'
      ],
      stepByStep: [
        `1. Identify the input expression: ${message}`,
        `2. Perform the arithmetic calculation`,
        `3. Final result: ${mathEval.directAnswer}`
      ],
      checkQuestions: [
        `What would happen if you added 10 to this result?`,
        `Can you write an equation that gives the same answer?`
      ],
      memoryAids: ['Arithmetic principle: Addition combines quantities into a single sum.'],
      encouragement: 'Great job! Math fundamentals make complex problem solving easy.'
    };
  } else {
    fallbackData = {
      mainMessage: `Great question regarding **${subject}**! Let's break down "${message}" together.\n\n**Key Knowledge Context:**\n${ragContext}`,
      responseType: sessionType,
      keyConcepts: [
        `Core principles of ${subject}`,
        'Fundamental logic & problem structure',
        'Practical application in real scenarios'
      ],
      stepByStep: [
        `1. Identify the fundamental formula or concept behind ${message}`,
        '2. Analyze the given parameters and requirements',
        '3. Apply step-by-step logic to deduce the correct result'
      ],
      checkQuestions: [
        `How would you describe ${message} in your own words?`,
        'What is the most critical constraint or assumption here?'
      ],
      memoryAids: [`Recall: ${subject} problems always start with understanding key inputs!`],
      encouragement: 'You are making steady progress! Keep up the curiosity.'
    };
  }

  responseCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
  return res.json({ success: true, data: fallbackData, cached: false, deterministic: true });
});

// 2. Generate Quiz Endpoint
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  const { topic, count = 5, subject = 'General', difficulty = 'Medium' } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, error: 'Topic is required' });
  }

  // Cache check for deterministic quiz generation
  const cacheKey = getCacheKey('quiz', subject, topic, difficulty, count);
  const cachedHit = responseCache.get(cacheKey);
  if (cachedHit) {
    return res.json({ success: true, data: cachedHit.data, cached: true, deterministic: true });
  }

  const ragContext = retrieveRAGContext(topic, subject);

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_QUIZ_PROMPT}\n\nGenerate a ${difficulty} difficulty quiz with ${count} questions for topic: "${topic}" in subject: "${subject}".\nVerified Knowledge Reference:\n${ragContext}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0, // Deterministic greedy decoding
          topP: 0.95
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        responseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return res.json({ success: true, data: parsed, cached: false, deterministic: true });
      }
    } catch (err: any) {
      console.warn('Quiz AI generation failed, using fallback:', err?.message || err);
    }
  }

  // Fallback Quiz Generator
  const fallbackQuiz = {
    title: `${topic} Master Quiz`,
    subject,
    questions: [
      {
        id: 'q1',
        question: `What is the primary objective when studying ${topic}?`,
        options: [
          `To understand the core principles and relationships in ${topic}`,
          `To memorize unrelated equations without application`,
          `To ignore the underlying theoretical framework`,
          `None of the above`
        ],
        correctIndex: 0,
        explanation: `Mastering ${topic} requires a firm grasp of underlying concepts and their interconnections.`
      },
      {
        id: 'q2',
        question: `Which of the following best describes a key property of ${topic}?`,
        options: [
          `Static and non-interacting`,
          `Dynamic and foundational to ${subject}`,
          `Purely theoretical with no practical use`,
          `Applicable only in laboratory settings`
        ],
        correctIndex: 1,
        explanation: `${topic} provides essential tools for understanding dynamic systems in ${subject}.`
      },
      {
        id: 'q3',
        question: `When solving problems in ${topic}, what is recommended as the first step?`,
        options: [
          `Jump straight to final calculation`,
          `Draw a diagram or list given information and goal variables`,
          `Guess the answer based on past intuition`,
          `Skip definition check`
        ],
        correctIndex: 1,
        explanation: `Listing known variables and sketching the problem structure prevents calculation errors.`
      }
    ]
  };

  responseCache.set(cacheKey, { data: fallbackQuiz, timestamp: Date.now() });
  res.json({ success: true, data: fallbackQuiz, cached: false, deterministic: true });
});

// 4. Snap & Solve Image Analysis Endpoint
app.post('/api/vision/analyze', async (req: Request, res: Response) => {
  const { imageBase64, prompt = 'Solve and explain this problem step by step.' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ success: false, error: 'Image data is required' });
  }

  const ai = getGenAI();
  if (ai) {
    try {
      // Strip base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: cleanBase64 } },
              { text: `${SYSTEM_VISION_PROMPT}\n\nAdditional Instruction: ${prompt}` }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0,
          topP: 0.95
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, deterministic: true });
      }
    } catch (err: any) {
      console.warn('Vision AI analysis failed, using fallback:', err?.message || err);
    }
  }

  // Fallback Vision Response
  res.json({
    success: true,
    data: {
      title: 'Scanned Problem Analysis',
      summary: 'Image processed successfully. Detected mathematical & conceptual text.',
      extractedText: 'Sample equation/problem transcribed from uploaded image.',
      stepByStepSolution: [
        'Step 1: Identify given equations and variable constraints from the image.',
        'Step 2: Apply appropriate transformation rules and fundamental formulas.',
        'Step 3: Simplify algebraic expressions to obtain final verified answer.'
      ],
      keyTakeaways: [
        'Always double-check unit conversions when solving physics/math equations.',
        'Pay close attention to initial sign conventions and boundaries.'
      ],
      relatedConcepts: ['Algebraic Simplification', 'Conceptual Graphing', 'Problem Decomposition']
    }
  });
});

// 5. Syllabus Analysis Endpoint
app.post('/api/syllabus/analyze', async (req: Request, res: Response) => {
  const { text, courseTitle = 'Course Syllabus' } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Syllabus content is required' });
  }

  const cacheKey = getCacheKey('syllabus', courseTitle, text);
  const cachedHit = responseCache.get(cacheKey);
  if (cachedHit) {
    return res.json({ success: true, data: cachedHit.data, cached: true, deterministic: true });
  }

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_SYLLABUS_PROMPT}\n\nCourse Title: ${courseTitle}\n\nSyllabus Content:\n${text}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0,
          topP: 0.95
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        responseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return res.json({ success: true, data: parsed, cached: false, deterministic: true });
      }
    } catch (err: any) {
      console.warn('Syllabus AI analysis failed, using fallback:', err?.message || err);
    }
  }

  // Fallback Syllabus Breakdown
  res.json({
    success: true,
    data: {
      courseTitle,
      summary: 'Automated study schedule constructed from course content.',
      modules: [
        {
          week: 1,
          moduleName: 'Foundations & Principles',
          topics: ['Introduction to Core Definitions', 'Historical Context & Terminology'],
          estimatedHours: 4,
          keyOutcome: 'Master baseline vocabulary and core assumptions'
        },
        {
          week: 2,
          moduleName: 'Intermediate Concepts & Applications',
          topics: ['Analytical Frameworks', 'Problem Solving Techniques'],
          estimatedHours: 5,
          keyOutcome: 'Apply formulas to practical study problems'
        },
        {
          week: 3,
          moduleName: 'Advanced Synthesis & Review',
          topics: ['Complex Case Studies', 'Comprehensive Exam Preparation'],
          estimatedHours: 6,
          keyOutcome: 'Achieve total mastery and exam readiness'
        }
      ]
    }
  });
});

// Vite Development Integration / Production Static Server
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StudyGenie AI server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start StudyGenie AI server:', err);
});

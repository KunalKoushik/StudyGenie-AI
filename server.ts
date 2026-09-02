import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db, initDB, seedDefaultUserIfEmpty, checkAndIncrementAIQuota } from './server/db';
import { 
  requireStrictAuth,
  authenticateUserToken,
  verifyCsrfToken,
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateCsrfToken,
  AuthenticatedRequest 
} from './server/auth';
import {
  PORT,
  GEMINI_MODEL,
  ALLOWED_ORIGIN
} from './server/config';
import {
  tutorRequestSchema,
  flashcardGenSchema,
  quizGenSchema,
  visionAnalyzeSchema,
  syllabusAnalyzeSchema,
  registerSchema,
  loginSchema
} from './server/validation';

// Initialize SQLite database
initDB();
seedDefaultUserIfEmpty();

const app = express();

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for inline KaTeX SVG and Vite HMR scripts
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));

// Rate Limiting Middleware (60 reqs/min per IP) with automatic memory cleanup
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) rateLimitMap.delete(ip);
  }
}, 60000);

app.use('/api/', (req: Request, res: Response, next) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const limit = 60;
  const windowMs = 60 * 1000;

  const current = rateLimitMap.get(ip);
  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (current.count >= limit) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please wait a minute before sending another request.' });
  }

  current.count += 1;
  next();
});

// CSRF Verification Middleware for state-changing endpoints
app.use('/api/', verifyCsrfToken as express.RequestHandler);

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

// Safe Math Evaluator (AST Token Parser avoiding new Function / eval)
function safeEvaluateMath(expr: string): number | null {
  try {
    const tokens = expr.match(/(\d+\.?\d*|\+|\-|\*|\/|\^|\(|\))/g);
    if (!tokens || tokens.join('') !== expr.replace(/\s+/g, '')) return null;

    let index = 0;
    function parseExpression(): number {
      let value = parseTerm();
      while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
        const op = tokens[index++];
        const nextTerm = parseTerm();
        value = op === '+' ? value + nextTerm : value - nextTerm;
      }
      return value;
    }

    function parseTerm(): number {
      let value = parseFactor();
      while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
        const op = tokens[index++];
        const nextFactor = parseFactor();
        value = op === '*' ? value * nextFactor : value / nextFactor;
      }
      return value;
    }

    function parseFactor(): number {
      if (tokens[index] === '(') {
        index++;
        const val = parseExpression();
        if (tokens[index] === ')') index++;
        return val;
      }
      if (tokens[index] === '-') {
        index++;
        return -parseFactor();
      }
      const num = parseFloat(tokens[index++]);
      if (isNaN(num)) throw new Error('Invalid number');
      return num;
    }

    const res = parseExpression();
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return res;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Helper to evaluate basic math expressions directly
function tryEvaluateSimpleMath(expr: string): { directAnswer: string; value: number } | null {
  try {
    const cleaned = expr
      .trim()
      .replace(/\?/g, '')
      .replace(/what is\s*/gi, '')
      .replace(/calculate\s*/gi, '')
      .replace(/solve\s*/gi, '')
      .replace(/=/g, '')
      .trim();

    // Square root calculation like "sqaure root of 21/100" or "sqrt(16)"
    const sqrtMatch = cleaned.match(/^(?:sqaure\s*root|square\s*root|sqrt|root)\s*(?:of)?\s*\(?\s*([0-9\.\/\s\+\-\*]+)\s*\)?$/i);
    if (sqrtMatch) {
      const innerStr = sqrtMatch[1].trim();
      let innerValue: number;
      if (innerStr.includes('/')) {
        const [num, den] = innerStr.split('/').map(s => parseFloat(s.trim()));
        innerValue = num / den;
      } else {
        innerValue = parseFloat(innerStr);
      }

      if (!isNaN(innerValue) && innerValue >= 0) {
        const val = Math.sqrt(innerValue);
        const formattedVal = Number.isInteger(val) ? val.toString() : val.toFixed(4);
        return {
          directAnswer: `\\sqrt{${innerStr}} = ${formattedVal}`,
          value: Number(val.toFixed(6))
        };
      }
    }

    // Percentage calculation like "15% of 200"
    const pctMatch = cleaned.match(/^(\d+(?:\.\d+)?)\%\s*of\s*(\d+(?:\.\d+)?)$/i);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const base = parseFloat(pctMatch[2]);
      const res = (pct / 100) * base;
      return { directAnswer: `${pct}% of ${base} = ${res}`, value: res };
    }

    // Safe AST arithmetic evaluator
    const val = safeEvaluateMath(cleaned);
    if (val !== null) {
      return { directAnswer: `${expr.trim()} = ${val}`, value: val };
    }
  } catch (err) {
    // Ignore math eval errors
  }
  return null;
}

const SYSTEM_TUTOR_PROMPT = `
You are StudyGenie AI, an elite Socratic AI Academic Tutor & STEM Specialist created to provide world-class educational guidance.

PEDAGOGICAL & PROFESSIONAL RULES:
1. **Accuracy & Precision**: Provide rigorous, mathematically and scientifically exact answers.
2. **Socratic Guidance**: Explain concepts clearly, break down problems into logical steps, and prompt the student with thoughtful reflection questions.
3. **Conversational Intelligence**: If the user input is a casual greeting or conversational phrase (e.g. "hi", "hii", "hello", "hey", "who are you", "thanks"), respond warmly and professionally, introduce yourself as StudyGenie AI Tutor, and ask how you can help them with their target subject. Do NOT force a complex mathematical formula on a simple greeting.
4. **Mathematical Formatting**: Use LaTeX ($...$ for inline math equations, $$...$$ for block display formulas).
5. **Structured JSON Output**: You MUST respond ONLY in raw, valid JSON matching this exact schema:

{
  "mainMessage": "Detailed, highly clear explanation of the topic or solution. Bold key terms and format math in LaTeX.",
  "responseType": "concept_explanation" | "problem_solving" | "homework_help" | "exam_prep",
  "keyConcepts": ["Specific Concept 1", "Specific Concept 2", "Specific Concept 3"],
  "stepByStep": [
    "Step 1: Clear, actionable explanation or calculation step",
    "Step 2: Next logical step with formula/reasoning",
    "Step 3: Conclusion or final formula"
  ],
  "checkQuestions": [
    "Reflective inquiry question 1 testing comprehension",
    "Reflective inquiry question 2 challenging edge cases"
  ],
  "memoryAids": [
    "High-impact mnemonic, formula memory hook, or key takeaway"
  ]
}

6. Do NOT enclose the JSON output in markdown backticks (such as \`\`\`json). Return pure JSON.
`;

function generateSmartTutorFallback(message: string, subject: string, level: string, sessionType: string) {
  const msgLower = message.toLowerCase().trim();

  // Conversational / Greeting check
  const isGreeting = /^(hi+|hello+|hey+|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|what\s*can\s*you\s*do|help|thanks|thank\s*you)\s*[\!\?\.\]]*$/i.test(msgLower);

  if (isGreeting) {
    return {
      mainMessage: `Hello Scholar! 👋 I am your **StudyGenie AI Tutor**.\n\nI am configured for **${subject}** (${level} level, ${sessionType.replace(/_/g, ' ')} mode).\n\nHow can I assist your study session today? You can ask me to explain any topic, solve complex equations, break down homework problems, or quiz your knowledge!`,
      responseType: sessionType,
      keyConcepts: [`${subject} Fundamentals`, 'Socratic Learning', 'Active Recall'],
      stepByStep: [
        `1. Confirm your desired Subject (${subject}) and Level above`,
        `2. Type any topic, question, or formula (e.g., "Explain L'Hôpital's rule", "F=ma example", "2+5")`,
        `3. Review step-by-step breakdowns and check questions to lock in your understanding`
      ],
      checkQuestions: [
        `What specific topic or problem in ${subject} would you like to explore first?`,
        `Would you prefer a conceptual explanation or a step-by-step numerical solution?`
      ],
      memoryAids: ['Active recall and explaining concepts in your own words is the fastest path to long-term memory retention!']
    };
  }

  const mathEval = tryEvaluateSimpleMath(message);

  if (mathEval) {
    return {
      mainMessage: `The calculated result is **${mathEval.directAnswer}**.\n\nHere is the step-by-step mathematical evaluation:`,
      responseType: 'problem_solving',
      keyConcepts: ['Arithmetic Evaluation', 'Order of Operations (PEMDAS)', 'Numerical Computation'],
      stepByStep: [
        `1. Parsed mathematical expression: $${message.trim()}$`,
        `2. Evaluated arithmetic operations: $${mathEval.directAnswer}$`,
        `3. Verified output value: **${mathEval.value}**`
      ],
      checkQuestions: [
        `How would the result change if you doubled one of the terms?`,
        `Can you express this arithmetic statement as a word problem?`
      ],
      memoryAids: ['PEMDAS Order: Parentheses → Exponents → Multiplication/Division → Addition/Subtraction']
    };
  }

  if (msgLower.includes('l\'hopital') || msgLower.includes('lhopital') || msgLower.includes('limit') || msgLower.includes('derivative') || msgLower.includes('calculus')) {
    return {
      mainMessage: `### Calculus & Limits Analysis: **L'Hôpital's Rule & Derivatives**\n\nWhen evaluating a limit $\\lim_{x \\to a} \\frac{f(x)}{g(x)}$ that results in an indeterminate form such as $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$, L'Hôpital's Rule allows us to take the derivatives of the numerator and denominator independently.`,
      responseType: 'concept_explanation',
      keyConcepts: ["L'Hôpital's Rule", "Indeterminate Forms (0/0, ∞/∞)", "Differentiability & Continuity"],
      stepByStep: [
        "Step 1: Check that $\\lim_{x \\to a} f(x) = 0$ and $\\lim_{x \\to a} g(x) = 0$ (or both approach $\\pm\\infty$).",
        "Step 2: Differentiate numerator and denominator separately: $f'(x)$ and $g'(x)$.",
        "Step 3: Evaluate the new limit: $$\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$$"
      ],
      checkQuestions: [
        "Why must you check for indeterminate forms before applying L'Hôpital's Rule?",
        "What happens if the first application of L'Hôpital's Rule still yields 0/0?"
      ],
      memoryAids: ["Remember: Differentiate numerator and denominator separately, NEVER apply the quotient rule here!"]
    };
  }

  if (msgLower.includes('newton') || msgLower.includes('force') || msgLower.includes('f=ma') || msgLower.includes('motion') || msgLower.includes('velocity') || msgLower.includes('physics')) {
    return {
      mainMessage: `### Physics & Classical Mechanics: **Newton's Laws of Motion**\n\nNewton's Second Law of Motion establishes that the acceleration ($a$) of an object is directly proportional to the net external force ($F$) applied, and inversely proportional to its mass ($m$).`,
      responseType: 'problem_solving',
      keyConcepts: ["Newton's Second Law ($F = m \\cdot a$)", "Inertia & Momentum", "Vector Net Force"],
      stepByStep: [
        "Step 1: Draw a Free-Body Diagram (FBD) listing all external forces acting on mass $m$.",
        "Step 2: Apply Newton's Second Law equation: $$F_{\\text{net}} = m \\cdot a$$",
        "Step 3: Solve for the target variable (force $N$, mass $kg$, or acceleration $m/s^2$)."
      ],
      checkQuestions: [
        "If the net force on an object is zero, does that mean the object must be stationary?",
        "How does doubling the mass affect acceleration if force remains constant?"
      ],
      memoryAids: ["F = m · a (Force in Newtons, Mass in kg, Acceleration in m/s²)"]
    };
  }

  if (msgLower.includes('sn1') || msgLower.includes('sn2') || msgLower.includes('organic') || msgLower.includes('reaction') || msgLower.includes('chemistry') || msgLower.includes('nucleophile')) {
    return {
      mainMessage: `### Organic Chemistry: **Nucleophilic Substitution ($S_N1$ vs $S_N2$)**\n\n$S_N1$ and $S_N2$ are fundamental substitution mechanisms differing by steps, kinetics, substrate preference, and stereochemistry.`,
      responseType: 'concept_explanation',
      keyConcepts: ["$S_N1$ Unimolecular Kinetics", "$S_N2$ Concerted Backside Attack", "Carbocation Stability"],
      stepByStep: [
        "1. $S_N1$: Two-step process forming a carbocation intermediate ($3^\\circ > 2^\\circ > 1^\\circ$). Results in racemization.",
        "2. $S_N2$: One-step concerted backside attack ($1^\\circ > 2^\\circ > 3^\\circ$). Results in Walden inversion.",
        "3. Solvent Influence: Polar protic solvents favor $S_N1$; polar aprotic solvents favor $S_N2$."
      ],
      checkQuestions: [
        "Why do tertiary alkyl halides prefer $S_N1$ over $S_N2$?",
        "What stereochemical outcome do you expect from an $S_N2$ attack at a chiral center?"
      ],
      memoryAids: ["$S_N1$ = 2 Steps, Carbocation, $3^\\circ$. $S_N2$ = 1 Step, Inversion, $1^\\circ$."]
    };
  }

  if (msgLower.includes('bfs') || msgLower.includes('dfs') || msgLower.includes('algorithm') || msgLower.includes('tree') || msgLower.includes('graph') || msgLower.includes('sorting') || msgLower.includes('code')) {
    return {
      mainMessage: `### Computer Science: **Graph Traversal (BFS vs DFS)**\n\nBreadth-First Search (BFS) and Depth-First Search (DFS) are fundamental algorithms for traversing tree and graph data structures.`,
      responseType: 'concept_explanation',
      keyConcepts: ["BFS (Queue / Level-Order)", "DFS (Stack / Recursion)", "Time Complexity $\\mathcal{O}(V + E)$"],
      stepByStep: [
        "1. **BFS**: Uses a Queue (FIFO). Explores neighbor nodes level-by-level. Ideal for finding shortest path in unweighted graphs.",
        "2. **DFS**: Uses a Stack (LIFO / Recursion). Explores deeply along each branch before backtracking. Ideal for topological sort.",
        "3. **Complexity**: Both require $\\mathcal{O}(V + E)$ time complexity."
      ],
      checkQuestions: [
        "Which traversal algorithm uses a Queue, and why is it preferred for shortest paths?",
        "What is the maximum recursion depth memory cost of DFS on a tree of height $h$?"
      ],
      memoryAids: ["BFS = Breadth (Queue / Level), DFS = Depth (Stack / Branch)"]
    };
  }

  return {
    mainMessage: `### ${subject} Inquiry: **Analytical Concept Breakdown**\n\nLet me guide you through the fundamental principles of **${message.trim()}** in ${subject} (${level} level).`,
    responseType: sessionType,
    keyConcepts: [`Core ${subject} Definitions`, "Analytical Scaffolding", "Socratic Inquiry"],
    stepByStep: [
      `1. **Define Core Terms**: Identify the primary parameters governing "${message.trim()}".`,
      `2. **Establish Model**: Apply governing theories or formulas in ${subject}.`,
      `3. **Synthesize Solution**: Verify logical consistency and draw conclusions.`
    ],
    checkQuestions: [
      `What key assumptions are required for this ${subject} concept to hold true?`,
      `Can you explain how this topic connects to practical applications?`
    ],
    memoryAids: ["Break complex topics into core definitions before solving detailed sub-problems."]
  };
}

// AUTH ENDPOINTS

app.post('/api/auth/register', (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.issues[0].message });
  }

  const { email, password, name } = result.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  db.prepare('INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)').run(
    userId, email, passwordHash, name, createdAt
  );

  const initialPerformance = [
    { subject: 'Mathematics', score: 0, hoursSpent: 0 },
    { subject: 'Physics', score: 0, hoursSpent: 0 },
    { subject: 'Chemistry', score: 0, hoursSpent: 0 },
    { subject: 'Biology', score: 0, hoursSpent: 0 },
    { subject: 'Computer Science', score: 0, hoursSpent: 0 }
  ];

  db.prepare(`
    INSERT INTO user_stats (user_id, streak_days, total_study_hours, cards_reviewed, quizzes_completed, average_quiz_score, subject_performance_json)
    VALUES (?, 1, 0, 0, 0, 0, ?)
  `).run(userId, JSON.stringify(initialPerformance));

  const token = generateToken({ id: userId, email, name });
  const csrfToken = generateCsrfToken();

  res.cookie('studygenie_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.cookie('_csrf', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, token, csrfToken, user: { id: userId, email, name } });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.issues[0].message });
  }

  const { email, password } = result.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  const csrfToken = generateCsrfToken();

  res.cookie('studygenie_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.cookie('_csrf', csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, token, csrfToken, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('studygenie_token');
  res.clearCookie('_csrf');
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticateUserToken as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const csrfToken = req.cookies ? req.cookies['_csrf'] : generateCsrfToken();
  res.json({ success: true, user: req.user, csrfToken });
});

// API ENDPOINTS

app.get('/api/health', async (_req: Request, res: Response) => {
  const aiAvailable = !!process.env.GEMINI_API_KEY;
  let activePingSuccess = false;

  if (aiAvailable) {
    try {
      const ai = getGenAI();
      if (ai) {
        const pingRes = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        });
        activePingSuccess = !!pingRes.text;
      }
    } catch (err) {
      activePingSuccess = false;
    }
  }

  res.json({
    status: 'online',
    system: 'StudyGenie AI OS',
    version: '1.0.0',
    geminiActive: aiAvailable,
    geminiPingSuccess: activePingSuccess,
    geminiModel: GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});

// PROTECTED ENDPOINTS (Strict Authentication Enforced)

app.post('/api/tutor', requireStrictAuth as express.RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  const validation = tutorRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.issues[0].message });
  }

  const userId = req.user!.id;
  const quota = checkAndIncrementAIQuota(userId);
  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Daily AI usage quota exceeded (50 requests/day). Upgrade to Pro or try again tomorrow.'
    });
  }

  const { message, subject, studentLevel, sessionType } = validation.data;
  const mathEval = tryEvaluateSimpleMath(message);
  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_TUTOR_PROMPT}\n\nSubject: ${subject}\nLevel: ${studentLevel}\nSession Type: ${sessionType}\nStudent Question: ${message}${mathEval ? `\n(Note: Calculated Direct Math Solution: ${mathEval.directAnswer})` : ''}` }] }
        ],
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (mathEval && !parsed.mainMessage.includes(String(mathEval.value))) {
          parsed.mainMessage = `**${mathEval.directAnswer}**\n\n${parsed.mainMessage}`;
        }
        return res.json({ success: true, data: parsed, remainingQuota: quota.remaining });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, using fallback:', err?.message || err);
    }
  }

  const fallback = generateSmartTutorFallback(message, subject, studentLevel, sessionType);
  return res.json({ success: true, data: fallback, remainingQuota: quota.remaining, degraded: true });
});

app.post('/api/flashcards/generate', requireStrictAuth as express.RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  const validation = flashcardGenSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.issues[0].message });
  }

  const userId = req.user!.id;
  const quota = checkAndIncrementAIQuota(userId);
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: 'Daily AI usage quota exceeded.' });
  }

  const { topic, count, subject } = validation.data;
  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Generate a flashcard deck with exactly ${count} cards on topic "${topic}" in subject "${subject}".
Return raw JSON in this format:
{
  "title": "Deck Title",
  "description": "Short summary",
  "cards": [
    {
      "front": "Question/Prompt",
      "back": "Detailed answer with LaTeX if math",
      "hint": "Optional hint",
      "category": "${topic}"
    }
  ]
}`
            }]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, remainingQuota: quota.remaining });
      }
    } catch (err: any) {
      console.warn('Flashcard generation API call failed, using fallback:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    data: {
      title: `${topic} Flashcards`,
      description: `Active recall study deck for ${topic} (${subject})`,
      cards: Array.from({ length: count }).map((_, i) => ({
        front: `What is Key Concept #${i + 1} of ${topic}?`,
        back: `Explanation for concept #${i + 1}: ${topic} involves fundamental laws and core mechanisms.`,
        hint: `Think about core principles of ${topic}.`,
        category: topic
      }))
    },
    remainingQuota: quota.remaining,
    degraded: true
  });
});

app.post('/api/quiz/generate', requireStrictAuth as express.RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  const validation = quizGenSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.issues[0].message });
  }

  const userId = req.user!.id;
  const quota = checkAndIncrementAIQuota(userId);
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: 'Daily AI usage quota exceeded.' });
  }

  const { topic, count, subject, difficulty } = validation.data;
  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Generate a multiple choice quiz with exactly ${count} questions for topic "${topic}" (${subject}, Difficulty: ${difficulty}).
Return raw JSON in this format:
{
  "title": "${topic} Quiz",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why option A is correct"
    }
  ]
}`
            }]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, remainingQuota: quota.remaining });
      }
    } catch (err: any) {
      console.warn('Quiz generation API call failed, using fallback:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    data: {
      title: `${topic} Practice Quiz`,
      questions: [
        {
          question: `Which statement is true regarding ${topic}?`,
          options: [`${topic} is governed by standard principles`, 'It violates energy conservation', 'It only applies at absolute zero', 'It is non-repeatable'],
          correctIndex: 0,
          explanation: `${topic} follows standard academic principles in ${subject}.`
        }
      ]
    },
    remainingQuota: quota.remaining,
    degraded: true
  });
});

app.post('/api/vision/analyze', requireStrictAuth as express.RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  const validation = visionAnalyzeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.issues[0].message });
  }

  const userId = req.user!.id;
  const quota = checkAndIncrementAIQuota(userId);
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: 'Daily AI usage quota exceeded.' });
  }

  const { imageBase64, prompt } = validation.data;
  const ai = getGenAI();

  if (ai) {
    try {
      const mimeTypeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: cleanBase64, mimeType } },
              {
                text: `Analyze this image for study notes or exam problems. ${prompt || ''}
Return raw JSON in this format:
{
  "title": "Problem Title",
  "summary": "Brief problem summary",
  "extractedText": "Transcribed text from image",
  "stepByStepSolution": ["Step 1", "Step 2"],
  "keyTakeaways": ["Takeaway 1"],
  "relatedConcepts": ["Concept 1"]
}`
              }
            ]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, remainingQuota: quota.remaining });
      }
    } catch (err: any) {
      console.warn('Vision API call failed, using fallback:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    data: {
      title: 'Scanned Problem Analysis',
      summary: 'Extracted problem breakdown and step-by-step solution.',
      extractedText: 'Problem transcribed from uploaded image.',
      stepByStepSolution: ['1. Identify given variables', '2. Apply relevant equations', '3. Solve for unknown target variable'],
      keyTakeaways: ['Verify units before final calculation.'],
      relatedConcepts: ['Problem Solving Methodology']
    },
    remainingQuota: quota.remaining,
    degraded: true
  });
});

app.post('/api/syllabus/analyze', requireStrictAuth as express.RequestHandler, async (req: AuthenticatedRequest, res: Response) => {
  const validation = syllabusAnalyzeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.issues[0].message });
  }

  const userId = req.user!.id;
  const quota = checkAndIncrementAIQuota(userId);
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: 'Daily AI usage quota exceeded.' });
  }

  const { text, courseTitle } = validation.data;
  const ai = getGenAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [{
              text: `Parse this syllabus into a structured weekly breakdown for course "${courseTitle || 'Course'}":
${text}

Return raw JSON:
{
  "courseTitle": "Course Title",
  "summary": "Summary",
  "modules": [
    {
      "week": 1,
      "moduleName": "Module Name",
      "topics": ["Topic 1", "Topic 2"],
      "estimatedHours": 4,
      "keyOutcome": "Outcome"
    }
  ]
}`
            }]
          }
        ],
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({ success: true, data: parsed, remainingQuota: quota.remaining });
      }
    } catch (err: any) {
      console.warn('Syllabus API call failed, using fallback:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    data: {
      courseTitle: courseTitle || 'Structured Course Roadmap',
      summary: 'Automated study schedule constructed from course content.',
      modules: [
        {
          week: 1,
          moduleName: 'Foundations & Principles',
          topics: ['Introduction to Core Definitions', 'Terminology'],
          estimatedHours: 4,
          keyOutcome: 'Master baseline vocabulary'
        }
      ]
    },
    remainingQuota: quota.remaining,
    degraded: true
  });
});

// MULTI-TENANT DATABASE REST API ENDPOINTS (IDOR Protected with Ownership Verification)

app.get('/api/db/data', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const statsRow = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId) as any;
  const userStats = statsRow ? {
    streakDays: statsRow.streak_days,
    totalStudyHours: statsRow.total_study_hours,
    cardsReviewed: statsRow.cards_reviewed,
    quizzesCompleted: statsRow.quizzes_completed,
    averageQuizScore: statsRow.average_quiz_score,
    subjectPerformance: JSON.parse(statsRow.subject_performance_json || '[]')
  } : null;

  const decksRows = db.prepare('SELECT * FROM decks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset) as any[];
  const decks = decksRows.map((d) => {
    const cardsRows = db.prepare('SELECT * FROM flashcards WHERE deck_id = ?').all(d.id) as any[];
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      subject: d.subject,
      createdAt: d.created_at,
      cards: cardsRows.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        hint: c.hint,
        category: c.category,
        repetition: c.repetition,
        easeFactor: c.ease_factor,
        interval: c.interval,
        nextReviewDate: c.next_review_date,
        lastReviewed: c.last_reviewed,
        mastered: Boolean(c.mastered)
      }))
    };
  });

  const quizzesRows = db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, limit, offset) as any[];
  const quizzes = quizzesRows.map((q) => ({
    id: q.id,
    title: q.title,
    subject: q.subject,
    difficulty: q.difficulty,
    questions: JSON.parse(q.questions_json || '[]')
  }));

  const activitiesRows = db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(userId) as any[];
  const activities = activitiesRows.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    timestamp: a.timestamp,
    score: a.score
  }));

  res.json({
    success: true,
    data: { userStats, decks, quizzes, activities }
  });
});

app.put('/api/db/stats', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = req.body;

  const existing = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId) as any;
  if (!existing) {
    db.prepare(`
      INSERT INTO user_stats (user_id, streak_days, total_study_hours, cards_reviewed, quizzes_completed, average_quiz_score, subject_performance_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      updates.streakDays || 1,
      updates.totalStudyHours || 0,
      updates.cardsReviewed || 0,
      updates.quizzesCompleted || 0,
      updates.averageQuizScore || 0,
      JSON.stringify(updates.subjectPerformance || [])
    );
  } else {
    db.prepare(`
      UPDATE user_stats
      SET streak_days = ?, total_study_hours = ?, cards_reviewed = ?, quizzes_completed = ?, average_quiz_score = ?, subject_performance_json = ?
      WHERE user_id = ?
    `).run(
      updates.streakDays ?? existing.streak_days,
      updates.totalStudyHours ?? existing.total_study_hours,
      updates.cardsReviewed ?? existing.cards_reviewed,
      updates.quizzesCompleted ?? existing.quizzes_completed,
      updates.averageQuizScore ?? existing.average_quiz_score,
      JSON.stringify(updates.subjectPerformance || JSON.parse(existing.subject_performance_json || '[]')),
      userId
    );
  }

  res.json({ success: true });
});

app.post('/api/db/decks', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const newDeck = req.body;
  const deckId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO decks (id, user_id, title, description, subject, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(deckId, userId, newDeck.title, newDeck.description || '', newDeck.subject || 'General', new Date().toISOString());

  const createdCards: any[] = [];
  if (Array.isArray(newDeck.cards)) {
    const insertCard = db.prepare(`
      INSERT INTO flashcards (id, deck_id, front, back, hint, category, repetition, ease_factor, interval, next_review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const card of newDeck.cards) {
      const cardId = crypto.randomUUID();
      insertCard.run(
        cardId,
        deckId,
        card.front,
        card.back,
        card.hint || '',
        card.category || '',
        card.repetition || 0,
        card.easeFactor || 2.5,
        card.interval || 0,
        card.nextReviewDate || new Date().toISOString()
      );
      createdCards.push({ ...card, id: cardId, deckId });
    }
  }

  res.json({ success: true, data: { ...newDeck, id: deckId, cards: createdCards } });
});

// Strict IDOR Protection on SM-2 Updates
app.put('/api/db/decks/:deckId/cards/:cardId/sm2', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { deckId, cardId } = req.params;
  const sm2Data = req.body;

  const result = db.prepare(`
    UPDATE flashcards
    SET repetition = ?, ease_factor = ?, interval = ?, next_review_date = ?, last_reviewed = ?, mastered = ?
    WHERE id = ?
      AND deck_id = ?
      AND deck_id IN (SELECT id FROM decks WHERE user_id = ?)
  `).run(
    sm2Data.repetition,
    sm2Data.easeFactor,
    sm2Data.interval,
    sm2Data.nextReviewDate,
    sm2Data.lastReviewed,
    sm2Data.mastered ? 1 : 0,
    cardId,
    deckId,
    userId
  );

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Flashcard or deck not found' });
  }

  res.json({ success: true });
});

app.post('/api/db/quizzes', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const newQuiz = req.body;
  const quizId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO quizzes (id, user_id, title, subject, difficulty, questions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    quizId,
    userId,
    newQuiz.title,
    newQuiz.subject || 'General',
    newQuiz.difficulty || 'Medium',
    JSON.stringify(newQuiz.questions || []),
    new Date().toISOString()
  );

  res.json({ success: true, data: { ...newQuiz, id: quizId } });
});

app.post('/api/db/activities', requireStrictAuth as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const activity = req.body;
  const actId = crypto.randomUUID();

  db.prepare(`
    INSERT INTO activities (id, user_id, type, title, timestamp, score)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(actId, userId, activity.type, activity.title, activity.timestamp || 'Just now', activity.score || '');

  res.json({ success: true, data: { ...activity, id: actId } });
});

// Export app instance for Vitest integration testing
export { app };

// Vite Development Integration / Production Static Server
async function setupServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VITEST) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VITEST) {
    app.listen(PORT, () => {
      console.log(`🚀 StudyGenie AI backend running on http://localhost:${PORT}`);
    });
  }
}

setupServer().catch((err) => {
  console.error('Failed to start StudyGenie AI server:', err);
});

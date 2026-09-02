import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'studygenie.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      streak_days INTEGER DEFAULT 1,
      total_study_hours REAL DEFAULT 0,
      cards_reviewed INTEGER DEFAULT 0,
      quizzes_completed INTEGER DEFAULT 0,
      average_quiz_score REAL DEFAULT 0,
      subject_performance_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      hint TEXT,
      category TEXT,
      repetition INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      next_review_date TEXT,
      last_reviewed TEXT,
      mastered INTEGER DEFAULT 0,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      score TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS response_cache (
      hash_key TEXT PRIMARY KEY,
      response_json TEXT NOT NULL,
      ttl_timestamp INTEGER,
      content_type TEXT DEFAULT 'exact'
    );

    CREATE TABLE IF NOT EXISTS query_embeddings (
      id TEXT PRIMARY KEY,
      query_text TEXT NOT NULL,
      embedding_json TEXT NOT NULL,
      stage TEXT NOT NULL,
      subject TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rag_chunks (
      id TEXT PRIMARY KEY,
      namespace TEXT NOT NULL,
      board TEXT NOT NULL,
      stage TEXT NOT NULL,
      subject TEXT NOT NULL,
      subtopic TEXT NOT NULL,
      chapter TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding_json TEXT NOT NULL,
      source_url TEXT,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classification_cache (
      hash_key TEXT PRIMARY KEY,
      classification_json TEXT NOT NULL,
      ttl_timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      subtopics_json TEXT NOT NULL
    );
  `);
}

// Atomic Check & Increment AI Quota (Max 50 AI requests/day per user)
export function checkAndIncrementAIQuota(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const maxQuota = 50;

  const runAtomicTransaction = db.transaction(() => {
    const row = db.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').get(userId, today) as { count: number } | undefined;
    const currentCount = row ? row.count : 0;

    if (currentCount >= maxQuota) {
      return { allowed: false, remaining: 0 };
    }

    if (row) {
      db.prepare('UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND date = ?').run(userId, today);
    } else {
      db.prepare('INSERT INTO ai_usage (user_id, date, count) VALUES (?, ?, 1)').run(userId, today);
    }

    return { allowed: true, remaining: maxQuota - (currentCount + 1) };
  });

  return runAtomicTransaction();
}

// Seed default demo user if DB is empty
export function seedDefaultUserIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existing && existing.cnt > 0) return;

  const demoUserId = 'user-demo-default';
  const defaultPasswordHash = '$2a$10$w/X5yW.eM3vQ1Z.Y8Z9x3.q2vQ1Z8Z9x3q2vQ1Z8Z9x3q2vQ1Z8Z9';
  
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(demoUserId, 'demo@studygenie.ai', defaultPasswordHash, 'Guest Scholar', new Date().toISOString());

  const initialStats = {
    streakDays: 12,
    totalStudyHours: 28.5,
    cardsReviewed: 142,
    quizzesCompleted: 18,
    averageQuizScore: 88,
    subjectPerformance: [
      { subject: 'Mathematics', score: 92, hoursSpent: 8.5 },
      { subject: 'Physics', score: 85, hoursSpent: 6.0 },
      { subject: 'Chemistry', score: 88, hoursSpent: 5.2 },
      { subject: 'Biology', score: 90, hoursSpent: 4.8 },
      { subject: 'Computer Science', score: 95, hoursSpent: 4.0 }
    ]
  };

  db.prepare(`
    INSERT INTO user_stats (user_id, streak_days, total_study_hours, cards_reviewed, quizzes_completed, average_quiz_score, subject_performance_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    initialStats.streakDays,
    initialStats.totalStudyHours,
    initialStats.cardsReviewed,
    initialStats.quizzesCompleted,
    initialStats.averageQuizScore,
    JSON.stringify(initialStats.subjectPerformance)
  );

  // Initial Deck
  const deckId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO decks (id, user_id, title, description, subject, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(deckId, demoUserId, 'Calculus Fundamentals & Limits', 'Core concepts of derivatives and limits.', 'Mathematics', '2026-07-28');

  db.prepare(`
    INSERT INTO flashcards (id, deck_id, front, back, hint, category, repetition, ease_factor, interval, next_review_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(), deckId,
    'What is the definition of a Limit in Calculus?',
    'The value that a function approaches as the input approaches some value. Denoted as $\\lim_{x \\to a} f(x) = L$.',
    'Approaching a point without touching it.',
    'Calculus', 1, 2.5, 1, new Date().toISOString()
  );

  // Initial Activity
  db.prepare(`
    INSERT INTO activities (id, user_id, type, title, timestamp, score)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), demoUserId, 'tutor', 'Completed Calculus Socratic Inquiry', 'Today at 10:30 AM', 'Mastered');
}

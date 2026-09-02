# 🎓 StudyGenie AI — Deep Technical & Architectural Documentation

> **Platform Tagline**: Learn Smarter, Not Harder (Created by KK)  
> **Version**: 1.0.0 (Production & Security Hardened)  
> **Core Architecture**: React 18 SPA + Node.js Express REST API + SQLite WAL Database + Google Gemini 2.5 Flash AI + KaTeX Math Engine

---

## 📋 Executive Overview

**StudyGenie AI** is a comprehensive, commercial-grade Socratic Study Operating System and STEM/Humanities productivity suite. It combines artificial intelligence, cognitive science, active recall, spaced repetition, and multimodal computer vision into a unified, secure platform for students.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      React 18 Frontend                      │
 │   (TypeScript + Vite + Tailwind CSS + KaTeX + Sonner)       │
 └──────────────────────────────┬──────────────────────────────┘
                                │ REST API (HttpOnly Cookie Auth + Anti-CSRF)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  Node.js + Express API Server               │
 │    (Helmet + Zod Validation + IP Limiter + Atomic Quota)    │
 └───────┬──────────────────────┬──────────────────────┬───────┘
         │                      │                      │
         ▼                      ▼                      ▼
 ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
 │ Google GenAI  │      │ SQLite DB     │      │ KaTeX Engine  │
 │ (Gemini 2.5)  │      │ (WAL Mode)    │      │ (Math Output) │
 └───────────────┘      └───────────────┘      └───────────────┘
```

---

## 🔒 Security & Hardening Architecture

1. **HttpOnly Cookie Authentication**:
   - JWT tokens are stored exclusively in server-set `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`studygenie_token`), preventing XSS token theft.
   - Anti-CSRF double-submit protection validates header `X-CSRF-Token` against session cookie `_csrf`.

2. **Strict Authentication & IDOR Prevention**:
   - All user data and AI generation endpoints enforce `requireStrictAuth` (`401 Unauthorized` for unauthenticated requests).
   - Database mutations check ownership via explicit SQL subqueries:
     ```sql
     UPDATE flashcards
     SET repetition = ?, ease_factor = ?, interval = ?
     WHERE id = ? AND deck_id = ? AND deck_id IN (SELECT id FROM decks WHERE user_id = ?)
     ```
   - Unmatched rows return `404 Not Found` to eliminate ID enumeration attacks.

3. **Fail-Fast Environment Security**:
   - Server fails fast on startup if `JWT_SECRET` is missing or fewer than 32 characters in length (`server/config.ts`).

4. **Atomic AI Quotas**:
   - Usage increments are wrapped in atomic SQLite transactions (`db.transaction()`), returning `remainingQuota` to the client.

5. **Security Headers & Input Hygiene**:
   - Integrates `helmet` security headers.
   - Replaced dynamic code evaluation (`new Function`) with a safe AST token arithmetic evaluator.

---

## 🗄️ Database Schema (SQLite)

The SQLite database file is located at `data/studygenie.db` (gitignored).

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 2. User Stats Table
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

-- 3. Flashcard Decks Table
CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Flashcards Table (SM-2 Spaced Repetition Data)
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

-- 5. Quizzes Table
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

-- 6. Recent Activities Log Table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  score TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. AI Quota Rate Limiting Table
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
```

---

## 🔌 API Endpoint Specification

| Method | Endpoint | Auth | Request Payload / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | ❌ Public | `{ email, password, name }` | Registers user & sets HttpOnly cookie |
| `POST` | `/api/auth/login` | ❌ Public | `{ email, password }` | Authenticates & sets HttpOnly cookie |
| `POST` | `/api/auth/logout` | ❌ Public | - | Clears session & CSRF cookies |
| `GET` | `/api/auth/me` | 🔒 Strict | - | Returns authenticated user session & CSRF token |
| `GET` | `/api/health` | ❌ Public | - | System status & active Gemini ping check |
| `POST` | `/api/tutor` | 🔒 Strict | `{ message, subject, studentLevel, sessionType }` | Socratic AI Tutor completion engine |
| `POST` | `/api/flashcards/generate` | 🔒 Strict | `{ topic, count, subject }` | Generates AI flashcard decks |
| `POST` | `/api/quiz/generate` | 🔒 Strict | `{ topic, count, subject, difficulty }` | Generates practice quizzes |
| `POST` | `/api/vision/analyze` | 🔒 Strict | `{ imageBase64, prompt }` | OCR & vision solution generator |
| `POST` | `/api/syllabus/analyze` | 🔒 Strict | `{ text, courseTitle }` | Converts syllabus into weekly roadmap |
| `GET` | `/api/db/data` | 🔒 Strict | `?limit=50&offset=0` | Paginated user database fetch |
| `PUT` | `/api/db/stats` | 🔒 Strict | `{ streakDays, totalStudyHours, ... }` | Updates user statistics |
| `POST` | `/api/db/decks` | 🔒 Strict | Flashcard deck object | Persists a new deck |
| `PUT` | `/api/db/decks/:deckId/cards/:cardId/sm2` | 🔒 Strict | `{ repetition, easeFactor, interval, ... }` | IDOR-checked SM-2 card update |
| `POST` | `/api/db/quizzes` | 🔒 Strict | Quiz object | Persists a generated quiz |
| `POST` | `/api/db/activities` | 🔒 Strict | Activity object | Appends activity log entry |

---

## 🧪 Testing & CI/CD

- **Unit & Integration Tests**: Run `npm test` to execute Vitest integration tests covering authentication, IDOR checks, and AI quota enforcement.
- **GitHub Actions CI**: Automated workflow defined in `.github/workflows/ci.yml` running linting, tests, and production build checks on every push.

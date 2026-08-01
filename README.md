# StudyGenie AI 🎓

An intelligent, commercial-production-grade educational assistant powered by **Google Gemini 3.6 Flash**. StudyGenie AI empowers students with Socratic AI tutoring, real-time formula evaluation, AI image analysis ("Snap & Solve"), automated syllabus planning, dynamic practice quiz generation, and live learning analytics.

---

## 🌟 Key Features

### 1. 💬 AI Tutor Chat
- **Socratic Method Learning**: Encourages deep understanding through guided questions, step-by-step breakdowns, and memory aids.
- **Instant Math & Calculation Engine**: Direct, exact answers for calculation and arithmetic questions provided right up front, followed by complete step-by-step derivations.
- **Multi-Subject Support**: Covers Mathematics, Physics, Chemistry, Computer Science, Biology, and History.

### 2. 🧪 Interactive Formula Lab
- **Live Evaluator**: Test prebuilt formulas across Physics (Kinetic Energy, Gravitational Potential), Mathematics (Compound Interest), and Chemistry.
- **Custom Formula Creation**: Define custom variables, units, and expressions with instant calculation.
- **Automatic Progress Sync**: Automatically records solved formulas and adds to total study hours in state and local storage.

### 3. 📸 Snap & Solve (Vision AI)
- **Image Problem Solver**: Upload textbook excerpts, handwritten equations, or diagrams.
- **Step-by-Step Breakdown**: Gemini Vision model extracts key text, analyzes the problem, and outputs step-by-step solutions with related concepts.

### 4. 📅 Syllabus Planner
- **Course Breakdown**: Paste any course syllabus or table of contents to generate an organized weekly study plan.
- **Module Estimation**: Automatically estimates weekly study hours, topics, and key learning outcomes.

### 5. 🎯 Practice Quiz Engine
- **AI-Generated Quizzes**: Custom practice quizzes generated on-demand based on subject, topic, and difficulty (Easy, Medium, Hard).
- **Interactive Scoring**: Instant feedback with detailed explanations, confetti celebrations on completion, and average score tracking.

### 6. 📊 Analytics & Profile Dashboard
- **Live Progress Tracking**: Monitors study streak days, total study hours, formulas solved, quizzes completed, and average quiz score.
- **Subject Mastery Bar**: Visual chart tracking score performance and time spent per subject.
- **Pomodoro Timer**: Header-integrated timer for focused study sessions with work and break intervals.

---

## ⚡ Deterministic Cross-Device RAG Engine

To eliminate response variance across different devices and user sessions, StudyGenie AI implements the best cross-device consistency techniques:

1. **Greedy Sampling (`temperature: 0.0`)**: Disables random LLM sampling, ensuring identical prompt tokens generate identical output tokens every time.
2. **Server-Side Exact Hash Response Cache**: Caches AI responses in memory using normalized query hashes. Identical questions across any device return the exact same answer instantly.
3. **Canonical Query Normalization**: Strips punctuation, lowers case, and collapses spaces so minor typing differences map to identical cache keys.
4. **Centralized RAG Knowledge Base**: Uses a server-hosted knowledge store so all devices retrieve identical reference context chunks.

---

## 🔐 Environment Variables (`.env`)

Create a `.env` file in the root directory of your project (you can copy `.env.example`).

```env
# 1. Google Gemini API Key (Required for live AI tutor, quiz generation, vision analysis, and syllabus planning)
# Obtain your free API key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Server Port (Default is 3000)
PORT=3000

# 3. Optional MongoDB Connection String (If persisting user profile data to MongoDB)
MONGODB_URI=mongodb://localhost:27017/studygenie
```

> **Note**: Even if `GEMINI_API_KEY` is not provided, the application will operate seamlessly using built-in intelligent fallback generators!

---

## 💻 Local Setup & Running in VS Code

Follow these step-by-step instructions to run StudyGenie AI locally on your computer using VS Code:

### Prerequisites
- **Node.js**: Version 18.x or higher installed ([Download Node.js](https://nodejs.org/))
- **npm**: Version 9.x or higher (comes with Node.js)
- **VS Code**: Recommended code editor ([Download VS Code](https://code.visualstudio.com/))

### Step 1: Open Project in VS Code
1. Open **VS Code**.
2. Click **File > Open Folder...** and select the `StudyGenie AI` project root folder.
3. Open the built-in terminal in VS Code: Press `Ctrl + ~` (or `Cmd + ~` on macOS) or navigate to **Terminal > New Terminal**.

### Step 2: Install Dependencies
In the terminal, run:
```bash
npm install
```

### Step 3: Configure Environment Variables
1. Copy `.env.example` to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in VS Code and paste your **Google Gemini API Key**:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key...
   PORT=3000
   ```

### Step 4: Start Development Server
Run the development server command:
```bash
npm run dev
```
- This launches the Express backend with Vite middleware on **`http://localhost:3000`**.
- Open your browser and navigate to **`http://localhost:3000`** to view the app live!

### Step 5: Building & Running in Production Mode
To compile and test the production build locally:
```bash
# 1. Build client static files & bundle Express server
npm run build

# 2. Start production server
npm start
```
The production server will serve the bundled client files from `dist/` at `http://localhost:3000`.

---

## 📁 Project Structure

```
StudyGenie-AI/
├── server.ts                   # Express server entry point & Gemini API endpoints
├── index.html                  # HTML entry point
├── metadata.json               # Applet metadata
├── package.json                # npm scripts & dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── .env.example                # Sample environment variables template
└── src/
    ├── App.tsx                 # Main application layout & global state persistence
    ├── main.tsx                # React root entry point
    ├── index.css               # Global Tailwind CSS styles
    ├── types.ts                # TypeScript interfaces & types
    ├── data/
    │   └── initialData.ts      # Default profile, quizzes, and initial activity data
    └── components/
        ├── Header.tsx          # Navigation header, Pomodoro timer & mobile menu
        ├── Dashboard.tsx       # Main user dashboard & quick stats
        ├── AITutor.tsx         # Socratic AI Tutor Chat interface
        ├── FormulaLab.tsx      # Formula evaluator & custom formula creator
        ├── SnapAndSolve.tsx    # Vision AI image analysis & step-by-step solver
        ├── SyllabusPlanner.tsx # Course syllabus parser & weekly study planner
        ├── QuizEngine.tsx      # Practice quiz runner & AI quiz generator
        ├── AnalyticsView.tsx   # Detailed performance metrics & subject charts
        ├── PomodoroTimer.tsx   # Pomodoro focus session clock
        └── UserProfileModal.tsx# Profile settings & onboarding modal
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Canvas Confetti
- **Backend**: Node.js, Express.js, `tsx` / `esbuild`
- **AI Engine**: `@google/genai` TypeScript SDK (powered by `gemini-3.6-flash`)
- **Build Tools**: Vite 5, PostCSS, Tailwind CSS v4

---

## 📄 License

Commercial Production Grade - Built for StudyGenie AI.

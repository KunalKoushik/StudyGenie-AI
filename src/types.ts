export type NavTab = 'dashboard' | 'tutor' | 'snap' | 'syllabus' | 'quiz' | 'analytics' | 'formula-lab';

export type Subject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Computer Science' | 'History' | 'General Science';

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export type SessionType = 'concept_explanation' | 'problem_solving' | 'homework_help' | 'exam_prep';

export interface UserProfile {
  name: string;
  email?: string;
  targetExam: string;
  gradeLevel: string;
  focusSubject: Subject;
  dailyGoalHours: number;
  avatarUrl?: string;
  onboarded: boolean;
}

export interface CustomFormulaVariable {
  name: string;
  label: string;
  value: number;
  unit?: string;
}

export interface CustomFormula {
  id: string;
  title: string;
  expression: string;
  category: string;
  variables: CustomFormulaVariable[];
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: Subject;
  structuredData?: {
    mainMessage: string;
    responseType?: string;
    keyConcepts?: string[];
    stepByStep?: string[];
    checkQuestions?: string[];
    memoryAids?: string[];
    encouragement?: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  questions: QuizQuestion[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SyllabusModule {
  week: number;
  moduleName: string;
  topics: string[];
  estimatedHours: number;
  keyOutcome: string;
  completed?: boolean;
}

export interface SnapAnalysisResult {
  title: string;
  summary: string;
  extractedText: string;
  stepByStepSolution: string[];
  keyTakeaways: string[];
  relatedConcepts: string[];
}

export interface UserStats {
  streakDays: number;
  totalStudyHours: number;
  formulasSolved: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  subjectPerformance: {
    subject: Subject;
    score: number;
    hoursSpent: number;
  }[];
}

export interface RecentActivity {
  id: string;
  type: 'formula' | 'quiz' | 'tutor' | 'snap' | 'syllabus';
  title: string;
  timestamp: string;
  score?: string;
}

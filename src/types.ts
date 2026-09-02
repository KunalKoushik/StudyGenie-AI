export type NavTab = 'dashboard' | 'tutor' | 'snap' | 'syllabus' | 'quiz' | 'analytics' | 'formula-lab';

export type Subject = 
  | 'Mathematics' 
  | 'Physics' 
  | 'Chemistry' 
  | 'Biology' 
  | 'Computer Science' 
  | 'History' 
  | 'General Science'
  | 'Indian Polity & Governance'
  | 'Indian Economy'
  | 'Environment & Ecology'
  | 'Ethics & Aptitude (GS IV)'
  | 'Current Affairs'
  | string;

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export type EducationStage =
  | 'nursery' | 'lkg' | 'ukg'
  | 'primary_1' | 'primary_2' | 'primary_3' | 'primary_4' | 'primary_5'
  | 'middle_6' | 'middle_7' | 'middle_8'
  | 'secondary_9' | 'secondary_10'
  | 'senior_secondary_11' | 'senior_secondary_12'
  | 'undergraduate_y1' | 'undergraduate_y2' | 'undergraduate_y3' | 'undergraduate_y4'
  | 'competitive_exam';

export type Board = 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'Cambridge' | 'University' | 'N/A';

export type CompetitiveExam = 'UPSC_CSE' | 'JEE' | 'NEET' | 'SSC' | 'Banking' | 'GATE' | 'CAT' | 'None' | string;

export interface EducationContext {
  stage: EducationStage;
  board?: Board;
  exam?: CompetitiveExam;
  stream?: 'Science' | 'Commerce' | 'Arts' | 'Engineering' | 'Medicine' | 'Law' | 'General';
}

export type QueryIntent =
  | 'concept_explanation'
  | 'problem_solving'
  | 'homework_help'
  | 'exam_prep'
  | 'definition'
  | 'comparison'
  | 'current_affairs'
  | 'essay_feedback'
  | 'quiz_me'
  | 'greeting'
  | 'small_talk';

export interface QueryClassification {
  subject: string;
  subtopic?: string;
  detectedStage?: EducationStage;
  intent: QueryIntent;
  language: string;
  requiresRetrieval: boolean;
  confidence: number;
}

export interface RAGSource {
  title: string;
  reference: string;
  sourceUrl?: string;
  lastUpdated?: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  targetExam: string;
  gradeLevel: string;
  focusSubject: string;
  educationContext?: EducationContext;
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
  subject?: string;
  educationContext?: EducationContext;
  structuredData?: {
    mainMessage: string;
    responseType?: string;
    keyConcepts?: string[];
    stepByStep?: string[];
    checkQuestions?: string[];
    memoryAids?: string[];
    encouragement?: string;
    sources?: RAGSource[];
    grounded?: boolean;
    cached?: boolean;
    cacheType?: 'exact' | 'semantic' | null;
    classification?: QueryClassification;
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
  subject: string;
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
    subject: string;
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

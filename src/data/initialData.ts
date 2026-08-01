import { Quiz, UserStats, RecentActivity, UserProfile, CustomFormula } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Kunal Koushik',
  email: 'kunalkoushik44@gmail.com',
  targetExam: 'JEE / Competitive Engineering Exams',
  gradeLevel: 'College Prep / Undergrad',
  focusSubject: 'Mathematics',
  dailyGoalHours: 4,
  onboarded: true
};

export const INITIAL_USER_STATS: UserStats = {
  streakDays: 12,
  totalStudyHours: 28.5,
  formulasSolved: 142,
  quizzesCompleted: 18,
  averageQuizScore: 88,
  subjectPerformance: [
    { subject: 'Mathematics', score: 92, hoursSpent: 8.5 },
    { subject: 'Physics', score: 85, hoursSpent: 6.0 },
    { subject: 'Chemistry', score: 88, hoursSpent: 5.2 },
    { subject: 'Biology', score: 90, hoursSpent: 4.8 },
    { subject: 'Computer Science', score: 95, hoursSpent: 4.0 },
  ]
};

export const INITIAL_CUSTOM_FORMULAS: CustomFormula[] = [
  {
    id: 'form-1',
    title: 'Kinetic Energy',
    expression: '0.5 * m * v^2',
    category: 'Physics',
    variables: [
      { name: 'm', label: 'Mass', value: 10, unit: 'kg' },
      { name: 'v', label: 'Velocity', value: 5, unit: 'm/s' }
    ]
  },
  {
    id: 'form-2',
    title: 'Compound Interest',
    expression: 'P * (1 + r / n)^(n * t)',
    category: 'Mathematics',
    variables: [
      { name: 'P', label: 'Principal', value: 1000, unit: '$' },
      { name: 'r', label: 'Annual Rate (decimal)', value: 0.05, unit: '%' },
      { name: 'n', label: 'Compounds per Year', value: 12, unit: 'times/yr' },
      { name: 't', label: 'Time in Years', value: 3, unit: 'years' }
    ]
  },
  {
    id: 'form-3',
    title: 'Gravitational Potential Energy',
    expression: 'm * g * h',
    category: 'Physics',
    variables: [
      { name: 'm', label: 'Mass', value: 5, unit: 'kg' },
      { name: 'g', label: 'Gravity', value: 9.8, unit: 'm/s²' },
      { name: 'h', label: 'Height', value: 10, unit: 'm' }
    ]
  }
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Calculus & Derivatives Challenge',
    subject: 'Mathematics',
    difficulty: 'Medium',
    questions: [
      {
        id: 'q1',
        question: 'What is the derivative of f(x) = sin(x) + x³?',
        options: [
          'cos(x) + 3x²',
          '-cos(x) + 3x²',
          'cos(x) + x²',
          '-sin(x) + 3x'
        ],
        correctIndex: 0,
        explanation: 'd/dx[sin(x)] = cos(x) and by the power rule d/dx[x³] = 3x².'
      },
      {
        id: 'q2',
        question: 'Evaluate lim (x→0) sin(x)/x.',
        options: ['0', '1', 'Undefined', 'Infinity'],
        correctIndex: 1,
        explanation: 'This is a fundamental trigonometric limit equal to 1, or verifiable via L\'Hôpital\'s Rule.'
      },
      {
        id: 'q3',
        question: 'What is the derivative of e^(2x)?',
        options: ['e^(2x)', '2e^(2x)', '2x e^(2x)', 'e^x'],
        correctIndex: 1,
        explanation: 'By the chain rule: d/dx[e^(u)] = e^(u) · u\'. Here u = 2x, so u\' = 2.'
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'Physics Mechanics Mastery',
    subject: 'Physics',
    difficulty: 'Medium',
    questions: [
      {
        id: 'pq1',
        question: 'A 5 kg object is accelerated at 4 m/s². What is the net force acting on it?',
        options: ['20 N', '1.25 N', '9 N', '25 N'],
        correctIndex: 0,
        explanation: 'Using Newton\'s second law F = m · a: 5 kg × 4 m/s² = 20 N.'
      },
      {
        id: 'pq2',
        question: 'What is the kinetic energy of a 2 kg mass moving at 3 m/s?',
        options: ['6 J', '9 J', '18 J', '3 J'],
        correctIndex: 1,
        explanation: 'KE = 1/2 · m · v² = 1/2 · 2 · (3)² = 9 Joules.'
      }
    ]
  }
];

export const INITIAL_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'formula',
    title: 'Evaluated Kinetic Energy Custom Formula',
    timestamp: '20 mins ago',
    score: '125.00 J'
  },
  {
    id: 'act-2',
    type: 'quiz',
    title: 'Completed Physics Mechanics Quiz',
    timestamp: '2 hours ago',
    score: '100% Score'
  },
  {
    id: 'act-3',
    type: 'tutor',
    title: 'Asked AI Tutor about L\'Hôpital\'s Rule',
    timestamp: 'Yesterday',
    score: 'Concept Mastered'
  },
  {
    id: 'act-4',
    type: 'snap',
    title: 'Scanned Organic Chemistry Textbook Diagram',
    timestamp: '2 days ago'
  }
];

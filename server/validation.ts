import { z } from 'zod';

export const tutorRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  subject: z.string().default('Mathematics'),
  studentLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  sessionType: z.enum(['concept_explanation', 'problem_solving', 'homework_help', 'exam_prep']).default('concept_explanation')
});

export const flashcardGenSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty').max(500),
  count: z.number().int().min(1).max(20).default(5),
  subject: z.string().default('Mathematics')
});

export const quizGenSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty').max(500),
  count: z.number().int().min(1).max(15).default(5),
  subject: z.string().default('Mathematics'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium')
});

export const visionAnalyzeSchema = z.object({
  imageBase64: z.string().min(10, 'Invalid image data'),
  prompt: z.string().optional()
});

export const syllabusAnalyzeSchema = z.object({
  text: z.string().min(10, 'Syllabus text must be at least 10 characters').max(20000),
  courseTitle: z.string().optional()
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

import React, { useState } from 'react';
import { Quiz, QuizQuestion, Subject } from '../types';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizEngineProps {
  quizzes: Quiz[];
  onAddQuiz: (quiz: Quiz) => void;
  onRecordQuizCompleted?: (scorePercent: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ quizzes, onAddQuiz, onRecordQuizCompleted }) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(quizzes[0]?.id || null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genSubject, setGenSubject] = useState<Subject>('Mathematics');
  const [genDifficulty, setGenDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [genCount, setGenCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
  const currentQuestion: QuizQuestion | undefined = selectedQuiz?.questions[activeQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (userAnswers[activeQuestionIndex] !== undefined) return; // already answered
    setSelectedOption(idx);
    const newAnswers = { ...userAnswers, [activeQuestionIndex]: idx };
    setUserAnswers(newAnswers);

    // If last question answered
    if (selectedQuiz && Object.keys(newAnswers).length === selectedQuiz.questions.length) {
      setIsSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      let correct = 0;
      selectedQuiz.questions.forEach((q, qIdx) => {
        const userAns = newAnswers[qIdx];
        if (userAns === q.correctIndex) correct++;
      });
      const pct = Math.round((correct / selectedQuiz.questions.length) * 100);
      onRecordQuizCompleted?.(pct);
    }
  };

  const handleNext = () => {
    if (!selectedQuiz) return;
    if (activeQuestionIndex < selectedQuiz.questions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
      setSelectedOption(userAnswers[activeQuestionIndex + 1] ?? null);
    }
  };

  const handleResetQuiz = () => {
    setActiveQuestionIndex(0);
    setUserAnswers({});
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  const calculateScore = () => {
    if (!selectedQuiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    selectedQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: selectedQuiz.questions.length,
      percentage: Math.round((correct / selectedQuiz.questions.length) * 100)
    };
  };

  const handleGenerateQuiz = async () => {
    if (!genTopic.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genTopic,
          count: genCount,
          subject: genSubject,
          difficulty: genDifficulty
        })
      });

      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.questions)) {
        const newQuiz: Quiz = {
          id: `quiz-${Date.now()}`,
          title: json.data.title || `${genTopic} AI Quiz`,
          subject: genSubject,
          difficulty: genDifficulty,
          questions: json.data.questions
        };

        onAddQuiz(newQuiz);
        setSelectedQuizId(newQuiz.id);
        handleResetQuiz();
        setIsGeneratorOpen(false);
        setGenTopic('');
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const scoreStats = calculateScore();

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Quiz Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            <span>Practice Quiz Engine</span>
          </h1>
          <p className="text-xs text-slate-400">Test your mastery with AI-generated multiple choice quizzes and explanations</p>
        </div>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Generate AI Quiz</span>
        </button>
      </div>

      {/* Quiz Selector */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {quizzes.map((quiz) => {
          const isSelected = selectedQuizId === quiz.id;
          return (
            <button
              key={quiz.id}
              onClick={() => {
                setSelectedQuizId(quiz.id);
                handleResetQuiz();
              }}
              className={`px-4 py-3 rounded-2xl border text-left transition-all shrink-0 min-w-[220px] ${
                isSelected
                  ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="text-emerald-400">{quiz.subject}</span>
                <span className="text-amber-400">{quiz.difficulty}</span>
              </div>
              <h3 className="text-sm font-bold truncate">{quiz.title}</h3>
            </button>
          );
        })}
      </div>

      {/* Active Quiz Card */}
      {selectedQuiz && currentQuestion ? (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header Stats */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                {selectedQuiz.subject} • Question {activeQuestionIndex + 1} of {selectedQuiz.questions.length}
              </span>
              <h2 className="text-base font-bold text-white">{selectedQuiz.title}</h2>
            </div>

            <button
              onClick={handleResetQuiz}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Restart Quiz</span>
            </button>
          </div>

          {/* Question Text */}
          <p className="text-lg font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </p>

          {/* Multiple Choice Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const answeredIndex = userAnswers[activeQuestionIndex];
              const isAnswered = answeredIndex !== undefined;
              const isSelectedOption = answeredIndex === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;

              let style = 'bg-slate-900/60 border-slate-700/80 text-slate-200 hover:border-emerald-500/50';

              if (isAnswered) {
                if (isCorrectOption) {
                  style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelectedOption && !isCorrectOption) {
                  style = 'bg-red-500/20 border-red-500 text-red-200';
                } else {
                  style = 'bg-slate-900/40 border-slate-800 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between text-sm ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isAnswered && isSelectedOption && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation Card (shows after answer) */}
          {userAnswers[activeQuestionIndex] !== undefined && (
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 space-y-2 animate-fadeIn">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Explanation:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Navigation Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Answered: {Object.keys(userAnswers).length}/{selectedQuiz.questions.length}
            </span>

            {activeQuestionIndex < selectedQuiz.questions.length - 1 && (
              <button
                onClick={handleNext}
                disabled={userAnswers[activeQuestionIndex] === undefined}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Final Score Card on completion */}
          {isSubmitted && (
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
              <Award className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-extrabold text-white">Quiz Complete!</h3>
              <p className="text-sm text-slate-300">
                You scored <span className="text-emerald-400 font-bold text-lg">{scoreStats.correct} / {scoreStats.total}</span> ({scoreStats.percentage}%)
              </p>
              <button
                onClick={handleResetQuiz}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Retake Quiz
              </button>
            </div>
          )}

        </div>
      ) : null}

      {/* AI Quiz Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Generate Practice Quiz</span>
              </h2>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Quiz Topic
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Electric Fields & Potential"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                  <select
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value as Subject)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateQuiz}
                disabled={!genTopic.trim() || isGenerating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
              >
                {isGenerating ? (
                  <span>Generating Quiz...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

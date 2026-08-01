import React from 'react';
import { NavTab, UserStats, RecentActivity, UserProfile } from '../types';
import { 
  Flame, 
  Clock, 
  Award, 
  Bot, 
  Camera, 
  BookOpen, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Calculator,
  UserCheck
} from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  activities: RecentActivity[];
  profile: UserProfile;
  setActiveTab: (tab: NavTab) => void;
  onOpenProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, activities, profile, setActiveTab, onOpenProfile }) => {
  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 p-6 md:p-8 shadow-2xl glass-panel-glow">
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Target Exam: {profile.targetExam || 'General Prep'} • Goal: {profile.dailyGoalHours}h/day</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{profile.name || 'Scholar'}</span> ✨
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              You are currently on a <span className="text-amber-400 font-bold underline decoration-amber-500/40">{stats.streakDays}-day learning streak</span>. What concept, formula, or exam topic are we crushing today?
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('tutor')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Tutor</span>
            </button>
            <button
              onClick={onOpenProfile}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Study Streak</p>
            <p className="text-xl font-bold text-white">{stats.streakDays} Days</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Hours</p>
            <p className="text-xl font-bold text-white">{stats.totalStudyHours} hrs</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Formulas Evaluated</p>
            <p className="text-xl font-bold text-white">{stats.formulasSolved || 142}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Quiz Accuracy</p>
            <p className="text-xl font-bold text-white">{stats.averageQuizScore}%</p>
          </div>
        </div>

      </div>

      {/* Quick Launchpad Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Quick Learning Hub</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => setActiveTab('tutor')}
            className="group text-left p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl transition-all shadow-md hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-indigo-300">
              Socratic AI Tutor
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              Ask complex concepts and receive step-by-step Socratic guidance & memory tips.
            </p>
            <span className="text-xs font-semibold text-indigo-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Start Session <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={() => setActiveTab('formula-lab')}
            className="group text-left p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 rounded-2xl transition-all shadow-md hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-purple-300">
              Formula Lab & Evaluator
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              Write your custom formulas, define input variables, and calculate results live.
            </p>
            <span className="text-xs font-semibold text-purple-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Build Formula <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={() => setActiveTab('snap')}
            className="group text-left p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 rounded-2xl transition-all shadow-md hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-sky-300">
              Snap & Solve
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              Take live photo of textbook problems or diagrams for instant OCR & solution.
            </p>
            <span className="text-xs font-semibold text-sky-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Scan Image <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className="group text-left p-5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-2xl transition-all shadow-md hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-emerald-300">
              Practice Quizzes
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              Take interactive multiple choice quizzes with instant feedback & explanation.
            </p>
            <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Take Quiz <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

        </div>
      </div>

      {/* Two Column Layout: Recent Activity & Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subject Mastery Overview */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Subject Performance</span>
            </h3>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View Detailed Analytics
            </button>
          </div>

          <div className="space-y-4">
            {stats.subjectPerformance.map((item) => (
              <div key={item.subject} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{item.subject}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{item.hoursSpent} hrs studied</span>
                    <span className="font-bold text-indigo-300">{item.score}% Mastery</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Recent Activity</span>
          </h3>

          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-slate-800/60 border border-slate-700/40 rounded-xl flex items-start gap-3 hover:border-slate-600 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{act.title}</p>
                  <p className="text-[10px] text-slate-400">{act.timestamp}</p>
                </div>
                {act.score && (
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 whitespace-nowrap">
                    {act.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

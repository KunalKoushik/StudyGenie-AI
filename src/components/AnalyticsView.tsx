import React from 'react';
import { UserStats } from '../types';
import { 
  BarChart3, 
  Flame, 
  Clock, 
  Award, 
  Trophy, 
  CheckCircle2, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsViewProps {
  stats: UserStats;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  const weeklyStudyData = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.0 },
    { day: 'Wed', hours: 2.8 },
    { day: 'Thu', hours: 5.2 },
    { day: 'Fri', hours: 4.5 },
    { day: 'Sat', hours: 6.0 },
    { day: 'Sun', hours: 2.5 }
  ];

  const subjectChartData = stats.subjectPerformance.map((s) => ({
    subject: s.subject,
    score: s.score,
    hours: s.hoursSpent
  }));

  const COLORS = ['#6366f1', '#a855f7', '#38bdf8', '#34d399', '#f59e0b'];

  const achievements = [
    { title: 'Socratic Scholar', desc: 'Asked 10+ deep conceptual questions to AI Tutor', unlocked: true },
    { title: 'Flashcard Master', desc: 'Mastered 50+ flashcards across 3 decks', unlocked: true },
    { title: 'Quiz Whiz', desc: 'Scored 90%+ on 5 consecutive practice quizzes', unlocked: true },
    { title: 'Snap Explorer', desc: 'Analyzed 10+ textbook pages with AI Vision', unlocked: true },
    { title: 'Consistency Champion', desc: 'Maintained a 14-day continuous study streak', unlocked: false }
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Learning Analytics & Progress</h1>
            <p className="text-xs text-slate-400">Track your study hours, subject proficiency, and milestone badges</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Current Streak
          </span>
          <p className="text-xl font-bold text-white">{stats.streakDays} Days</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Total Time
          </span>
          <p className="text-xl font-bold text-white">{stats.totalStudyHours} Hours</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Avg Quiz Accuracy
          </span>
          <p className="text-xl font-bold text-white">{stats.averageQuizScore}%</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            Formulas Solved
          </span>
          <p className="text-xl font-bold text-white">{stats.formulasSolved || 142}</p>
        </div>
      </div>

      {/* Visual Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Hours Bar Chart */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Weekly Study Activity (Hours)</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStudyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery Pie / Distribution Chart */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Subject Mastery Breakdown (%)</span>
          </h2>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectChartData}
                  dataKey="score"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: any) => `${name}: ${value}%`}
                >
                  {subjectChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Achievement Badges Section */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Milestones & Achievement Badges</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                ach.unlocked
                  ? 'bg-slate-800/80 border-amber-500/30 text-white'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ach.unlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-600'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                  <span>{ach.title}</span>
                  {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-400">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

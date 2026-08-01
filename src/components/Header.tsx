import React, { useState } from 'react';
import { NavTab, UserProfile } from '../types';
import { 
  Sparkles, 
  Bot, 
  Camera, 
  BookOpen, 
  HelpCircle, 
  BarChart3, 
  Flame, 
  GraduationCap,
  Calculator,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';
import { PomodoroTimer } from './PomodoroTimer';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  streakDays: number;
  profile: UserProfile;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, streakDays, profile, onOpenProfile }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; desc?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <GraduationCap className="w-4 h-4" />, desc: 'Overview & streak stats' },
    { id: 'tutor', label: 'AI Tutor', icon: <Bot className="w-4 h-4" />, desc: 'Socratic step-by-step assistant' },
    { id: 'formula-lab', label: 'Formula Lab', icon: <Calculator className="w-4 h-4" />, desc: 'Custom formula builder & solvers' },
    { id: 'snap', label: 'Snap & Solve', icon: <Camera className="w-4 h-4" />, desc: 'OCR problem scanner' },
    { id: 'syllabus', label: 'Syllabus Planner', icon: <BookOpen className="w-4 h-4" />, desc: 'Exam prep timeline builder' },
    { id: 'quiz', label: 'Practice Quiz', icon: <HelpCircle className="w-4 h-4" />, desc: 'AI mock test generator' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, desc: 'Mastery & learning insights' },
  ];

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Top Header Row: Brand Logo & Right Controls */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <button 
            onClick={() => handleNavClick('dashboard')} 
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                  StudyGenie AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Pro
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-none mt-0.5">Learn Smarter, Not Harder.</p>
            </div>
          </button>

          {/* Right Section: Pomodoro Timer, Profile Badge, Streak/Gemini Status, & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PomodoroTimer />

            {/* User Profile Badge Button - Hidden on mobile, shown on desktop */}
            <button
              onClick={onOpenProfile}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-xs text-slate-200 font-semibold transition-all shadow-sm group"
              title="Edit Profile & Study Goals"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <div className="font-bold text-white text-[11px] group-hover:text-indigo-300 truncate max-w-[100px]">
                  {profile.name || 'Scholar'}
                </div>
                <div className="text-[9px] text-slate-400 truncate max-w-[100px]">
                  {profile.targetExam || 'General'}
                </div>
              </div>
            </button>

            {/* Desktop Streak & Gemini Status Block */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs leading-tight shadow-sm">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{streakDays} Days</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold" title="Deterministic sampling (Temp=0.0) + Server Hash Cache ensures identical answers across all devices">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deterministic RAG</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 3.6 Active</span>
              </div>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-700 focus:outline-none transition-all shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-slate-200" />}
            </button>
          </div>

        </div>

        {/* Desktop Navigation Row (Always visible without hamburger on desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto custom-scrollbar touch-scroll pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn max-w-7xl mx-auto">
          {/* Mobile Profile & Streak Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-800/90 to-indigo-950/50 border border-indigo-500/20">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenProfile(); }}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{profile.name}</div>
                <div className="text-[10px] text-indigo-300">{profile.targetExam}</div>
              </div>
            </button>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streakDays}d Streak</span>
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-1 gap-1.5 pt-1 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-800 text-indigo-400'}`}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{item.label}</div>
                      {item.desc && <div className="text-[10px] opacity-75 font-normal">{item.desc}</div>}
                    </div>
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-white shadow-glow" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};


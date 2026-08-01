import React, { useState } from 'react';
import { UserProfile, Subject } from '../types';
import { User, Sparkles, GraduationCap, Target, Clock, BookOpen, Check, X } from 'lucide-react';

interface UserProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveProfile
}) => {
  const [name, setName] = useState(profile.name || '');
  const [targetExam, setTargetExam] = useState(profile.targetExam || 'Competitive Exam / College Prep');
  const [gradeLevel, setGradeLevel] = useState(profile.gradeLevel || 'College Prep / Undergrad');
  const [focusSubject, setFocusSubject] = useState<Subject>(profile.focusSubject || 'Mathematics');
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(profile.dailyGoalHours || 3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedProfile: UserProfile = {
      ...profile,
      name,
      targetExam,
      gradeLevel,
      focusSubject,
      dailyGoalHours: Number(dailyGoalHours) || 3,
      onboarded: true
    };

    onSaveProfile(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative my-8 animate-fadeIn">
        
        {/* Close button if user already onboarded */}
        {profile.onboarded && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Title Banner */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{profile.onboarded ? 'Edit Scholar Profile' : 'Welcome to StudyGenie AI'}</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h2>
            <p className="text-xs text-slate-400">Personalize your study goals, exam targets, and subject focus</p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* Name Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Name / Student Alias</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kunal Koushik"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Target Exam */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              <span>Target Exam or Goal</span>
            </label>
            <select
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="JEE / Engineering College Entrance">JEE / Engineering Entrance</option>
              <option value="NEET / Medical Entrance">NEET / Medical Entrance</option>
              <option value="SAT / ACT College Prep">SAT / ACT College Prep</option>
              <option value="AP / IB Advanced Placement">AP / IB Advanced Placement</option>
              <option value="GRE / GMAT Graduate Prep">GRE / GMAT Graduate Prep</option>
              <option value="High School Board Finals">High School Board Finals</option>
              <option value="University Degree Coursework">University Degree Coursework</option>
              <option value="Self-Directed Lifelong Learning">Self-Directed Lifelong Learning</option>
            </select>
          </div>

          {/* Grade Level & Daily Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Education Level</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="High School (Grades 9-12)">High School (Grades 9-12)</option>
                <option value="College Prep / Undergrad">College Prep / Undergrad</option>
                <option value="Graduate / Postgrad">Graduate / Postgrad</option>
                <option value="Professional / Competitive">Professional / Competitive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Target (Hours)</span>
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Primary Focus Subject */}
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Primary Focus Subject</span>
            </label>
            <select
              value={focusSubject}
              onChange={(e) => setFocusSubject(e.target.value as Subject)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="History">History</option>
              <option value="General Science">General Science</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Launch Study Dashboard</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { SyllabusModule } from '../types';
import { 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Clock, 
  FileText, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SyllabusPlanner: React.FC = () => {
  const [courseTitle, setCourseTitle] = useState('Advanced Calculus & Differential Equations');
  const [syllabusText, setSyllabusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<SyllabusModule[]>([
    {
      week: 1,
      moduleName: 'Limits, Continuity & Differentiation Fundamentals',
      topics: ['Limits at infinity and asymptotes', 'Continuity & Intermediate Value Theorem', 'Derivatives from first principles'],
      estimatedHours: 5,
      keyOutcome: 'Master limit evaluation and formal derivative definitions',
      completed: true
    },
    {
      week: 2,
      moduleName: 'Advanced Differentiation & Chain Rule',
      topics: ['Product, Quotient, and Chain Rules', 'Implicit Differentiation', 'Related Rates Problems'],
      estimatedHours: 6,
      keyOutcome: 'Apply differentiation rules to multi-variable constraints',
      completed: false
    },
    {
      week: 3,
      moduleName: 'Integration & Fundamental Theorem of Calculus',
      topics: ['Antiderivatives and indefinite integrals', 'Definite integrals and Riemann sums', 'Integration by Substitution (u-substitution)'],
      estimatedHours: 7,
      keyOutcome: 'Evaluate definite and indefinite integrals with substitution',
      completed: false
    }
  ]);

  const sampleSyllabi = [
    {
      title: 'AP Physics C: Mechanics Syllabus',
      content: 'Unit 1: Kinematics (Motion in 1D and 2D, vectors, projectile motion)\nUnit 2: Newton\'s Laws of Motion (Forces, friction, circular motion)\nUnit 3: Work, Energy, and Power (Kinetic & potential energy, conservation laws)\nUnit 4: Systems of Particles and Linear Momentum\nUnit 5: Rotation and Angular Momentum'
    },
    {
      title: 'Organic Chemistry I Syllabus',
      content: 'Chapter 1: Structure and Bonding in Organic Molecules\nChapter 2: Acids and Bases, Functional Groups\nChapter 3: Alkanes and Cycloalkanes Stereochemistry\nChapter 4: Substitution (SN1/SN2) and Elimination (E1/E2) Reactions\nChapter 5: Alkenes, Alkynes, and Reaction Mechanisms'
    }
  ];

  const handleAnalyze = async () => {
    if (!syllabusText.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/syllabus/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: syllabusText,
          courseTitle
        })
      });

      const json = await res.json();
      if (json.success && json.data && json.data.modules) {
        setModules(json.data.modules);
      }
    } catch (err) {
      console.error('Syllabus analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleCompleted = (index: number) => {
    setModules((prev) => prev.map((m, i) => i === index ? { ...m, completed: !m.completed } : m));
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Syllabus & Course Study Planner</h1>
            <p className="text-xs text-slate-400">Paste your course syllabus or textbook table of contents to auto-generate a structured timeline</p>
          </div>
        </div>
      </div>

      {/* Input & Sample Buttons */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Syllabus Input</span>
        </h2>

        {/* Samples */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-semibold block">Load Sample Syllabus:</span>
          <div className="flex flex-nowrap overflow-x-auto custom-scrollbar touch-scroll gap-2 pb-2">
            {sampleSyllabi.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCourseTitle(s.title);
                  setSyllabusText(s.content);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-indigo-300 transition-all"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Course Title</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Course Title"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Paste Syllabus / TOC Content</label>
            <textarea
              rows={3}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste course modules, syllabus text, or chapter titles..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!syllabusText.trim() || loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Generating Weekly Study Schedule...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Study Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Weekly Timeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <span>Study Plan Timeline — {courseTitle}</span>
        </h2>

        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl p-5 transition-all space-y-3 ${
                mod.completed
                  ? 'bg-slate-900/60 border-slate-800 opacity-75'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleModuleCompleted(idx)}
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {mod.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Week {mod.week}
                    </span>
                    <h3 className={`text-sm font-bold text-white ${mod.completed ? 'line-through text-slate-400' : ''}`}>
                      {mod.moduleName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700/50 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{mod.estimatedHours} hrs</span>
                </div>
              </div>

              {/* Topics list */}
              <div className="pl-8 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">Topics & Concepts:</span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mod.topics.map((t, tidx) => (
                    <li key={tidx} className="text-xs text-slate-300 flex items-center gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-700/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Outcome */}
              <div className="pl-8 pt-1 flex items-center justify-between text-xs text-indigo-300">
                <span>🎯 Goal: {mod.keyOutcome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

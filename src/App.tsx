import React, { useState, useEffect } from 'react';
import { NavTab, Quiz, UserStats, RecentActivity, UserProfile } from './types';
import { INITIAL_USER_STATS, INITIAL_QUIZZES, INITIAL_ACTIVITIES, INITIAL_USER_PROFILE } from './data/initialData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AITutor } from './components/AITutor';
import { FormulaLab } from './components/FormulaLab';
import { SnapAndSolve } from './components/SnapAndSolve';
import { SyllabusPlanner } from './components/SyllabusPlanner';
import { QuizEngine } from './components/QuizEngine';
import { AnalyticsView } from './components/AnalyticsView';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal } from './components/AuthModal';
import { Toaster, toast } from 'sonner';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('tutor');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('studygenie_user_stats');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_USER_STATS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [activities, setActivities] = useState<RecentActivity[]>(INITIAL_ACTIVITIES);

  // Check authentication session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setCurrentUser(json.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const handleAuthSuccess = (user: { id: string; email: string; name: string }) => {
    setCurrentUser(user);
    toast.success(`Welcome ${user.name}!`);
  };

  // User Profile & Onboarding State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('studygenie_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_USER_PROFILE;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem('studygenie_user_profile', JSON.stringify(updated));
  };

  const handleRecordFormulaSolved = () => {
    setStats((prev) => ({
      ...prev,
      formulasSolved: (prev.formulasSolved || 0) + 1,
      totalStudyHours: Number(((prev.totalStudyHours || 0) + 0.1).toFixed(1))
    }));
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'formula',
        title: 'Evaluated & Mastered Formula in Lab',
        timestamp: 'Just now'
      },
      ...prev
    ]);
  };

  const handleRecordQuizCompleted = (scorePercent: number) => {
    setStats((prev) => {
      const prevCompleted = prev.quizzesCompleted || 0;
      const newCompleted = prevCompleted + 1;
      const prevAvg = prev.averageQuizScore || 0;
      const newAvg = Math.round((prevAvg * prevCompleted + scorePercent) / newCompleted);
      return {
        ...prev,
        quizzesCompleted: newCompleted,
        averageQuizScore: newAvg,
        totalStudyHours: Number(((prev.totalStudyHours || 0) + 0.25).toFixed(1))
      };
    });
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'quiz',
        title: `Completed Quiz (${scorePercent}% score)`,
        timestamp: 'Just now'
      },
      ...prev
    ]);
  };

  const handleAddQuiz = (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'quiz',
        title: `Generated Practice Quiz: ${newQuiz.title}`,
        timestamp: 'Just now'
      },
      ...prev
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Toaster position="top-right" theme="dark" richColors />
      
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakDays={stats.streakDays}
        profile={profile}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            activities={activities}
            profile={profile}
            setActiveTab={setActiveTab}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === 'tutor' && <AITutor />}

        {activeTab === 'formula-lab' && <FormulaLab onRecordFormulaSolved={handleRecordFormulaSolved} />}

        {activeTab === 'snap' && <SnapAndSolve />}

        {activeTab === 'syllabus' && <SyllabusPlanner />}

        {activeTab === 'quiz' && (
          <QuizEngine
            quizzes={quizzes}
            onAddQuiz={handleAddQuiz}
            onRecordQuizCompleted={handleRecordQuizCompleted}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView stats={stats} />}
      </main>

      {/* Auth Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* User Information Modal */}
      <UserProfileModal
        profile={profile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        StudyGenie AI • Commercial Production Grade • Created by KK
      </footer>
    </div>
  );
};

export default App;

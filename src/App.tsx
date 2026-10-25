/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { ServantDashboard } from './components/ServantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import {
  Sparkles,
  Shield,
  GraduationCap,
  Users,
  Clock,
  RotateCcw,
  BookOpen,
  Church,
  QrCode,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, switchUserById, resetDemoData, theme } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // Auto-route on role switch
  useEffect(() => {
    if (!currentUser) {
      setCurrentTab('home');
      return;
    }

    if (currentUser.role === 'admin' || currentUser.role === 'assistant') {
      if (currentTab === 'student' || currentTab === 'servant') {
        setCurrentTab('admin');
      }
    } else if (currentUser.role === 'servant') {
      if (currentTab === 'admin' || currentTab === 'student') {
        setCurrentTab('servant');
      }
    } else if (currentUser.role === 'student') {
      if (currentTab === 'admin' || currentTab === 'servant') {
        setCurrentTab('student');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      dir="rtl"
    >
      {/* Background with the St. Paul Icon uploaded by user */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.06] dark:opacity-[0.09] filter saturate-150"
        style={{
          backgroundImage: `url('/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg')`,
        }}
      />

      {/* Decorative Warm Ambient Glow matching Saint Paul colors (Amber Gold & Royal Blue) */}
      <div className="fixed -top-40 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Navbar */}
      <div className="relative z-10">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenAuth={handleOpenAuth}
        />
      </div>

      {/* Main Body */}
      <main className="flex-1 relative z-10">
        {currentTab === 'home' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'student' && <StudentDashboard />}

        {currentTab === 'servant' && <ServantDashboard />}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Demo Role Switcher Dock for Instant Testing */}
      <aside
        aria-label="شريط التبديل التجريبي السريع"
        className="fixed bottom-4 left-4 z-40 hidden lg:flex items-center gap-2 p-2 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-amber-600/40 text-xs"
      >
        <div className="flex items-center gap-1.5 px-2 text-amber-300 font-bold border-l border-slate-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px]">تجربة سريعة:</span>
        </div>

        <button
          onClick={() => {
            switchUserById('admin-1');
            setCurrentTab('admin');
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            currentUser?.id === 'admin-1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="دخول كـ مسؤول النظام وأمين الخدمة (أ. مينا عادل)"
        >
          👑 أمين الخدمة
        </button>

        <button
          onClick={() => {
            switchUserById('assistant-1');
            setCurrentTab('admin');
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            currentUser?.id === 'assistant-1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="دخول كـ مساعد إدارة ورصد درجات (د. مريم يوسف)"
        >
          🛡️ مساعد إدارة
        </button>

        <button
          onClick={() => {
            switchUserById('servant-1');
            setCurrentTab('servant');
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            currentUser?.id === 'servant-1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="دخول كـ خادم فصل (أ. بيشوي كمال)"
        >
          ✝️ خادم فصل
        </button>

        <button
          onClick={() => {
            switchUserById('student-1');
            setCurrentTab('student');
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            currentUser?.id === 'student-1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="دخول كـ طالب مفعل بالمنصة (فادي جورج)"
        >
          📖 مخدوم مفعل
        </button>

        <button
          onClick={() => {
            switchUserById('student-pending-1');
            setCurrentTab('student');
          }}
          className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            currentUser?.id === 'student-pending-1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
          title="دخول كـ طالب جديد ينتظر موافقة الأدمن (توماس هاني)"
        >
          ⏳ مخدوم معلق
        </button>

        <button
          onClick={() => handleOpenAuth('register')}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-all cursor-pointer border border-amber-500/30 text-[11px]"
        >
          ➕ حساب جديد
        </button>
      </aside>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 dark:bg-slate-950 text-white border-t border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 text-center md:text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/50 shadow-md">
                <img
                  src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                  alt="القديس بولس"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-base text-amber-50">
                  مدرسة سانت بولس للكتاب المقدس
                </h4>
                <p className="text-xs text-slate-400">
                  كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <button
                onClick={() => setCurrentTab('home')}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                الرئيسية
              </button>
              <span>•</span>
              <button
                onClick={() => handleOpenAuth('register')}
                className="hover:text-amber-300 transition-colors cursor-pointer"
              >
                طلب انضمام
              </button>
              <span>•</span>
              <button
                onClick={resetDemoData}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 text-slate-400 cursor-pointer"
                title="إعادة ضبط البيانات"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط البيانات</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 text-center sm:text-right">
            <div>
              منصة الإدارة التعليمية الشاملة - ٧ فصول دراسية، حضور بـ QR كود، وحوكمة المذكرات والدرجات
            </div>
            <div className="font-serif italic text-amber-400/80">
              «وَالَّذِي أَعْطَى الْبَعْضَ أَنْ يَكُونُوا... مُعَلِّمِينَ، لأَجْلِ تَكْمِيلِ الْقِدِّيسِينَ لِعَمَلِ الْخِدْمَةِ»
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

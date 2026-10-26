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
import { ClassId } from './types';
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

  const [currentTab, setCurrentTab] = useState<string>('admin');
  const [adminSubTab, setAdminSubTab] = useState<string>('classes');
  const [adminClassId, setAdminClassId] = useState<ClassId>('primary_4');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  const handleNavigateMaster = (tab: string, subTab?: string, classId?: ClassId) => {
    setCurrentTab(tab);
    if (subTab) setAdminSubTab(subTab);
    if (classId) setAdminClassId(classId);
  };

  // Auto-route on role switch (STRICT: only admin can be on admin tab)
  useEffect(() => {
    if (!currentUser) {
      if (currentTab === 'admin') setCurrentTab('home');
      return;
    }

    if (currentUser.role === 'admin') {
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
    } else {
      if (currentTab === 'admin') {
        setCurrentTab('home');
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

      {/* Top Navbar with highest stacking context to never be covered by main */}
      <div className="sticky top-0 z-50">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenAuth={handleOpenAuth}
          onNavigateMaster={handleNavigateMaster}
        />
      </div>

      {/* Main Body */}
      <main className="flex-1 relative z-0">
        {currentTab === 'home' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'student' && <StudentDashboard />}

        {currentTab === 'servant' && <ServantDashboard />}

        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              initialTab={adminSubTab as any}
              initialClassId={adminClassId}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-lg space-y-4 text-stone-900 dark:text-stone-100">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">
                صلاحية محظورة: لوحة الأدمن فقط
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                عفواً، الدخول إلى لوحة التحكم والإدارة مخصص حصرياً لمسؤول النظام (أمين الخدمة: ts199075@gmail.com).
              </p>
              <button
                onClick={() => setCurrentTab(currentUser?.role === 'servant' ? 'servant' : currentUser?.role === 'student' ? 'student' : 'home')}
                className="px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-amber-700 text-white font-medium text-xs cursor-pointer shadow-xs"
              >
                العودة إلى لوحتي المخصصة
              </button>
            </div>
          )
        )}
      </main>



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

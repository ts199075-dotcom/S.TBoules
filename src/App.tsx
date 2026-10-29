import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { ServantDashboard } from './components/ServantDashboard';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { FeaturesGuideModal } from './components/FeaturesGuideModal';
import { BrandMark } from './components/ui/BrandMark';
import { ClassId } from './types';
import { Shield, RotateCcw } from 'lucide-react';
import { CHURCH_NAME, SCHOOL_NAME, SAINT_PAUL_ICON } from './lib/constants';

const MainAppContent: React.FC = () => {
  const { currentUser, resetDemoData, theme } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>('classes');
  const [adminClassId, setAdminClassId] = useState<ClassId>('primary_4');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const handleNavigateMaster = (tab: string, subTab?: string, classId?: ClassId) => {
    setCurrentTab(tab);
    if (subTab) setAdminSubTab(subTab as AdminTab);
    if (classId) setAdminClassId(classId);
  };

  const prevUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      prevUserIdRef.current = null;
      if (currentTab === 'admin' || currentTab === 'student' || currentTab === 'servant') {
        setCurrentTab('home');
      }
      return;
    }

    const isNewLogin = prevUserIdRef.current !== currentUser.id;
    prevUserIdRef.current = currentUser.id;

    if (isNewLogin) {
      if (currentUser.role === 'admin') {
        setCurrentTab('admin');
      } else if (currentUser.role === 'servant' || currentUser.role === 'assistant') {
        setCurrentTab('servant');
      } else if (currentUser.role === 'student') {
        setCurrentTab('student');
      }
    } else {
      if (currentUser.role === 'admin') {
        if (currentTab === 'student' || currentTab === 'servant') setCurrentTab('admin');
      } else if (currentUser.role === 'servant' || currentUser.role === 'assistant') {
        if (currentTab === 'admin' || currentTab === 'student') setCurrentTab('servant');
      } else if (currentUser.role === 'student') {
        if (currentTab === 'admin' || currentTab === 'servant') setCurrentTab('student');
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleLoginSuccess = (role: string) => {
    if (role === 'admin') {
      setCurrentTab('admin');
    } else if (role === 'servant' || role === 'assistant') {
      setCurrentTab('servant');
    } else if (role === 'student') {
      setCurrentTab('student');
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const confirmReset = () => {
    if (window.confirm('سيتم إعادة ضبط بيانات العرض المحلية. هل تريد المتابعة؟')) {
      resetDemoData();
      setCurrentTab('home');
    }
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col font-sans transition-colors duration-300 ${
        theme === 'dark' ? 'dark bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'
      }`}
      dir="rtl"
    >
      <a href="#main-content" className="skip-link">
        تخطي إلى المحتوى
      </a>

      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.16] dark:opacity-[0.20]"
        style={{ backgroundImage: `url('${SAINT_PAUL_ICON}')` }}
        aria-hidden="true"
      />
      <div className="fixed -top-40 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" aria-hidden="true" />
      <div className="fixed -bottom-40 left-1/4 w-96 h-96 bg-blue-900/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" aria-hidden="true" />

      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onNavigateMaster={handleNavigateMaster}
        onOpenFeaturesGuide={() => setFeaturesOpen(true)}
      />

      <main id="main-content" className="flex-1 relative z-0" tabIndex={-1}>
        {currentTab === 'home' && (
          <LandingPage onOpenAuth={handleOpenAuth} onNavigateTab={setCurrentTab} />
        )}

        {currentTab === 'student' && <StudentDashboard />}

        {currentTab === 'servant' && <ServantDashboard />}

        {currentTab === 'admin' &&
          (currentUser?.role === 'admin' ? (
            <AdminDashboard initialTab={adminSubTab} initialClassId={adminClassId} />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 text-center surface-card space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="font-bold text-lg">صلاحية محظورة</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                لوحة الإدارة مخصصة لأمين الخدمة فقط.
              </p>
              <button
                type="button"
                onClick={() =>
                  setCurrentTab(
                    currentUser?.role === 'servant'
                      ? 'servant'
                      : currentUser?.role === 'student'
                        ? 'student'
                        : 'home'
                  )
                }
                className="btn-secondary"
              >
                العودة إلى لوحتي
              </button>
            </div>
          ))}
      </main>

      <footer className="relative z-10 bg-stone-900 dark:bg-stone-950 text-white border-t border-stone-800 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-800 pb-6 text-center md:text-right">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <h2 className="font-bold text-base text-amber-50">{SCHOOL_NAME}</h2>
                <p className="text-xs text-stone-400">{CHURCH_NAME}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400" aria-label="روابط التذييل">
              <button type="button" onClick={() => setCurrentTab('home')} className="hover:text-amber-300">
                الرئيسية
              </button>
              <span aria-hidden="true">•</span>
              <button type="button" onClick={() => handleOpenAuth('register')} className="hover:text-amber-300">
                طلب انضمام
              </button>
              <span aria-hidden="true">•</span>
              <button type="button" onClick={() => setFeaturesOpen(true)} className="hover:text-amber-300">
                دليل المنصة
              </button>
              <span aria-hidden="true">•</span>
              <button
                type="button"
                onClick={confirmReset}
                className="hover:text-amber-300 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط البيانات المحلية
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500 text-center sm:text-right">
            <p>منصة إدارة تعليمية: سبعة فصول، حضور برمز الجلسة، ومتابعة المذكرات والدرجات</p>
            <p className="font-serif italic text-amber-400/80">
              «وَالَّذِي أَعْطَى الْبَعْضَ أَنْ يَكُونُوا... مُعَلِّمِينَ، لأَجْلِ تَكْمِيلِ الْقِدِّيسِينَ لِعَمَلِ الْخِدْمَةِ»
            </p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
      />
      <FeaturesGuideModal isOpen={featuresOpen} onClose={() => setFeaturesOpen(false)} />
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

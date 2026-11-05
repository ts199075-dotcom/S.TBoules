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
import { Shield } from 'lucide-react';
import { CHURCH_NAME, SCHOOL_NAME, SAINT_PAUL_ICON } from './lib/constants';
import { ClassId } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, theme } = useApp();

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
      if (currentTab !== 'home') {
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
        {(!currentUser || currentTab === 'home') && (
          <LandingPage onOpenAuth={handleOpenAuth} onNavigateTab={setCurrentTab} />
        )}

        {currentUser && currentTab === 'student' && <StudentDashboard />}

        {currentUser && (currentUser.role === 'servant' || currentUser.role === 'assistant') && currentTab === 'servant' && (
          <ServantDashboard />
        )}

        {currentUser && currentTab === 'admin' && (
          currentUser.role === 'admin' ? (
            <AdminDashboard initialTab={adminSubTab} initialClassId={adminClassId} />
          ) : (
            <LandingPage onOpenAuth={handleOpenAuth} onNavigateTab={setCurrentTab} />
          )
        )}
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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✝️
            </div>
            <h2 className="text-xl font-black">مدرسة القديس بولس للكتاب المقدس</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              تم تحديث الجلسة. يمكنك العودة للصفحة الرئيسية الآن.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

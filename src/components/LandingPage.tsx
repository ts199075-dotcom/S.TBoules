import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  Scroll,
  Church,
  Shield,
  Heart,
  Compass,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onNavigateTab,
}) => {
  const { classes, currentUser } = useApp();

  // The 5 biblical study axes requested by the user
  const studyPillars = [
    {
      title: 'البعد المسياني',
      subtitle: 'رؤية شخص ربنا يسوع المسيح ورموزه ونبواته في كل أسفار الكتاب المقدس',
      icon: '✝️',
    },
    {
      title: 'الطقس',
      subtitle: 'فهم طقوس الكنيسة والصلوات الليتورجية والارتباط الحي بالنص الكتابي',
      icon: '🕯️',
    },
    {
      title: 'العقيدة',
      subtitle: 'الإيمان الأرثوذكسي المسلّم مرة للقديسين والعمق اللاهوتي الآبائي المستقيم',
      icon: '📜',
    },
    {
      title: 'معاملات الله مع البشر',
      subtitle: 'اكتشاف أمانة الله، صلاحه، مراحمه، وتدبيره الأبوي للإنسان عبر الأجيال',
      icon: '🕊️',
    },
    {
      title: 'الخطية ونتائجها',
      subtitle: 'الفهم الروحي الواعي لضعف الطبيعة وسقوط الإنسان وقوة التوبة والنعمة المخلّصة',
      icon: '🌿',
    },
  ];

  return (
    <div className="space-y-16 pb-20 text-stone-900 dark:text-stone-100">
      {/* Calm & Reverent Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-100 pt-14 pb-20 px-4 sm:px-6 rounded-b-[2rem] border-b border-stone-800">
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          {/* Saint Paul Icon Avatar Display */}
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-600/60 shadow-md overflow-hidden bg-stone-800 p-0.5">
              <img
                src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                alt="القديس بولس الرسول"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* Church Affiliation Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-stone-300 text-xs font-medium">
            <span>☩</span>
            <span>كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-amber-50">
            مدرسة سانت بولس للكتاب المقدس
          </h1>

          {/* User Requested Body Introduction */}
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="text-base sm:text-lg text-stone-200 font-medium leading-relaxed">
              أهلاً بك في مدرسة سانت بولس للكتاب المقدس
            </p>
            <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed">
              وهنا ستتعلم معنا الكتاب المقدس بطريقة رائعة من خلال عدة محاور وهي:
            </p>
          </div>

          {/* The 5 Study Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 text-right">
            {studyPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-stone-800/70 border border-stone-700/80 rounded-xl p-3.5 space-y-1.5 transition-colors hover:border-amber-600/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pillar.icon}</span>
                  <h3 className="font-bold text-amber-200 text-xs sm:text-sm">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {pillar.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>انضم للمدرسة (تسجيل حساب جديد)</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  if (currentUser.role === 'admin' || currentUser.role === 'assistant') {
                    onNavigateTab('admin');
                  } else if (currentUser.role === 'servant') {
                    onNavigateTab('servant');
                  } else {
                    onNavigateTab('student');
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>دخول إلى لوحتي ({currentUser.name})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>تسجيل الدخول للمنصة</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* The 7 Educational Classes Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-stone-500 dark:text-stone-400 text-xs font-semibold">
            الفصول الدراسية
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            فصول مدرسة سانت بولس
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs">
            ٧ فصول دراسية مقسمة بحسب المراحل العمرية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {classes.map((cls, idx) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 flex flex-col justify-between hover:border-amber-700/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-mono text-[11px]">
                    ٠{idx + 1}
                  </span>
                  <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {cls.ageRange}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {cls.name}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed min-h-[36px]">
                  {cls.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  الالتحاق بهذا الفصل
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biblical Verse Banner */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-1">
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif italic">
            «كُلُّ الْكِتَابِ هُوَ مُوحىً بِهِ مِنَ اللهِ، وَنَافِعٌ لِلتَّعْلِيمِ وَالتَّوْبِيخِ، لِلتَّقْوِيمِ وَالتَّأْدِيبِ الَّذِي فِي الْبِرِّ»
          </p>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans block">
            (رسالة القديس بولس الرسول الثانية إلى تيموثاوس ٣ : ١٦)
          </span>
        </div>
      </section>
    </div>
  );
};

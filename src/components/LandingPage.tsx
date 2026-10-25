import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Award,
  Sparkles,
  Users,
  Shield,
  Calendar,
  Heart,
  Flame,
  FileCheck,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Scroll,
  Church,
  GraduationCap,
  Star,
  Check,
  QrCode,
  Lock,
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

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Saint Paul Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-amber-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Saint Paul Icon Avatar Display in Hero */}
          <div className="flex justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400/80 shadow-2xl overflow-hidden bg-amber-100 p-1">
              <img
                src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                alt="القديس بولس الرسول"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-medium backdrop-blur-md">
            <span>☩</span>
            <span>كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-amber-50 tracking-tight leading-tight max-w-4xl mx-auto">
            مدرسة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">سانت بولس</span> للكتاب المقدس
          </h1>

          <p className="text-base sm:text-xl text-amber-100/80 max-w-2xl mx-auto leading-relaxed font-normal">
            منظومة كنسية تعليمية وتربوية متكاملة لـ ٧ فصول دراسية، مع نظام الحضور الإلكتروني بـ QR Code، ورصد فوري للدرجات (٢٤ درجة للسيشن، ٦٠ أعمال سنة، ٤٠ امتحان نهائي).
          </p>

          {/* St. Paul Verse Banner */}
          <div className="max-w-2xl mx-auto bg-amber-900/30 border border-amber-500/30 rounded-2xl p-4 text-amber-200/90 text-xs sm:text-sm italic font-serif">
            «كُلُّ الْكِتَابِ هُوَ مُوحىً بِهِ مِنَ اللهِ، وَنَافِعٌ لِلتَّعْلِيمِ وَالتَّوْبِيخِ، لِلتَّقْوِيمِ وَالتَّأْدِيبِ الَّذِي فِي الْبِرِّ»
            <span className="block text-[11px] text-amber-400 mt-1 not-italic font-sans">
              (رسالة القديس بولس الرسول الثانية إلى تيموثاوس ٣ : ١٦)
            </span>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-900/40 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>انضم للمدرسة (تسجيل جديد)</span>
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
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-300/30 text-sm font-semibold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>دخول إلى لوحتي ({currentUser.name})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-300/30 text-sm font-semibold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>تسجيل الدخول للمنصة</span>
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-amber-800/40 text-right">
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-black text-amber-300">٧ فصول</div>
              <div className="text-xs text-amber-200/70">رابعة، خامسة، سادسة، أولى، ثانية وثالثة، ثانوي، كبار</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-black text-amber-300">٢٤ درجة للسيشن</div>
              <div className="text-xs text-amber-200/70">١٠ امتحان + ١٠ واجب + ٤ درجات (حضور، صلاة، أدوات، مشاركة)</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-black text-amber-300">٦٠ + ٤٠</div>
              <div className="text-xs text-amber-200/70">أعمال سنة دورية (٦٠) + امتحان نهائي (٤٠) = ١٠٠</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <div className="text-2xl font-black text-amber-300">اعتماد الأدمن</div>
              <div className="text-xs text-amber-200/70">موافقة مسبقة على المسجلين ومذكرات الخدام</div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities & What Happens Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            المنظومة التعليمية المتكاملة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
            إيه اللي بيحصل داخل مدرسة سانت بولس؟
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            المنصة تدمج التكنولوجيا الكنسية الحديثة مع الأصالة الآبائية لبناء شخصية مسيحية ناضجة تحيا بكلمة الله.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">١. حضور ذكي بـ QR Code</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              يقوم الخادم بفتح كود الـ QR على الشاشة أو الهاتف، ويمسح كل طالب الكود ليسجل حضوره فورياً ويحصل على درجة الحضور (١ من ١).
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">٢. تقييم اللقاء (٢٤ درجة)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              ١٠ درجات للامتحان، ١٠ درجات للواجب، درجة للحضور بالـ QR، درجة لحضور الصلاة، درجة للأدوات والنوتة، ودرجة للمشاركة، بإجمالي ٢٤ درجة لكل لقاء.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">٣. حوكمة مذكرات الخدام</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              أي مذكرة أو بحث أو مسابقة يرفعها الخادم تمر أولاً عبر أمانة الخدمة لاعتمادها ومراجعتها قبل أن تصبح منشورة ومتاحة للطلاب.
            </p>
          </div>
        </div>

        {/* The 7 Educational Classes Grid */}
        <div className="space-y-6 pt-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-bold bg-amber-100 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              الفصول السبعة المستقلة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              فصول مدرسة سانت بولس للكتاب المقدس
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              لكل مرحلة دراسية فصل مستقل ومنهج كتابي ولائحي مخصص
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {classes.map((cls, idx) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between group hover:border-amber-400 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {cls.ageRange}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {cls.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[38px]">
                    {cls.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    الالتحاق بهذا الفصل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Church Patron & Saint Paul Icon Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
          <img
            src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
            alt="أيقونة القديس بولس الرسول"
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          تحت رعاية آباء كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          «لأَنِّي لَسْتُ أَسْتَحِي بِإِنْجِيلِ الْمَسِيحِ، لأَنَّهُ قُوَّةُ اللهِ لِلْخَلاَصِ لِكُلِّ مَنْ يُؤْمِنُ» (رومية ١ : ١٦)
        </p>

        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            سجل الآن في مدرسة سانت بولس
          </button>
        </div>
      </section>
    </div>
  );
};

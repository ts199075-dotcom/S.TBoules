import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  AlertTriangle,
  Info,
  ChevronDown,
  Printer,
  FileText,
  Lock,
  Layers,
  Heart,
  TrendingUp,
  QrCode,
  Download,
  Share2,
  LogOut,
  PartyPopper,
  Scroll,
  ArrowRight,
  Flame,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CertificateModal } from './CertificateModal';
import { QrAttendanceModal } from './QrAttendanceModal';
import { BibleCanonExplorer } from './BibleCanonExplorer';
import { BIBLE_BOOKS, BibleBook, generateBookSessions } from '../data/bibleCanon';
import { BibleSession, SessionGrade } from '../types';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    academicTerms,
    currentTermId,
    sessions,
    grades,
    lessonPosts,
    classAssignedBooks,
    getStudentSessionGrades,
    getStudentScoreSummary,
    addAcademicTerm,
    logout,
  } = useApp();

  const [selectedTermId, setSelectedTermId] = useState<string>(currentTermId || 'term_1');
  const [showCertificate, setShowCertificate] = useState(false);
  const [qrModalSession, setQrModalSession] = useState<BibleSession | null>(null);
  const [studentTab, setStudentTab] = useState<'study' | 'grades' | 'canon'>('study');

  const assignedBookForClass = currentUser?.classId ? classAssignedBooks[currentUser.classId] : undefined;

  // Selected Bible Book state (synchronized with assigned book if present)
  const [selectedBook, setSelectedBook] = useState<BibleBook>(() => {
    const classId = currentUser?.classId;
    if (classId && classAssignedBooks[classId]) {
      const b = BIBLE_BOOKS.find((item) => item.id === classAssignedBooks[classId].bookId);
      if (b) return b;
    }
    return BIBLE_BOOKS.find((b) => b.id === 'genesis') || BIBLE_BOOKS[0];
  });

  // Sync when servant assigns a new book to the class
  useEffect(() => {
    if (assignedBookForClass) {
      const b = BIBLE_BOOKS.find((item) => item.id === assignedBookForClass.bookId);
      if (b && b.id !== selectedBook.id) {
        setSelectedBook(b);
      }
    }
  }, [assignedBookForClass]);

  // Completed Books History (saved in localStorage)
  const [completedBookIds, setCompletedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('st_paul_completed_books_v6');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showPartyCelebration, setShowPartyCelebration] = useState(false);

  // Persist completed books
  useEffect(() => {
    try {
      localStorage.setItem('st_paul_completed_books_v6', JSON.stringify(completedBookIds));
    } catch {
      /* ignore */
    }
  }, [completedBookIds]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          برجاء تسجيل الدخول بحساب مخدوم لعرض الدرجات
        </h2>
        <p className="text-sm text-stone-500">بعد اعتماد أمين الخدمة ستظهر درجاتك ولقاءات فصلك هنا.</p>
      </div>
    );
  }

  // Pending student approval screen
  if (currentUser.status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950 border-2 border-amber-300 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-700">
            حساب طالب جديد قيد المراجعة
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            أهلاً بك يا {currentUser.name} في مدرسة سانت بولس
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            تم استلام طلب انضمامك لفصلك بنجاح، ولكن بحسب نظام المدرسة <strong className="text-amber-800 dark:text-amber-400">لا يمكنك الدخول إلى الفصل أو رؤية الدرجات إلا بعد قبول واعتماد أمين الخدمة أو مسؤول النظام</strong>.
          </p>
        </div>

        <div className="bg-amber-50/80 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 text-right max-w-md mx-auto space-y-3">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>بيانات طلبك المسجلة:</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div>• <strong>الفصل المطلوب:</strong> {classes.find((c) => c.id === currentUser.classId)?.name || 'فصل دراسي'}</div>
            <div>• <strong>رقم الهاتف:</strong> {currentUser.phone}</div>
            <div>• <strong>السن:</strong> {currentUser.age} سنة</div>
            <div>• <strong>أب الاعتراف:</strong> {currentUser.confessionFather || 'لم يحدد'}</div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  // Active student calculations
  const allStudentGrades = getStudentSessionGrades(currentUser.id);
  const activeTerm = academicTerms.find((t) => t.id === selectedTermId) || academicTerms[0] || {
    id: 'term_1',
    title: 'الترم الأول',
    bookSubject: selectedBook.title,
    sessionsCount: 8,
  };
  const summary = getStudentScoreSummary(currentUser.id, selectedTermId);
  const classObj = classes.find((c) => c.id === currentUser.classId) || classes[0];

  const classSessions = sessions.filter((s) => s.classId === currentUser.classId);
  const termSessions = classSessions.filter((s) => (s.termId || 'term_1') === selectedTermId);
  const termStudentGrades = allStudentGrades.filter((g) => (g.termId || 'term_1') === selectedTermId);

  // Real sessions published by the servant for this class
  const publishedClassSessions = useMemo(() => {
    return [...termSessions].sort((a, b) => (a.sessionNumber || 1) - (b.sessionNumber || 1));
  }, [termSessions]);

  // Determine if this book/term is fully completed (all 8 sessions graded + final exam recorded)
  const isTermFullyCompleted = summary.gradedSessionsCount >= 8 && summary.finalExamScore > 0;

  // Active session for QR scanning
  const activeQrSession: BibleSession = useMemo(() => {
    if (termSessions.length > 0) return termSessions[termSessions.length - 1];
    if (classSessions.length > 0) return classSessions[classSessions.length - 1];
    return {
      id: `sess-${selectedBook.id}-1`,
      title: `اللقاء الأسبوعي: دراسة ${selectedBook.title}`,
      classId: currentUser.classId || 'primary_4',
      termId: selectedTermId,
      date: new Date().toISOString().split('T')[0],
      biblePassage: selectedBook.title,
      servantName: 'أمانة الخدمة',
      maxScorePerMetric: 10,
      qrSecretCode: `STPAUL-${selectedBook.id.slice(0, 4).toUpperCase()}-101`,
      qrActive: true,
    };
  }, [termSessions, classSessions, selectedBook, currentUser.classId, selectedTermId]);

  // Approved posts targeted for this student's class
  const classApprovedPosts = lessonPosts.filter((p) => {
    if (p.status !== 'approved') return false;
    if (p.targetAudience === 'servants_only') return false;
    if (p.targetScope === 'all_classes') return true;
    return p.classId === currentUser.classId;
  });

  // Calculate lost points analysis
  let totalLostExam = 0;
  let totalLostHomework = 0;
  let totalLostAttendance = 0;
  let totalLostParticipation = 0;
  let totalLostPrayer = 0;
  let totalLostTools = 0;

  termStudentGrades.forEach((g: SessionGrade) => {
    totalLostExam += Math.max(0, 10 - Number(g.exam || 0));
    totalLostHomework += Math.max(0, 10 - Number(g.homework || 0));
    totalLostAttendance += Math.max(0, 1 - Number(g.attendance || 0));
    totalLostParticipation += Math.max(0, 1 - Number(g.participation || 0));
    totalLostPrayer += Math.max(0, 1 - Number(g.prayer || 0));
    totalLostTools += Math.max(0, 1 - Number(g.tools || 0));
  });

  const totalLostSum =
    totalLostExam +
    totalLostHomework +
    totalLostAttendance +
    totalLostParticipation +
    totalLostPrayer +
    totalLostTools;

  // Handler to select a Bible book from the canon explorer
  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    // Find or align matching term
    const matchedTerm = academicTerms.find((t) => t.bookSubject === book.title);
    if (matchedTerm) {
      setSelectedTermId(matchedTerm.id);
    }
    // Scroll smoothly to the 8-session curriculum section
    const target = document.getElementById('curriculum-sessions-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler to start a new term after the graduation party
  const handleStartNewTermAfterParty = async () => {
    if (!completedBookIds.includes(selectedBook.id)) {
      setCompletedBookIds((prev) => [...prev, selectedBook.id]);
    }

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch {}

    // Find next book in the canon
    const currentIndex = BIBLE_BOOKS.findIndex((b) => b.id === selectedBook.id);
    const nextBook = BIBLE_BOOKS[currentIndex + 1] || BIBLE_BOOKS[0];

    // Create a new academic term for the next book
    const newTermNumber = academicTerms.length + 1;
    const termTitle = `الترم ${newTermNumber === 2 ? 'الثاني' : newTermNumber === 3 ? 'الثالث' : newTermNumber === 4 ? 'الرابع' : `رقم ${newTermNumber}`}`;

    const created = await addAcademicTerm({
      title: termTitle,
      bookSubject: nextBook.title,
      description: `دراسة متعمقة في ${nextBook.title} - (${nextBook.theme})`,
      sessionsCount: 8,
      isCurrent: true,
      startDate: new Date().toISOString().split('T')[0],
    });

    setSelectedBook(nextBook);
    if (created?.id) setSelectedTermId(created.id);
    setShowPartyCelebration(false);

    // Scroll to the book explorer
    const target = document.getElementById('bible-canon-explorer-section');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-right" dir="rtl">
      {/* Student Profile & Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-amber-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-amber-300/20">
              حساب مخدوم معتمد ومفعل
            </span>
            <span className="text-xs text-amber-200/80">|</span>
            <span className="text-xs text-amber-200/80 flex items-center gap-1">
              <Scroll className="w-3.5 h-3.5 text-amber-400" />
              السفر الحالي: <strong>{selectedBook.title}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-50">
            {currentUser.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-100/80 pt-1">
            <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30 font-bold text-amber-200">
              {classObj.name}
            </span>
            <span>السن: <strong>{currentUser.age} سنة</strong></span>
            <span>•</span>
            <span>أب الاعتراف: <strong>{currentUser.confessionFather || 'أبونا ميخائيل القمص'}</strong></span>
          </div>
        </div>

        {/* Action Controls: Real Live Camera QR Check-in & Certificate */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setQrModalSession(activeQrSession)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            title="فتح كاميرا الهاتف وتسجيل الحضور بالباركود"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span>تسجيل حضوري بـ QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>عرض شهادة التقدير</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-rose-200 border border-white/15 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* GRADUATION & COMPLETION PARTY BANNER (حفلة إتمام السفر وتكريم الناجحين) */}
      {(isTermFullyCompleted || showPartyCelebration) && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute -left-10 -bottom-10 opacity-15 pointer-events-none text-slate-950">
            <PartyPopper className="w-48 h-48" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-xs font-black">
                <PartyPopper className="w-4 h-4 text-amber-400" />
                <span>حفل ختام التيرم وتكريم الفائقين 🎉</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                مبارك يا {currentUser.name}! أتممت دراسة {selectedBook.title} بتفوق! 🎓
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-900/90 max-w-xl leading-relaxed">
                تم استيفاء الحصص الـ ٨ كاملة واحتساب متوسط أعمال السنة (٦٠ درجة) وأداء الامتحان النهائي (٤٠ درجة). مجموعك الكلي: <strong>{summary.totalScore} من ١٠٠</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCertificate(true)}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>طباعة شهادة التخرج الرسمية 📜</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewTermAfterParty}
                className="px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>بدء ترم جديد بسفر جديد بعد الحفلة 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Top Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 max-w-2xl">
        <button
          type="button"
          onClick={() => setStudentTab('study')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            studentTab === 'study'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دراستي ومذكراتي 📚</span>
        </button>

        <button
          type="button"
          onClick={() => setStudentTab('grades')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            studentTab === 'grades'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>كشف الدرجات والتقييم 📊</span>
        </button>

        <button
          type="button"
          onClick={() => setStudentTab('canon')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            studentTab === 'canon'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Scroll className="w-4 h-4" />
          <span>أسفار الكتاب المقدس 📖</span>
        </button>
      </div>

      {/* TAB 1: STUDY & HANDOUTS («دراستي ومذكراتي 📚») */}
      {studentTab === 'study' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Selected Book Banner */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-6 sm:p-7 rounded-3xl border border-amber-400/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <span className="text-xs bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full">
                  السفر المقرر للدراسة حالياً
                </span>
                <span className="text-xs text-amber-200">
                  ({selectedBook.testament === 'old' ? 'العهد القديم' : 'العهد الجديد'} • {selectedBook.chaptersCount} أصحاحاً)
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                منهج دراسة {selectedBook.title}
              </h2>
              {assignedBookForClass?.customOverview ? (
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <span>✍️ نبذة وتوجيهات خاصة من خادم فصلك:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed whitespace-pre-line bg-black/20 p-3 rounded-2xl border border-white/10">
                    {assignedBookForClass.customOverview}
                  </p>
                  <div className="text-[11px] text-amber-300/80 pt-0.5">
                    موضوع السفر العام: {selectedBook.theme}
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl leading-relaxed">
                  {selectedBook.theme}
                </p>
              )}
              <div className="text-xs text-amber-300/90 pt-1 font-serif italic">
                «{selectedBook.keyVerse}»
              </div>
            </div>

            <div className="p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-white/15 text-center shrink-0 space-y-1">
              <span className="text-[11px] text-amber-200 font-bold">الرمز المسياني بالسفر:</span>
              <div className="text-xs font-black text-amber-300 max-w-xs">
                {selectedBook.messianicSymbol}
              </div>
            </div>
          </div>

          {/* Published Lessons Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    الحصص واللقاءات الدراسية المنشورة لفصلك
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  كل حصة ينشرها خادم فصلك تجد فيها الآية الحافظة وشرح الدرس وملف المذكرة ودرجاتك المسجلة.
                </p>
              </div>
            </div>

            {publishedClassSessions.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto text-2xl font-black">
                  📖
                </div>
                <h4 className="font-black text-slate-800 dark:text-slate-200 text-base">
                  لم يقم خادم فصلك بنشر أي لقاءات دراسية بعد لهذا الترم
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  في يوم خدمة المدرسة، يقوم الخادم بإنشاء اللقاء واختيار السفر والأصحاحات والآية ورفع المذكرة ونشرها للفصل؛ وستظهر الحصة هنا فوراً لتسجيل الحضور بالـ QR وتلقي الدرجات.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedClassSessions.map((session, idx) => {
                  const recordedGrade = termStudentGrades.find(
                    (g) => g.sessionId === session.id || g.sessionTitle === session.title
                  );
                  const isGraded = Boolean(recordedGrade);
                  const hasAttended = Number(recordedGrade?.attendance || 0) >= 1;
                  const totalSessionScore = isGraded
                    ? Number(recordedGrade?.exam || 0) +
                      Number(recordedGrade?.homework || 0) +
                      Number(recordedGrade?.attendance || 0) +
                      Number(recordedGrade?.participation || 0) +
                      Number(recordedGrade?.prayer || 0) +
                      Number(recordedGrade?.tools || 0)
                    : 0;

                  return (
                    <div
                      key={session.id}
                      className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                        isGraded
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-emerald-300/70 dark:border-emerald-800/70 shadow-xs'
                          : 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                              {session.sessionNumber || idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {session.title}
                                </h4>
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                                  لقاء منشور ✅
                                </span>
                              </div>
                              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                📖 {session.bookName || 'الكتاب المقدس'} — {session.coveredChapters || session.biblePassage}
                              </span>
                            </div>
                          </div>

                          {isGraded ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black shrink-0">
                              {totalSessionScore} / ٢٤ درجة
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                              مفتوح للحضور
                            </span>
                          )}
                        </div>

                        {/* Memory Verses Golden Cards (User Request 4) */}
                        {session.memoryVerses && session.memoryVerses.length > 0 ? (
                          <div className="space-y-2">
                            {session.memoryVerses.map((mv, vIdx) => (
                              <div
                                key={mv.id || `v-${vIdx}`}
                                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/60 dark:to-amber-900/40 border border-amber-300/80 dark:border-amber-700/80 space-y-1"
                              >
                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                                  <Scroll className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span>الآية الحافظة {session.memoryVerses!.length > 1 ? `(${vIdx + 1})` : ''}:</span>
                                </div>
                                <div className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 font-serif leading-relaxed pr-2 border-r-2 border-amber-500">
                                  «{mv.verse}»
                                </div>
                                {mv.reference && (
                                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 text-left pl-1 font-mono">
                                    ({mv.reference})
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (session.memoryVerse || session.objective) ? (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/60 dark:to-amber-900/40 border border-amber-300/80 dark:border-amber-700/80 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
                              <Scroll className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>الآية الأسبوعية الحافظة:</span>
                            </div>
                            <div className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 font-serif leading-relaxed pr-2 border-r-2 border-amber-500">
                              «{session.memoryVerse || session.objective}»
                            </div>
                            {session.memoryVerseRef && (
                              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 text-left pl-1 font-mono">
                                ({session.memoryVerseRef})
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Lesson Explanation / Spiritual Points */}
                        {session.lessonSummary && (
                          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                              <span>شرح وتلخيص الدرس الروحي:</span>
                            </div>
                            <p className="leading-relaxed text-[11px] whitespace-pre-line text-slate-600 dark:text-slate-300">
                              {session.lessonSummary}
                            </p>
                          </div>
                        )}

                        {/* Attached Handout / PDF File with Instant Download */}
                        {session.fileData && session.attachmentName && (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                                  {session.attachmentName}
                                </div>
                                {session.fileSize && (
                                  <div className="text-[10px] text-slate-500 font-mono">{session.fileSize}</div>
                                )}
                              </div>
                            </div>
                            <a
                              href={session.fileData}
                              download={session.attachmentName}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل مذكرة الدرس 📥</span>
                            </a>
                          </div>
                        )}

                        {/* Breakdown of 6 criteria if graded */}
                        {isGraded ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-6 gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">امتحان</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {recordedGrade?.exam || 0}/10
                                </div>
                              </div>
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">واجب</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {recordedGrade?.homework || 0}/10
                                </div>
                              </div>
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">حضور QR</div>
                                <div className="text-xs font-bold text-emerald-600">
                                  {recordedGrade?.attendance || 0}/1
                                </div>
                              </div>
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">مشاركة</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {recordedGrade?.participation || 0}/1
                                </div>
                              </div>
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">صلاة</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {recordedGrade?.prayer || 0}/1
                                </div>
                              </div>
                              <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-[9px] text-slate-400">أدوات</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {recordedGrade?.tools || 0}/1
                                </div>
                              </div>
                            </div>

                            {recordedGrade?.notes && (
                              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-200 border border-amber-200/50">
                                <strong>ملاحظة الخادم المباشرة لك:</strong> {recordedGrade.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400">
                            بانتظار تصحيح ورصد درجات الحصة (الامتحان والواجب والحضور) من خادم الفصل.
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          📅 {session.date}
                        </span>

                        {hasAttended ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>تم تسجيل حضورك بنجاح ✅</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setQrModalSession(session)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>تسجيل حضور QR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approved Servant Materials & Lesson Handouts */}
          {classApprovedPosts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    مذكرات وأبحاث دراسة الكتاب المعتمدة من أمانة الخدمة
                  </h3>
                </div>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                  معتمد للنشر ✅
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classApprovedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{post.title}</div>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                        إعداد: {post.servantName}
                      </span>
                    </div>

                    {post.bibleVerse && (
                      <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg font-serif italic">
                        «{post.bibleVerse}»
                      </div>
                    )}

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {post.content}
                    </p>

                    {post.attachmentName && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {post.attachmentName}
                        </span>
                        {post.fileData ? (
                          <a
                            href={post.fileData}
                            download={post.attachmentName}
                            className="text-[10px] bg-amber-600 text-white hover:bg-amber-700 px-3 py-1 rounded-md transition-colors font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>تحميل المذكرة</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">مرفق جاهز للمعاينة</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRADES & FACTUAL EVALUATION («كشف الدرجات والتقييم 📊») */}
      {studentTab === 'grades' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grade Calculation Summary Cards (60 + 40 = 100) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Score */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold">المجموع الكلي النهائي</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{summary.totalScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, summary.totalScore)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                أعمال السنة (60) + الامتحان النهائي (40)
              </p>
            </div>

            {/* Year Work Score */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold">أعمال السنة المقررة للسفر</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                {summary.isCalculated ? (
                  <>
                    <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{summary.yearWorkScore}</span>
                    <span className="text-sm font-bold text-slate-400">/ 60</span>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-amber-700 dark:text-amber-400">
                      {summary.yearWorkScore}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      نقطة ({summary.gradedSessionsCount} / 8 حصص)
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${summary.isCalculated ? (summary.yearWorkScore / 60) * 100 : (summary.gradedSessionsCount / 8) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {summary.isCalculated
                  ? 'تم احتساب واعتماد متوسط الـ ٨ حصص كاملة من ٦٠ درجة'
                  : 'يتم احتساب المتوسط التلقائي فور رصد الحصص الثمانية'}
              </p>
            </div>

            {/* Final Exam Score */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold">امتحان السفر النهائي الكبير</span>
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-indigo-700 dark:text-indigo-400">{summary.finalExamScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 40</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${(summary.finalExamScore / 40) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                امتحان شامل على أحداث ونبوات السفر كاملة
              </p>
            </div>

            {/* Active Sessions Count Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold">الحصص المنعقدة بالفصل</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                  {publishedClassSessions.length}
                </span>
                <span className="text-sm font-bold text-slate-400">من ٨ حصص</span>
              </div>
              <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (publishedClassSessions.length / 8) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {publishedClassSessions.length === 0
                  ? 'بانتظار نشر الخادم للحصة الأولى'
                  : `${termStudentGrades.length} من ${publishedClassSessions.length} حصص تم رصد درجاتها لك`}
              </p>
            </div>
          </div>

          {/* Factual Analysis Section: Real Lost Points */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    تحليل الدرجات: «بيان الدرجات المفقودة في كل معيار»
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  كشف رقمي دقيق بالدرجات التي فُقدت في كل معيار بحسب رصد خادم الفصل للحصص.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                إجمالي الدرجات المفقودة: <strong className="text-rose-600 dark:text-rose-400 font-bold">{totalLostSum} درجة</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className={`p-4 rounded-2xl border text-center ${totalLostExam > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الامتحان الأسبوعي</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostExam === 0 ? 'كامل ⭐️' : `-${totalLostExam}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostExam === 0 ? 'درجات تامة (١٠/١٠)' : `فُقدت ${totalLostExam} درجات`}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${totalLostHomework > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الواجب والبحوث</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostHomework === 0 ? 'كامل ⭐️' : `-${totalLostHomework}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostHomework === 0 ? 'درجات تامة (١٠/١٠)' : `فُقدت ${totalLostHomework} درجات`}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${totalLostAttendance > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نسبة الحضور والـ QR</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostAttendance === 0 ? 'كامل ⭐️' : `-${totalLostAttendance}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostAttendance === 0 ? 'حضور كامل بالـ QR' : `غياب في ${totalLostAttendance} حصص`}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${totalLostParticipation > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">المشاركة والتفاعل</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostParticipation === 0 ? 'كامل ⭐️' : `-${totalLostParticipation}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostParticipation === 0 ? 'مشاركة كاملة' : `عدم تفاعل في ${totalLostParticipation} حصص`}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${totalLostPrayer > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حضور الصلاة</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostPrayer === 0 ? 'كامل ⭐️' : `-${totalLostPrayer}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostPrayer === 0 ? 'حضور تام لصلاة اللقاء' : `غياب صلاة في ${totalLostPrayer} حصص`}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-center ${totalLostTools > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الأدوات والنوتة</div>
                <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
                  {totalLostTools === 0 ? 'كامل ⭐️' : `-${totalLostTools}`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  {totalLostTools === 0 ? 'إحضار كامل للأدوات' : `نقص أدوات في ${totalLostTools} حصص`}
                </div>
              </div>
            </div>

            {/* Direct Servant Feedback & Instructions Journal (ملاحظات الخادم المباشرة فقط دون أي نصوص عشوائية) */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>توجيهات وملاحظات خادم فصلك المباشرة لك ✍️</span>
              </div>

              {(() => {
                const notesList = termStudentGrades.filter((g) => g.notes && g.notes.trim() !== '');
                if (notesList.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      لم يدوّن خادم الفصل أي ملاحظات سلبية بعد — واصل اجتهادك والتزامك الروحي والكنسي وحفظ الآيات! 👏
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {notesList.map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                          <span>📌 {g.sessionTitle}</span>
                          <span className="font-mono opacity-80">📅 {g.date}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          «{g.notes}»
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOLY BIBLE CANON EXPLORER («أسفار الكتاب المقدس 📖») */}
      {studentTab === 'canon' && (
        <div id="bible-canon-explorer-section" className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            💡 <strong>توجيه دراسي:</strong> يمكنك استكشاف أسفار الكتاب المقدس الـ ٧٣ لمعرفة أصحاحاتها وشواهدها ورموزها المسيانية، مع العلم بأن السفر المعتمد لدراستك حالياً يحدده خادم فصلك.
          </div>
          <BibleCanonExplorer
            currentBookId={selectedBook.id}
            onSelectBook={handleSelectBook}
            completedBookIds={completedBookIds}
            userRole="student"
            assignedBookIds={assignedBookForClass ? [assignedBookForClass.bookId] : [selectedBook.id]}
          />
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          studentName={currentUser.name}
          className={classObj.name}
          yearWorkScore={summary.yearWorkScore}
          totalScore={summary.totalScore}
          gradedSessionsCount={summary.gradedSessionsCount}
          isCalculated={summary.isCalculated}
          termTitle={activeTerm.title}
          bookSubject={selectedBook.title}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* QR Attendance Live Camera & Manual Scanner Modal */}
      {qrModalSession && (
        <QrAttendanceModal
          session={qrModalSession}
          mode="student_scan"
          onClose={() => setQrModalSession(null)}
        />
      )}
    </div>
  );
};

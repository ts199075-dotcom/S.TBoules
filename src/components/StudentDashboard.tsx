import React, { useState } from 'react';
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
} from 'lucide-react';
import { CertificateModal } from './CertificateModal';
import { QrAttendanceModal } from './QrAttendanceModal';
import { BibleSession, SessionGrade } from '../types';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    sessions,
    grades,
    lessonPosts,
    getStudentSessionGrades,
    getStudentScoreSummary,
    getClassLeaderboard,
    approveUser,
    logout,
  } = useApp();

  const [showCertificate, setShowCertificate] = useState(false);
  const [qrModalSession, setQrModalSession] = useState<BibleSession | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
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
            <div>• <strong>الفصل المطلوب:</strong> {classes.find(c => c.id === currentUser.classId)?.name || 'فصل دراسي'}</div>
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

  // Active student view
  const studentGrades = getStudentSessionGrades(currentUser.id);
  const summary = getStudentScoreSummary(currentUser.id);
  const classObj = classes.find((c) => c.id === currentUser.classId) || classes[4];
  const leaderboard = currentUser.classId ? getClassLeaderboard(currentUser.classId) : [];
  const currentRank = leaderboard.findIndex((s) => s.studentId === currentUser.id) + 1;
  const classSessions = sessions.filter((s) => s.classId === currentUser.classId);
  const latestSession = classSessions[classSessions.length - 1] || sessions[0];

  // Approved posts STRICTLY targeted for this student's class only
  const classApprovedPosts = lessonPosts.filter(
    (p) => p.classId === currentUser.classId && p.status === 'approved'
  );

  // Analysis of lost marks
  let totalLostExam = 0;
  let totalLostHomework = 0;
  let totalLostAttendance = 0;
  let totalLostParticipation = 0;
  let totalLostPrayer = 0;
  let totalLostTools = 0;

  studentGrades.forEach((g: SessionGrade) => {
    totalLostExam += 10 - Number(g.exam || 0);
    totalLostHomework += 10 - Number(g.homework || 0);
    totalLostAttendance += 1 - Number(g.attendance || 0);
    totalLostParticipation += 1 - Number(g.participation || 0);
    totalLostPrayer += 1 - Number(g.prayer || 0);
    totalLostTools += 1 - Number(g.tools || 0);
  });

  const totalLostSum =
    totalLostExam +
    totalLostHomework +
    totalLostAttendance +
    totalLostParticipation +
    totalLostPrayer +
    totalLostTools;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-right">
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
              <Lock className="w-3 h-3" />
              للقراءة والعرض فقط
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

        {/* QR Scan Button & Certificate Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {latestSession && (
            <button
              onClick={() => setQrModalSession(latestSession)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>تسجيل حضوري بـ QR Code</span>
            </button>
          )}

          <button
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>عرض شهادة التقدير</span>
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-rose-200 border border-white/15 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>خروج</span>
          </button>
        </div>
      </div>

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
            <span className="text-sm font-bold text-slate-400">/ ١٠٠</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, summary.totalScore)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            أعمال السنة (٦٠) + الامتحان النهائي (٤٠)
          </p>
        </div>

        {/* Year Work Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">أعمال السنة الدورية</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            {summary.isCalculated ? (
              <>
                <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{summary.yearWorkScore}</span>
                <span className="text-sm font-bold text-slate-400">/ ٦٠</span>
              </>
            ) : (
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                جارٍ الرصد ({summary.gradedSessionsCount}/٨)
              </span>
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
              ? 'تم اعتماد واحتساب متوسط الـ ٨ حصص كاملة من ٦٠ درجة'
              : 'بانتظار استيفاء رصد الـ ٨ حصص واعتماد المتوسط بأمر الإدارة'}
          </p>
        </div>

        {/* Final Exam Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">درجة الامتحان النهائي</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl font-black text-indigo-700 dark:text-indigo-400">{summary.finalExamScore}</span>
            <span className="text-sm font-bold text-slate-400">/ ٤٠</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${(summary.finalExamScore / 40) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            امتحان نهاية التيرم الشامل
          </p>
        </div>

        {/* Student Rank */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold">الترتيب في الفصل</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-black text-amber-700 dark:text-amber-400">
              {currentRank === 1 ? '🥇 الأول' : currentRank === 2 ? '🥈 الثاني' : currentRank === 3 ? '🥉 الثالث' : `المركز ${currentRank}`}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Award className="w-4 h-4 text-amber-600" />
            <span>من بين {leaderboard.length} طلاب مسجلين بفصلك</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {currentRank <= 3 ? '🎉 مبروك! أنت من أوائل مدرسة سانت بولس' : 'واصل المواظبة لتحقيق مركز أعلى!'}
          </p>
        </div>
      </div>

      {/* Analysis Section: "إيه اللي نقص فيه؟" */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                تحليل الدرجات: «إيه اللي نقصت فيه وطرق التعويض؟»
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              كشف تفصيلي يوضح بالضبط الدرجات التي فُقدت في كل معيار لمساعدتك على التطوير الروحي والدراسي.
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
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostExam === 0 ? 'درجات تامة' : 'نقص في الشواهد'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center ${totalLostHomework > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الواجب والبحوث</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
              {totalLostHomework === 0 ? 'كامل ⭐️' : `-${totalLostHomework}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostHomework === 0 ? 'واجبات كاملة' : 'حل الأسئلة وتسليمها'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center ${totalLostAttendance > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نسبة الحضور والـ QR</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
              {totalLostAttendance === 0 ? 'كامل ⭐️' : `-${totalLostAttendance}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostAttendance === 0 ? 'مسح الباركود ١ من ١' : 'تأخير أو عدم مسح'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center ${totalLostParticipation > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">المشاركة والتفاعل</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
              {totalLostParticipation === 0 ? 'كامل ⭐️' : `-${totalLostParticipation}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostParticipation === 0 ? 'تفاعل ممتاز' : 'شارك أكثر مع الخادم'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center ${totalLostPrayer > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حضور الصلاة</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
              {totalLostPrayer === 0 ? 'كامل ⭐️' : `-${totalLostPrayer}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostPrayer === 0 ? 'حضور الصلاة والقداس' : 'الالتزام ببدء اللقاء'}
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-center ${totalLostTools > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">الأدوات والنوتة</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
              {totalLostTools === 0 ? 'كامل ⭐️' : `-${totalLostTools}`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {totalLostTools === 0 ? 'الكتاب والنوتة' : 'إحضار الإنجيل الورقي'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sessions Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              سجل درجات اللقاءات الأسبوعية وتأكيد حضور الـ QR
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الامتحان (١٠) + الواجب (١٠) + الحضور (١) + المشاركة (١) + الصلاة (١) + الأدوات (١) = ٢٤ درجة لكل لقاء
            </p>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            عدد اللقاءات المرصودة: {studentGrades.length}
          </span>
        </div>

        {studentGrades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            لم يتم رصد درجات للقاءات حتى الآن، فور إدخال درجاتك ستظهر هنا فوراً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">
                  <th className="py-3 px-3 font-bold">اللقاء وتاريخه</th>
                  <th className="py-3 px-2 text-center font-bold">الامتحان (١٠)</th>
                  <th className="py-3 px-2 text-center font-bold">الواجب (١٠)</th>
                  <th className="py-3 px-2 text-center font-bold">الحضور (١)</th>
                  <th className="py-3 px-2 text-center font-bold">المشاركة (١)</th>
                  <th className="py-3 px-2 text-center font-bold">الصلاة (١)</th>
                  <th className="py-3 px-2 text-center font-bold">الأدوات (١)</th>
                  <th className="py-3 px-3 text-center font-black text-amber-900 dark:text-amber-300">مجموع اللقاء (٢٤)</th>
                  <th className="py-3 px-3 font-bold">ملاحظات الخادم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentGrades.map((g: SessionGrade) => {
                  const sessionTotal =
                    Number(g.exam || 0) +
                    Number(g.homework || 0) +
                    Number(g.attendance || 0) +
                    Number(g.participation || 0) +
                    Number(g.prayer || 0) +
                    Number(g.tools || 0);

                  return (
                    <tr key={g.id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        <div>{g.sessionTitle}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {g.date}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded-md ${g.exam >= 9 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-700 dark:text-slate-300'}`}>
                          {g.exam}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded-md ${g.homework >= 9 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-700 dark:text-slate-300'}`}>
                          {g.homework}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-bold">
                        <span className="inline-block px-2 py-0.5 rounded-md text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                          {g.attendance} {g.qrAttendedAt ? '📱 QR' : ''}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {g.participation}
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {g.prayer}
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {g.tools}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-black text-xs">
                          {sessionTotal} / ٢٤
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs">
                        {g.notes ? <span className="italic">«{g.notes}»</span> : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    <button
                      onClick={() => alert(`جارٍ تحميل المذكرة: ${post.attachmentName}`)}
                      className="text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-amber-600 hover:text-white px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      تحميل المذكرة
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
          rank={currentRank}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* QR Attendance Modal */}
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

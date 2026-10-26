import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassId, SessionGrade, UserProfile, BibleSession, ServantLessonPost } from '../types';
import {
  Shield,
  Users,
  BookOpen,
  Award,
  Trophy,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Search,
  Filter,
  Download,
  FileCheck,
  Calendar,
  Sparkles,
  Phone,
  Clock,
  Printer,
  ChevronDown,
  UserCheck,
  UserMinus,
  Check,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  QrCode,
  LogOut,
  GraduationCap,
  Zap,
  Trash2,
  PartyPopper,
  Megaphone,
} from 'lucide-react';
import { CertificateModal } from './CertificateModal';
import { QrAttendanceModal } from './QrAttendanceModal';

type AdminTab = 'classes' | 'scores' | 'pending' | 'post_approvals' | 'servants' | 'assistants' | 'reports' | 'events';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  initialClassId?: ClassId;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab,
  initialClassId,
}) => {
  const {
    currentUser,
    users,
    classes,
    sessions,
    grades,
    finalExamScores,
    servantSubmissions,
    lessonPosts,
    approveUser,
    rejectUser,
    toggleAssistantRole,
    saveSessionGrade,
    updateFinalExamScore,
    addNewSession,
    approveLessonPost,
    rejectLessonPost,
    createLessonPost,
    getStudentScoreSummary,
    getClassLeaderboard,
    getStudentSessionGrades,
    resetDemoData,
    logout,
    seedDemoData,
    clearAllStudentsAndServants,
  } = useApp();

  const [featuresModalOpen, setFeaturesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'classes');
  const [selectedClassId, setSelectedClassId] = useState<ClassId>(initialClassId || 'primary_4');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-Class Targeted Post Modal State
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [newPostTargetClass, setNewPostTargetClass] = useState<ClassId>('primary_4');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'announcement' | 'lesson_handout' | 'bible_study' | 'quiz'>('announcement');
  const [newPostVerse, setNewPostVerse] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostAttachment, setNewPostAttachment] = useState('');
  const [postPublishedSuccess, setPostPublishedSuccess] = useState(false);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    if (initialClassId) setSelectedClassId(initialClassId);
  }, [initialClassId]);

  const handleAdminCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    createLessonPost({
      title: newPostTitle.trim(),
      category: newPostCategory,
      bibleVerse: newPostVerse.trim(),
      content: newPostContent.trim(),
      attachmentName: newPostAttachment.trim() || undefined,
      classId: newPostTargetClass,
    });

    setNewPostTitle('');
    setNewPostVerse('');
    setNewPostContent('');
    setNewPostAttachment('');
    setNewPostModalOpen(false);
    setPostPublishedSuccess(true);
    setTimeout(() => setPostPublishedSuccess(false), 5000);
  };

  // Strict check: only admin can view this dashboard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl space-y-4 text-stone-900 dark:text-stone-100">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg">
          لوحة تحكم محظورة
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          هذه اللوحة مخصصة حصرياً لمسؤول النظام (أمين الخدمة: ts199075@gmail.com).
        </p>
      </div>
    );
  }

  // Grading Modal State
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<UserProfile | null>(null);
  const [selectedSessionForGrading, setSelectedSessionForGrading] = useState<string>('');
  const [gradeExam, setGradeExam] = useState<number>(10);
  const [gradeHomework, setGradeHomework] = useState<number>(10);
  const [gradeAttendance, setGradeAttendance] = useState<number>(1);
  const [gradeParticipation, setGradeParticipation] = useState<number>(1);
  const [gradePrayer, setGradePrayer] = useState<number>(1);
  const [gradeTools, setGradeTools] = useState<number>(1);
  const [gradeNotes, setGradeNotes] = useState<string>('');

  // Final Exam Quick Edit Modal
  const [finalExamModalOpen, setFinalExamModalOpen] = useState(false);
  const [studentForFinalExam, setStudentForFinalExam] = useState<UserProfile | null>(null);
  const [tempFinalScore, setTempFinalScore] = useState<number>(35);

  // New Session Creation Modal State
  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionPassage, setNewSessionPassage] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionServant, setNewSessionServant] = useState('أمين الخدمة');

  // QR Display Modal
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<BibleSession | null>(null);

  // Certificate Modal State
  const [certData, setCertData] = useState<{
    studentName: string;
    className: string;
    totalScore: number;
    rank?: number;
  } | null>(null);

  // Pending users and pending posts counts
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const pendingPosts = lessonPosts.filter((p) => p.status === 'pending_approval');
  const currentClassObj = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Comprehensive school-wide statistics
  const totalStudents = users.filter((u) => u.role === 'student');
  const activeStudents = totalStudents.filter((u) => u.status === 'active');
  const pendingStudents = totalStudents.filter((u) => u.status === 'pending');

  const totalServants = users.filter((u) => u.role === 'servant' || u.role === 'assistant');
  const activeServants = totalServants.filter((u) => u.status === 'active');
  const attendedServants = servantSubmissions.filter((s) => s.status === 'attending');

  const handleOpenGrading = (student: UserProfile, sessionId?: string) => {
    setSelectedStudentForGrading(student);
    const classSessions = sessions.filter((s) => s.classId === student.classId);
    const targetSessionId = sessionId || classSessions[0]?.id || '';
    setSelectedSessionForGrading(targetSessionId);

    const existingGrade = grades.find(
      (g) => g.studentId === student.id && g.sessionId === targetSessionId
    );

    if (existingGrade) {
      setGradeExam(existingGrade.exam);
      setGradeHomework(existingGrade.homework);
      setGradeAttendance(existingGrade.attendance);
      setGradeParticipation(existingGrade.participation);
      setGradePrayer(existingGrade.prayer);
      setGradeTools(existingGrade.tools);
      setGradeNotes(existingGrade.notes || '');
    } else {
      setGradeExam(10);
      setGradeHomework(10);
      setGradeAttendance(1);
      setGradeParticipation(1);
      setGradePrayer(1);
      setGradeTools(1);
      setGradeNotes('');
    }

    setGradingModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForGrading || !selectedSessionForGrading) return;

    saveSessionGrade({
      studentId: selectedStudentForGrading.id,
      sessionId: selectedSessionForGrading,
      exam: Number(gradeExam),
      homework: Number(gradeHomework),
      attendance: Number(gradeAttendance),
      participation: Number(gradeParticipation),
      prayer: Number(gradePrayer),
      tools: Number(gradeTools),
      notes: gradeNotes,
    });

    setGradingModalOpen(false);
  };

  const handleSaveFinalExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForFinalExam) return;
    updateFinalExamScore(studentForFinalExam.id, tempFinalScore);
    setFinalExamModalOpen(false);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    addNewSession({
      title: newSessionTitle.trim(),
      biblePassage: newSessionPassage.trim() || 'شواهد مختارة',
      date: newSessionDate,
      servantName: newSessionServant,
      classId: selectedClassId,
      maxScorePerMetric: 10,
    });

    setNewSessionTitle('');
    setNewSessionPassage('');
    setNewSessionModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-right">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="text-xs text-amber-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-amber-300/20">
              لوحة تحكم مسؤول النظام (أمين الخدمة)
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-50">
            إدارة مدرسة سانت بولس للكتاب المقدس
          </h1>

          <p className="text-xs sm:text-sm text-amber-100/80 max-w-xl leading-relaxed">
            كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي - ٧ فصول دراسية، حضور بـ QR كود، رصد فوري للدرجات، واعتماد طلبات ومذكرات الخدام.
          </p>
        </div>

        {/* Quick Summary Pill & Alerts & Features Guide Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Features Guide Button Requested by User */}
          <button
            onClick={() => setFeaturesModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 p-3 px-4 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            title="عرض خريطة كافة فيتشرز وإمكانيات المنصة"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>📋 دليل كافة مميزات المنصة</span>
          </button>

          {/* Quick Logout Button */}
          <button
            onClick={logout}
            className="bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/60 p-3 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>

          <div className="bg-white/10 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10 text-xs text-center">
            <div className="text-amber-300 font-bold text-lg">
              {totalStudents.length}
            </div>
            <div className="text-amber-100/70 text-[11px]">إجمالي الطلاب</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10 text-xs text-center">
            <div className="text-blue-300 font-bold text-lg">
              {totalServants.length}
            </div>
            <div className="text-amber-100/70 text-[11px]">إجمالي الخدام</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10 text-xs text-center">
            <div className="text-emerald-300 font-bold text-lg">
              {classes.length}
            </div>
            <div className="text-amber-100/70 text-[11px]">فصول معتمدة</div>
          </div>
        </div>
      </div>

      {/* 1. The 4 Major Executive Metric Cards - Prominent at the very top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students Card */}
        <div
          onClick={() => setActiveTab('classes')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">إجمالي طلاب المدرسة</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-1 flex items-baseline gap-1.5">
            <span>{totalStudents.length}</span>
            <span className="text-xs font-normal text-stone-500">طالب مسجل</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{activeStudents.length} نشط بالـ ٧ فصول</span>
            {pendingStudents.length > 0 && (
              <span className="text-rose-600 font-bold">({pendingStudents.length} بانتظار الاعتماد)</span>
            )}
          </div>
        </div>

        {/* Total Servants Card */}
        <div
          onClick={() => setActiveTab('servants')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">إجمالي الخدام والمسؤولين</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-1 flex items-baseline gap-1.5">
            <span>{totalServants.length}</span>
            <span className="text-xs font-normal text-stone-500">خادم مسجل</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{attendedServants.length} أكدوا تحضير اللقاء القادم</span>
          </div>
        </div>

        {/* 7 Classes Card */}
        <div
          onClick={() => setActiveTab('classes')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">الفصول الدراسية المعتمدة</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-1 flex items-baseline gap-1.5">
            <span>٧</span>
            <span className="text-xs font-normal text-stone-500">فصول كاملة</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>من ٤ ابتدائي حتى الكبار (٢٤ درجة للسيشن)</span>
          </div>
        </div>

        {/* Pending Requests & Approvals Card */}
        <div
          onClick={() => setActiveTab('pending')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">طلبات بانتظار موافقتك</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1 flex items-baseline gap-1.5">
            <span>{pendingUsers.length + pendingPosts.length}</span>
            <span className="text-xs font-normal text-stone-500">عملية معلقة</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            <span>{pendingUsers.length} طلب انضمام</span>
            <span>•</span>
            <span>{pendingPosts.length} مذكرات للخدام</span>
          </div>
        </div>
      </div>

      {/* 2. The 7-Class Visual Horizontal Ribbon - Direct Class Quick-Access */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
              توزيع الطلاب وإحصائيات الفصول السبعة (اضغط على أي فصل لفتحه مباشرة):
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {totalStudents.length === 0 ? (
              <button
                onClick={seedDemoData}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                title="شحن ١٤ طالب و ٢ خدام لتجربة رصد الدرجات فوراً"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ شحن طلاب وخدام تجريبيين للفصول</span>
              </button>
            ) : (
              <button
                onClick={clearAllStudentsAndServants}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="تفريغ كافة الطلاب والخدام والعودة للحساب الخالي"
              >
                <Trash2 className="w-3 h-3" />
                <span>تفريغ الطلاب للاختبار الحر</span>
              </button>
            )}
          </div>
        </div>

        {/* 7 Class Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {classes.map((cls) => {
            const classCount = users.filter((u) => u.role === 'student' && u.classId === cls.id && u.status === 'active').length;
            const isSelected = selectedClassId === cls.id && activeTab === 'classes';
            return (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  setActiveTab('classes');
                }}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-amber-500/40 bg-stone-50/50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs truncate mb-0.5">{cls.name}</div>
                  <div className="text-[10px] text-stone-400">{cls.ageRange}</div>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500">الطلاب:</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {classCount} طالب
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>سيكشن الفصول والطلاب والدرجات (٧ فصول)</span>
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'scores'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>كشف الدرجات والترتيب والأوائل (٦٠ + ٤٠ = ١٠٠)</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'pending'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>طلبات الانضمام والاعتماد</span>
          {pendingUsers.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('post_approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'post_approvals'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>اعتماد منشورات ومذكرات الخدام</span>
          {pendingPosts.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
              {pendingPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('servants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'servants'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>متابعة الخدام والتحضيرات ({servantSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assistants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'assistants'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>مساعدو الإدارة والصلاحيات</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Printer className="w-4 h-4 text-emerald-500" />
          <span>التقارير والكشوفات والطباعة</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <PartyPopper className="w-4 h-4 text-purple-400" />
          <span>الحفلات والمناسبات والتكريمات</span>
        </button>
      </div>

      {/* TAB 1: سيكشن الفصول والطلاب والدرجات (7 Classes) */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Class Selectors Pill Bar: 7 Classes */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر من بين الفصول السبعة لعرض الطلاب ورصد درجاتهم:
              </span>

              <div className="flex items-center gap-2">
                {sessions.find((s) => s.classId === selectedClassId) && (
                  <button
                    onClick={() => {
                      const s = sessions.find((item) => item.classId === selectedClassId);
                      if (s) setSelectedSessionForQr(s);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>عرض باركود QR للحضور</span>
                  </button>
                )}

                <button
                  onClick={() => setNewSessionModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة لقاء أسبوعي جديد لهذا الفصل</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {classes.map((cls) => {
                const count = users.filter(
                  (u) => u.role === 'student' && u.classId === cls.id && u.status === 'active'
                ).length;
                const isSelected = selectedClassId === cls.id;

                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-bold ring-2 ring-amber-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{cls.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{cls.ageRange}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">{count} طلاب</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Class Sessions Roster */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{currentClassObj.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    ({currentClassObj.ageRange})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  اضغط على أي طالب لكتابة ورصد درجاته في الامتحان، الواجب، الحضور، المشاركة، الصلاة، والأدوات لتظهر له فوراً.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  اللقاءات المنعقدة: {sessions.filter((s) => s.classId === selectedClassId).length}
                </span>
              </div>
            </div>

            {/* Students Table */}
            {users.filter((u) => u.role === 'student' && u.classId === selectedClassId && u.status === 'active').length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                لا يوجد طلاب مفعلين في هذا الفصل حتى الآن. (يمكنك قبول طلبات الانضمام المعلقة من تبويب "طلبات الانضمام").
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">
                      <th className="py-3 px-3 font-bold">اسم الطالب</th>
                      <th className="py-3 px-3 font-bold">رقم الهاتف وولي الأمر</th>
                      <th className="py-3 px-2 text-center font-bold">أعمال السنة (٦٠)</th>
                      <th className="py-3 px-2 text-center font-bold">الامتحان النهائي (٤٠)</th>
                      <th className="py-3 px-3 text-center font-black text-amber-900 dark:text-amber-300">المجموع الكلي (١٠٠)</th>
                      <th className="py-3 px-3 text-center font-bold">الإجراءات ورصد الدرجات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users
                      .filter((u) => u.role === 'student' && u.classId === selectedClassId && u.status === 'active')
                      .map((student) => {
                        const summary = getStudentScoreSummary(student.id);
                        return (
                          <tr key={student.id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-[11px]">
                                  {student.name.slice(0, 1)}
                                </div>
                                <span>{student.name}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                              <div className="font-mono text-[11px]">{student.phone}</div>
                              {student.guardianPhone && (
                                <div className="text-[10px] text-slate-400">ولي الأمر: {student.guardianPhone}</div>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                                {summary.yearWorkScore} / ٦٠
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  setStudentForFinalExam(student);
                                  setTempFinalScore(summary.finalExamScore);
                                  setFinalExamModalOpen(true);
                                }}
                                className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-800 dark:text-indigo-300 font-bold cursor-pointer"
                              >
                                {summary.finalExamScore} / ٤٠ ✏️
                              </button>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 font-black text-xs">
                                {summary.totalScore} / ١٠٠
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleOpenGrading(student)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>رصد درجات اللقاءات الأسبوعية</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: سيكشن الدرجات والترتيب والأوائل */}
      {activeTab === 'scores' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    كشف الدرجات والترتيب والأوائل لكل فصل
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  أعمال السنة (متوسط السيشنات من ٦٠) + الامتحان النهائي (من ٤٠) = المجموع الكلي (من ١٠٠).
                </p>
              </div>

              {/* Class Filter Tab buttons: 7 Classes */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedClassId === cls.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 Podiums Banner */}
            {(() => {
              const leaderboard = getClassLeaderboard(selectedClassId);
              if (leaderboard.length === 0) return null;

              const top1 = leaderboard[0];
              const top2 = leaderboard[1];
              const top3 = leaderboard[2];

              return (
                <div className="bg-gradient-to-r from-amber-900/10 via-amber-500/15 to-amber-900/10 dark:from-slate-800 dark:to-slate-800 border border-amber-300/60 dark:border-amber-600/30 p-5 rounded-2xl">
                  <div className="text-center font-bold text-xs text-amber-900 dark:text-amber-300 mb-4 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>لوحة شرف الأوائل - {currentClassObj.name}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {top2 && (
                      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs order-2 sm:order-1">
                        <div className="text-2xl mb-1">🥈</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">المركز الثاني</div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{top2.studentName}</div>
                        <div className="text-xs font-black text-amber-800 dark:text-amber-300 mt-1">{top2.totalScore} / ١٠٠</div>
                        <button
                          onClick={() =>
                            setCertData({
                              studentName: top2.studentName,
                              className: currentClassObj.name,
                              totalScore: top2.totalScore,
                              rank: 2,
                            })
                          }
                          className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-bold"
                        >
                          عرض الشهادة الرسمية
                        </button>
                      </div>
                    )}

                    {top1 && (
                      <div className="bg-gradient-to-b from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl border-2 border-amber-400 dark:border-amber-500 text-center shadow-md order-1 sm:order-2 scale-105">
                        <div className="text-3xl mb-1">🥇</div>
                        <div className="text-xs font-black text-amber-700 dark:text-amber-400">المركز الأول والدرع الذهبي</div>
                        <div className="font-black text-slate-900 dark:text-slate-100 text-base mt-0.5">{top1.studentName}</div>
                        <div className="text-sm font-black text-amber-900 dark:text-amber-300 mt-1">{top1.totalScore} / ١٠٠</div>
                        <button
                          onClick={() =>
                            setCertData({
                              studentName: top1.studentName,
                              className: currentClassObj.name,
                              totalScore: top1.totalScore,
                              rank: 1,
                            })
                          }
                          className="mt-2.5 px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                        >
                          تتويج وطباعة الشهادة 🎓
                        </button>
                      </div>
                    )}

                    {top3 && (
                      <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs order-3 sm:order-3">
                        <div className="text-2xl mb-1">🥉</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">المركز الثالث</div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{top3.studentName}</div>
                        <div className="text-xs font-black text-amber-800 dark:text-amber-300 mt-1">{top3.totalScore} / ١٠٠</div>
                        <button
                          onClick={() =>
                            setCertData({
                              studentName: top3.studentName,
                              className: currentClassObj.name,
                              totalScore: top3.totalScore,
                              rank: 3,
                            })
                          }
                          className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-bold"
                        >
                          عرض الشهادة الرسمية
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Complete Ranking Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/80">
                    <th className="py-3 px-3 font-bold text-center">الترتيب</th>
                    <th className="py-3 px-3 font-bold">اسم الطالب</th>
                    <th className="py-3 px-2 text-center font-bold">أعمال السنة (٦٠)</th>
                    <th className="py-3 px-2 text-center font-bold">الامتحان النهائي (٤٠)</th>
                    <th className="py-3 px-3 text-center font-black text-amber-900 dark:text-amber-300">المجموع (١٠٠)</th>
                    <th className="py-3 px-3 text-center font-bold">شهادة التفوق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {getClassLeaderboard(selectedClassId).map((row, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <tr
                        key={row.studentId}
                        className={`hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                          isTop1
                            ? 'bg-amber-50/40 dark:bg-amber-950/30 font-bold'
                            : isTop2 || isTop3
                            ? 'bg-amber-50/20 dark:bg-amber-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          {isTop1 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-2xs">
                              🥇 الأول
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-900 font-bold text-xs">
                              🥈 الثاني
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-900 dark:text-amber-300 font-bold text-xs">
                              🥉 الثالث
                            </span>
                          ) : (
                            <span className="text-slate-500 font-semibold">{idx + 1}</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {row.studentName}
                        </td>

                        <td className="py-3 px-2 text-center font-bold text-emerald-800 dark:text-emerald-300">
                          {row.yearWorkScore} / ٦٠
                        </td>

                        <td className="py-3 px-2 text-center font-bold text-indigo-800 dark:text-indigo-300">
                          <button
                            onClick={() => {
                              const st = users.find((u) => u.id === row.studentId);
                              if (st) {
                                setStudentForFinalExam(st);
                                setTempFinalScore(row.finalExamScore);
                                setFinalExamModalOpen(true);
                              }
                            }}
                            className="hover:underline cursor-pointer"
                          >
                            {row.finalExamScore} / ٤٠ ✏️
                          </button>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 font-black text-xs">
                            {row.totalScore} / ١٠٠
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() =>
                              setCertData({
                                studentName: row.studentName,
                                className: currentClassObj.name,
                                totalScore: row.totalScore,
                                rank: idx + 1,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            عرض وطباعة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: طلبات الانضمام والاعتماد */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  طلبات الانضمام الجديدة (قيد المراجعة والاعتماد)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لا يمكن لأي طالب أو خادم الدخول إلى الفصل إلا بعد قبول واعتماد الإدارة هنا.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
              {pendingUsers.length} طلبات معلقة
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                تم اعتماد جميع طلبات الانضمام، لا توجد طلبات معلقة حالياً!
              </h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((pUser) => {
                const targetClass = classes.find((c) => c.id === pUser.classId);

                return (
                  <div
                    key={pUser.id}
                    className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800/60 space-y-4 text-xs shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{pUser.name}</div>
                        <div className="text-amber-800 dark:text-amber-400 font-semibold mt-0.5">
                          {pUser.role === 'servant' ? '✝️ يطلب الانضمام كـ خادم' : '📖 يطلب الالتحاق كـ مخدوم (طالب)'}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                        طلب معلق ⏳
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-slate-700 dark:text-slate-300">
                      <div>• <strong>رقم الهاتف:</strong> <span className="font-mono">{pUser.phone}</span></div>
                      {pUser.guardianPhone && (
                        <div>• <strong>هاتف ولي الأمر:</strong> <span className="font-mono">{pUser.guardianPhone}</span></div>
                      )}
                      <div>• <strong>السن:</strong> {pUser.age} سنة</div>
                      {pUser.classId && (
                        <div>• <strong>الفصل المطلوب:</strong> <span className="font-bold text-amber-900 dark:text-amber-400">{targetClass?.name}</span></div>
                      )}
                      <div>• <strong>أب الاعتراف:</strong> {pUser.confessionFather || 'لم يُحدد'}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => approveUser(pUser.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>قبول واعتماد الدخول للفصل ✅</span>
                      </button>

                      <button
                        onClick={() => rejectUser(pUser.id)}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: اعتماد منشورات ومذكرات الخدام (Requested: لما الخادم ينزل حاجه متتنشرش غير لما الادمن يوافق عليها) */}
      {activeTab === 'post_approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  اعتماد منشورات ومذكرات الخدام ونشر إعلانات الفصول
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                «أي مذكرة، مسابقة، أو منشور يرفعه الخادم لا يظهر للطلاب حتى يوافق عليه الأدمن، أو انشر مباشرة لفصل معين».
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setNewPostModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>+ نشر إعلان / مذكرة جديدة لفصل معين</span>
              </button>

              <span className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
                {pendingPosts.length} منشورات معلقة
              </span>
            </div>
          </div>

          {postPublishedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم نشر المنشور فوراً بنجاح ومتاح الآن حصرياً لطلاب الفصل المستهدف! ✅</span>
            </div>
          )}

          <div className="space-y-4">
            {pendingPosts.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  تمت مراجعة جميع منشورات الخدام، لا يوجد شيء معلق!
                </h4>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map((post) => {
                  const targetCls = classes.find((c) => c.id === post.classId);

                  return (
                    <div
                      key={post.id}
                      className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-slate-800/60 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 dark:border-slate-700 pb-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {post.title}
                          </span>
                          <div className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                            الخادم الرافع: <strong>{post.servantName}</strong> | مخصص لـ: <strong>{targetCls?.name}</strong>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                          بانتظار الموافقة والنشر ⏳
                        </span>
                      </div>

                      {post.bibleVerse && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-serif text-amber-900 dark:text-amber-300 italic">
                          «{post.bibleVerse}»
                        </div>
                      )}

                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {post.content}
                      </p>

                      {post.attachmentName && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>المرفق: {post.attachmentName}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => rejectLessonPost(post.id)}
                          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          رفض المنشور
                        </button>

                        <button
                          onClick={() => approveLessonPost(post.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>موافقة ونشر فوري للطلاب ✅</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: متابعة الخدام والتحضيرات */}
      {activeTab === 'servants' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  متابعة حضور الخدام ورفع التحضيرات الأسبوعية
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تسجيل الحضور أو الاعتذار لـ اجتماع الجمعة القادم مع تفاصيل ومرفقات تحضير الدروس.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {servantSubmissions.map((sub) => {
              const isAttending = sub.status === 'attending';

              return (
                <div
                  key={sub.id}
                  className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                    isAttending
                      ? 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isAttending ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'}`}>
                        {isAttending ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{sub.servantName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{sub.servantPhone}</div>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${isAttending ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {isAttending ? 'حاضر بإذن المسيح ✅' : 'معتذر عن الحضور ❌'}
                    </span>
                  </div>

                  {!isAttending ? (
                    <div className="bg-rose-100/50 dark:bg-rose-950/40 p-3 rounded-xl text-rose-900 dark:text-rose-300">
                      <strong>سبب الاعتذار:</strong> {sub.absenceReason || 'ظرف طارئ'}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <strong className="text-slate-800 dark:text-slate-200 block text-xs">عنوان الدرس المرفوع: {sub.prepTitle}</strong>
                      {sub.prepBibleVerse && <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">الشاهد: {sub.prepBibleVerse}</div>}
                      {sub.prepAttachmentName && (
                        <div className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2 pt-1">
                          <FileText className="w-4 h-4" />
                          <span>المرفق المعتمد: {sub.prepAttachmentName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: مساعدو الإدارة والصلاحيات */}
      {activeTab === 'assistants' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  تحديد وتعيين مساعدي الإدارة
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                منح صلاحيات مساعد إدارة لرصد وتعديل الدرجات ومتابعة الطلاب.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users
              .filter((u) => u.role === 'servant' || u.role === 'assistant')
              .map((servant) => {
                const isAssistant = servant.role === 'assistant';

                return (
                  <div
                    key={servant.id}
                    className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                      isAssistant
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{servant.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{servant.phone}</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isAssistant ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {isAssistant ? '🛡️ مساعد إدارة معتمد' : 'خادم فصل'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isAssistant ? 'صلاحيات رصد درجات ومتابعة' : 'خدمة الفصل'}
                      </span>

                      <button
                        onClick={() => toggleAssistantRole(servant.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          isAssistant
                            ? 'bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {isAssistant ? 'إلغاء صفة المساعد' : 'تعيين كمساعد إدارة'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 7: التقارير والكشوفات والطباعة */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  التقارير الإحصائية وطباعة الكشوفات المعتمدة
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                استخراج وطباعة كشوف درجات الطلاب، إحصائيات الحضور والغياب، وتقارير أداء الفصول السبعة.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ أمر طباعة التقرير الحالي</span>
            </button>
          </div>

          {/* 3 Executive Report Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                📊 تقرير نسب الحضور العام
              </span>
              <p className="text-xs text-stone-500 leading-relaxed">
                إجمالي الطلاب المقيدين: <strong>{totalStudents.length}</strong> | الحضور بـ QR: <strong>{grades.filter(g => g.attendance === 1).length}</strong> حضور مسجل.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                🏆 تقرير المتفوقين والأوائل
              </span>
              <p className="text-xs text-stone-500 leading-relaxed">
                كشف الأوائل الثلاثة من كل فصل جاهز للطباعة والتعليق في لوحة شرف الكنيسة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                ✝️ تقرير التزام الخدام
              </span>
              <p className="text-xs text-stone-500 leading-relaxed">
                عدد الخدام المسجلين: <strong>{totalServants.length}</strong> | التحضيرات المرفوعة: <strong>{servantSubmissions.length}</strong> تحضيراً.
              </p>
            </div>
          </div>

          {/* Detailed Printable Grade Roster for Selected Class */}
          <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                كشف درجات الفصل المعتمد: {currentClassObj.name}
              </h4>
              <div className="flex gap-1.5 flex-wrap">
                {classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedClassId === c.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                  <th className="py-2.5 px-3">الترتيب</th>
                  <th className="py-2.5 px-3">اسم الطالب</th>
                  <th className="py-2.5 px-3 text-center">أعمال السنة (٦٠)</th>
                  <th className="py-2.5 px-3 text-center">الامتحان النهائي (٤٠)</th>
                  <th className="py-2.5 px-3 text-center font-bold">المجموع الكلي (١٠٠)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {getClassLeaderboard(selectedClassId).map((row, idx) => (
                  <tr key={row.studentId}>
                    <td className="py-2 px-3 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold">{row.studentName}</td>
                    <td className="py-2 px-3 text-center text-emerald-700 dark:text-emerald-400 font-bold">{row.yearWorkScore} / ٦٠</td>
                    <td className="py-2 px-3 text-center text-indigo-700 dark:text-indigo-400 font-bold">{row.finalExamScore} / ٤٠</td>
                    <td className="py-2 px-3 text-center font-black text-amber-800 dark:text-amber-300">{row.totalScore} / ١٠٠</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: الحفلات والمناسبات والتكريمات */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  أجندة الحفلات السنوية والتكريمات والمناسبات الكنسية
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة احتفالات ختام العام، يوم التكريم، وتوزيع الجوائز وشهادات التقدير التذكارية.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event 1 */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-purple-50/60 dark:from-stone-800 dark:to-stone-850 border border-amber-200/80 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  🏆 حفلة ختام العام الدراسي وتوزيع الكؤوس
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                  الحدث الأكبر السنوي
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                يقام على مسرح الكنيسة الكبير بحضور آباء الكنيسة الأجلاء، ويتضمن عرض مسرحي لكرازة القديس بولس، وتوزيع كؤوس التفوق للأوائل، وشهادات تذكارية لكافة المشاركين.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-amber-200/40 dark:border-stone-700">
                <span>📍 المكان: مسرح الكنيسة</span>
                <span>•</span>
                <span>🎁 تكريم الأوائل بالـ ٧ فصول</span>
              </div>
            </div>

            {/* Event 2 */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-stone-800 dark:to-stone-850 border border-blue-200/80 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  🎓 يوم تكريم المتفوقين وحاملي شهادات التقدير
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold text-[10px]">
                  تكريم فصلي
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                تكريم الطلاب الحاصلين على أعلى درجات أعمال السنة (٦٠) والامتحان النهائي (٤٠) بمجموع يفوق ٩٠٪، مع منحهم درع التفوق الدراسي.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-blue-200/40 dark:border-stone-700">
                <span>🎖️ شهادات تقدير معتمدة</span>
                <span>•</span>
                <span>📸 التقاط صور تذكارية</span>
              </div>
            </div>

            {/* Event 3 */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-stone-800 dark:to-stone-850 border border-emerald-200/80 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  ⛪ المؤتمر الروحي السنوي لمدرسة الكتاب
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[10px]">
                  مؤتمر صيفي
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                ٣ أيام روحية في بيت مارمينا للمؤتمرات، دراسة تفسيرية معمقة لرسائل القديس بولس، قداسات يومية، ومسابقات ثقافية ورياضية.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-emerald-200/40 dark:border-stone-700">
                <span>🏕️ ٣ أيام مبيت</span>
                <span>•</span>
                <span>📖 دراسات لاهوتية وكتابية</span>
              </div>
            </div>

            {/* Event 4 */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/60 to-amber-50/60 dark:from-stone-800 dark:to-stone-850 border border-rose-200/80 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  🌟 مسابقة الصوم الكبير الكبرى وأعياد القيامة
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-bold text-[10px]">
                  مسابقة كنسية
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                أسئلة أسبوعية لكل مرحلة من مراحل المدرسة الـ ٧، مع رصد درجات إضافية للطلاب المشاركين وجوائز قيمة في أحد القيامة المجيد.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-rose-200/40 dark:border-stone-700">
                <span>🎁 جوائز تشجيعية</span>
                <span>•</span>
                <span>📝 أسئلة لكل مرحلة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Targeted Per-Class Post Publishing (Requested by User) */}
      {newPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  نشر إعلان أو مذكرة موجهة لفصل معين حصرياً
                </h3>
              </div>
              <button
                onClick={() => setNewPostModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminCreatePost} className="space-y-3.5 text-xs">
              {/* Target Class Selection (Mandatory per User Request) */}
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                  اختر الفصل المستهدف (سيتم النشر حصرياً لطلاب هذا الفصل فقط): <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newPostTargetClass}
                  onChange={(e) => setNewPostTargetClass(e.target.value as ClassId)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-500/50 bg-amber-50/40 dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-200"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.ageRange})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    تصنيف المنشور:
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="announcement">📢 إعلان هام وتنبيه للفصل</option>
                    <option value="lesson_handout">📖 مذكرة وملخص درس</option>
                    <option value="bible_study">✝️ بحث ودراسة كتابية</option>
                    <option value="quiz">🎯 مسابقة وتحدي آيات</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    عنوان المنشور / المذكرة: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إعلان موعد امتحان سفر التكوين"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {/* Bible Verse */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  الشاهد الكتابي والآية الحافظة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: فِيلِبِّي ٤ : ١٣"
                  value={newPostVerse}
                  onChange={(e) => setNewPostVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  نص المنشور والتفاصيل: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب التنبيه أو محتوى المذكرة هنا..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Attachment Name */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  اسم ملف المرفق (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: جدول_امتحانات_الفصل.pdf"
                  value={newPostAttachment}
                  onChange={(e) => setNewPostAttachment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewPostModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>نشر مباشر للفصل الآن ✅</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Grading Modal for Session */}
      {gradingModalOpen && selectedStudentForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-amber-50">
                  رصد وتعديل درجات الطالب: {selectedStudentForGrading.name}
                </h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  تظهر الدرجات فوراً في لوحة الطالب وتحدث المجموع التراكمي
                </p>
              </div>

              <button
                onClick={() => setGradingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر اللقاء الأسبوعي: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSessionForGrading}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedSessionForGrading(sid);
                    const existingGrade = grades.find(
                      (g) => g.studentId === selectedStudentForGrading.id && g.sessionId === sid
                    );
                    if (existingGrade) {
                      setGradeExam(existingGrade.exam);
                      setGradeHomework(existingGrade.homework);
                      setGradeAttendance(existingGrade.attendance);
                      setGradeParticipation(existingGrade.participation);
                      setGradePrayer(existingGrade.prayer);
                      setGradeTools(existingGrade.tools);
                      setGradeNotes(existingGrade.notes || '');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {sessions
                    .filter((s) => s.classId === selectedStudentForGrading.classId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.date})
                      </option>
                    ))}
                </select>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/90 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-700 pb-2">
                  <span>معايير التقييم الستة (إجمالي اللقاء: ٢٤ درجة)</span>
                  <span className="text-amber-800 dark:text-amber-400 font-black text-sm">
                    المجموع: {Number(gradeExam) + Number(gradeHomework) + Number(gradeAttendance) + Number(gradeParticipation) + Number(gradePrayer) + Number(gradeTools)} / ٢٤
                  </span>
                </div>

                {/* Exam & Homework (من 10) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        ١. امتحان الدرس
                      </label>
                      <span className="text-xs font-black text-stone-500">من ١٠</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGradeExam((prev) => Math.max(0, Math.round((prev - 0.5) * 10) / 10))}
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-base cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        required
                        value={gradeExam}
                        onChange={(e) => setGradeExam(Math.min(10, Math.max(0, Number(e.target.value))))}
                        className="flex-1 py-1.5 text-center font-black text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setGradeExam((prev) => Math.min(10, Math.round((prev + 0.5) * 10) / 10))}
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-base cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        ٢. الواجب والأبحاث
                      </label>
                      <span className="text-xs font-black text-stone-500">من ١٠</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGradeHomework((prev) => Math.max(0, Math.round((prev - 0.5) * 10) / 10))}
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-base cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.5}
                        required
                        value={gradeHomework}
                        onChange={(e) => setGradeHomework(Math.min(10, Math.max(0, Number(e.target.value))))}
                        className="flex-1 py-1.5 text-center font-black text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setGradeHomework((prev) => Math.min(10, Math.round((prev + 0.5) * 10) / 10))}
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-base cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* The 4 Criteria as One-Click Toggle Buttons (الأدوات، الحضور، الصلاة، المشاركة) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                    اضغط على أي معيار لتغيير حالته فوراً (١ أو ٠):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* الأدوات والنوتة */}
                    <button
                      type="button"
                      onClick={() => setGradeTools((prev) => (prev >= 1 ? 0 : 1))}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        gradeTools >= 1
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎒</span>
                        <div>
                          <div className="text-xs font-bold">الأدوات (الكتاب والنوتة)</div>
                          <div className="text-[10px] mt-0.5 opacity-80">
                            {gradeTools >= 1 ? 'أحضر الأدوات كاملة' : 'لم يجلب الأدوات'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeTools >= 1 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                        {gradeTools >= 1 ? '١ / ١ ✅' : '٠ / ١ ⭕'}
                      </span>
                    </button>

                    {/* حضور الصلاة */}
                    <button
                      type="button"
                      onClick={() => setGradePrayer((prev) => (prev >= 1 ? 0 : 1))}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        gradePrayer >= 1
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">✝️</span>
                        <div>
                          <div className="text-xs font-bold">حضور الصلاة</div>
                          <div className="text-[10px] mt-0.5 opacity-80">
                            {gradePrayer >= 1 ? 'حضر الصلاة في الميعاد' : 'تأخر أو لم يحضر الصلاة'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradePrayer >= 1 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                        {gradePrayer >= 1 ? '١ / ١ ✅' : '٠ / ١ ⭕'}
                      </span>
                    </button>

                    {/* الحضور بالـ QR */}
                    <button
                      type="button"
                      onClick={() => setGradeAttendance((prev) => (prev >= 1 ? 0 : 1))}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        gradeAttendance >= 1
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📱</span>
                        <div>
                          <div className="text-xs font-bold">الحضور بالـ QR</div>
                          <div className="text-[10px] mt-0.5 opacity-80">
                            {gradeAttendance >= 1 ? 'حاضر باللقاء' : 'غائب عن اللقاء'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeAttendance >= 1 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                        {gradeAttendance >= 1 ? '١ / ١ ✅' : '٠ / ١ ⭕'}
                      </span>
                    </button>

                    {/* المشاركة والتفاعل */}
                    <button
                      type="button"
                      onClick={() => setGradeParticipation((prev) => (prev >= 1 ? 0 : 1))}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        gradeParticipation >= 1
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">💬</span>
                        <div>
                          <div className="text-xs font-bold">المشاركة والتفاعل</div>
                          <div className="text-[10px] mt-0.5 opacity-80">
                            {gradeParticipation >= 1 ? 'شارك بفاعلية وأجاب' : 'لم يشارك أثناء الدرس'}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeParticipation >= 1 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'}`}>
                        {gradeParticipation >= 1 ? '١ / ١ ✅' : '٠ / ١ ⭕'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الخادم أو رسالة تشجيع:
                </label>
                <textarea
                  rows={2}
                  value={gradeNotes}
                  onChange={(e) => setGradeNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-right"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وتثبيت الدرجات فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Exam Score */}
      {finalExamModalOpen && studentForFinalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-right">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              درجة الامتحان النهائي: {studentForFinalExam.name}
            </h3>

            <form onSubmit={handleSaveFinalExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الدرجة من ٤٠:
                </label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.5}
                  required
                  value={tempFinalScore}
                  onChange={(e) => setTempFinalScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFinalExamModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  حفظ وتحديث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New Session */}
      {newSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                إضافة لقاء أسبوعي جديد لـ {currentClassObj.name}
              </h3>
              <button
                onClick={() => setNewSessionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان اللقاء / الدرس</label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">الشاهد الكتابي</label>
                <input
                  type="text"
                  value={newSessionPassage}
                  onChange={(e) => setNewSessionPassage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">تاريخ اللقاء</label>
                  <input
                    type="date"
                    required
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">الخادم المسؤول</label>
                  <input
                    type="text"
                    value={newSessionServant}
                    onChange={(e) => setNewSessionServant(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewSessionModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                >
                  إنشاء وتفعيل اللقاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {certData && (
        <CertificateModal
          studentName={certData.studentName}
          className={certData.className}
          totalScore={certData.totalScore}
          rank={certData.rank}
          onClose={() => setCertData(null)}
        />
      )}

      {/* QR Code Display Modal for Session */}
      {selectedSessionForQr && (
        <QrAttendanceModal
          session={selectedSessionForQr}
          mode="servant_display"
          onClose={() => setSelectedSessionForQr(null)}
        />
      )}

      {/* COMPREHENSIVE FEATURES GUIDE MODAL */}
      {featuresModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 space-y-6 text-right max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h3 className="text-lg sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>دليل كافة مميزات وإمكانيات مدرسة سانت بولس</span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-300/40">
                      خريطة النظام الشاملة
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي - مرجع كامل لكافة الخصائص المفعلة في المنصة.
                </p>
              </div>

              <button
                onClick={() => setFeaturesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Features Content Grid */}
            <div className="overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Category 1: Classes & Structure */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">🏫</span>
                  <h4>١. الفصول السبعة المستقلة (7 Classes Structure)</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  نظام فصول دراسية مستقلة لكل مرحلة عمرية: رابعة ابتدائي، خامسة ابتدائي، سادسة ابتدائي، أولى إعدادي، ثانية وثالثة إعدادي، مرحلة ثانوي، ومرحلة الكبار والخريجين، مع مناهج كتابية مخصصة لكل فصل.
                </p>
              </div>

              {/* Category 2: Grading System (24 Marks) */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">⚖️</span>
                  <h4>٢. نظام تقييم اللقاء الدقيق (٢٤ درجة للسيشن)</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-amber-700 dark:text-amber-400">١٠ درجات:</strong> امتحان الدرس الأسبوعي
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-amber-700 dark:text-amber-400">١٠ درجات:</strong> الواجب والبحث الكتابي
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-emerald-700 dark:text-emerald-400">درجة واحدة (١):</strong> حضور اللقاء بالـ QR
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-emerald-700 dark:text-emerald-400">درجة واحدة (١):</strong> حضور الصلاة في الموعد
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-emerald-700 dark:text-emerald-400">درجة واحدة (١):</strong> الأدوات (الكتاب والنوتة)
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <strong className="text-emerald-700 dark:text-emerald-400">درجة واحدة (١):</strong> المشاركة والتفاعل
                  </div>
                </div>
              </div>

              {/* Category 3: One-Click Toggle Buttons */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">⚡</span>
                  <h4>٣. أزرار الرصد السريع بنقرة واحدة (One-Click Toggle Buttons)</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  في نافذة رصد الدرجات: أزرار تفاعلية للأدوات، الصلاة، الحضور، والمشاركة، حيث يضغط الخادم أو الأدمن على الزر مباشرة ليتحول بين (١/١ ✅) و (٠/١ ⭕) دون الحاجة لكتابة أرقام، مما يتيح رصد درجات الفصل كاملاً خلال دقائق معدودة.
                </p>
              </div>

              {/* Category 4: Smart QR Attendance */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">📱</span>
                  <h4>٤. نظام الحضور الذكي بـ QR Code الموحد</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  يفتح الخادم باركود QR للجلسة على الشاشة أو هاتفه، ويمسحه كل طالب عبر كاميرا هاتفه، فيُسجل حضوره وتوقيت وصوله فورياً على السيستم مع منحه درجة الحضور كاملة (١ من ١).
                </p>
              </div>

              {/* Category 5: 60 + 40 = 100 System & Certificates */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">🎓</span>
                  <h4>٥. احتساب المجموع (٦٠ أعمال سنة + ٤٠ امتحان نهائي = ١٠٠ درجة)</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  • <strong>أعمال السنة (٦٠ درجة):</strong> حساب تلقائي لمتوسط درجات لقاءات الطالب من ٢٤ ومعادلتها لتكون من ٦٠.
                  <br />
                  • <strong>الامتحان النهائي (٤٠ درجة):</strong> رصد وتعديل درجة الامتحان النهائي الشامل.
                  <br />
                  • <strong>لوحة الأوائل والشهادات:</strong> ترتيب الطلاب تلقائياً وتكريم المراكز الثلاثة الأولى مع إمكانية طباعة شهادات تقدير رسمية باسم الطالب والكنيسة.
                </p>
              </div>

              {/* Category 6: Lost Marks Analysis in Student View */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">🔍</span>
                  <h4>٦. كشف تحليل الدرجات («إيه اللي نقصت فيه وطرق التعويض»)</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  في لوحة الطالب، كشف تحليلي فوري يوضح بالضبط كم درجة نقصت في كل معيار (الامتحان، الواجب، الحضور، المشاركة، الصلاة، الأدوات)، لمساعدته على التطوير الروحي والمواظبة في اللقاءات القادمة.
                </p>
              </div>

              {/* Category 7: Security & Approvals */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">🔒</span>
                  <h4>٧. حوكمة التسجيل واعتماد مذكرات الخدام</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  • <strong>اعتماد الطلاب والخدام الجدد:</strong> لا يدخل أي حساب مسجل للفصل إلا بعد مراجعة وقبول الأدمن من تبويب "طلبات الانضمام".
                  <br />
                  • <strong>اعتماد مذكرات وأبحاث الخدام:</strong> أي مذكرة أو مسابقة يرفعها الخادم تمر أولاً على الأدمن لاعتمادها قبل أن تظهر للطلاب في فصلهم.
                  <br />
                  • <strong>متابعة حضور واعتذارات الخدام:</strong> تسجيل موقف الخادم المسبق (حاضر بالتحضير أو معتذر مع بيان السبب).
                </p>
              </div>

              {/* Category 8: Exclusivity & Responsiveness */}
              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100">
                  <span className="text-base">🛡️</span>
                  <h4>٨. حصرية لوحة التحكم وتوافق الموبايل والـ Dark Mode</h4>
                </div>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                  • <strong>حماية لوحة الأدمن:</strong> محظورة تماماً ومقصورة على حسابك (ts199075@gmail.com) فقط، ولا تظهر لغير الأدمن في القوائم أو الصفحات.
                  <br />
                  • <strong>تصميم متجاوب وسريع (Responsive):</strong> دعم كامل للهواتف الذكية مع قوائم إشعارات وحسابات منبثقة بسلاسة، ووضع ليلي (Dark Mode) هادئ ومريح للعين.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-500 font-serif italic">
                «وَالَّذِي أَعْطَى الْبَعْضَ أَنْ يَكُونُوا... مُعَلِّمِينَ»
              </span>
              <button
                onClick={() => setFeaturesModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-stone-900 dark:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer hover:bg-stone-800"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

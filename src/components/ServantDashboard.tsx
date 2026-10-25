import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  BookOpen,
  Send,
  AlertCircle,
  FileCheck,
  Check,
  Download,
  QrCode,
  Share2,
  Plus,
} from 'lucide-react';
import { QrAttendanceModal } from './QrAttendanceModal';
import { BibleSession } from '../types';

export const ServantDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    users,
    sessions,
    servantSubmissions,
    lessonPosts,
    submitServantCheckIn,
    createLessonPost,
    getStudentScoreSummary,
  } = useApp();

  const currentSubmission = servantSubmissions.find(
    (s) => s.servantId === currentUser?.id
  );

  const [status, setStatus] = useState<'attending' | 'absent'>(
    currentSubmission?.status || 'attending'
  );
  const [absenceReason, setAbsenceReason] = useState(
    currentSubmission?.absenceReason || ''
  );
  const [prepTitle, setPrepTitle] = useState(
    currentSubmission?.prepTitle || 'شرح سفر أعمال الرسل: كرازة القديس بولس في أثينا'
  );
  const [prepBibleVerse, setPrepBibleVerse] = useState(
    currentSubmission?.prepBibleVerse || 'لأَنَّنَا بِهِ نَحْيَا وَنَتَحَرَّكُ وَنُوجَدُ (أعمال ١٧ : ٢٨)'
  );
  const [attachmentName, setAttachmentName] = useState(
    currentSubmission?.prepAttachmentName || 'مذكرة_تحضير_أعمال_الرسل_الأسبوع_القادم.pdf'
  );
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'document' | 'notes'>(
    currentSubmission?.prepAttachmentType || 'pdf'
  );
  const [prepNotes, setPrepNotes] = useState(
    currentSubmission?.prepNotes || 'تم تجهيز أسئلة مسابقة سريعة وعرض سلايدات على الداتاشو مع خريطة رحلات بولس الرسول.'
  );

  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // New Post Modal State (نشر شيء جديد يتطلب موافقة الأدمن)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<'lesson_handout' | 'bible_study' | 'quiz' | 'announcement'>('lesson_handout');
  const [postVerse, setPostVerse] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postAttachmentName, setPostAttachmentName] = useState('');
  const [postSuccessNotice, setPostSuccessNotice] = useState(false);

  // QR Modal State
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<BibleSession | null>(null);

  // Servant's class
  const servantClassId = currentUser?.classId || 'prep_2_3';
  const classObj = classes.find((c) => c.id === servantClassId) || classes[4];
  const classStudents = users.filter(
    (u) => u.role === 'student' && u.classId === servantClassId && u.status === 'active'
  );
  const classSessions = sessions.filter((s) => s.classId === servantClassId);
  const activeSessionForQr = classSessions[classSessions.length - 1] || sessions[0];

  // Posts created by this servant
  const myPosts = lessonPosts.filter((p) => p.servantId === currentUser?.id);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submitServantCheckIn({
      status,
      absenceReason: status === 'absent' ? absenceReason : undefined,
      prepTitle: status === 'attending' ? prepTitle : undefined,
      prepBibleVerse: status === 'attending' ? prepBibleVerse : undefined,
      prepAttachmentName: status === 'attending' ? attachmentName : undefined,
      prepAttachmentType: status === 'attending' ? attachmentType : undefined,
      prepNotes: status === 'attending' ? prepNotes : undefined,
    });

    setIsSubmittedSuccess(true);
    setTimeout(() => setIsSubmittedSuccess(false), 4000);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    createLessonPost({
      title: postTitle.trim(),
      category: postCategory,
      bibleVerse: postVerse.trim(),
      content: postContent.trim(),
      attachmentName: postAttachmentName.trim() || undefined,
      classId: servantClassId,
    });

    setPostTitle('');
    setPostVerse('');
    setPostContent('');
    setPostAttachmentName('');
    setIsPostModalOpen(false);
    setPostSuccessNotice(true);
    setTimeout(() => setPostSuccessNotice(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-right">
      {/* Header with Church & Saint Paul aesthetics */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="text-xs text-amber-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-amber-300/20">
              بوابة الخدام ومسؤولي الدروس
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-50">
            أهلاً بك يا خادم المسيح: {currentUser?.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-100/80 pt-1">
            <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30 font-bold text-amber-200">
              {classObj.name}
            </span>
            <span>رقم الهاتف: <strong>{currentUser?.phone}</strong></span>
            <span>•</span>
            <span>أب الاعتراف: <strong>{currentUser?.confessionFather || 'أبونا ميخائيل القمص'}</strong></span>
          </div>
        </div>

        {/* Big QR Button for Servant */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {activeSessionForQr && (
            <button
              onClick={() => setSelectedSessionForQr(activeSessionForQr)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <QrCode className="w-5 h-5" />
              <span>فتح QR كود حضور الجلسة للطلاب 📱</span>
            </button>
          )}
        </div>
      </div>

      {/* Post Success Notice */}
      {postSuccessNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <strong>تم إرسال المادة التعليمية بنجاح!</strong> كما طلبت، المنشور الآن في حالة <strong className="underline">«قيد المراجعة»</strong> ولن يظهر للطلاب إلا بعد موافقة واعتماد الأدمن المسؤول.
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form: Pre-meeting Readiness (الحضور والتحضير) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                تأكيد الحضور ورفع تحضير درس الاجتماع القادم
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يرجى إتمام هذا التقرير قبل موعد الاجتماع ليظهر مباشرة في لوحة إدارة المدرسة وأمانة الخدمة.
            </p>
          </div>

          {currentSubmission && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم تسجيل استجابتك: {currentSubmission.submittedAt}</span>
            </div>
          )}
        </div>

        {isSubmittedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>تم إرسال تقريرك بنجاح!</strong> تم إشعار أمين الخدمة ومسؤول النظام برفعك للتحضير أو حالة حضورك.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Status Switch: Attending vs Absent */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              هل ستحضر اجتماع الجمعة القادم بإذن المسيح؟ <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus('attending')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  status === 'attending'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'attending' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">حاضر بإذن المسيح ✅</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">سأتواجد وأقوم برفع تحضير الدرس كمرفق</div>
                  </div>
                </div>
                {status === 'attending' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setStatus('absent')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  status === 'absent'
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold ring-2 ring-rose-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">معتذر لظرف طارئ ❌</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">يتطلب ذكر سبب الاعتذار لتسجيله للإدارة</div>
                  </div>
                </div>
                {status === 'absent' && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
              </button>
            </div>
          </div>

          {/* If Absent */}
          {status === 'absent' ? (
            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
                سبب الاعتذار عن حضور الاجتماع: <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="برجاء توضيح سبب الاعتذار وهل تم التنسيق مع خادم بديل؟"
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-right"
              />
            </div>
          ) : (
            /* If Attending */
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  بيانات ومرفق تحضير الدرس الأسبوعي:
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  يسمع في لوحة تحكم الأدمن فوراً
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الدرس / الموضوع
                  </label>
                  <input
                    type="text"
                    required
                    value={prepTitle}
                    onChange={(e) => setPrepTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الشاهد الكتابي والآية الذهبية
                  </label>
                  <input
                    type="text"
                    required
                    value={prepBibleVerse}
                    onChange={(e) => setPrepBibleVerse(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  إرفاق ملف التحضير:
                </label>
                <div className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 bg-amber-50/40 dark:bg-slate-800/80 text-center">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {attachmentName ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        تم إرفاق: {attachmentName}
                      </span>
                    ) : (
                      'اضغط لاختيار ملف المذكرة'
                    )}
                  </div>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAttachmentName(f.name);
                    }}
                    className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التقرير وتثبيته في لوحة الإدارة</span>
            </button>
          </div>
        </form>
      </div>

      {/* Educational Post Creation Section (يتطلب موافقة الأدمن) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                نشر مذكرات ومسابقات كتابية للطلاب (نظام الاعتماد والموافقة)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              «لما الخادم ينزل حاجة متتنشرش غير لما الأدمن يوافق عليها» - يتم مراجعة كل محتوى واعتماده رسمياً.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مذكرة / مسابقة جديدة</span>
          </button>
        </div>

        {/* My Posts Roster with Status Badges */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            منشوراتي السابقة وحالة موافقة الإدارة:
          </h4>

          {myPosts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">لم تقم بإضافة منشورات بعد.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{post.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        post.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : post.status === 'pending_approval'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {post.status === 'approved'
                        ? 'معتمد ومنشور للطلاب ✅'
                        : post.status === 'pending_approval'
                        ? 'قيد مراجعة الأدمن ⏳'
                        : 'مرفوض ❌'}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Class Students Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-700" />
              قائمة طلاب فصلي ({classObj.name})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              بيانات التواصل مع المخدومين ومتابعة درجاتهم.
            </p>
          </div>

          <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full font-bold">
            {classStudents.length} طلاب مسجلين
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classStudents.map((st) => {
            const scoreSummary = getStudentScoreSummary(st.id);
            return (
              <div
                key={st.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{st.name}</div>
                  <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    {scoreSummary.totalScore} / ١٠٠
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <div>الهاتف: <strong className="font-mono">{st.phone}</strong></div>
                  {st.guardianPhone && <div>ولي الأمر: <strong className="font-mono">{st.guardianPhone}</strong></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Create New Educational Material / Post */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              إضافة مذكرة درس أو مسابقة للنشر بفصلك
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              ⚠️ تنبيه: المنشور سيذهب أولاً للوحة تحكم الأدمن، ولن يتم نشره للطلاب إلا بعد اعتماده رسمياً.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المذكرة / المسابقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مذكرة شرح رسالة غلاطية وأسئلة الآيات"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الشاهد الكتابي والآية الحافظة
                </label>
                <input
                  type="text"
                  placeholder="مثال: غلاطية ٥ : ٢٢"
                  value={postVerse}
                  onChange={(e) => setPostVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نص المذكرة أو إرشادات المسابقة <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب التوجيهات أو ملخص الدرس..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم ملف المرفق (PDF / Docx):
                </label>
                <input
                  type="text"
                  placeholder="مثال: مذكرة_الدرس_الثالث.pdf"
                  value={postAttachmentName}
                  onChange={(e) => setPostAttachmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  إرسال للأدمن للموافقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Attendance Modal */}
      {selectedSessionForQr && (
        <QrAttendanceModal
          session={selectedSessionForQr}
          mode="servant_display"
          onClose={() => setSelectedSessionForQr(null)}
        />
      )}
    </div>
  );
};

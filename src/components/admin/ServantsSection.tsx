import React, { useState } from 'react';
import { UserProfile, ClassInfo, ClassId, ServantAttendanceSubmission, ServantLessonPost } from '../../types';
import {
  Users,
  Shield,
  FileCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Edit,
  ArrowRightLeft,
  X,
  Check,
  Phone,
  BookOpen,
  Award,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface ServantsSectionProps {
  users: UserProfile[];
  classes: ClassInfo[];
  servantSubmissions: ServantAttendanceSubmission[];
  lessonPosts: ServantLessonPost[];
  updateServantProfile: (servantId: string, updates: { role?: UserProfile['role']; classId?: ClassId }) => void;
  toggleAssistantRole: (userId: string) => void;
  deleteUser: (userId: string) => void;
}

export const ServantsSection: React.FC<ServantsSectionProps> = ({
  users,
  classes,
  servantSubmissions,
  lessonPosts,
  updateServantProfile,
  toggleAssistantRole,
  deleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'servant' | 'assistant'>('all');
  const [classFilter, setClassFilter] = useState<ClassId | 'all'>('all');

  // Detailed Servant Profile View Modal
  const [selectedServant, setSelectedServant] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<'servant' | 'assistant'>('servant');
  const [editClassId, setEditClassId] = useState<ClassId>('prep_2_3');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Filter servants and assistants
  const allServants = users.filter((u) => u.role === 'servant' || u.role === 'assistant');
  const filteredServants = allServants.filter((serv) => {
    const matchesSearch =
      serv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (serv.phone && serv.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'all' || serv.role === roleFilter;
    const matchesClass = classFilter === 'all' || serv.classId === classFilter;
    return matchesSearch && matchesRole && matchesClass;
  });

  const handleOpenServantProfile = (serv: UserProfile) => {
    setSelectedServant(serv);
    setEditRole((serv.role === 'assistant' ? 'assistant' : 'servant') as any);
    setEditClassId((serv.classId || 'prep_2_3') as ClassId);
    setSaveSuccessMsg(false);
  };

  const handleSaveServantSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServant) return;

    updateServantProfile(selectedServant.id, {
      role: editRole,
      classId: editClassId,
    });

    // Update local modal state
    setSelectedServant({
      ...selectedServant,
      role: editRole,
      classId: editClassId,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  كشف الخدام ومساعدو أمين الخدمة
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  اضغط على اسم أي خادم لعرض صفحته وملفه الشخصي: متابعة حضوره، هل رفع الدرس، وتعيين رتبته وفصله.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <span className="text-stone-500 block text-[11px]">إجمالي الخدام المقيدين</span>
            <strong className="text-xl font-black text-stone-900 dark:text-white mt-1 block">
              {allServants.length} خادم
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
            <span className="text-amber-800 dark:text-amber-400 block text-[11px]">مساعدو أمين الخدمة</span>
            <strong className="text-xl font-black text-amber-900 dark:text-amber-300 mt-1 block">
              {allServants.filter((s) => s.role === 'assistant').length} مساعد
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">تحضيرات ومذكرات مرفوعة</span>
            <strong className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
              {servantSubmissions.filter((s) => s.prepTitle).length + lessonPosts.length} تحضير
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
            <span className="text-blue-700 dark:text-blue-400 block text-[11px]">حضور لقاء الخدمة</span>
            <strong className="text-xl font-black text-blue-900 dark:text-blue-300 mt-1 block">
              {servantSubmissions.filter((s) => s.status === 'attending').length} حاضر
            </strong>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex-1 min-w-[240px] relative">
            <input
              type="text"
              placeholder="ابحث باسم الخادم أو رقم هاتفه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="all">كافة الرتب (خدام ومساعدون)</option>
              <option value="assistant">مساعدو أمين الخدمة 🛡️</option>
              <option value="servant">خدام الفصول ✝️</option>
            </select>

            {/* Filter by class */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="all">كل الفصول</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Servants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServants.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            لا يوجد خدام مطابقين للبحث.
          </div>
        ) : (
          filteredServants.map((servant) => {
            const assignedClass = classes.find((c) => c.id === servant.classId);
            const submissions = servantSubmissions.filter((s) => s.servantId === servant.id);
            const posts = lessonPosts.filter((p) => p.servantId === servant.id);
            const hasAttended = submissions.some((s) => s.status === 'attending');
            const hasUploadedLesson = submissions.some((s) => s.prepTitle) || posts.length > 0;
            const isAssistant = servant.role === 'assistant';

            return (
              <div
                key={servant.id}
                onClick={() => handleOpenServantProfile(servant)}
                className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/50 hover:shadow-lg transition-all cursor-pointer space-y-4 group relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform border border-amber-500/30">
                      ✝️
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {servant.name}
                      </h4>
                      <span className="text-[11px] text-stone-500 font-mono" dir="ltr">
                        {servant.phone || 'بدون هاتف'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isAssistant
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300'
                    }`}
                  >
                    {isAssistant ? 'مساعد إدارة 🛡️' : 'خادم فصل ✝️'}
                  </span>
                </div>

                {/* Assigned Class */}
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70">
                  <span className="text-stone-500 text-[11px]">فصل الخدمة:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-400">
                    {assignedClass?.name || 'لم يُحدد'}
                  </span>
                </div>

                {/* Status Badges: Attended & Lesson Uploaded */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 ${
                      hasAttended
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
                    }`}
                  >
                    {hasAttended ? 'حضر اللقاء ✅' : 'لم يسجل حضور ⭕'}
                  </div>

                  <div
                    className={`p-2 rounded-xl border text-center font-bold flex items-center justify-center gap-1 ${
                      hasUploadedLesson
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
                    }`}
                  >
                    {hasUploadedLesson ? 'رفع الدرس 📄' : 'لم يرفع الدرس ⭕'}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 dark:text-amber-400 font-bold group-hover:underline">
                    فتح الصفحة والملف الشخصي ←
                  </span>
                  <span className="text-stone-400 text-[10px]">
                    {submissions.length} تسجيلات
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SERVANT DETAILED PROFILE MODAL */}
      {selectedServant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 text-right max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  ✝️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                      {selectedServant.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedServant.role === 'assistant'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                      }`}
                    >
                      {selectedServant.role === 'assistant' ? 'مساعد إدارة 🛡️' : 'خادم فصل ✝️'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono" dir="ltr">
                    {selectedServant.phone} • {selectedServant.email || 'حساب خادم مدرسة سانت بولس'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedServant(null)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Feedback banner */}
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ وتحديث رتبة وفصل الخادم بنجاح على النظام المركزي! ✅</span>
                </div>
              )}

              {/* SECTION 1: ROLE & CLASS ASSIGNMENT (Requested by User) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>إدارة الصلاحيات والفصل المسؤول عنه (تحكم الأدمن)</span>
                </div>

                <form onSubmit={handleSaveServantSettings} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Role Selector */}
                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        تحديد رتبة الخادم:
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                      >
                        <option value="servant">✝️ خادم فصل دراسي</option>
                        <option value="assistant">🛡️ مساعد أمين الخدمة (صلاحيات إدارة)</option>
                      </select>
                    </div>

                    {/* Class Selector */}
                    <div>
                      <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                        الفصل الدراسي المسؤول عنه:
                      </label>
                      <select
                        value={editClassId}
                        onChange={(e) => setEditClassId(e.target.value as ClassId)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.ageRange})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ تعيين الرتبة والفصل فوراً</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 2: ATTENDANCE RECORD - هل حضر شيئاً أم لا؟ */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>سجل الحضور والغياب والاعتذارات (هل حضر شيئاً أم لا؟)</span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {servantSubmissions.filter((s) => s.servantId === selectedServant.id).length} تسجيلات
                  </span>
                </div>

                {(() => {
                  const subs = servantSubmissions.filter((s) => s.servantId === selectedServant.id);
                  if (subs.length === 0) {
                    return (
                      <div className="p-5 text-center text-stone-400 bg-white dark:bg-stone-800 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                        لم يسجل هذا الخادم أي حضور أو اعتذار حتى الآن ⭕
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {subs.map((s) => {
                        const isAttending = s.status === 'attending';
                        return (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              isAttending
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold">
                                {isAttending ? 'حاضر بالخدمة ✅' : 'معتذر عن الحضور ❌'}
                              </div>
                              <div className="text-[11px] opacity-80">
                                {s.meetingTitle || s.meetingDate}
                              </div>
                              {!isAttending && s.absenceReason && (
                                <div className="text-[10px] text-rose-700 dark:text-rose-300 font-medium">
                                  سبب الاعتذار: {s.absenceReason}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] opacity-60 font-mono">
                              {s.submittedAt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 3: LESSONS & PREPARATIONS - هل رفع الدرس الذي شرحه أم لا؟ */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>الدروس والتحضيرات المرفوعة (هل رفع الدرس الذي شرحه أم لا؟)</span>
                  </div>
                </div>

                {(() => {
                  const prepList = servantSubmissions.filter(
                    (s) => s.servantId === selectedServant.id && s.prepTitle
                  );
                  const postsList = lessonPosts.filter(
                    (p) => p.servantId === selectedServant.id
                  );

                  if (prepList.length === 0 && postsList.length === 0) {
                    return (
                      <div className="p-5 text-center text-stone-400 bg-white dark:bg-stone-800 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                        لم يقم الخادم برفع أي تحضير درس أو مذكرة حتى الآن ⭕
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {/* Prep Submissions */}
                      {prepList.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-amber-800 dark:text-amber-400 font-bold">
                              📄 {p.prepTitle}
                            </strong>
                            <span className="text-[10px] text-stone-400">{p.submittedAt}</span>
                          </div>
                          {p.prepBibleVerse && (
                            <div className="text-[11px] text-stone-600 dark:text-stone-300 font-serif">
                              الشاهد: {p.prepBibleVerse}
                            </div>
                          )}
                          {p.prepAttachmentName && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>الملف المرفق: {p.prepAttachmentName}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Lesson Posts */}
                      {postsList.map((post) => (
                        <div
                          key={post.id}
                          className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-blue-800 dark:text-blue-400 font-bold">
                              📢 مذكرة فصل: {post.title}
                            </strong>
                            <span className="text-[10px] text-stone-400">{post.createdAt}</span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] line-clamp-2">
                            {post.content}
                          </p>
                          {post.attachmentName && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              المرفق: {post.attachmentName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedServant(null)}
                className="px-6 py-2 rounded-xl bg-stone-900 dark:bg-stone-800 text-white font-bold text-xs"
              >
                إغلاق الملف الشخصي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

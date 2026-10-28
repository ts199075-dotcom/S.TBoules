import React, { useState } from 'react';
import { UserProfile, ClassInfo, ClassId, SessionGrade } from '../../types';
import {
  GraduationCap,
  Search,
  Filter,
  UserPlus,
  Trash2,
  ArrowRightLeft,
  Edit,
  Phone,
  CheckCircle2,
  Clock,
  Award,
  X,
  Check,
  Shield,
  BookOpen,
} from 'lucide-react';

interface StudentsRosterSectionProps {
  users: UserProfile[];
  classes: ClassInfo[];
  grades: SessionGrade[];
  addStudentByAdmin: (data: Omit<UserProfile, 'id' | 'role' | 'status' | 'registeredAt'>) => Promise<UserProfile> | UserProfile;
  changeStudentClass: (studentId: string, newClassId: ClassId) => void;
  deleteUser: (userId: string) => void;
  approveUser: (userId: string) => void;
  onOpenGrading: (student: UserProfile) => void;
  onOpenCertificate: (student: UserProfile) => void;
  yearWorkApprovedClasses: Record<string, boolean>;
}

export const StudentsRosterSection: React.FC<StudentsRosterSectionProps> = ({
  users,
  classes,
  grades,
  addStudentByAdmin,
  changeStudentClass,
  deleteUser,
  approveUser,
  onOpenGrading,
  onOpenCertificate,
  yearWorkApprovedClasses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<ClassId | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  // Add Student Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClassId, setNewClassId] = useState<ClassId>('prep_2_3');
  const [newPhone, setNewPhone] = useState('');
  const [newAge, setNewAge] = useState<number | ''>(14);
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newConfessionFather, setNewConfessionFather] = useState('أبونا ميخائيل');
  const [addSuccessMsg, setAddSuccessMsg] = useState(false);

  // Transfer Student Modal State
  const [transferTargetStudent, setTransferTargetStudent] = useState<UserProfile | null>(null);
  const [transferNewClassId, setTransferNewClassId] = useState<ClassId>('prep_2_3');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState(false);

  // Filter students
  const allStudents = users.filter((u) => u.role === 'student');
  const filteredStudents = allStudents.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.phone && st.phone.includes(searchQuery)) ||
      (st.guardianPhone && st.guardianPhone.includes(searchQuery));
    const matchesClass = selectedClassFilter === 'all' || st.classId === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'all' || st.status === selectedStatusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeCount = allStudents.filter((s) => s.status === 'active').length;
  const pendingCount = allStudents.filter((s) => s.status === 'pending').length;

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    addStudentByAdmin({
      name: newName.trim(),
      phone: newPhone.trim(),
      classId: newClassId,
      age: Number(newAge) || 14,
      guardianPhone: newGuardianPhone.trim() || undefined,
      password: newPassword.trim() || '123456',
      confessionFather: newConfessionFather.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewGuardianPhone('');
    setAddModalOpen(false);
    setAddSuccessMsg(true);
    setTimeout(() => setAddSuccessMsg(false), 4000);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetStudent) return;
    changeStudentClass(transferTargetStudent.id, transferNewClassId);
    setTransferTargetStudent(null);
    setTransferSuccessMsg(true);
    setTimeout(() => setTransferSuccessMsg(false), 4000);
  };

  const handleDeleteStudent = (student: UserProfile) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${student.name}" نهائياً من السيستم؟`)) {
      deleteUser(student.id);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  كشف الطلاب العام لكافة الفصول الدراسية
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  إدارة الطلاب، إضافة طالب جديد، نقله بين الفصول، رصد الدرجات، وحذف الحسابات.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة طالب جديد</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <span className="text-stone-500 block text-[11px]">إجمالي الطلاب المقيدين</span>
            <strong className="text-xl font-black text-stone-900 dark:text-white mt-1 block">
              {allStudents.length} طالب
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">الطلاب النشطون بالفصول</span>
            <strong className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1 block">
              {activeCount} مفعل
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
            <span className="text-amber-800 dark:text-amber-400 block text-[11px]">طلبات قيد المراجعة</span>
            <strong className="text-xl font-black text-amber-900 dark:text-amber-300 mt-1 block">
              {pendingCount} معلق
            </strong>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
            <span className="text-blue-700 dark:text-blue-400 block text-[11px]">الفصول الدراسية</span>
            <strong className="text-xl font-black text-blue-900 dark:text-blue-300 mt-1 block">
              ٧ فصول رسمية
            </strong>
          </div>
        </div>

        {/* Feedback banners */}
        {addSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تمت إضافة الطالب الجديد بنجاح، وتفعيله فوراً على قاعدة البيانات المركزية! ✅</span>
          </div>
        )}

        {transferSuccessMsg && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 rounded-xl text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم نقل الطالب للفصل الجديد بنجاح وتحديث كافة سجلاته! ✅</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex-1 min-w-[240px] relative">
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو رقم هاتفه أو ولي أمره..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by class */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="all">كل الفصول الدراسية (٧)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filter by status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">مفعل فقط ✅</option>
              <option value="pending">قيد المراجعة ⏳</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold">
                <th className="py-3 px-3 text-center">#</th>
                <th className="py-3 px-3">اسم الطالب والسن</th>
                <th className="py-3 px-3">الفصل الدراسي</th>
                <th className="py-3 px-3">رقم الهاتف وولي الأمر</th>
                <th className="py-3 px-3 text-center">حالة الحساب</th>
                <th className="py-3 px-3 text-center">الحصص المرصودة</th>
                <th className="py-3 px-3 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    لا يوجد طلاب مطابقين للبحث أو الفلتر المحدد.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentClass = classes.find((c) => c.id === student.classId);
                  const studentGrades = grades.filter((g) => g.studentId === student.id);
                  const isClassCalculated = student.classId ? Boolean(yearWorkApprovedClasses[student.classId]) : false;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-bold text-stone-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          <span>{student.name}</span>
                          {student.age && (
                            <span className="text-[10px] text-stone-400 font-normal">
                              ({student.age} سنة)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-bold text-[11px] border border-amber-300/40">
                          <BookOpen className="w-3 h-3 text-amber-700" />
                          {studentClass?.name || 'فصل غير محدد'}
                        </span>
                      </td>

                      <td className="py-3 px-3 space-y-0.5 text-stone-600 dark:text-stone-300 font-mono text-[11px]" dir="ltr">
                        <div>{student.phone}</div>
                        {student.guardianPhone && (
                          <div className="text-[10px] text-stone-400">ولي الأمر: {student.guardianPhone}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {student.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مفعل ✅
                          </span>
                        ) : (
                          <button
                            onClick={() => approveUser(student.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[10px] hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                            title="اضغط لاعتماد الحساب فوراً"
                          >
                            <Clock className="w-3 h-3" />
                            معلق ⏳ (اضغط للقبول)
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[11px]">
                          {studentGrades.length} من ٨ حصص
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transfer Class Button */}
                          <button
                            onClick={() => {
                              setTransferTargetStudent(student);
                              setTransferNewClassId(student.classId || 'prep_2_3');
                            }}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-blue-500 bg-stone-50 dark:bg-stone-800 text-blue-700 dark:text-blue-400 font-bold transition-all cursor-pointer shadow-2xs"
                            title="نقل الطالب إلى فصل دراسي آخر"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Grade Session Button */}
                          <button
                            onClick={() => onOpenGrading(student)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-500 bg-stone-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400 font-bold transition-all cursor-pointer shadow-2xs"
                            title="رصد وتحديث درجات الطالب"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Certificate Button */}
                          <button
                            onClick={() => onOpenCertificate(student)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 font-bold transition-all cursor-pointer shadow-2xs"
                            title="شهادة التقدير (مشروطة بإتمام ٨ حصص)"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student Button */}
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-bold transition-colors cursor-pointer shadow-2xs"
                            title="حذف الطالب نهائياً من السيستم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Student Directly by Admin */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  إضافة طالب جديد مباشرة بواسطة الأدمن
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الاسم الرباعي للطالب: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف مايكل يوسف حنا"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الفصل الدراسي المستهدف: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value as ClassId)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.ageRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    السن: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    رقم هاتف الطالب (أو واتساب): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010xxxxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    رقم تليفون ولي الأمر:
                  </label>
                  <input
                    type="tel"
                    placeholder="010xxxxxxxx"
                    value={newGuardianPhone}
                    onChange={(e) => setNewGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    كلمة المرور للحساب:
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    أب الاعتراف:
                  </label>
                  <input
                    type="text"
                    value={newConfessionFather}
                    onChange={(e) => setNewConfessionFather(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>إضافة وتفعيل الطالب فوراً ✅</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Student to Another Class */}
      {transferTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  نقل الطالب إلى فصل دراسي آخر
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferTargetStudent(null)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/70 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs space-y-1">
              <div>الطالب: <strong className="text-stone-900 dark:text-stone-100">{transferTargetStudent.name}</strong></div>
              <div>الفصل الحالي: <span className="font-bold text-amber-700 dark:text-amber-400">{classes.find(c => c.id === transferTargetStudent.classId)?.name || 'غير محدد'}</span></div>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  اختر الفصل الجديد المراد نقل الطالب إليه:
                </label>
                <select
                  value={transferNewClassId}
                  onChange={(e) => setTransferNewClassId(e.target.value as ClassId)}
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-400 dark:border-blue-700 bg-blue-50/40 dark:bg-stone-800 font-bold text-stone-900 dark:text-stone-100 text-xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.ageRange})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  سيتم تحديث فصل الطالب فوراً في قاعدة البيانات المركزية لجميع الأجهزة.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setTransferTargetStudent(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد نقل الفصل الآن ✅</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

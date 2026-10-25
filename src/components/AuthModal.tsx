import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassId, UserRole } from '../types';
import {
  X,
  UserPlus,
  LogIn,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  User,
  BookOpen,
  Church,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onRegistrationSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  onRegistrationSuccess,
}) => {
  const { classes, registerUser, users, switchUserById } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(14);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [confessionFather, setConfessionFather] = useState('أبونا ميخائيل القمص');
  const [address, setAddress] = useState('');
  const [classId, setClassId] = useState<ClassId>('prep_2_3');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingUser, setSuccessPendingUser] = useState<string | null>(null);

  const [loginPhone, setLoginPhone] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('برجاء كتابة الاسم الرباعي للطالب أو الخادم');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('برجاء كتابة رقم التليفون المحمول أو الواتساب');
      return;
    }
    if (age === '' || Number(age) <= 4) {
      setErrorMsg('برجاء إدخال سن صحيح');
      return;
    }

    const newUser = registerUser({
      name: name.trim(),
      phone: phone.trim(),
      age: Number(age),
      role,
      classId: role === 'student' ? classId : undefined,
      guardianPhone: role === 'student' ? guardianPhone.trim() : undefined,
      confessionFather: confessionFather.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setSuccessPendingUser(newUser.name);
    switchUserById(newUser.id);

    if (onRegistrationSuccess) {
      onRegistrationSuccess();
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const found = users.find(
      (u) => u.phone === loginPhone.trim() || u.name.includes(loginPhone.trim())
    );

    if (!found) {
      setErrorMsg('لم يتم العثور على حساب بهذا الرقم، يمكنك اختيار حساب من القائمة السريعة أدناه.');
      return;
    }

    switchUserById(found.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right max-h-[92vh] flex flex-col">
        {/* Header with St. Paul icon */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-400/50 shrink-0">
              <img
                src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                alt="القديس بولس"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-50">
                مدرسة سانت بولس للكتاب المقدس
              </h3>
              <p className="text-xs text-amber-200/70">
                كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Pending state view */}
        {successPendingUser ? (
          <div className="p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                تم تسجيل طلبك بنجاح، يا {successPendingUser}!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                حسابك الآن في حالة <strong className="text-amber-700 dark:text-amber-400">«قيد الانتظار والمراجعة»</strong> لدى أمانة الخدمة. لن تتمكن من الدخول إلى الفصل أو تسجيل الحضور بالـ QR إلا بعد اعتماد وقبول انضمامك.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 text-right space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>تنبيه النظام:</strong> تم إرسال طلبك إلى لوحة الأدمن لاعتماده من قسم «طلبات الانضمام».
                </span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                متابعة حالة الحساب
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 text-amber-600" />
                إنشاء حساب جديد (طالب / خادم)
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4 text-amber-600" />
                تسجيل الدخول / الحسابات السريعة
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto">
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اختر صفتك في مدرسة سانت بولس: <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        role === 'student'
                          ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs ring-2 ring-amber-600/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">📖 مخدوم (طالب)</span>
                        {role === 'student' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        يتم التحويل للفصل ومتابعة الدرجات والـ QR
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('servant')}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        role === 'servant'
                          ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs ring-2 ring-amber-600/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">✝️ خادم دراسة كتاب</span>
                        {role === 'servant' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        تسجيل الحضور وفتح QR كود ورفع المذكرات
                      </div>
                    </button>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم الرباعي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: يوسف مايكل يوسف حنا"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      رقم التليفون / واتساب <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="012xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Age & Guardian Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      السن (بالسنوات) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={6}
                      max={90}
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {role === 'student' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        رقم تليفون ولي الأمر
                      </label>
                      <input
                        type="tel"
                        placeholder="010xxxxxxxx"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-left font-mono"
                        dir="ltr"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        أب الاعتراف
                      </label>
                      <input
                        type="text"
                        value={confessionFather}
                        onChange={(e) => setConfessionFather(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>

                {/* If Student: 7 Classes Selector */}
                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اختر الفصل الدراسي (٧ فصول محددة): <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {classes.map((cls) => (
                        <label
                          key={cls.id}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            classId === cls.id
                              ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="classSelection"
                              checked={classId === cls.id}
                              onChange={() => setClassId(cls.id)}
                              className="accent-amber-600"
                            />
                            <span className="truncate">{cls.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">{cls.ageRange}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confession Father for student & Address */}
                {role === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        أب الاعتراف
                      </label>
                      <input
                        type="text"
                        value={confessionFather}
                        onChange={(e) => setConfessionFather(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        منطقة السكن / العنوان
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="الشاطبي - محطة الرمل"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>تأكيد أمانة الخدمة:</strong> بعد التسجيل سيتم مراجعة طلبك من مسؤول النظام وقبوله قبل إتاحة الدخول للفصل والدرجات.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إرسال طلب الانضمام للمراجعة والاعتماد</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <div className="p-6 space-y-5 overflow-y-auto">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      أدخل رقم تليفون الحساب أو اسم المستخدم:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 01223456780 أو فادي جورج"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>تسجيل الدخول</span>
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    أو اختر حساباً تجريبياً جاهزاً:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {users.slice(0, 8).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUserById(u.id);
                          onClose();
                        }}
                        className="text-right p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800 transition-all text-xs"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {u.role === 'admin' && '👑 أمين الخدمة'}
                          {u.role === 'assistant' && '🛡️ مساعد إدارة'}
                          {u.role === 'servant' && '✝️ خادم'}
                          {u.role === 'student' && u.status === 'active' && '📖 مخدوم مفعل'}
                          {u.role === 'student' && u.status === 'pending' && '⏳ مخدوم معلق'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

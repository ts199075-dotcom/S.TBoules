import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassId, UserRole } from '../types';
import {
  X,
  UserPlus,
  LogIn,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Shield,
  AlertCircle,
  Mail,
  KeyRound,
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
  initialMode = 'login',
  onRegistrationSuccess,
}) => {
  const { classes, registerUser, users, switchUserById } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(14);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [confessionFather, setConfessionFather] = useState('أبونا ميخائيل القمص');
  const [address, setAddress] = useState('');
  const [classId, setClassId] = useState<ClassId>('prep_2_3');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingUser, setSuccessPendingUser] = useState<string | null>(null);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('ts199075@gmail.com');
  const [loginPassword, setLoginPassword] = useState('987321987');

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
    if (!password.trim()) {
      setErrorMsg('برجاء تعيين كلمة مرور للحساب');
      return;
    }
    if (age === '' || Number(age) <= 4) {
      setErrorMsg('برجاء إدخال سن صحيح');
      return;
    }

    const newUser = registerUser({
      name: name.trim(),
      email: email.trim() || undefined,
      password: password.trim(),
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

    const inputTrim = loginIdentifier.trim().toLowerCase();
    const passTrim = loginPassword.trim();

    const found = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === inputTrim) ||
        u.phone === loginIdentifier.trim() ||
        u.name.toLowerCase() === inputTrim
    );

    if (!found) {
      setErrorMsg('لم يتم العثور على حساب بهذا البريد الإلكتروني أو رقم الهاتف.');
      return;
    }

    if (found.password && found.password !== passTrim) {
      setErrorMsg('كلمة المرور غير صحيحة، برجاء التأكد من كتابتها بشكل صحيح.');
      return;
    }

    switchUserById(found.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden text-right max-h-[92vh] flex flex-col">
        {/* Header with St. Paul icon */}
        <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-600 shrink-0">
              <img
                src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                alt="القديس بولس"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-50">
                مدرسة سانت بولس للكتاب المقدس
              </h3>
              <p className="text-[11px] text-stone-400">
                كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Pending View */}
        {successPendingUser ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                تم تسجيل طلبك بنجاح، يا {successPendingUser}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
                حسابك الآن في حالة <strong className="text-amber-800 dark:text-amber-400 font-bold">«قيد الانتظار والمراجعة»</strong>. بحسب نظام المدرسة، سيقوم مسؤول النظام بمراجعة طلبك وقبوله واعتماده أولاً.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-stone-900 dark:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                حسناً، متابعة حالة الحساب
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switch Tabs (Login / Register) */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب جديد (طلب انضمام)</span>
              </button>
            </div>

            {errorMsg && (
              <div className="m-4 mb-0 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'register' ? (
              /* Register Form */
              <form onSubmit={handleRegister} className="p-5 space-y-3.5 overflow-y-auto text-xs">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                    نوع الحساب المطلوب:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        role === 'student'
                          ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      📖 طالب (مخدوم)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('servant')}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        role === 'servant'
                          ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      ✝️ خادم فصل
                    </button>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      الاسم الرباعي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: يوسف مايكل يوسف حنا"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      البريد الإلكتروني (اختياري)
                    </label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Phone & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      رقم الهاتف / واتساب <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="012xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      تعيين كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="كلمة مرور للدخول"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Age & Guardian / Confession Father */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      السن (بالسنوات) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={6}
                      max={90}
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  {role === 'student' ? (
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                        رقم تليفون ولي الأمر
                      </label>
                      <input
                        type="tel"
                        placeholder="010xxxxxxxx"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                        أب الاعتراف
                      </label>
                      <input
                        type="text"
                        value={confessionFather}
                        onChange={(e) => setConfessionFather(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  )}
                </div>

                {/* If Student: 7 Classes Selector */}
                {role === 'student' && (
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      اختر الفصل الدراسي: <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {classes.map((cls) => (
                        <label
                          key={cls.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            classId === cls.id
                              ? 'border-amber-600 bg-amber-50/60 dark:bg-stone-800 text-amber-900 dark:text-amber-200 font-bold'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="classSelection"
                              checked={classId === cls.id}
                              onChange={() => setClassId(cls.id)}
                              className="accent-amber-600"
                            />
                            <span className="truncate">{cls.name}</span>
                          </div>
                          <span className="text-[10px] text-stone-400">{cls.ageRange}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 dark:bg-stone-800/80 rounded-xl border border-amber-200 dark:border-stone-700 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>تنبيه:</strong> سيتم إرسال طلبك فوراً لمسؤول النظام (أمين الخدمة) لاعتماده قبل الدخول للفصل.
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إرسال طلب الانضمام</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Login Form */
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      البريد الإلكتروني أو رقم الهاتف:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="ts199075@gmail.com أو رقم الهاتف"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left pl-8"
                        dir="ltr"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      كلمة المرور:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="كلمة المرور"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-left pl-8"
                        dir="ltr"
                      />
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-700 dark:hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>دخول</span>
                  </button>
                </form>

                {/* Admin Quick Fill Helper */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('ts199075@gmail.com');
                      setLoginPassword('987321987');
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    👑 ملء بيانات حساب الأدمن (ts199075@gmail.com)
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassId, UserRole } from '../types';
import {
  X,
  UserPlus,
  LogIn,
  Clock,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { BrandMark } from './ui/BrandMark';
import { CHURCH_NAME, SCHOOL_NAME } from '../lib/constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess?: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const {
    classes,
    loginWithGoogle,
    loginWithEmailPassword,
    registerWithEmailPassword,
    completeGoogleRegistration,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [registerMethod, setRegisterMethod] = useState<'email' | 'google'>('email');

  // Shared / profile fields
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>(14);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [confessionFather, setConfessionFather] = useState('');
  const [classId, setClassId] = useState<ClassId>('prep_2_3');

  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingUser, setSuccessPendingUser] = useState<string | null>(null);
  const [googlePendingProfile, setGooglePendingProfile] = useState<{
    uid: string;
    email: string;
    name: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetAllFields = () => {
    setRole('student');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPhone('');
    setAge(14);
    setGuardianPhone('');
    setConfessionFather('');
    setClassId('prep_2_3');
    setErrorMsg('');
    setSuccessPendingUser(null);
    setGooglePendingProfile(null);
  };

  const handleClose = () => {
    resetAllFields();
    onClose();
  };

  useEffect(() => {
    setMode(initialMode);
    setRegisterMethod('email');
    resetAllFields();
    setSubmitting(false);
  }, [isOpen, initialMode]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    const res = await loginWithGoogle();
    setSubmitting(false);
    if (res.needsProfileCompletion && res.googleProfile) {
      setGooglePendingProfile(res.googleProfile);
      return;
    }
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    resetAllFields();
    if (onLoginSuccess && res.role) {
      onLoginSuccess(res.role);
    }
    onClose();
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setSubmitting(true);
    const res = await loginWithEmailPassword(email, password);
    setSubmitting(false);
    if (res.needsProfileCompletion && res.googleProfile) {
      setGooglePendingProfile(res.googleProfile);
      return;
    }
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    resetAllFields();
    if (onLoginSuccess && res.role) {
      onLoginSuccess(res.role);
    }
    onClose();
  };

  const handleEmailPasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('يرجى إدخال صيغة بريد إلكتروني صحيحة (مثال: mina@stpaul.school).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('يجب أن تكون كلمة المرور ٦ أحرف أو أرقام على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
      return;
    }
    if (!/^01\d{9}$/.test(phone.trim()) && !/^\d{10,15}$/.test(phone.trim())) {
      setErrorMsg('برجاء إدخال رقم هاتف صحيح');
      return;
    }
    if (age === '' || Number(age) < 6 || Number(age) > 90) {
      setErrorMsg('برجاء إدخال سن صحيح بين ٦ و٩٠');
      return;
    }

    setSubmitting(true);
    const res = await registerWithEmailPassword({
      name: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      age: Number(age),
      classId,
      role: role === 'servant' ? 'servant' : 'student',
      guardianPhone: role === 'student' ? guardianPhone.trim() : undefined,
      confessionFather: confessionFather.trim() || undefined,
    });
    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    const regName = res.name || fullName.trim();
    resetAllFields();
    setSuccessPendingUser(regName);
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!/^01\d{9}$/.test(phone.trim()) && !/^\d{10,15}$/.test(phone.trim())) {
      setErrorMsg('برجاء إدخال رقم هاتف صحيح');
      return;
    }
    if (age === '' || Number(age) < 6 || Number(age) > 90) {
      setErrorMsg('برجاء إدخال سن صحيح بين ٦ و٩٠');
      return;
    }
    setSubmitting(true);
    const res = await completeGoogleRegistration({
      phone: phone.trim(),
      age: Number(age),
      classId,
      role: role === 'servant' ? 'servant' : 'student',
      guardianPhone: role === 'student' ? guardianPhone.trim() : undefined,
      confessionFather: confessionFather.trim() || undefined,
    });
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    const regName = res.name || googlePendingProfile?.name || 'عضو جديد';
    resetAllFields();
    setSuccessPendingUser(regName);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} titleId="auth-title" panelClassName="w-full max-w-lg max-h-[92vh] overflow-y-auto">
      <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" className="rounded-full" />
          <div>
            <h3 id="auth-title" className="font-bold text-sm text-amber-50">
              {SCHOOL_NAME}
            </h3>
            <p className="text-[11px] text-stone-400">{CHURCH_NAME}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 cursor-pointer"
          aria-label="إغلاق نافذة الدخول"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {successPendingUser ? (
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            تم تسجيل طلبك يا {successPendingUser}
          </h4>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            حسابك الآن <strong className="text-amber-800 dark:text-amber-400">قيد المراجعة</strong>. لن تُفتح لوحة الفصل إلا بعد اعتماد أمين الخدمة، وبعدها يمكنك الدخول مباشرة بالبريد وكلمة المرور أو حساب جوجل.
          </p>
          <button type="button" onClick={handleClose} className="btn-secondary">
            حسناً
          </button>
        </div>
      ) : googlePendingProfile ? (
        <form onSubmit={handleCompleteGoogleProfile} className="p-5 space-y-3.5 overflow-y-auto text-xs">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 space-y-1">
            <div className="font-bold">مرحباً {googlePendingProfile.name}</div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono" dir="ltr">
              {googlePendingProfile.email}
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              استكمل رقم الهاتف والفصل الدراسي لإرسال طلب الانضمام وانتظار اعتماد أمين الخدمة.
            </p>
          </div>
          {errorMsg && (
            <div className="p-3 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                role === 'student'
                  ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600'
              }`}
            >
              طالب (مخدوم)
            </button>
            <button
              type="button"
              onClick={() => setRole('servant')}
              className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                role === 'servant'
                  ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600'
              }`}
            >
              خادم فصل
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                dir="ltr"
                required
                className="input-field text-left font-mono"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">السن *</label>
              <input
                type="number"
                min={6}
                max={90}
                required
                className="input-field"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
          {role === 'student' && (
            <div>
              <label className="block font-semibold mb-1">هاتف ولي الأمر (اختياري)</label>
              <input
                type="tel"
                dir="ltr"
                className="input-field text-left font-mono"
                placeholder="01xxxxxxxxx"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block font-semibold mb-1">اسم الأب الكاهن / أب الاعتراف</label>
            <input
              className="input-field"
              placeholder="مثال: أبونا كيرلس"
              value={confessionFather}
              onChange={(e) => setConfessionFather(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">الفصل الدراسي *</label>
            <select
              className="input-field"
              value={classId}
              onChange={(e) => setClassId(e.target.value as ClassId)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ageRange})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
              <UserPlus className="w-4 h-4" />
              إرسال طلب الانضمام
            </button>
            <button
              type="button"
              onClick={() => setGooglePendingProfile(null)}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-bold cursor-pointer"
            >
              رجوع
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                resetAllFields();
              }}
              className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900'
                  : 'border-transparent text-stone-500'
              }`}
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                resetAllFields();
              }}
              className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900'
                  : 'border-transparent text-stone-500'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              إنشاء حساب / طلب انضمام
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4 text-xs">
            {errorMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
                  errorMsg.includes('انتظار موافقة')
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                }`}
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <div className="space-y-4">
                <form onSubmit={handleEmailPasswordSignIn} className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        dir="ltr"
                        required
                        autoComplete="email"
                        placeholder="name@stpaul.school"
                        className="input-field text-left font-mono pr-3 pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        required
                        autoComplete="current-password"
                        placeholder="••••••"
                        className="input-field text-left font-mono pr-9 pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{submitting ? 'جاري تسجيل الدخول...' : 'دخول بالبريد وكلمة المرور'}</span>
                  </button>
                </form>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                  <span className="shrink mx-3 text-[11px] font-semibold text-stone-400">أو</span>
                  <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                  </svg>
                  <span>تسجيل الدخول بحساب جوجل</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod('email');
                      setErrorMsg('');
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      registerMethod === 'email'
                        ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    بريد وكلمة مرور جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod('google');
                      setErrorMsg('');
                    }}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      registerMethod === 'google'
                        ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>بحساب جوجل</span>
                  </button>
                </div>

                {registerMethod === 'email' ? (
                  <form onSubmit={handleEmailPasswordRegister} className="space-y-3">
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/70 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 leading-relaxed">
                      يمكنك إنشاء بريد خاص بالمنصة (مثل <span dir="ltr" className="font-mono font-bold">mina@stpaul.school</span>) وكلمة مرور، ولا يُشترط وجود بريد جوجل حقيقي.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                          role === 'student'
                            ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600'
                        }`}
                      >
                        طالب (مخدوم)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('servant')}
                        className={`py-2 px-3 rounded-xl border font-bold cursor-pointer ${
                          role === 'servant'
                            ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200'
                            : 'border-stone-200 dark:border-stone-700 text-stone-600'
                        }`}
                      >
                        خادم فصل
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">الاسم الكامل *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: مينا سمير يوسف"
                        className="input-field"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">البريد الإلكتروني للحساب *</label>
                      <input
                        type="email"
                        dir="ltr"
                        required
                        placeholder="mina@stpaul.school"
                        className="input-field text-left font-mono"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold mb-1">كلمة المرور * (٦+ أحرف)</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            dir="ltr"
                            required
                            minLength={6}
                            placeholder="••••••"
                            className="input-field text-left font-mono pr-8"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">تأكيد كلمة المرور *</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          dir="ltr"
                          required
                          minLength={6}
                          placeholder="••••••"
                          className="input-field text-left font-mono"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold mb-1">رقم الهاتف *</label>
                        <input
                          type="tel"
                          dir="ltr"
                          required
                          className="input-field text-left font-mono"
                          placeholder="01xxxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">السن *</label>
                        <input
                          type="number"
                          min={6}
                          max={90}
                          required
                          className="input-field"
                          value={age}
                          onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {role === 'student' && (
                      <div>
                        <label className="block font-semibold mb-1">هاتف ولي الأمر (اختياري)</label>
                        <input
                          type="tel"
                          dir="ltr"
                          className="input-field text-left font-mono"
                          placeholder="01xxxxxxxxx"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold mb-1">الفصل الدراسي *</label>
                        <select
                          className="input-field"
                          value={classId}
                          onChange={(e) => setClassId(e.target.value as ClassId)}
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.ageRange})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">أب الاعتراف (اختياري)</label>
                        <input
                          className="input-field"
                          placeholder="مثال: أبونا كيرلس"
                          value={confessionFather}
                          onChange={(e) => setConfessionFather(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{submitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وإرسال طلب الانضمام'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-center">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        تقديم طلب انضمام بحساب جوجل
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                        للتسجيل باستخدام حساب جوجل الخاص بك، اضغط على الزر التالي ثم استكمل بيانات الفصل ورقم الهاتف.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleGoogleSignIn}
                      className="w-full py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                        <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                      </svg>
                      <span>{submitting ? 'جاري المتابعة...' : 'المتابعة بحساب جوجل لتقديم الطلب'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

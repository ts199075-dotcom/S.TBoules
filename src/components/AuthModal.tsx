import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClassId, UserRole } from '../types';
import { X, UserPlus, LogIn, Clock, Shield, AlertCircle, Mail, KeyRound } from 'lucide-react';
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
    users,
    classes,
    registerUser,
    login,
    loginWithGoogle,
    completeGoogleRegistration,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetAllFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAge(14);
    setGuardianPhone('');
    setConfessionFather('');
    setClassId('prep_2_3');
    setLoginIdentifier('');
    setLoginPassword('');
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('برجاء كتابة الاسم الرباعي');
      return;
    }
    if (!/^01\d{9}$/.test(phone.trim()) && !/^\d{10,15}$/.test(phone.trim())) {
      setErrorMsg('برجاء إدخال رقم هاتف صحيح');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن ٦ أحرف');
      return;
    }
    if (age === '' || Number(age) < 6 || Number(age) > 90) {
      setErrorMsg('برجاء إدخال سن صحيح بين ٦ و٩٠');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    setSubmitting(true);
    void (async () => {
      try {
        const newUser = await registerUser({
          name: name.trim(),
          email: email.trim() || undefined,
          password: password.trim(),
          phone: phone.trim(),
          age: Number(age),
          role,
          classId,
          guardianPhone: role === 'student' ? guardianPhone.trim() : undefined,
          confessionFather: confessionFather.trim() || undefined,
        });
        const registeredName = newUser.name;
        resetAllFields();
        setSuccessPendingUser(registeredName);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'تعذر إرسال الطلب.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    const idToLookup = loginIdentifier.trim().toLowerCase();

    void (async () => {
      const result = await login(loginIdentifier, loginPassword);
      setSubmitting(false);
      if (!result.success) {
        setErrorMsg(result.message);
        return;
      }
      const loggedUser = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === idToLookup) ||
          u.phone === loginIdentifier.trim() ||
          u.name.toLowerCase() === idToLookup
      );
      const role = loggedUser?.role || 'admin';
      resetAllFields();
      if (onLoginSuccess) {
        onLoginSuccess(role);
      }
      onClose();
    })();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} titleId="auth-title" panelClassName="w-full max-w-lg">
      <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800">
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
          className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300"
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
            حسابك الآن <strong className="text-amber-800 dark:text-amber-400">قيد المراجعة</strong>. لن تُفتح لوحة الفصل إلا بعد اعتماد أمين الخدمة.
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
              استكمل رقم الهاتف والفصل الدراسي لحفظ حسابك على Firebase وانتظار اعتماد أمين الخدمة.
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
              className={`py-2 px-3 rounded-xl border font-bold ${
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
              className={`py-2 px-3 rounded-xl border font-bold ${
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
              إرسال الطلب وحفظه في Firebase
            </button>
            <button
              type="button"
              onClick={() => setGooglePendingProfile(null)}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 font-bold"
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
              className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-amber-600 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900'
                  : 'border-transparent text-stone-500'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              طلب انضمام
            </button>
          </div>

          <div className="px-5 pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
              </svg>
              <span>تسجيل الدخول بحساب جوجل (مزامنة Firebase السحابية)</span>
            </button>
          </div>

          {errorMsg && (
            <div
              className={`m-4 mb-0 p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in ${
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

          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="p-5 space-y-3.5 overflow-y-auto text-xs">
              <fieldset>
                <legend className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  نوع الحساب
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 rounded-xl border font-bold ${
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
                    className={`py-2 px-3 rounded-xl border font-bold ${
                      role === 'servant'
                        ? 'border-amber-600 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    خادم فصل
                  </button>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-name" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    الاسم الرباعي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-name"
                    autoComplete="off"
                    className="input-field"
                    required
                    placeholder="مثال: كيرلس ميخائيل عزيز"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="off"
                    className="input-field text-left font-mono"
                    dir="ltr"
                    placeholder="example@mail.com (اختياري)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-phone" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    رقم الهاتف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="off"
                    className="input-field text-left font-mono"
                    dir="ltr"
                    required
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reg-pass" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    كلمة المرور <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    autoComplete="new-password"
                    className="input-field text-left font-mono"
                    dir="ltr"
                    required
                    minLength={6}
                    placeholder="اختر كلمة مرور قوية من ٦ خانات"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-age" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    السن <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-age"
                    type="number"
                    min={6}
                    max={90}
                    autoComplete="off"
                    className="input-field"
                    required
                    placeholder="مثال: 14"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                {role === 'student' ? (
                  <div>
                    <label htmlFor="reg-guardian" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      هاتف ولي الأمر (اختياري)
                    </label>
                    <input
                      id="reg-guardian"
                      type="tel"
                      autoComplete="off"
                      className="input-field text-left font-mono"
                      dir="ltr"
                      placeholder="رقم هاتف ولي الأمر (01xxxxxxxxx)"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="reg-father" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                      اسم الأب الكاهن / أب الاعتراف
                    </label>
                    <input
                      id="reg-father"
                      autoComplete="off"
                      className="input-field"
                      placeholder="مثال: أبونا كيرلس أو أبونا ميخائيل"
                      value={confessionFather}
                      onChange={(e) => setConfessionFather(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {role === 'student' && (
                <div>
                  <label htmlFor="reg-father-student" className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">
                    اسم الأب الكاهن / أب الاعتراف <span className="text-stone-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    id="reg-father-student"
                    autoComplete="off"
                    className="input-field"
                    placeholder="اسم أب الاعتراف (مثال: أبونا كيرلس، أبونا بولا...)"
                    value={confessionFather}
                    onChange={(e) => setConfessionFather(e.target.value)}
                  />
                </div>
              )}

              {(role === 'student' || role === 'servant') && (
                <fieldset>
                  <legend className="font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الفصل الدراسي <span className="text-rose-500">*</span>
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {classes.map((cls) => (
                      <label
                        key={cls.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                          classId === cls.id
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-stone-800 font-bold'
                            : 'border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="classSelection"
                            checked={classId === cls.id}
                            onChange={() => setClassId(cls.id)}
                            className="accent-amber-600"
                          />
                          <span className="truncate">{cls.name}</span>
                        </span>
                        <span className="text-[10px] text-stone-400">{cls.ageRange}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <p className="p-2.5 bg-amber-50 dark:bg-stone-800/80 rounded-xl border border-amber-200 dark:border-stone-700 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                سيصل الطلب لأمين الخدمة للاعتماد قبل دخول الفصل.
              </p>

              <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
                <UserPlus className="w-4 h-4" />
                إرسال طلب الانضمام
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="p-5 space-y-3 overflow-y-auto text-xs">
              <div>
                <label htmlFor="login-id" className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <input
                    id="login-id"
                    className="input-field text-left font-mono ps-8"
                    dir="ltr"
                    required
                    autoComplete="off"
                    placeholder="ts199075@gmail.com أو رقم هاتفك"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute start-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="login-pass" className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="login-pass"
                    type="password"
                    autoComplete="off"
                    className="input-field text-left font-mono ps-8"
                    dir="ltr"
                    required
                    placeholder="أدخل كلمة المرور الخاصة بحسابك"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute start-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-secondary w-full disabled:opacity-60">
                <LogIn className="w-4 h-4 text-amber-400" />
                دخول
              </button>
            </form>
          )}
        </>
      )}
    </Modal>
  );
};

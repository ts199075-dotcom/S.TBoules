import React, { useState } from 'react';
import {
  Shield,
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Activity,
  Server,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MigrationReport } from '../../lib/firestoreMigration';

export const SystemSecuritySection: React.FC = () => {
  const {
    currentUser,
    users,
    sessions,
    sessionQrSecrets,
    grades,
    finalExamScores,
    servantSubmissions,
    lessonPosts,
    libraryBooks,
    churchEvents,
    academicTerms,
    notifications,
    firebaseUser,
    firebaseConnected,
    firebaseSyncing,
    firebaseError,
    adminMarkerVerified,
    lastSyncedAt,
    checkAdminSecurityStatus,
    exportBackupJson,
    restoreBackupJson,
    forceSyncDatabase,
    runSafeMigration,
  } = useApp();

  const [actionStatus, setActionStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [lastMigrationReport, setLastMigrationReport] = useState<MigrationReport | null>(null);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;
  const suspendedOrRejectedCount = users.filter((u) => u.status === 'suspended' || u.status === 'rejected').length;

  const handleCheckConnection = async () => {
    setBusy(true);
    setActionStatus(null);
    const res = await checkAdminSecurityStatus();
    setBusy(false);
    if (!res.connected) {
      setActionStatus({
        ok: false,
        text: `تعذر الاتصال بقاعدة البيانات السحابية${res.error ? `: ${res.error}` : '.'}`,
      });
    } else if (!firebaseUser) {
      setActionStatus({
        ok: false,
        text: 'الاتصال متاح، لكن يلزم تسجيل الدخول بحساب جوجل لمسؤول النظام للتحقق من الصلاحيات.',
      });
    } else if (!res.adminMarkerVerified) {
      setActionStatus({
        ok: false,
        text: 'الاتصال متاح، لكن لم يتم التحقق من سجل صلاحية المسؤول (/admins) لهذا الحساب.',
      });
    } else {
      setActionStatus({
        ok: true,
        text: 'تم فحص الاتصال والتحقق من هوية وصلاحيات مسؤول النظام بنجاح.',
      });
    }
  };

  const handleSyncNow = async () => {
    setBusy(true);
    setActionStatus(null);
    const res = await forceSyncDatabase();
    setBusy(false);
    setActionStatus({ ok: res.success, text: res.message });
  };

  const handleDownloadBackup = () => {
    const ok = exportBackupJson();
    if (!ok) {
      setActionStatus({ ok: false, text: 'تعذر تصدير النسخة الاحتياطية: الصلاحية مخصصة لمسؤول النظام فقط.' });
      return;
    }
    const stamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setLastExportAt(stamp);
    setActionStatus({
      ok: true,
      text: `تم تنزيل ملف النسخة الاحتياطية الكامل بصيغة JSON بنجاح (${users.length} مستخدم، ${sessions.length} لقاء، ${grades.length} سجل درجات).`,
    });
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setActionStatus(null);
    const res = await restoreBackupJson(file);
    setBusy(false);
    setActionStatus({ ok: res.success, text: res.message });
    e.target.value = '';
  };

  const handleRunMigration = async () => {
    setBusy(true);
    setActionStatus(null);
    const report = await runSafeMigration();
    setBusy(false);
    if (!report) {
      setActionStatus({
        ok: false,
        text: 'تعذر تشغيل الترحيل الآمن: يلزم تسجيل الدخول بحساب جوجل لمسؤول النظام والتحقق من الاتصال.',
      });
      return;
    }
    setLastMigrationReport(report);
    if (report.alreadyClean) {
      setActionStatus({
        ok: true,
        text: 'هيكل البيانات محدّث ومطابق بالكامل بالفعل (لم يلزم تعديل أي سجلات).',
      });
    } else {
      setActionStatus({
        ok: true,
        text: `تم تحديث هيكل البيانات بأمان بدون حذف أي سجلات (أكواد QR: ${report.migratedQrSecrets} • درجات: ${report.backfilledGradeClassIds} • امتحانات نهائية: ${report.backfilledFinalExamClassIds}).`,
      });
    }
  };

  const collectionStats = [
    { label: 'المستخدمون', count: users.length },
    { label: 'اللقاءات', count: sessions.length },
    { label: 'أكواد QR', count: Object.keys(sessionQrSecrets).length },
    { label: 'سجلات الدرجات', count: grades.length },
    { label: 'الامتحان النهائي', count: Object.keys(finalExamScores).length },
    { label: 'تحضير الخدام', count: servantSubmissions.length },
    { label: 'المنشورات والمذكرات', count: lessonPosts.length },
    { label: 'المكتبة', count: libraryBooks.length },
    { label: 'الحفلات والمناسبات', count: churchEvents.length },
    { label: 'الترمات', count: academicTerms.length },
    { label: 'الإشعارات', count: notifications.length },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
              مركز أمان البيانات والنسخ الاحتياطي والمزامنة
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            أدوات إدارية حصرية لمسؤول النظام لمتابعة أمان الحسابات، مراجعة حالة المزامنة، أخذ نسخ احتياطية، وتحديث هيكل البيانات بدون أي حذف.
          </p>
        </div>

        <button
          type="button"
          disabled={busy || firebaseSyncing}
          onClick={handleCheckConnection}
          className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-700 hover:bg-stone-800 dark:hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          <span>فحص الاتصال والصلاحيات الآن</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {actionStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
            actionStatus.ok
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
          role="status"
        >
          {actionStatus.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionStatus.text}</span>
        </div>
      )}

      {/* Grid: 1. Data Security + 2. Sync Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Data Security */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ١. أمان البيانات وصلاحيات الوصول
              </h3>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                firebaseUser && firebaseUser.emailVerified && adminMarkerVerified
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}
            >
              {firebaseUser && firebaseUser.emailVerified && adminMarkerVerified
                ? 'محمي وموثّق'
                : 'بانتظار التحقق'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-stone-500">حساب المسؤول الموثّق</span>
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200" dir="ltr">
                {firebaseUser?.email || currentUser.email || 'غير مسجل'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-stone-500">تحقق البريد وصلاحية الأدمن</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {firebaseUser?.emailVerified && adminMarkerVerified === true
                  ? 'موثّق ومفعّل كمسؤول نظام ✅'
                  : adminMarkerVerified === false
                    ? 'غير مفعل في قاعدة الصلاحيات ⚠️'
                    : 'يتطلب جلسة جوجل نشطة'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-stone-500">عزل البيانات الخاصة وأكواد QR</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                مفعل (بيانات الهواتف وأسرار QR معزولة عن غير المختصين)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <div className="text-base font-black text-emerald-600">{activeUsersCount}</div>
                <div className="text-[10px] text-stone-500">حساب نشط</div>
              </div>
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <div className="text-base font-black text-amber-600">{pendingUsersCount}</div>
                <div className="text-[10px] text-stone-500">بانتظار الاعتماد</div>
              </div>
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
                <div className="text-base font-black text-rose-600">{suspendedOrRejectedCount}</div>
                <div className="text-[10px] text-stone-500">موقوف / مرفوض</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Sync Status & Review */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٢. إدارة ومراجعة حالة المزامنة
              </h3>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                firebaseSyncing
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : firebaseConnected && firebaseUser && !firebaseError
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}
            >
              {firebaseSyncing
                ? 'جاري المزامنة...'
                : firebaseConnected && firebaseUser && !firebaseError
                  ? 'متصل ومتزامن'
                  : firebaseError
                    ? 'يوجد تنبيه بالمزامنة'
                    : 'غير متصل'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-stone-500">حالة الاتصال السحابي</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {firebaseConnected ? 'متصل بقاعدة البيانات السحابية' : 'تعذر الوصول للخادم السحابي'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
              <span className="text-stone-500">آخر مزامنة مؤكدة في هذه الجلسة</span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {lastSyncedAt || 'لم تُنفذ بعد'}
              </span>
            </div>

            {firebaseError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">
                تفاصيل الخطأ الحالي: {firebaseError}
              </div>
            )}

            <button
              type="button"
              disabled={busy || firebaseSyncing}
              onClick={handleSyncNow}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Server className="w-4 h-4" />
              <span>{firebaseSyncing ? 'جاري المزامنة...' : 'رفع ومزامنة السجلات غير المرفوعة الآن'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Synced Record Counts */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            ملخص السجلات المتزامنة حالياً عبر جميع المجموعات
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {collectionStats.map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-center"
            >
              <div className="text-lg font-black text-stone-900 dark:text-stone-100">{item.count}</div>
              <div className="text-[11px] text-stone-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: 3. Backups & Download + 4. Safe Restore + 5. Safe Migration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Download Backup */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٣. النسخ الاحتياطية وتنزيلها
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              تصدير نسخة احتياطية كاملة بصيغة JSON تشمل المستخدمين، اللقاءات، الدرجات، الامتحانات النهائية، المكتبة، والمناسبات.
            </p>
            {lastExportAt && (
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                آخر تصدير تم الساعة: {lastExportAt}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تنزيل نسخة احتياطية (JSON)</span>
          </button>
        </div>

        {/* 4. Safe Non-Destructive Restore */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٤. استعادة ودمج نسخة احتياطية
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              استيراد ملف JSON والتحقق من صحته ثم دمج السجلات المفقودة في قاعدة البيانات بأمان تام دون حذف أي بيانات قائمة.
            </p>
          </div>
          <label className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-blue-200 dark:border-blue-800">
            <UploadCloud className="w-4 h-4" />
            <span>{busy ? 'جاري التحقق والدمج...' : 'اختيار ملف JSON ودمجه بأمان'}</span>
            <input
              type="file"
              accept=".json,application/json"
              disabled={busy}
              className="hidden"
              onChange={handleRestoreBackup}
            />
          </label>
        </div>

        {/* 5. Idempotent Schema Migration */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٥. ترحيل وتحديث هيكل البيانات
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              استكمال أي حقول قديمة ناقصة (مثل ربط الفصول بالدرجات وعزل أسرار QR) بشكل آمن وقابل للتكرار بدون حذف.
            </p>
            {lastMigrationReport && (
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 text-[11px] text-stone-700 dark:text-stone-300 space-y-0.5">
                <div>أكواد QR المهاجرة: {lastMigrationReport.migratedQrSecrets}</div>
                <div>درجات تم ربط فصلها: {lastMigrationReport.backfilledGradeClassIds}</div>
                <div>امتحانات تم ربط فصلها: {lastMigrationReport.backfilledFinalExamClassIds}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={busy || firebaseSyncing}
            onClick={handleRunMigration}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 border border-amber-200 dark:border-amber-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تشغيل الترحيل الآمن الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
};

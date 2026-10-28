import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { BibleSession } from '../types';
import {
  QrCode,
  CheckCircle2,
  X,
  Camera,
  Users,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface QrAttendanceModalProps {
  session: BibleSession;
  mode: 'servant_display' | 'student_scan';
  onClose: () => void;
}

export const QrAttendanceModal: React.FC<QrAttendanceModalProps> = ({
  session,
  mode,
  onClose,
}) => {
  const { currentUser, grades, users, recordQrAttendance, toggleSessionQr } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Generate QR Code data URL
  useEffect(() => {
    const payload = JSON.stringify({
      app: 'st_paul_bible_school',
      church: 'archangel_michael_prince_tadros',
      sessionId: session.id,
      sessionTitle: session.title,
      code: session.qrSecretCode,
      classId: session.classId,
      date: session.date,
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#78350f', // deep amber
        light: '#fffbeb', // warm amber tint
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [session]);

  // List of students who have attended this session
  const attendedGrades = grades.filter(
    (g) => g.sessionId === session.id && g.attendance >= 1
  );

  const handleStudentScan = () => {
    if (!currentUser) return;
    setIsScanning(true);

    setTimeout(async () => {
      setIsScanning(false);
      const res = await recordQrAttendance(currentUser.id, session.id);
      if (res.success) {
        setScanSuccessMsg(res.message);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }, 900);
  };

  const isCurrentStudentAttended = currentUser
    ? attendedGrades.some((g) => g.studentId === currentUser.id)
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-amber-50">
                {mode === 'servant_display'
                  ? 'عرض باركود QR لتسجيل حضور الطلاب'
                  : 'مسح باركود الحضور بالهاتف'}
              </h3>
              <p className="text-[11px] text-amber-200/70 truncate max-w-xs">
                {session.title}
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

        {/* SERVANT / CLASS DISPLAY MODE */}
        {mode === 'servant_display' ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300/40">
                باركود موحد ومعتمد للجلسة
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 leading-relaxed">
                يفتح الخادم هذا الباركود، ويقوم كل مخدوم بمسح الكود بكاميرا هاتفه لتسجيل حضوره فوراً ومنحه درجة الحضور كاملة (١ من ١).
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-slate-800 dark:to-slate-800/60 p-5 rounded-3xl border-2 border-dashed border-amber-400 dark:border-amber-600/40 text-center flex flex-col items-center justify-center space-y-3 shadow-inner">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Session Attendance QR Code"
                  className="w-64 h-64 rounded-2xl shadow-md border-4 border-white dark:border-slate-700"
                />
              ) : (
                <div className="w-64 h-64 rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-400">
                  جارٍ إنشاء الباركود...
                </div>
              )}

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-amber-200">{session.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  كود الجلسة: <strong className="font-mono text-amber-800 dark:text-amber-400">{session.qrSecretCode}</strong>
                </div>
              </div>
            </div>

            {/* Live Attended Students Counter */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  الطلاب الذين سجلوا الحضور الآن:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300">
                  {attendedGrades.length} طلاب حاضرين
                </span>
              </div>

              {attendedGrades.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-2">
                  في انتظار مسح الطلاب للباركود...
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
                  {attendedGrades.map((g) => {
                    const st = users.find((u) => u.id === g.studentId);
                    return (
                      <span
                        key={g.id}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {st?.name || 'طالب'}
                        {g.qrAttendedAt && (
                          <span className="text-[9px] text-slate-400 mr-1">({g.qrAttendedAt})</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              إغلاق نافذة الباركود
            </button>
          </div>
        ) : (
          /* STUDENT SCANNER MODE */
          <div className="p-6 space-y-5 overflow-y-auto">
            {isCurrentStudentAttended || scanSuccessMsg ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    تم تسجيل حضورك بنجاح!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    تم احتساب درجة الحضور كاملة <strong className="text-emerald-700 dark:text-emerald-400 font-black">١ من ١</strong> في اللقاء، وتم تسجيل توقيت حضورك على السيستم فوراً.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
                >
                  العودة للوحة درجاتي
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    تسجيل الحضور في: {session.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    وجّه كاميرا هاتفك نحو شاشة الخادم أو اضغط زر المسح والتأكيد المباشر:
                  </p>
                </div>

                {/* Animated Scanner Viewfinder Box */}
                <div className="relative w-64 h-64 mx-auto rounded-3xl bg-slate-950 border-4 border-amber-500/70 overflow-hidden flex flex-col items-center justify-center shadow-xl">
                  {/* Laser Scan line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-400 animate-bounce" />

                  <Camera className="w-12 h-12 text-amber-400/80 mb-2" />
                  <span className="text-amber-200 text-xs font-bold">
                    {isScanning ? 'جارٍ قراءة الباركود...' : 'عدسة الماسح الضوئي الذكية'}
                  </span>
                  <span className="text-slate-400 text-[10px] mt-1 font-mono">
                    {session.qrSecretCode}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStudentScan}
                    disabled={isScanning}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isScanning ? 'جارٍ تسجيل الحضور...' : 'مسح وتأكيد حضوري باللقاء الآن ✅'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';
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
  RefreshCw,
  Upload,
  AlertTriangle,
  Zap,
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
  const { currentUser, grades, users, recordQrAttendance } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera States
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error'>('idle');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState<string>(session?.qrSecretCode || '');
  const [inputCode, setInputCode] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Generate QR Code data URL for servant display
  useEffect(() => {
    if (!session) return;
    const payload = JSON.stringify({
      app: 'st_paul_bible_school',
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
  const attendedGrades = session
    ? grades.filter((g) => g.sessionId === session.id && g.attendance >= 1)
    : [];

  const isCurrentStudentAttended = currentUser && session
    ? attendedGrades.some((g) => g.studentId === currentUser.id)
    : false;

  const triggerSuccessCelebration = useCallback((msg: string) => {
    setScanSuccessMsg(msg);
    setScanErrorMsg(null);
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      /* ignore */
    }
  }, []);

  const handleExecuteAttendance = useCallback(
    async (codeToVerify?: string) => {
      if (!currentUser || !session) return;
      setIsSubmitting(true);
      setScanErrorMsg(null);

      try {
        const secret = (codeToVerify || inputCode || session.qrSecretCode || '').trim();
        const res = await recordQrAttendance(currentUser.id, session.id, secret);
        if (res.success) {
          triggerSuccessCelebration(res.message);
        } else {
          setScanErrorMsg(res.message || 'كود الحضور غير متطابق. تأكد من إدخال الكود الظاهر مع الخادم.');
        }
      } catch (err: any) {
        setScanErrorMsg(err?.message || 'تعذر تسجيل الحضور. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, session, inputCode, recordQrAttendance, triggerSuccessCelebration]
  );

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Frame scanner using jsQR
  const scanQrVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanQrVideoFrame);
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameIdRef.current = requestAnimationFrame(scanQrVideoFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        let extractedCode = code.data;
        try {
          const parsed = JSON.parse(code.data);
          if (parsed.code) extractedCode = parsed.code;
        } catch {
          // not json, plain text code
        }

        stopCameraStream();
        setCameraState('idle');
        void handleExecuteAttendance(extractedCode);
        return;
      }
    } catch {
      /* scanning frame error */
    }

    animFrameIdRef.current = requestAnimationFrame(scanQrVideoFrame);
  }, [handleExecuteAttendance, stopCameraStream]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCameraStream();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    setCameraState('requesting');
    setScanErrorMsg(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (initialErr) {
        // Fallback to any available video source
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraState('active');
        animFrameIdRef.current = requestAnimationFrame(scanQrVideoFrame);
      }
    } catch (err: any) {
      console.warn('[QR Camera Error]', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('unsupported');
      } else {
        setCameraState('error');
      }
    }
  }, [cameraFacing, scanQrVideoFrame, stopCameraStream]);

  // Handle switching camera front/back
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (cameraState === 'active') {
      void startCamera();
    }
  }, [cameraFacing]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Auto-start camera when student scan mode opens
  useEffect(() => {
    if (mode === 'student_scan' && !isCurrentStudentAttended) {
      void startCamera();
    }
  }, [mode, isCurrentStudentAttended]);

  // Handle image upload with QR code
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          let extracted = code.data;
          try {
            const parsed = JSON.parse(code.data);
            if (parsed.code) extracted = parsed.code;
          } catch {}
          void handleExecuteAttendance(extracted);
        } else {
          setScanErrorMsg('لم يتم العثور على باركود صالح في الصورة المرفوعة. جرب إدخال الكود يدوياً.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-amber-50">
                {mode === 'servant_display'
                  ? 'عرض باركود QR لتسجيل حضور الطلاب'
                  : 'مسح باركود الحضور بالهاتف والكاميرا'}
              </h3>
              <p className="text-[11px] text-amber-200/70 truncate max-w-xs">
                {session?.title || 'لقاء دراسة الكتاب المقدس'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="إغلاق"
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

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-900 dark:text-amber-200">{session?.title}</div>
                <div className="text-[12px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 px-3 py-1 rounded-xl border border-amber-200 dark:border-slate-700">
                  رمز الجلسة المكتوب: <strong className="font-mono text-amber-900 dark:text-amber-300 text-sm">{session?.qrSecretCode}</strong>
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

            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              إغلاق نافذة الباركود
            </button>
          </div>
        ) : (
          /* STUDENT SCANNER MODE */
          <div className="p-6 space-y-4 overflow-y-auto">
            {isCurrentStudentAttended || scanSuccessMsg ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    تم تسجيل حضورك بنجاح! 🎉
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                    تم احتساب درجة الحضور كاملة <strong className="text-emerald-700 dark:text-emerald-400 font-black">١ من ١</strong> في اللقاء، وتم تدوين التوقيت الرسمي على النظام.
                  </p>
                </div>

                <button
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  العودة للوحة درجاتي
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    تسجيل الحضور في: {session?.title || 'اللقاء الأسبوعي'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    وجّه كاميرا هاتفك نحو باركود الخادم، أو استخدم التأكيد المباشر أدناه:
                  </p>
                </div>

                {/* Live Video Camera Box */}
                <div className="relative w-full max-w-xs h-64 mx-auto rounded-3xl bg-slate-950 border-4 border-amber-500/80 overflow-hidden flex flex-col items-center justify-center shadow-xl">
                  {cameraState === 'active' ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Laser animated scan bar */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-bounce" />
                      {/* Viewfinder crosshairs */}
                      <div className="absolute inset-6 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none" />

                      {/* Camera control button */}
                      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs hover:bg-slate-800"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>تبديل الكاميرا</span>
                        </button>
                      </div>
                    </>
                  ) : cameraState === 'requesting' ? (
                    <div className="text-center space-y-2 p-4">
                      <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-amber-200 font-bold">جارٍ طلب الإذن وفتح الكاميرا...</p>
                    </div>
                  ) : (
                    /* Fallback when Camera is denied or unsupported */
                    <div className="text-center p-4 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-amber-200">
                        {cameraState === 'denied'
                          ? 'إذن الكاميرا محظور بالمتصفح'
                          : cameraState === 'unsupported'
                          ? 'الكاميرا غير متوفرة بهذا الجهاز'
                          : 'الكاميرا متوقفة حالياً'}
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-xs">
                        يمكنك استخدام خيار «التأكيد الفوري» أو كتابة رمز الجلسة أدناه لتسجيل الحضور دون كاميرا.
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>إعادة محاولة فتح الكاميرا</span>
                      </button>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Error Banner if any */}
                {scanErrorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{scanErrorMsg}</span>
                  </div>
                )}

                {/* Instant Attendance Button (No Camera Required) */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleExecuteAttendance(session?.qrSecretCode)}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>
                      {isSubmitting ? 'جارٍ تسجيل الحضور...' : 'تسجيل وتأكيد حضوري الفوري (١ من ١) بنقرة واحدة ✅'}
                    </span>
                  </button>
                </div>

                {/* Manual Code Entry & Photo Upload Alternative */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>أو أدخل كود الجلسة يدوياً:</span>
                    <label className="text-[11px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>رفع صورة الباركود</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder={session?.qrSecretCode || 'اكتب كود الجلسة (مثال: STPAUL-...)'}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 text-center uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleExecuteAttendance(inputCode || session?.qrSecretCode)}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

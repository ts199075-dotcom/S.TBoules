import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Printer, Trophy, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  studentName: string;
  className: string;
  yearWorkScore: number;
  totalScore?: number;
  gradedSessionsCount: number;
  isCalculated: boolean;
  rank?: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  studentName,
  className,
  yearWorkScore,
  gradedSessionsCount,
  isCalculated,
  rank,
  onClose,
}) => {
  const isCompleted8Sessions = gradedSessionsCount >= 8 && isCalculated;

  useEffect(() => {
    if (isCompleted8Sessions) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isCompleted8Sessions]);

  const handlePrint = () => {
    window.print();
  };

  // Grade classification based purely on the 60 year-work marks
  const getRating = (score: number) => {
    if (score >= 51) return 'ممتاز مع مرتبة الشرف 🌟';
    if (score >= 42) return 'جيد جداً مرتفع 👏';
    if (score >= 36) return 'جيد ✝️';
    return 'ناجح ومجتهد 📖';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-amber-50 dark:bg-stone-900 rounded-3xl shadow-2xl border-4 border-amber-600/40 p-5 sm:p-8 text-stone-900 dark:text-stone-100 print:m-0 print:border-none print:shadow-none print:p-8">
        {/* Close & Print Buttons */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200 dark:border-stone-800 print:hidden">
          {isCompleted8Sessions ? (
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الشهادة الرسمية</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>شهادة مشروطة بإتمام الـ ٨ حصص</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-200/60 hover:bg-amber-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-900 dark:text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not eligible view: < 8 sessions */}
        {!isCompleted8Sessions ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                شهادة التقدير تُمنح فقط بعد إتمام الـ ٨ حصص الرسمية
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                بحسب نظام ولوائح مدرسة سانت بولس للكتاب المقدس، لا يتم إصدار شهادة التقدير إلا للطالب الذي أتم وحُسبت له الـ ٨ حصص كاملة مع اعتماد درجات أعمال السنة (٦٠ درجة).
              </p>
              <div className="p-3 rounded-2xl bg-amber-100/70 dark:bg-stone-800 border border-amber-300 dark:border-stone-700 text-xs text-amber-900 dark:text-amber-200 font-bold inline-block">
                حالة الطالب: تم رصد {gradedSessionsCount} من ٨ حصص {isCalculated ? '(معتمدة)' : '(قيد الرصد)'}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-stone-900 dark:bg-amber-700 text-white font-bold text-xs"
              >
                حسناً، متابعة رصد باقي الحصص
              </button>
            </div>
          </div>
        ) : (
          /* Eligible Certificate View */
          <div className="text-center space-y-5 pt-4 border-2 border-dashed border-amber-300/80 dark:border-amber-600/30 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-white via-amber-50/50 to-white dark:from-stone-900 dark:via-stone-900 dark:to-stone-850 relative overflow-hidden">
            {/* Subtle watermark cross */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-[150px] font-serif text-amber-950 dark:text-amber-100">
              ☩
            </div>

            {/* Church & School Crest */}
            <div className="space-y-1">
              <div className="text-amber-900 dark:text-amber-400 text-2xl font-serif">☩ ☩ ☩</div>
              <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">
                كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
              </h4>
              <h5 className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                مدرسة القديس بولس الرسول لدراسة وتفسير الكتاب المقدس
              </h5>
            </div>

            {/* Certificate Title */}
            <div className="space-y-1">
              <div className="inline-block px-4 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 text-xs font-black uppercase tracking-wider">
                {rank && rank <= 3 ? 'شهادة تفوق وتكريم أوائل (٨ حصص)' : 'شهادة إتمام كورس الكتاب المقدس (٨ حصص)'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                شـهـادة تـقـديـر وتـفـوّق
              </h2>
            </div>

            {/* Text Statement */}
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
              تشهد أمانة مدرسة سانت بولس للكتاب المقدس بأن الابن المبارك / الابنة المباركة:
            </p>

            <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-300 border-b-2 border-amber-500/40 inline-block px-8 pb-1">
              {studentName}
            </div>

            <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-xl mx-auto leading-relaxed space-y-1.5">
              <p>
                قد أتمّ بنجاح حضور ودراسة كورس الكتاب المقدس كاملاً بمجموع <strong className="text-stone-900 dark:text-white font-black">(٨ حصص دراسية)</strong> بفصل: <strong className="text-amber-800 dark:text-amber-400">{className}</strong>
              </p>
              <div className="p-3 bg-amber-100/70 dark:bg-stone-800/90 rounded-2xl border border-amber-300 dark:border-stone-700 inline-block px-6">
                <span className="text-xs text-stone-600 dark:text-stone-400">وحصل في أعمال السنة على درجة: </span>
                <strong className="text-amber-900 dark:text-amber-200 font-black text-lg sm:text-xl">
                  {yearWorkScore} من ٦٠
                </strong>
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">
                  التقدير العام: {getRating(yearWorkScore)}
                </div>
              </div>
              {rank && rank <= 3 && (
                <div className="font-bold text-amber-800 dark:text-amber-300 pt-1">
                  🎉 محققاً {rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : 'المركز الثالث 🥉'} على مستوى الفصل الدراسي.
                </div>
              )}
            </div>

            {/* Verse */}
            <div className="bg-amber-100/60 dark:bg-stone-800/60 border border-amber-300/80 dark:border-stone-700 rounded-xl p-2.5 max-w-lg mx-auto text-xs italic text-amber-950 dark:text-amber-200 font-serif">
              «قَدْ جَاهَدْتُ الْجِهَادَ الْحَسَنَ، أَكْمَلْتُ السَّعْيَ، حَفِظْتُ الإِيمَانَ، وَأَخِيرًا قَدْ وُضِعَ لِي إِكْلِيلُ الْبِرِّ»
              <span className="block text-[10px] text-amber-800 dark:text-amber-400 mt-0.5 not-italic font-sans">
                (٢ تيموثاوس ٤ : ٧-٨)
              </span>
            </div>

            {/* Signatures */}
            <div className="pt-5 grid grid-cols-3 gap-4 text-center text-xs text-stone-700 dark:text-stone-300 border-t border-amber-200 dark:border-stone-800">
              <div>
                <div className="font-bold">خادم الفصل المسؤول</div>
                <div className="mt-5 text-[11px] text-stone-500">أمانة الفصل</div>
              </div>
              <div>
                <div className="font-bold">أمين عام المدرسة</div>
                <div className="mt-5 text-[11px] text-stone-500">أمين الخدمة</div>
              </div>
              <div>
                <div className="font-bold">آباء كهنة الكنيسة</div>
                <div className="mt-5 text-[11px] text-stone-500">القمص ميخائيل والقمص باخوم</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

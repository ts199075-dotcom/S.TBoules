import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Printer, Trophy, Award, Sparkles } from 'lucide-react';

interface CertificateModalProps {
  studentName: string;
  className: string;
  totalScore: number;
  rank?: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  studentName,
  className,
  totalScore,
  rank,
  onClose,
}) => {
  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-amber-50 rounded-3xl shadow-2xl border-4 border-amber-600/40 p-6 sm:p-10 text-slate-900 print:m-0 print:border-none print:shadow-none print:p-8">
        {/* Close & Print Buttons */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة الشهادة الرسمية</span>
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-200/60 hover:bg-amber-300 text-amber-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body with Elegant Church Style */}
        <div className="text-center space-y-6 pt-4 border-2 border-dashed border-amber-300/80 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-white via-amber-50/50 to-white relative overflow-hidden">
          {/* Subtle watermark cross */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-[160px] font-serif text-amber-950">
            ☩
          </div>

          {/* Church & School Crest */}
          <div className="space-y-1">
            <div className="text-amber-900 text-2xl font-serif">☩ ☩ ☩</div>
            <h4 className="text-sm sm:text-base font-bold text-amber-950">
              كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
            </h4>
            <h5 className="text-xs text-amber-800 font-semibold">
              مدرسة القديس بولس الرسول لدراسة وتفسير الكتاب المقدس
            </h5>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1">
            <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
              {rank && rank <= 3 ? 'شهادة تفوق وتكريم أوائل' : 'شهادة تقدير واجتهاد كتابي'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              شـهـادة تـفـوّق كـتـابـي
            </h2>
          </div>

          {/* Text Statement */}
          <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            تشهد أمانة مدرسة سانت بولس للكتاب المقدس بأن الابن المبارك / الابنة المباركة:
          </p>

          <div className="text-2xl sm:text-3xl font-black text-amber-900 border-b-2 border-amber-500/40 inline-block px-8 pb-2">
            {studentName}
          </div>

          <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            قد أتمّ متطلبات دراسة الكتاب المقدس بفصل: <strong className="text-slate-900">{className}</strong>
            <br />
            وحصل على مجموع كلي قدره: <strong className="text-amber-800 font-black text-base">{totalScore} من ١٠٠</strong>
            {rank && rank <= 3 && (
              <span className="block mt-1 font-bold text-emerald-800">
                🎉 محققاً {rank === 1 ? 'المركز الأول 🥇' : rank === 2 ? 'المركز الثاني 🥈' : 'المركز الثالث 🥉'} على مستوى الفصل.
              </span>
            )}
          </p>

          {/* Verse */}
          <div className="bg-amber-100/60 border border-amber-300/80 rounded-xl p-3 max-w-lg mx-auto text-xs italic text-amber-950 font-serif">
            «قَدْ جَاهَدْتُ الْجِهَادَ الْحَسَنَ، أَكْمَلْتُ السَّعْيَ، حَفِظْتُ الإِيمَانَ، وَأَخِيرًا قَدْ وُضِعَ لِي إِكْلِيلُ الْبِرِّ»
            <span className="block text-[10px] text-amber-800 mt-0.5 not-italic font-sans">
              (٢ تيموثاوس ٤ : ٧-٨)
            </span>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-700 border-t border-amber-200">
            <div>
              <div className="font-bold">خادم الفصل المسؤول</div>
              <div className="mt-6 text-[11px] text-slate-500">أ. بيشوي كمال</div>
            </div>
            <div>
              <div className="font-bold">أمين عام المدرسة</div>
              <div className="mt-6 text-[11px] text-slate-500">أ. مينا عادل</div>
            </div>
            <div>
              <div className="font-bold">آباء كهنة الكنيسة</div>
              <div className="mt-6 text-[11px] text-slate-500">القمص ميخائيل والقمص باخوم</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

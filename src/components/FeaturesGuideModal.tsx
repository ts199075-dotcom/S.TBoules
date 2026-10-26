import React from 'react';
import { X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { CHURCH_NAME } from '../lib/constants';

interface FeaturesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: '١',
    title: 'الفصول السبعة المستقلة',
    body: 'نظام فصول دراسية مستقلة لكل مرحلة عمرية: رابعة ابتدائي، خامسة ابتدائي، سادسة ابتدائي، أولى إعدادي، ثانية وثالثة إعدادي، مرحلة ثانوي، ومرحلة الكبار والخريجين، مع مناهج كتابية مخصصة لكل فصل.',
  },
  {
    icon: '٢',
    title: 'تقييم اللقاء (٢٤ درجة)',
    body: 'امتحان أسبوعي (١٠) + واجب (١٠) + حضور بالرمز (١) + صلاة (١) + أدوات (١) + مشاركة (١).',
  },
  {
    icon: '٣',
    title: 'رصد سريع للدرجات',
    body: 'في نافذة الرصد يمكن تبديل درجات الحضور والصلاة والأدوات والمشاركة بنقرة واحدة بين ١ و٠ دون كتابة أرقام.',
  },
  {
    icon: '٤',
    title: 'حضور اللقاء برمز الجلسة',
    body: 'يعرض الخادم رمز QR للقاء. يؤكد الطالب حضوره بإدخال كود الجلسة الظاهر مع الخادم، فيُحتسب الحضور فوراً إن كان الرمز مفتوحاً وصحيحاً.',
  },
  {
    icon: '٥',
    title: 'المجموع من ١٠٠',
    body: 'أعمال السنة ٦٠ (متوسط اللقاءات معادَل من ٢٤) + امتحان نهائي ٤٠، مع ترتيب الأوائل وطباعة شهادات التقدير.',
  },
  {
    icon: '٦',
    title: 'تحليل الدرجات للطالب',
    body: 'لوحة الطالب توضح الدرجات المفقودة في كل معيار لمساعدته على المواظبة في اللقاءات التالية.',
  },
  {
    icon: '٧',
    title: 'اعتماد الحسابات والمذكرات',
    body: 'لا يدخل طالب أو خادم جديد الفصل إلا بعد قبول أمين الخدمة. مذكرات الخدام تُنشر للطلاب بعد الاعتماد فقط.',
  },
  {
    icon: '٨',
    title: 'حصرية الإدارة والوضع الليلي',
    body: 'لوحة التحكم مقصورة على حساب المسؤول. الواجهة متجاوبة مع الهاتف وتدعم الوضع الليلي.',
  },
];

export const FeaturesGuideModal: React.FC<FeaturesGuideModalProps> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} titleId="features-guide-title" panelClassName="w-full max-w-3xl">
    <div className="p-5 sm:p-7 space-y-5 overflow-hidden flex flex-col max-h-[92vh]">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h2 id="features-guide-title" className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
            دليل إمكانيات المنصة
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{CHURCH_NAME}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300"
          aria-label="إغلاق الدليل"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto space-y-3 pr-1">
        {sections.map((section) => (
          <article
            key={section.icon}
            className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700"
          >
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1.5">
              {section.icon}. {section.title}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{section.body}</p>
          </article>
        ))}
      </div>

      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
        <p className="text-[11px] text-stone-500 font-serif italic">
          «وَالَّذِي أَعْطَى الْبَعْضَ أَنْ يَكُونُوا... مُعَلِّمِينَ»
        </p>
        <button type="button" onClick={onClose} className="btn-secondary">
          إغلاق الدليل
        </button>
      </div>
    </div>
  </Modal>
);

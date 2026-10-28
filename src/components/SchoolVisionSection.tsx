import React from 'react';
import {
  BookOpen,
  Sparkles,
  Heart,
  Target,
  Compass,
  Scroll,
  Sun,
  Shield,
  Church,
  Flame,
  CheckCircle2,
  Bookmark,
  ChevronDown,
} from 'lucide-react';

export const SchoolVisionSection: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 my-8 text-right font-sans" dir="rtl">
      {/* Main Section Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-amber-950/80 to-stone-900 border border-amber-600/30 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <span>☩</span>
            <span>كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-amber-50 tracking-tight leading-tight">
            رؤية ورسالة مدرسة Saint Paul’s School
          </h2>

          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-light">
            «رحلة إيمانية متكاملة في كلمة الله الحية، ليكون الكتاب المقدس مفتوحاً في كل بيت مسيحي، ونحيا به إنجيلاً معاشاً بالروح القدس».
          </p>
        </div>

        {/* Ambient watermark pattern */}
        <div className="absolute left-4 bottom-2 opacity-10 pointer-events-none">
          <Church className="w-64 h-64 text-amber-400" />
        </div>
      </div>

      {/* أولًا: رؤية المدرسة */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">البند الأول</span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
              أولًا: رؤية المدرسة
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          تهدف مدرسة <strong>Saint Paul’s School</strong> إلى أن يكون الكتاب المقدس مفتوحًا في كل بيت مسيحي، وأن يصبح جزءًا أصيلًا من حياة كل أسرة، من الطفل إلى الكهل، فيقرأ الجميع كلمة الله بروح الفهم والتعلُّم، وبإرشاد الروح القدس، ويعيشون بحسب تعاليمها.
        </p>

        {/* Golden Bible Verse Quote */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 space-y-2">
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            فنحن نؤمن بأن الكتاب المقدس هو روح وحياة، وهو كلمة الله الموحى بها، كما قال السيد المسيح:
          </p>
          <blockquote className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 font-serif pr-3 border-r-4 border-amber-600">
            «فَتِّشُوا الْكُتُبَ، لأَنَّكُمْ تَظُنُّونَ أَنَّ لَكُمْ فِيهَا حَيَاةً أَبَدِيَّةً، وَهِيَ الَّتِي تَشْهَدُ لِي».
            <span className="text-xs font-normal text-amber-800 dark:text-amber-400 block mt-1">(يوحنا ٥ : ٣٩)</span>
          </blockquote>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          وانطلاقًا من إيماننا بأهمية كلمة الله ودورها في بناء الإنسان المسيحي، تسعى المدرسة إلى إعداد جيل من المخدومين يعرف الكتاب المقدس، ويفهمه، ويحبه، ويدرسه بطريقة منهجية وتفاعلية، حتى يتحول من مجرد كتاب نقرأه إلى حياة نعيشها، وشهادة نقدمها للعالم.
        </p>
      </div>

      {/* ثانيًا: أهداف المدرسة */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">البند الثاني</span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
              ثانيًا: أهداف المدرسة
            </h3>
          </div>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          تسعى مدرسة Saint Paul’s School إلى تحقيق الأهداف السامية التالية:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[
            {
              title: 'نشر دراسة الكتاب المقدس',
              desc: 'أن يصبح الكتاب المقدس كتابًا مفتوحًا في كل بيت مسيحي.',
              icon: '📖',
            },
            {
              title: 'بناء جيل محب لكلمة الله',
              desc: 'إعداد مخدومين يفهمون الكتاب المقدس ويحبون دراسته، ويستطيعون تطبيق تعاليمه في حياتهم اليومية.',
              icon: '🌱',
            },
            {
              title: 'تنمية الفهم الروحي',
              desc: 'مساعدة الدارسين على اكتشاف المعاني الروحية والكنوز المختفية بين صفحات الكتاب المقدس.',
              icon: '✨',
            },
            {
              title: 'التعرُّف على شخص السيد المسيح',
              desc: 'اكتشاف حضور المسيح وعمله في أسفار الكتاب المقدس، من سفر التكوين إلى سفر الرؤيا.',
              icon: '✝️',
            },
            {
              title: 'ترسيخ العقيدة والطقس الأرثوذكسي',
              desc: 'ربط دراسة الكتاب المقدس بإيمان الكنيسة الأرثوذكسية وطقوسها.',
              icon: '⛪',
            },
            {
              title: 'تنمية الفضائل المسيحية',
              desc: 'التعلُّم من حياة الشخصيات الكتابية، واكتشاف الفضائل التي تحلّت بها، والاقتداء بها.',
              icon: '🕊️',
            },
            {
              title: 'فهم معاملات الله مع الإنسان',
              desc: 'دراسة تعاملات الله مع البشر عبر العصور، وفهم نتائج الخطية وأهمية التوبة والطاعة.',
              icon: '⚖️',
            },
            {
              title: 'تحويل المعرفة إلى حياة',
              desc: 'أن يصبح كل مسيحي إنجيلًا معاشًا، يشهد للمسيح بسلوكه، وبإرشاد الروح القدس.',
              icon: '🌟',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-7">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ثالثًا: منهج الدراسة في المدرسة */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">البند الثالث</span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
              ثالثًا: منهج الدراسة في المدرسة
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          تعتمد المدرسة على رحلة متكاملة لدراسة الكتاب المقدس بعهديه القديم والجديد، تبدأ من سفر التكوين وتنتهي بسفر الرؤيا، وتهدف إلى اكتشاف خطة الله للخلاص والتعرُّف على شخص السيد المسيح وعمله عبر التاريخ، وذلك عبر <strong>٨ محاور أساسية</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              title: 'البعد المسياني',
              desc: 'اكتشاف النبوات والرموز والإشارات التي تقودنا إلى شخص السيد المسيح وعمله الخلاصي، خاصة في العهد القديم.',
              badge: 'المسيح أولاً',
            },
            {
              title: 'بُعد الخطية ونتائجها',
              desc: 'دراسة الخطية وآثارها على الإنسان، وكيفية تعامل الله معه، ودعوته المستمرة إلى التوبة والرجوع إليه.',
              badge: 'التوبة والرجوع',
            },
            {
              title: 'بُعد معاملات الله',
              desc: 'اكتشاف محبة الله ورعايته وتدخله في حياة الإنسان عبر العصور.',
              badge: 'رعاية إلهية',
            },
            {
              title: 'بُعد الفضيلة',
              desc: 'التعرُّف على الفضائل التي عاشتها الشخصيات الكتابية، والتعلُّم منها وتطبيقها عمليًا.',
              badge: 'اقتداء عملي',
            },
            {
              title: 'البعد العقائدي',
              desc: 'فهم العقائد المسيحية والتعرُّف على جذورها الكتابية في ضوء إيمان الكنيسة الأرثوذكسية.',
              badge: 'إيمان مستقيم',
            },
            {
              title: 'البعد الطقسي',
              desc: 'اكتشاف الارتباط بين الكتاب المقدس وطقوس الكنيسة الأرثوذكسية وصلواتها وأسرارها.',
              badge: 'طقس حي',
            },
            {
              title: 'البعد التاريخي',
              desc: 'فهم الأحداث والشخصيات والظروف التاريخية التي تساعد على إدراك المعنى الكتابي بصورة أعمق.',
              badge: 'سياق تاريخي',
            },
            {
              title: 'البعد الروحي والسلوكي',
              desc: 'تحويل ما نتعلّمه من كلمة الله إلى حياة عملية وسلوك مسيحي يشهد للمسيح.',
              badge: 'شهادة وسلوك',
            },
          ].map((col, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  {col.badge}
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                  {col.title}
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  {col.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* رابعًا: مراحل الرحلة الكتابية */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-black">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">البند الرابع</span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
              رابعًا: مراحل الرحلة الكتابية (٥ محطات متدرجة)
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stage 1 */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                ١
              </span>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ١. رحلة اكتشاف المسيح في العهد القديم
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-9">
              تبدأ الرحلة من سفر التكوين، حيث نبحث عن شخص السيد المسيح في النبوات والرموز والأحداث والشخصيات التي تشير إليه، ونتتبّع خطة الله للخلاص عبر أسفار العهد القديم.
              <br />
              وفي أثناء هذه الرحلة، نكتشف كنوزًا روحية وعقائدية وتاريخية، ونتعلّم من معاملات الله مع الإنسان، ونفهم نتائج الخطية، ونكتشف الفضائل التي عاشها رجال الله وقديسوه، إلى جانب التعرُّف على جذور إيماننا وطقوس كنيستنا الأرثوذكسية.
              وتقودنا دراسة العهد القديم إلى إدراك احتياج الإنسان إلى الخلاص، وإلى انتظار المخلّص الذي يحقق وعد الله ويمنح الإنسان طريق المصالحة معه.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                ٢
              </span>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٢. رحلة اكتشاف شخص السيد المسيح في الأناجيل الأربعة
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-9">
              بعد الانتهاء من دراسة العهد القديم، ننتقل إلى العهد الجديد، ونبدأ بالأناجيل الأربعة، لنتعرّف بصورة أعمق على شخص الرب يسوع المسيح، له كل المجد.
              وندرس الأناجيل من خلال منهج التوازي بين الأناجيل الأربعة (التيترا إيفانجيليون – Tetraevangelion)، حيث نتأمل الأحداث المشتركة بينها، ونقارن بين الروايات الإنجيلية، لنكتشف تكامل الشهادة عن حياة السيد المسيح وتعاليمه:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-9 pt-1 text-[11px] text-stone-700 dark:text-stone-300">
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">✨ المعجزات ودلالاتها الروحية</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">🤝 لقاءاته وموقفه من الإنسان</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">📜 الأمثال وتعليم الملكوت</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">🕊️ تعاليمه ووصاياه الإلهية</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">✝️ شخصيته الإلهية والإنسانية</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">⛪ العقيدة والطقس الكنسي</span>
              <span className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 col-span-2">🌟 سلوكه الشخصي باعتباره المثال الأعظم</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                ٣
              </span>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٣. رحلة تأسيس الكنيسة وانتشار الكرازة
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-9">
              ننتقل بعد ذلك إلى سفر أعمال الرسل، لنتعرّف على اختيار السيد المسيح لتلاميذه، وإعدادهم للخدمة، وعمل الروح القدس في تأسيس الكنيسة وانتشار الكرازة بالإنجيل في العالم.
              ومن خلال هذه الدراسة، نكتشف دور الرسل في الشهادة للمسيح، ومواجهة الصعوبات، وخدمة الآخرين، وكيف تحولت جماعة التلاميذ إلى كنيسة تحمل رسالة الخلاص إلى جميع الأمم.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                ٤
              </span>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٤. رحلة التعلُّم من رسائل الرسل
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-9">
              تستمر رحلتنا مع رسائل القديس بولس الرسول، ثم الرسائل الجامعة، لنتعمّق في فهم الإيمان المسيحي وكيفية تطبيقه في الحياة اليومية: أسس الحياة المسيحية، بناء علاقة حقيقية مع الله، المحبة والخدمة والتواضع، والسلوك الذي يليق بأبناء الله، لتنتقل المعرفة إلى ممارسة حية في البيت والكنيسة والمجتمع.
            </p>
          </div>

          {/* Stage 5 */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                ٥
              </span>
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                ٥. الوصول إلى أورشليم السماوية من خلال سفر الرؤيا
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pr-9">
              تُختتم الرحلة بدراسة سفر الرؤيا، الذي يفتح أمامنا أفق الرجاء المسيحي، ويعلن غلبة المسيح النهائية، وأمانة الله لوعوده، ورجاء المؤمنين في الحياة الأبدية. ونتعلّم الثبات في الإيمان، والأمانة للمسيح، والاستعداد الروحي، حتى نصل إلى الغاية النهائية لرحلتنا، وهي الحياة الأبدية والوجود مع الله في أورشليم السماوية.
            </p>
          </div>
        </div>
      </div>

      {/* خامسًا: ثمار الرحلة الكتابية */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-black">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">البند الخامس</span>
            <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
              خامسًا: ثمار الرحلة الكتابية
            </h3>
          </div>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          نطمح من خلال هذه الرحلة المباركة إلى أن يصل كل دارس إلى الثمار الروحية التالية:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'معرفة أعمق بشخص السيد المسيح.',
            'فهم متكامل للكتاب المقدس بعهديه القديم والجديد.',
            'إدراك وحدة الكتاب المقدس وترابط أسفاره في إعلان خطة الله للخلاص.',
            'نمو روحي وعقائدي وكنسي متوازن.',
            'اكتساب الفضائل المسيحية وتطبيقها في الحياة اليومية.',
            'تكوين أسرة تجتمع حول كلمة الله، وتقرأها وتفهمها وتحيا بها.',
            'تقديم شهادة حية للمسيح من خلال السلوك والأعمال والمحبة.',
          ].map((fruit, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                {fruit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* سادسًا: رسالتنا التي نحيا من أجلها */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-500/50 p-6 sm:p-10 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">البند السادس والختام</span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-50">
              سادسًا: رسالتنا التي نحيا من أجلها
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
          إن الكتاب المقدس ليس مجرد كلمات نقرأها، بل هو كلمة الله الحية التي ترشدنا إلى الحق، وتقودنا إلى معرفة السيد المسيح، وتساعدنا على أن نحيا بحسب مشيئته.
        </p>

        <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
          ومن هنا، تنطلق رسالة مدرسة <strong>Saint Paul’s School</strong> من إيمان راسخ بأن دراسة الكتاب المقدس ليست غاية في ذاتها، بل هي بداية لحياة جديدة تتشكّل فيها أفكارنا وقلوبنا وسلوكنا وفقًا لكلمة الله.
        </p>

        <div className="p-4 rounded-2xl bg-black/30 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-bold text-center leading-relaxed">
          «فنحن نحلم ببيت مسيحي يظل الكتاب المقدس مفتوحًا فيه، وأسرة تجتمع حوله بمحبة، وجيل يعرف كلمة الله ويفهمها ويحفظها ويحيا بها ويعلّمها للآخرين.
          غايتنا أن نفهم الكتاب المقدس، ونحيا به، ونشهد للمسيح من خلاله، حتى يصبح كل إنسان مسيحي إنجيلًا معاشًا بالروح القدس».
        </div>
      </div>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BIBLE_BOOKS,
  BibleBook,
  OLD_TESTAMENT_CATEGORIES,
  NEW_TESTAMENT_CATEGORIES,
} from '../data/bibleCanon';
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  Award,
  Calendar,
  Layers,
  Flame,
  Crown,
  Scroll,
  Shield,
  Star,
  CheckCircle2,
  Filter,
  Lock,
  Unlock,
  Check,
  AlertCircle,
} from 'lucide-react';

interface BibleCanonExplorerProps {
  currentBookId?: string;
  onSelectBook: (book: BibleBook) => void;
  completedBookIds?: string[];
  userRole?: 'student' | 'servant' | 'admin' | 'assistant';
  assignedBookIds?: string[];
  onAssignBook?: (book: BibleBook) => void;
  classNameTitle?: string;
}

export const BibleCanonExplorer: React.FC<BibleCanonExplorerProps> = ({
  currentBookId,
  onSelectBook,
  completedBookIds = [],
  userRole = 'student',
  assignedBookIds,
  onAssignBook,
  classNameTitle,
}) => {
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lockedBookNotice, setLockedBookNotice] = useState<string | null>(null);

  const oldTestamentBooks = useMemo(
    () => BIBLE_BOOKS.filter((b) => b.testament === 'old'),
    []
  );
  const newTestamentBooks = useMemo(
    () => BIBLE_BOOKS.filter((b) => b.testament === 'new'),
    []
  );

  const activeBooksList = useMemo(() => {
    let list = selectedTestament === 'old' ? oldTestamentBooks : selectedTestament === 'new' ? newTestamentBooks : BIBLE_BOOKS;
    if (activeCategory !== 'all') {
      list = list.filter((b) => b.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.englishTitle.toLowerCase().includes(q) ||
          b.theme.toLowerCase().includes(q) ||
          b.messianicSymbol.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedTestament, activeCategory, searchQuery, oldTestamentBooks, newTestamentBooks]);

  const categories = selectedTestament === 'old' ? OLD_TESTAMENT_CATEGORIES : NEW_TESTAMENT_CATEGORIES;

  return (
    <div className="space-y-6 text-right">
      {/* TWO BIG PROMINENT TESTAMENT CARDS (الأيقونتان الكبار للعهد القديم والعهد الجديد) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-600" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              مكتبة أسفار الكتاب المقدس (٧٣ سفراً قانونياً)
            </h3>
          </div>
          <span className="text-xs text-amber-800 dark:text-amber-300 font-bold bg-amber-100/80 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-300/40">
            الأسفار المقررة بتوجيه خادم الفصل 📖
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          تصفح شواهد وتفاصيل أسفار الكتاب المقدس ومتابعة السفر المشتغل عليه في حصص فصلك:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* CARD 1: العهد القديم */}
        <button
          type="button"
          onClick={() => {
            setSelectedTestament('old');
            setActiveCategory('all');
            setSearchQuery('');
          }}
          className={`relative p-6 sm:p-7 rounded-3xl border-2 text-right transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between gap-5 ${
            selectedTestament === 'old'
              ? 'bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 text-white border-amber-400 shadow-xl ring-4 ring-amber-500/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-600 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:scale-[1.01]'
          }`}
        >
          {/* Background Watermark Symbol */}
          <div className="absolute -left-6 -bottom-6 w-36 h-36 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-amber-400 flex items-center justify-center">
            <Scroll className="w-32 h-32" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md transition-transform group-hover:scale-110 ${
                  selectedTestament === 'old'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                }`}
              >
                📜
              </div>
              <div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTestament === 'old'
                      ? 'bg-white/20 text-amber-200'
                      : 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700'
                  }`}
                >
                  ٤٦ سفراً مقدساً
                </span>
                <h4
                  className={`text-xl sm:text-2xl font-black mt-1 ${
                    selectedTestament === 'old' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  العهد القديم
                </h4>
              </div>
            </div>

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                selectedTestament === 'old'
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
              }`}
            >
              <span>{selectedTestament === 'old' ? 'معروض الآن ✓' : 'عرض الأسفار'}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <p
              className={`leading-relaxed ${
                selectedTestament === 'old' ? 'text-amber-100/90' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              شريعة موسى، خروج الشعب، المزامير والنبوات، وسلسلة الآباء البطاركة ورموز الفداء العظيم.
            </p>
            <div
              className={`flex flex-wrap gap-1.5 text-[10px] font-semibold pt-1 ${
                selectedTestament === 'old' ? 'text-amber-200' : 'text-slate-400'
              }`}
            >
              <span>• التوراة والشريعة (٥)</span>
              <span>• الأسفار التاريخية (١٦)</span>
              <span>• الشعرية والحكمية (٧)</span>
              <span>• الأنبياء (١٨)</span>
            </div>
          </div>
        </button>

        {/* CARD 2: العهد الجديد */}
        <button
          type="button"
          onClick={() => {
            setSelectedTestament('new');
            setActiveCategory('all');
            setSearchQuery('');
          }}
          className={`relative p-6 sm:p-7 rounded-3xl border-2 text-right transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between gap-5 ${
            selectedTestament === 'new'
              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white border-emerald-400 shadow-xl ring-4 ring-emerald-500/20 scale-[1.02]'
              : 'bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:scale-[1.01]'
          }`}
        >
          {/* Background Watermark Symbol */}
          <div className="absolute -left-6 -bottom-6 w-36 h-36 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-32 h-32" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md transition-transform group-hover:scale-110 ${
                  selectedTestament === 'new'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                ✝️
              </div>
              <div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTestament === 'new'
                      ? 'bg-white/20 text-emerald-200'
                      : 'bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700'
                  }`}
                >
                  ٢٧ سفراً مقدساً
                </span>
                <h4
                  className={`text-xl sm:text-2xl font-black mt-1 ${
                    selectedTestament === 'new' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  العهد الجديد
                </h4>
              </div>
            </div>

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                selectedTestament === 'new'
                  ? 'bg-emerald-400 text-slate-950 font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white'
              }`}
            >
              <span>{selectedTestament === 'new' ? 'معروض الآن ✓' : 'عرض الأسفار'}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <p
              className={`leading-relaxed ${
                selectedTestament === 'new' ? 'text-emerald-100/90' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              بشارة الخلاص وإنجيل ربنا يسوع المسيح، أعمال الرسل، رسائل بولس الرسول والكاثوليكون، وسفر الرؤيا.
            </p>
            <div
              className={`flex flex-wrap gap-1.5 text-[10px] font-semibold pt-1 ${
                selectedTestament === 'new' ? 'text-emerald-200' : 'text-slate-400'
              }`}
            >
              <span>• الأناجيل الأربعة (٤)</span>
              <span>• أعمال الرسل (١)</span>
              <span>• رسائل بولس (١٤)</span>
              <span>• الكاثوليكون (٧)</span>
              <span>• الرؤيا (١)</span>
            </div>
          </div>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR (WHEN A TESTAMENT IS SELECTED) */}
      {selectedTestament && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {selectedTestament === 'old' ? '📜' : '✝️'}
              </span>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedTestament === 'old'
                    ? 'أسفار العهد القديم المقررة'
                    : 'أسفار العهد الجديد المقررة'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  اضغط على أي سفر لعرض شواهده وموضوعه الروحي والرمز المسياني:
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن اسم السفر..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              جميع الأسفار ({selectedTestament === 'old' ? oldTestamentBooks.length : newTestamentBooks.length})
            </button>

            {categories.map((cat) => {
              const count = (selectedTestament === 'old' ? oldTestamentBooks : newTestamentBooks).filter(
                (b) => b.category === cat
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Locked Notice Banner */}
          {lockedBookNotice && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-bold">{lockedBookNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setLockedBookNotice(null)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Role Helper Notice */}
          {userRole === 'student' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>توجيه دراسي:</strong> الأسفار المفتوحة هي التي كلّفك بها خادم فصلك للدراسة ورصد الدرجات. باقي الأسفار مغلقة حتى يتم اعتمادها من الخادم.
              </span>
            </div>
          )}

          {/* BOOK CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {activeBooksList.map((book) => {
              const isAssigned = assignedBookIds && assignedBookIds.length > 0
                ? assignedBookIds.includes(book.id)
                : book.id === (currentBookId || 'genesis');
              const isCurrent = currentBookId === book.id;
              const isCompleted = completedBookIds.includes(book.id);
              const isStudentLocked = userRole === 'student' && !isAssigned;

              return (
                <div
                  key={book.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isStudentLocked
                      ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
                      : isAssigned
                      ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-500/20'
                      : isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className={`font-black text-sm sm:text-base ${isStudentLocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {book.title}
                          </h5>
                          {isAssigned && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                              {userRole === 'student' ? 'مقرر ومتاح 📖' : 'معتمد للفصل 🎯'}
                            </span>
                          )}
                          {isStudentLocked && (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>مغلق</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                              تم الإتمام 🎓
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {book.englishTitle} • {book.chaptersCount} أصحاحاً
                        </span>
                      </div>

                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md shrink-0 font-medium">
                        {book.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {book.theme}
                    </p>

                    <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 text-[10px] text-amber-900 dark:text-amber-300 border border-amber-300/30">
                      <strong>الرمز المسياني:</strong> {book.messianicSymbol}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {book.chaptersCount} أصحاحاً • ٨ حصص
                    </span>

                    {/* Student View Action */}
                    {userRole === 'student' ? (
                      isAssigned ? (
                        <button
                          type="button"
                          onClick={() => onSelectBook(book)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span>متابعة الحصص والدرجات</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setLockedBookNotice(
                              `سفر «${book.title}» مغلق حالياً. خادم فصلك هو من يحدد السفر المتاح لدراسته ورصد الدرجات.`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-not-allowed hover:bg-slate-300"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>مغلق للمخدومين</span>
                        </button>
                      )
                    ) : (
                      /* Servant / Admin Actions */
                      <div className="flex items-center gap-1.5">
                        {onAssignBook && (
                          <button
                            type="button"
                            onClick={() => onAssignBook(book)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isAssigned
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                            title={isAssigned ? 'هذا هو السفر المعتمد حالياً' : 'تحديد هذا السفر لدراسة الفصل'}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAssigned ? 'السفر المعتمد للفصل' : 'تحديد لدراسة الفصل'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectBook(book)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>استعراض</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

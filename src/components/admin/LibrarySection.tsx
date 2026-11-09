import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Download,
  Search,
  ExternalLink,
  BookMarked,
  Filter,
  FileText,
  Sparkles,
  X,
  CheckCircle,
  CheckCircle2,
  Upload,
  Eye,
  FileUp,
} from 'lucide-react';
import { ClassId, LibraryBook } from '../../types';
import { CLASSES_LIST } from '../../data/mockData';

interface LibrarySectionProps {
  libraryBooks: LibraryBook[];
  onAddBook: (bookData: Omit<LibraryBook, 'id' | 'addedAt' | 'addedBy'>) => Promise<LibraryBook>;
  onDeleteBook: (bookId: string) => void;
  canManage?: boolean;
}

const CATEGORY_LABELS: Record<LibraryBook['category'], { label: string; color: string }> = {
  old_testament: { label: 'تفاسير العهد القديم والرموز', color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  new_testament: { label: 'العهد الجديد والرسائل البولسية', color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  patristic: { label: 'أقوال وتفاسير الآباء', color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  theology_creed: { label: 'العقيدة واللاهوت الأرثوذكسي', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  church_ritual: { label: 'الطقوس والتاريخ الكنسي', color: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800' },
  servant_prep: { label: 'إعداد الخادم والمهارات الروحية', color: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
};

export const LibrarySection: React.FC<LibrarySectionProps> = ({
  libraryBooks,
  onAddBook,
  onDeleteBook,
  canManage = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState(false);

  // Form State
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState<LibraryBook['category']>('old_testament');
  const [bookTargetClass, setBookTargetClass] = useState<ClassId | 'all_classes'>('all_classes');
  const [bookDescription, setBookDescription] = useState('');
  const [bookFileName, setBookFileName] = useState('');
  const [bookPageCount, setBookPageCount] = useState<number | ''>('');
  const [bookDownloadUrl, setBookDownloadUrl] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState<string>('');
  const [uploadedFileType, setUploadedFileType] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Book Delete State
  const [bookToDelete, setBookToDelete] = useState<LibraryBook | null>(null);
  const [deleteBookSuccessMsg, setDeleteBookSuccessMsg] = useState<string | null>(null);

  const handleConfirmDeleteBook = () => {
    if (!bookToDelete) return;
    const title = bookToDelete.title;
    onDeleteBook(bookToDelete.id);
    setBookToDelete(null);
    setDeleteBookSuccessMsg(`تم حذف كتاب «${title}» نهائياً من المكتبة وقاعدة البيانات بنجاح ✅`);
    setTimeout(() => setDeleteBookSuccessMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookFileName(file.name);
    setUploadedFileType(file.type || 'application/pdf');
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFileSize(`${sizeMb} MB`);
    if (!bookTitle) {
      setBookTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const filteredBooks = libraryBooks.filter((book) => {
    if (selectedCategory !== 'all' && book.category !== selectedCategory) return false;
    if (selectedClassFilter !== 'all') {
      if (book.targetClassId && book.targetClassId !== 'all_classes' && book.targetClassId !== selectedClassFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author.toLowerCase().includes(q);
      const matchDesc = book.description.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchDesc) return false;
    }
    return true;
  });

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddBook({
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category: bookCategory,
        targetClassId: bookTargetClass,
        description: bookDescription.trim() || 'مرجع كنسي موثوق لإعداد الدروس والوعظ الكتابي.',
        fileName: bookFileName.trim() || `${bookTitle.trim().replace(/\s+/g, '_')}.pdf`,
        fileSize: uploadedFileSize || `${(Math.random() * 4 + 2).toFixed(1)} MB`,
        pageCount: bookPageCount ? Number(bookPageCount) : undefined,
        downloadUrl: bookDownloadUrl.trim() || undefined,
        fileData: uploadedFileData || undefined,
        fileType: uploadedFileType || undefined,
      });

      setBookTitle('');
      setBookAuthor('');
      setBookDescription('');
      setBookFileName('');
      setBookPageCount('');
      setBookDownloadUrl('');
      setUploadedFileData('');
      setUploadedFileType('');
      setUploadedFileSize('');
      setIsAddModalOpen(false);
      setAddSuccessMsg(true);
      setTimeout(() => setAddSuccessMsg(false), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Toast Alert: Delete Book Success */}
      {deleteBookSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{deleteBookSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteBookSuccessMsg(null)}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner / Hero Card */}
      <div className="bg-gradient-to-l from-amber-900 via-stone-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <BookMarked className="w-3.5 h-3.5" />
              <span>مكتبة مدرسة سانت بولس الكنسية</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-amber-50">
              المكتبة والمراجع الكنسية لإعداد الدروس
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              هنا يرفع أمين الخدمة للخدام أمهات الكتب الكنسية، تفاسير الآباء القديسين، مذكرات العهد القديم والجديد، والمراجع الموثوقة لتحضير اللقاءات الأسبوعية وتزويد المخدومين بالمعرفة الأرثوذكسية النقية.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كتاب / مرجع جديد للخدام</span>
            </button>
          )}
        </div>
      </div>

      {addSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تمت إضافة الكتاب بنجاح إلى المكتبة! يستطيع جميع الخدام الآن الاطلاع عليه وتحميله فوراً.</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث باسم الكتاب، اسم الكاتب، أو الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">كل التصنيفات (جميع المراجع)</option>
              <option value="old_testament">تفاسير العهد القديم والرموز</option>
              <option value="new_testament">العهد الجديد والرسائل البولسية</option>
              <option value="patristic">أقوال وتفاسير الآباء</option>
              <option value="theology_creed">العقيدة واللاهوت الأرثوذكسي</option>
              <option value="church_ritual">الطقوس والتاريخ الكنسي</option>
              <option value="servant_prep">إعداد الخادم والمهارات الروحية</option>
            </select>
          </div>

          {/* Class Target Filter */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">كل الفصول الدراسية</option>
              {CLASSES_LIST.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.ageRange})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 ml-1">تصفية سريعة:</span>
          {Object.entries(CATEGORY_LABELS).map(([catKey, val]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(selectedCategory === catKey ? 'all' : catKey)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books Roster Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>الكتب والمراجع المتاحة ({filteredBooks.length} كتاب)</span>
          </h3>
          {(selectedCategory !== 'all' || selectedClassFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedClassFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              إلغاء الفلاتر
            </button>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
            <BookMarked className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
              لم يتم العثور على مراجع مطابقة للبحث
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              جرب تغيير كلمات البحث أو إزالة التصفية لعرض جميع الكتب المرفوعة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const catInfo = CATEGORY_LABELS[book.category] || { label: 'مرجع عام', color: 'bg-stone-100 text-stone-800' };
              const targetCls = CLASSES_LIST.find((c) => c.id === book.targetClassId);

              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header Tags */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                      {targetCls ? (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                          {targetCls.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-amber-200 dark:border-amber-800/50">
                          لكافة الفصول
                        </span>
                      )}
                    </div>

                    {/* Title & Author */}
                    <div>
                      <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-400 font-bold mt-1">
                        بقلم: {book.author}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                      {book.description}
                    </p>
                  </div>

                  {/* Metadata and Actions */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>الملف: {book.fileName || 'نسخة إلكترونية'}</span>
                      {book.pageCount && <span>{book.pageCount} صفحة</span>}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {book.fileData ? (
                        <a
                          href={book.fileData}
                          download={book.fileName || `${book.title}.pdf`}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          title="تحميل الملف مباشرة إلى جهازك"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل الملف ({book.fileSize || 'PDF'})</span>
                        </a>
                      ) : book.downloadUrl ? (
                        <a
                          href={book.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>فتح رابط الكتاب</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const content = `مدرسة سانت بولس للكتاب المقدس\nكنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي\n\nاسم المرجع: ${book.title}\nالكاتب: ${book.author}\nالتصنيف: ${catInfo.label}\n\nملخص ومحاور الكتاب:\n${book.description}\n\nتاريخ الإضافة: ${book.addedAt}\nأضيف بواسطة: ${book.addedBy}\n`;
                            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${book.title.replace(/\s+/g, '_')}_مرجع_كنسي.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل بطاقة المرجع</span>
                        </button>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setBookToDelete(book)}
                          className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                          title="حذف هذا الكتاب من المكتبة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Book */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-right p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  إضافة مرجع أو كتاب كنسي لمكتبة الخدام
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-3.5 text-xs">
              {/* Real File Upload Section Requested by User */}
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رفع ملف المرجع من جهازك (PDF، صورة، أو مستند):
                </label>
                <div className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 bg-amber-50/50 dark:bg-stone-800/80 text-center space-y-2">
                  <input
                    type="file"
                    id="library-file-upload-input"
                    accept="application/pdf,image/*,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="library-file-upload-input"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-all hover:scale-105"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📁 اضغط لاختيار ملف من جهازك</span>
                  </label>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    يدعم رفع ملفات PDF وصور ومذكرات Word ليتمكن الخدام من تحميلها مباشرة.
                  </p>
                  {uploadedFileData && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>تم إرفاق: {bookFileName} ({uploadedFileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  اسم الكتاب أو المرجع: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرح سفر التكوين والرموز المسيانية"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الكاتب / الأب المسلّم: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قداسة البابا شنودة الثالث / القديس يوحنا ذهبي الفم"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    تصنيف المرجع:
                  </label>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="old_testament">تفاسير العهد القديم والرموز</option>
                    <option value="new_testament">العهد الجديد والرسائل البولسية</option>
                    <option value="patristic">أقوال وتفاسير الآباء</option>
                    <option value="theology_creed">العقيدة واللاهوت الأرثوذكسي</option>
                    <option value="church_ritual">الطقوس والتاريخ الكنسي</option>
                    <option value="servant_prep">إعداد الخادم والمهارات الروحية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الفصل المستهدف بالتحضير:
                  </label>
                  <select
                    value={bookTargetClass}
                    onChange={(e) => setBookTargetClass(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="all_classes">متاح لكافة الفصول والخدام</option>
                    {CLASSES_LIST.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  نبذة عن الكتاب ومحاوره التعليمية:
                </label>
                <textarea
                  rows={3}
                  placeholder="اكتب ملخصاً سريعاً لما يحتويه الكتاب وكيف يستفيد منه الخادم في تحضير درسه..."
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    اسم الملف (PDF):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: genesis_commentary.pdf"
                    value={bookFileName}
                    onChange={(e) => setBookFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    عدد الصفحات التقريبي:
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 220"
                    value={bookPageCount}
                    onChange={(e) => setBookPageCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رابط خارجي للتحميل المباشر (اختياري):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bookDownloadUrl}
                  onChange={(e) => setBookDownloadUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر الكتاب للخدام'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE BOOK PERMANENTLY */}
      {bookToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setBookToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  تأكيد حذف الكتاب من المكتبة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs space-y-1.5 text-rose-900 dark:text-rose-200">
              <div>الكتاب المراد حذفه: <strong className="text-base text-stone-950 dark:text-white block mt-0.5">{bookToDelete.title}</strong></div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                الكاتب/الأب: {bookToDelete.author} | الحجم: {bookToDelete.fileSize || 'ملف كتابي'}
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              ⚠️ هل أنت متأكد من حذف هذا المرجع الكنسي نهائياً من المكتبة؟ سيتم إزالته فوراً من قاعدة البيانات ولن يظهر للخدام بعد الآن.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBook}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف المرجع الآن 🗑️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

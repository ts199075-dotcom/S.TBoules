import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  BookOpen,
  Send,
  AlertCircle,
  FileCheck,
  Check,
  Download,
  QrCode,
  Share2,
  Plus,
  LogOut,
  Edit,
  X,
  BookMarked,
  Trash2,
  Save,
  BookmarkCheck,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  Scroll,
} from 'lucide-react';
import { QrAttendanceModal } from './QrAttendanceModal';
import { LibrarySection } from './admin/LibrarySection';
import { BibleCanonExplorer } from './BibleCanonExplorer';
import { BIBLE_BOOKS, BibleBook } from '../data/bibleCanon';
import { BibleSession, ClassId, UserProfile } from '../types';
import { sessionTotal } from '../lib/scores';

export const ServantDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    users,
    sessions,
    grades,
    servantSubmissions,
    lessonPosts,
    libraryBooks,
    classAssignedBooks,
    assignBookForClass,
    saveBatchGrades,
    currentTermId,
    addLibraryBook,
    deleteLibraryBook,
    deleteLessonPost,
    submitServantCheckIn,
    createLessonPost,
    saveSessionGrade,
    getStudentScoreSummary,
    getStudentSessionGrades,
    logout,
  } = useApp();

  const [activeServantTab, setActiveServantTab] = useState<'class_management' | 'library'>('class_management');

  const servantClassId = currentUser?.classId || 'prep_2_3';
  const classObj = classes.find((c) => c.id === servantClassId) || classes[4];
  const classStudents = users.filter(
    (u) => u.role === 'student' && u.classId === servantClassId && u.status === 'active'
  );
  const classSessions = sessions.filter((s) => s.classId === servantClassId);
  const activeSessionForQr = classSessions[classSessions.length - 1] || sessions[0];

  // Book Assignment State
  const [isAssignBookModalOpen, setIsAssignBookModalOpen] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const currentClassAssigned = servantClassId ? classAssignedBooks[servantClassId] : undefined;

  // Flexible Curriculum & Batch Grading Workbench State
  const [workbenchSessionNumber, setWorkbenchSessionNumber] = useState<number>(1);
  const [workbenchBookId, setWorkbenchBookId] = useState<string>(() => currentClassAssigned?.bookId || 'genesis');
  const [workbenchChapters, setWorkbenchChapters] = useState<string>('الأصحاحات ١ إلى ٣');
  const [workbenchTitle, setWorkbenchTitle] = useState<string>('الحصة الأولى: دراسة السفر');
  const [workbenchObjective, setWorkbenchObjective] = useState<string>('فهم الشاهد الكتابي وتطبيقه روحياً وحفظ الآية');
  const [workbenchDate, setWorkbenchDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [workbenchMemoryVerse, setWorkbenchMemoryVerse] = useState<string>('');
  const [workbenchVerseRef, setWorkbenchVerseRef] = useState<string>('');
  const [workbenchVerses, setWorkbenchVerses] = useState<Array<{ id: string; verse: string; reference: string }>>([
    { id: 'v-1', verse: '', reference: '' },
  ]);
  const [workbenchLessonSummary, setWorkbenchLessonSummary] = useState<string>('');
  const [workbenchAttachmentName, setWorkbenchAttachmentName] = useState<string>('');
  const [workbenchFileData, setWorkbenchFileData] = useState<string | undefined>(undefined);
  const [workbenchFileType, setWorkbenchFileType] = useState<string | undefined>(undefined);
  const [workbenchFileSize, setWorkbenchFileSize] = useState<string | undefined>(undefined);
  const [workbenchPublishSuccessModal, setWorkbenchPublishSuccessModal] = useState<{
    sessionNumber: number;
    bookTitle: string;
    chapters: string;
    studentsCount: number;
    versesCount: number;
    hasAttachment: boolean;
  } | null>(null);

  const handleAddWorkbenchVerse = () => {
    setWorkbenchVerses((prev) => [
      ...prev,
      { id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, verse: '', reference: '' },
    ]);
  };

  const handleUpdateWorkbenchVerse = (id: string, field: 'verse' | 'reference', val: string) => {
    setWorkbenchVerses((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const handleRemoveWorkbenchVerse = (id: string) => {
    setWorkbenchVerses((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== id) : prev));
  };

  const [batchGradesMap, setBatchGradesMap] = useState<
    Record<string, { exam: number; homework: number; attendance: number; participation: number; prayer: number; tools: number; notes: string }>
  >({});
  const [batchGradeSuccessMsg, setBatchGradeSuccessMsg] = useState<string | null>(null);

  // File upload handler for the Workbench lesson handout / PDF
  const handleWorkbenchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى ٢٠ ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setWorkbenchFileData(reader.result as string);
      setWorkbenchAttachmentName(file.name);
      setWorkbenchFileType(file.type || 'application/pdf');
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      setWorkbenchFileSize(`${mb} MB`);
    };
    reader.readAsDataURL(file);
  };

  // Ref to prevent background polling from wiping batchGradesMap while the servant is editing
  const sessionSyncKeyRef = useRef<string>('');

  // Sync Workbench when session number, class, or term changes
  React.useEffect(() => {
    const key = `${servantClassId}_${currentTermId}_${workbenchSessionNumber}`;
    if (sessionSyncKeyRef.current === key) {
      return;
    }
    sessionSyncKeyRef.current = key;

    const existing = sessions.find(
      (s) => s.classId === servantClassId && (s.termId || currentTermId) === currentTermId && s.sessionNumber === workbenchSessionNumber
    );

    if (existing) {
      setWorkbenchBookId(existing.bookId || currentClassAssigned?.bookId || 'genesis');
      setWorkbenchChapters(existing.coveredChapters || existing.biblePassage || 'الأصحاحات ١ إلى ٣');
      setWorkbenchTitle(existing.title || `الحصة ${workbenchSessionNumber}: دراسة السفر`);
      setWorkbenchObjective(existing.objective || 'فهم الشاهد الكتابي وتطبيقه روحياً وحفظ الآية');
      setWorkbenchDate(existing.date || new Date().toISOString().split('T')[0]);
      if (existing.memoryVerses && existing.memoryVerses.length > 0) {
        setWorkbenchVerses(existing.memoryVerses);
        setWorkbenchMemoryVerse(existing.memoryVerses[0]?.verse || '');
        setWorkbenchVerseRef(existing.memoryVerses[0]?.reference || '');
      } else if (existing.memoryVerse) {
        setWorkbenchVerses([{ id: 'v-1', verse: existing.memoryVerse, reference: existing.memoryVerseRef || '' }]);
        setWorkbenchMemoryVerse(existing.memoryVerse);
        setWorkbenchVerseRef(existing.memoryVerseRef || '');
      } else {
        setWorkbenchVerses([{ id: 'v-1', verse: '', reference: '' }]);
        setWorkbenchMemoryVerse('');
        setWorkbenchVerseRef('');
      }
      setWorkbenchLessonSummary(existing.lessonSummary || existing.objective || '');
      setWorkbenchAttachmentName(existing.attachmentName || '');
      setWorkbenchFileData(existing.fileData);
      setWorkbenchFileType(existing.fileType);
      setWorkbenchFileSize(existing.fileSize);

      // Populate grades
      const newMap: Record<string, any> = {};
      classStudents.forEach((st) => {
        const g = grades.find((gr) => gr.sessionId === existing.id && gr.studentId === st.id);
        newMap[st.id] = {
          exam: g ? Number(g.exam || 0) : 0,
          homework: g ? Number(g.homework || 0) : 0,
          attendance: g ? Number(g.attendance || 0) : 0,
          participation: g ? Number(g.participation || 0) : 0,
          prayer: g ? Number(g.prayer || 0) : 0,
          tools: g ? Number(g.tools || 0) : 0,
          notes: g ? g.notes || '' : '',
        };
      });
      setBatchGradesMap(newMap);
    } else {
      const activeBook = BIBLE_BOOKS.find((b) => b.id === (currentClassAssigned?.bookId || 'genesis')) || BIBLE_BOOKS[0];
      setWorkbenchBookId(activeBook.id);
      setWorkbenchChapters(
        workbenchSessionNumber === 1
          ? 'الأصحاحات ١ إلى ٣'
          : workbenchSessionNumber === 2
          ? 'الأصحاحات ٤ إلى ٦'
          : workbenchSessionNumber === 3
          ? 'الأصحاحات ٧ إلى ١٠'
          : `أصحاحات الحصة ${workbenchSessionNumber}`
      );
      setWorkbenchTitle(`الحصة ${workbenchSessionNumber}: دراسة ${activeBook.title}`);
      setWorkbenchObjective(`دراسة وتطبيق الشاهد الكتابي في ${activeBook.title} وحفظ الآية الأسبوعية`);
      setWorkbenchDate(new Date().toISOString().split('T')[0]);
      setWorkbenchVerses([{ id: 'v-1', verse: '', reference: '' }]);
      setWorkbenchMemoryVerse('');
      setWorkbenchVerseRef('');
      setWorkbenchLessonSummary('');
      setWorkbenchAttachmentName('');
      setWorkbenchFileData(undefined);
      setWorkbenchFileType(undefined);
      setWorkbenchFileSize(undefined);

      const newMap: Record<string, any> = {};
      classStudents.forEach((st) => {
        newMap[st.id] = {
          exam: 0,
          homework: 0,
          attendance: 0,
          participation: 0,
          prayer: 0,
          tools: 0,
          notes: '',
        };
      });
      setBatchGradesMap(newMap);
    }
  }, [workbenchSessionNumber, servantClassId, currentTermId]);

  const currentSubmission = servantSubmissions.find(
    (s) => s.servantId === currentUser?.id
  );

  const [status, setStatus] = useState<'attending' | 'absent'>(
    currentSubmission?.status || 'attending'
  );
  const [absenceReason, setAbsenceReason] = useState(
    currentSubmission?.absenceReason || ''
  );
  const [prepTitle, setPrepTitle] = useState(
    currentSubmission?.prepTitle || 'شرح سفر أعمال الرسل: كرازة القديس بولس في أثينا'
  );
  const [prepBibleVerse, setPrepBibleVerse] = useState(
    currentSubmission?.prepBibleVerse || 'لأَنَّنَا بِهِ نَحْيَا وَنَتَحَرَّكُ وَنُوجَدُ (أعمال ١٧ : ٢٨)'
  );
  const [attachmentName, setAttachmentName] = useState(
    currentSubmission?.prepAttachmentName || 'مذكرة_تحضير_أعمال_الرسل_الأسبوع_القادم.pdf'
  );
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'document' | 'notes' | 'image'>(
    currentSubmission?.prepAttachmentType || 'pdf'
  );
  const [attachmentData, setAttachmentData] = useState<string | undefined>(
    currentSubmission?.prepAttachmentData || undefined
  );
  const [prepNotes, setPrepNotes] = useState(
    currentSubmission?.prepNotes || 'تم تجهيز أسئلة مسابقة سريعة وعرض سلايدات على الداتاشو مع خريطة رحلات بولس الرسول.'
  );
  const [isEditOverviewModalOpen, setIsEditOverviewModalOpen] = useState(false);
  const [customOverviewDraft, setCustomOverviewDraft] = useState(
    currentClassAssigned?.customOverview || ''
  );

  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // New Post Modal State (نشر شيء جديد يتطلب موافقة الأدمن)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTargetClass, setPostTargetClass] = useState<ClassId>(servantClassId);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<'lesson_handout' | 'bible_study' | 'quiz' | 'announcement'>('lesson_handout');
  const [postVerse, setPostVerse] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postAttachmentName, setPostAttachmentName] = useState('');
  const [postFileData, setPostFileData] = useState<string | undefined>(undefined);
  const [postFileType, setPostFileType] = useState<string | undefined>(undefined);
  const [postFileSize, setPostFileSize] = useState<string | undefined>(undefined);
  const [postSuccessNotice, setPostSuccessNotice] = useState(false);

  // File Upload Handler for Post / Handout
  const handlePostPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى ١٥ ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPostFileData(reader.result as string);
      setPostAttachmentName(file.name);
      setPostFileType(file.type || 'application/pdf');
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      setPostFileSize(`${mb} MB`);
    };
    reader.readAsDataURL(file);
  };

  // QR Modal State
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<BibleSession | null>(null);

  // Posts created by this servant
  const myPosts = lessonPosts.filter((p) => p.servantId === currentUser?.id);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          برجاء تسجيل الدخول بحساب خادم لعرض لوحة الفصل
        </h2>
        <p className="text-sm text-stone-500">سجل الدخول للمتابعة والتحضير ورصد درجات فصلك.</p>
      </div>
    );
  }

  // 1. Pending Approval Screen for New Servants
  if (currentUser.status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-700">
            حساب خادم جديد بانتظار اعتماد وموافقة أمانة الخدمة ⏳
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            أهلاً بك يا خادم المسيح: {currentUser.name}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            تم تسجيل بياناتك بنجاح في مدرسة القديس بولس للكتاب المقدس. وبحسب لوائح المدرسة، <strong className="text-amber-800 dark:text-amber-400">لا يمكنك الدخول إلى الفصل أو رصد درجات الطلاب أو إرسال التحضيرات إلا بعد اعتماد وتفعيل حسابك رسميًا من أمين الخدمة أو مسؤول النظام</strong>.
          </p>
        </div>

        <div className="bg-amber-50/80 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 text-right max-w-md mx-auto space-y-3">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>بيانات حساب الخادم المسجلة:</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <div>• <strong>الفصل المخصص للخدمة:</strong> {classes.find(c => c.id === currentUser.classId)?.name || 'لم يحدد بعد'}</div>
            <div>• <strong>رقم الهاتف:</strong> {currentUser.phone}</div>
            <div>• <strong>أب الاعتراف:</strong> {currentUser.confessionFather || 'لم يحدد'}</div>
            <div>• <strong>مسؤول الاعتماد:</strong> أمين الخدمة (ts199075@gmail.com)</div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>
    );
  }

  const handleAssignBook = async (book: BibleBook) => {
    await assignBookForClass({
      classId: servantClassId,
      bookId: book.id,
      bookName: book.title,
      testament: book.testament,
      termId: currentTermId,
      assignedByServantName: currentUser?.name || 'خادم الفصل',
      assignedAt: new Date().toISOString().split('T')[0],
      customOverview: currentClassAssigned?.bookId === book.id ? currentClassAssigned.customOverview : undefined,
    });
    setWorkbenchBookId(book.id);
    setWorkbenchTitle(`الحصة ${workbenchSessionNumber}: دراسة ${book.title}`);
    setIsAssignBookModalOpen(false);
    setAssignSuccessMsg(`تم تحديد سفر «${book.title}» رسمياً لطلاب فصل ${classObj.name}! الآن لن يفتح للمخدومين سوى هذا السفر المقرر.`);
    setTimeout(() => setAssignSuccessMsg(null), 5000);
  };

  const handleSaveCustomOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeAssigned = currentClassAssigned || {
      classId: servantClassId,
      bookId: 'genesis',
      bookName: 'سفر التكوين',
      testament: 'old' as const,
      termId: currentTermId,
      assignedByServantName: currentUser?.name || 'خادم الفصل',
      assignedAt: new Date().toISOString().split('T')[0],
    };

    await assignBookForClass({
      ...activeAssigned,
      customOverview: customOverviewDraft.trim() || undefined,
    });
    setIsEditOverviewModalOpen(false);
    setAssignSuccessMsg('تم حفظ وتحديث نبذة ومعلومات السفر لطلاب فصلك بنجاح! ستظهر للطلاب فوراً.');
    setTimeout(() => setAssignSuccessMsg(null), 5000);
  };

  const handleSaveWorkbench = async (e: React.FormEvent) => {
    e.preventDefault();
    const book = BIBLE_BOOKS.find((b) => b.id === workbenchBookId) || BIBLE_BOOKS[0];
    const existingSession = sessions.find(
      (s) => s.classId === servantClassId && (s.termId || currentTermId) === currentTermId && s.sessionNumber === workbenchSessionNumber
    );
    const sessionId = existingSession?.id || `sess-${servantClassId}-${currentTermId}-${workbenchSessionNumber}-${Date.now().toString(36)}`;

    const gradesArray = classStudents.map((st) => {
      const val = batchGradesMap[st.id] || {
        exam: 0,
        homework: 0,
        attendance: 0,
        participation: 0,
        prayer: 0,
        tools: 0,
        notes: '',
      };
      return {
        studentId: st.id,
        ...val,
      };
    });

    await saveBatchGrades({
      sessionId,
      sessionMeta: {
        id: sessionId,
        classId: servantClassId,
        termId: currentTermId,
        sessionNumber: workbenchSessionNumber,
        bookId: book.id,
        bookName: book.title,
        testament: book.testament,
        coveredChapters: workbenchChapters,
        title: workbenchTitle || `الحصة ${workbenchSessionNumber}: دراسة ${book.title}`,
        objective: workbenchObjective,
        date: workbenchDate,
        servantName: currentUser?.name || 'خادم الفصل',
        qrSecretCode: existingSession?.qrSecretCode || `STPAUL-${book.id.slice(0, 3).toUpperCase()}-${workbenchSessionNumber}`,
        qrActive: true,
        maxScorePerMetric: 10,
        memoryVerse: workbenchVerses.find((v) => v.verse.trim())?.verse || workbenchMemoryVerse,
        memoryVerseRef: workbenchVerses.find((v) => v.verse.trim())?.reference || workbenchVerseRef,
        memoryVerses: workbenchVerses.filter((v) => v.verse.trim()),
        lessonSummary: workbenchLessonSummary,
        attachmentName: workbenchAttachmentName || undefined,
        fileData: workbenchFileData,
        fileType: workbenchFileType,
        fileSize: workbenchFileSize,
      },
      grades: gradesArray,
    });

    setBatchGradeSuccessMsg(
      `تم حفظ وتثبيت الحصة رقم (${workbenchSessionNumber}) وسفر «${book.title}» (${workbenchChapters}) ورصد درجات جميع طلاب الفصل (${classStudents.length} طلاب) بنجاح تام في قاعدة البيانات! ✅`
    );
    setTimeout(() => setBatchGradeSuccessMsg(null), 6000);

    const validVerses = workbenchVerses.filter((v) => v.verse.trim());

    // Open high-clarity publication delivery modal
    setWorkbenchPublishSuccessModal({
      sessionNumber: workbenchSessionNumber,
      bookTitle: book.title,
      chapters: workbenchChapters,
      studentsCount: classStudents.length,
      versesCount: validVerses.length,
      hasAttachment: Boolean(workbenchAttachmentName),
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitServantCheckIn({
      status,
      absenceReason: status === 'absent' ? absenceReason : undefined,
      prepTitle: status === 'attending' ? prepTitle : undefined,
      prepBibleVerse: status === 'attending' ? prepBibleVerse : undefined,
      prepAttachmentName: status === 'attending' ? attachmentName : undefined,
      prepAttachmentType: status === 'attending' ? attachmentType : undefined,
      prepAttachmentData: status === 'attending' ? attachmentData : undefined,
      prepNotes: status === 'attending' ? prepNotes : undefined,
    });

    setIsSubmittedSuccess(true);
    setTimeout(() => setIsSubmittedSuccess(false), 5000);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    createLessonPost({
      title: postTitle.trim(),
      category: postCategory,
      bibleVerse: postVerse.trim(),
      content: postContent.trim(),
      attachmentName: postAttachmentName.trim() || undefined,
      fileData: postFileData,
      fileType: postFileType,
      classId: postTargetClass,
    });

    setPostTitle('');
    setPostVerse('');
    setPostContent('');
    setPostAttachmentName('');
    setPostFileData(undefined);
    setPostFileType(undefined);
    setPostFileSize(undefined);
    setIsPostModalOpen(false);
    setPostSuccessNotice(true);
    setTimeout(() => setPostSuccessNotice(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-right">
      {/* Header with Church & Saint Paul aesthetics */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="text-xs text-amber-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-amber-300/20">
              بوابة الخدام ومسؤولي الدروس
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-amber-50">
            أهلاً بك يا خادم المسيح: {currentUser?.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-100/80 pt-1">
            <span className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30 font-bold text-amber-200">
              {classObj.name}
            </span>
            <span>رقم الهاتف: <strong>{currentUser?.phone}</strong></span>
            <span>•</span>
            <span>أب الاعتراف: <strong>{currentUser?.confessionFather || 'أبونا ميخائيل القمص'}</strong></span>
          </div>
        </div>

        {/* Big QR Button for Servant */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {activeSessionForQr && (
            <button
              onClick={() => setSelectedSessionForQr(activeSessionForQr)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <QrCode className="w-5 h-5" />
              <span>فتح QR كود حضور الجلسة للطلاب 📱</span>
            </button>
          )}

          <button
            onClick={logout}
            className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-rose-200 border border-white/15 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Servant Section Tabs: Class Management vs Church Library */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveServantTab('class_management')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeServantTab === 'class_management'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>إدارة الفصل ودرجات الطلاب وتحضير الدرس</span>
        </button>

        <button
          onClick={() => setActiveServantTab('library')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeServantTab === 'library'
              ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <BookMarked className="w-4 h-4 text-amber-500" />
          <span>مكتبة المراجع الكنسية وتفاسير الآباء للتحضير ({libraryBooks.length})</span>
        </button>
      </div>

      {activeServantTab === 'library' ? (
        <LibrarySection
          libraryBooks={libraryBooks}
          onAddBook={addLibraryBook}
          onDeleteBook={deleteLibraryBook}
          canManage={currentUser?.role === 'admin' || currentUser?.role === 'assistant'}
        />
      ) : (
        <>
          {/* Toast / Alert: Book Assignment Success */}
          {assignSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{assignSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAssignSuccessMsg(null)}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Toast / Alert: Batch Grading Success */}
          {batchGradeSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{batchGradeSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setBatchGradeSuccessMsg(null)}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* SECTION 1: Class Assigned Bible Book (الخادم يحدد السفر المقرر للفصل) */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-amber-400" />
                <span className="text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                  السفر المقرر لدراسة الفصل حالياً 🎯
                </span>
                <span className="text-xs text-amber-200/80">
                  فصل {classObj.name}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-amber-50">
                {currentClassAssigned ? currentClassAssigned.bookName : 'سفر التكوين (افتراضي)'}
              </h2>

              <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl leading-relaxed">
                {currentClassAssigned
                  ? `هذا هو السفر الوحيد المتاح لطلاب فصلك حالياً للدخول ورصد الدرجات. جميع الأسفار الأخرى مغلقة 🔒 أمام الطلاب لحين تكليفهم بسفر جديد.`
                  : `لم تقم بعد باختيار السفر المخصص لفصلك. اضغط على الزر لاختيار السفر المناسب من العهد القديم أو العهد الجديد (٧٣ سفراً قانونياً).`}
              </p>

              {currentClassAssigned?.customOverview && (
                <div className="p-3.5 rounded-2xl bg-black/30 border border-amber-400/30 text-amber-200 text-xs space-y-1 max-w-2xl">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>✍️ نبذة ومعلومات السفر المخصصة لطلابك (تظهر لهم في شاشاتهم):</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{currentClassAssigned.customOverview}</p>
                </div>
              )}

              {currentClassAssigned && (
                <div className="text-[11px] text-amber-300 font-medium flex items-center gap-3 pt-1">
                  <span>تم التكليف بواسطة: <strong>{currentClassAssigned.assignedByServantName || currentUser?.name}</strong></span>
                  <span>•</span>
                  <span>تاريخ الاعتماد: <strong>{currentClassAssigned.assignedAt}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCustomOverviewDraft(currentClassAssigned?.customOverview || '');
                  setIsEditOverviewModalOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-200 font-bold text-xs border border-amber-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✍️ {currentClassAssigned?.customOverview ? 'تعديل نبذة السفر للطلاب' : 'كتابة نبذة خاصة للطلاب'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAssignBookModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <BookOpen className="w-4 h-4" />
                <span>{currentClassAssigned ? 'تغيير السفر المقرر للفصل 📖' : 'اختيار السفر المقرر للطلاب 🎯'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Published Church Library Showcase (المكتبة المنشورة من أمين الخدمة) */}
          {libraryBooks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      مكتبة المراجع وتفاسير الآباء المنشورة من أمانة الخدمة
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      قام أمين الخدمة بنشر ({libraryBooks.length}) مرجع وتفسير متاح لجميع الخدام لتحضير الدروس وتعميق المعرفة الكتابية.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveServantTab('library')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>عرض جميع المراجع ({libraryBooks.length})</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {libraryBooks.slice(0, 4).map((book) => (
                  <div
                    key={book.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate" title={book.title}>
                          {book.title}
                        </span>
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                          كتاب معتمد
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        بقلم: <strong>{book.author}</strong>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {book.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{book.fileSize || '3.5 MB'}</span>
                      {book.fileData ? (
                        <a
                          href={book.fileData}
                          download={book.fileName || `${book.title}.pdf`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>تحميل</span>
                        </a>
                      ) : book.downloadUrl ? (
                        <a
                          href={book.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>قراءة</span>
                        </a>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">متاح بالمكتبة</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: Flexible 8-Session Curriculum & Batch Student Grading Workbench */}
          <div id="sessions-workbench" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    منظومة توثيق الحصص الدراسية ورصد درجات الطلاب (منهج الـ ٨ حصص المرن)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  «الترم ٨ حصص - يمكن دراسة السفر في حصتين أو أكثر، اختر السفر والأصحاحات ورقم الحصة ورصيد درجات الـ ٢٤ نقطة فوراً».
                </p>
              </div>

              {/* QR Modal Trigger for Current Workbench Session */}
              <button
                type="button"
                onClick={() => {
                  const existing = sessions.find(
                    (s) => s.classId === servantClassId && (s.termId || currentTermId) === currentTermId && s.sessionNumber === workbenchSessionNumber
                  );
                  const sessToQr: BibleSession = existing || {
                    id: `sess-${servantClassId}-${currentTermId}-${workbenchSessionNumber}`,
                    title: workbenchTitle,
                    classId: servantClassId,
                    termId: currentTermId,
                    date: workbenchDate,
                    biblePassage: workbenchChapters,
                    servantName: currentUser?.name || 'خادم الفصل',
                    maxScorePerMetric: 10,
                    qrSecretCode: `STPAUL-${workbenchBookId.slice(0, 3).toUpperCase()}-${workbenchSessionNumber}`,
                    qrActive: true,
                    sessionNumber: workbenchSessionNumber,
                    bookId: workbenchBookId,
                    bookName: BIBLE_BOOKS.find((b) => b.id === workbenchBookId)?.title || 'سفر مقدس',
                    coveredChapters: workbenchChapters,
                    objective: workbenchObjective,
                  };
                  setSelectedSessionForQr(sessToQr);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>فتح باركود QR للحصة {workbenchSessionNumber} 📱</span>
              </button>
            </div>

            {/* 8-Session Tabs Selector (الحصة رقم ١ إلى ٨) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                اختر رقم الحصة في الترم الحالي (إجمالي ٨ حصص):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const isConfigured = sessions.some(
                    (s) => s.classId === servantClassId && (s.termId || currentTermId) === currentTermId && s.sessionNumber === num
                  );
                  const isCurrent = workbenchSessionNumber === num;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWorkbenchSessionNumber(num)}
                      className={`p-2.5 rounded-2xl border text-center font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20 scale-105'
                          : isConfigured
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>الحصة {num}</span>
                      <span className="text-[10px] font-normal">
                        {isConfigured ? 'مرصودة ✓' : 'جديدة'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flexible Session Configuration Form (القسم العلوي) */}
            <form onSubmit={handleSaveWorkbench} className="space-y-6">
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
                  <span>القسم العلوي: بيانات السفر والأصحاحات المغطاة في الحصة رقم ({workbenchSessionNumber})</span>
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    المرونة المنهجية الكاملة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Bible Book Selector */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      1. السفر المشتغل عليه: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={workbenchBookId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setWorkbenchBookId(bId);
                        const bObj = BIBLE_BOOKS.find((b) => b.id === bId);
                        if (bObj) {
                          setWorkbenchTitle(`الحصة ${workbenchSessionNumber}: دراسة ${bObj.title}`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      <optgroup label="العهد القديم (٤٦ سفراً)">
                        {BIBLE_BOOKS.filter((b) => b.testament === 'old').map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} ({b.chaptersCount} أصحاحاً)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="العهد الجديد (٢٧ سفراً)">
                        {BIBLE_BOOKS.filter((b) => b.testament === 'new').map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} ({b.chaptersCount} أصحاحاً)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Chapters Count / Range */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      2. الأصحاحات المغطاة (المرونة): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الأصحاحات ١ إلى ٣ أو أصحاحين"
                      value={workbenchChapters}
                      onChange={(e) => setWorkbenchChapters(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Session Title */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      3. عنوان السيشن / موضوع الدرس: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: بدء الخليقة وسقوط الإنسان"
                      value={workbenchTitle}
                      onChange={(e) => setWorkbenchTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>

                  {/* Session Date */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      4. تاريخ انعقاد الحصة: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={workbenchDate}
                      onChange={(e) => setWorkbenchDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                    />
                  </div>
                </div>

                {/* Dynamic Memory Verses List (User Request 4: إضافة آيات براحته مش واحدة بس) */}
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
                      <Scroll className="w-4 h-4 text-amber-600" />
                      <span>5. الآيات الحافظة للحصة (يمكنك إضافة أكثر من آية بحرية):</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddWorkbenchVerse}
                      className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة آية أخرى ✝️</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {workbenchVerses.map((item, vIdx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                          <span>الآية رقم ({vIdx + 1}):</span>
                          {workbenchVerses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveWorkbenchVerse(item.id)}
                              className="text-rose-600 hover:text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف هذه الآية</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="نص الآية (مثال: «فِي الْبَدْءِ كَانَ الْكَلِمَةُ، وَالْكَلِمَةُ كَانَ عِنْدَ اللهِ»)"
                              value={item.verse}
                              onChange={(e) => handleUpdateWorkbenchVerse(item.id, 'verse', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-serif"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="الشاهد (مثال: يوحنا ١ : ١)"
                              value={item.reference}
                              onChange={(e) => handleUpdateWorkbenchVerse(item.id, 'reference', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lesson Explanation & Objective */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      6. شرح الدرس والنقاط الروحية المستفادة:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="اكتب تلخيصاً أو أهم النقاط في أصحاحات هذا الأسبوع ليقرأها المخدوم في حسابه..."
                      value={workbenchLessonSummary}
                      onChange={(e) => setWorkbenchLessonSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      الهدف التعليمي العام:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="مثال: إدراك محبة الله الفادية، وحفظ الآية والالتزام بالصلاة اليومية..."
                      value={workbenchObjective}
                      onChange={(e) => setWorkbenchObjective(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                </div>

                {/* Lesson Handout / PDF File Uploader */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300/60 dark:border-amber-800/60 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>7. رفع مذكرة وملف الدرس للطلاب (PDF / Word):</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      يظهر فوراً للتنزيل والقراءة في حسابات جميع مخدومي الفصل
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>{workbenchAttachmentName ? 'تغيير الملف المرفوع' : 'اختر ملف المذكرة (PDF)...'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleWorkbenchFileChange}
                        className="hidden"
                      />
                    </label>

                    {workbenchAttachmentName ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <span>📄 {workbenchAttachmentName}</span>
                        {workbenchFileSize && <span className="text-[10px] opacity-75 font-mono">({workbenchFileSize})</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setWorkbenchAttachmentName('');
                            setWorkbenchFileData(undefined);
                            setWorkbenchFileType(undefined);
                            setWorkbenchFileSize(undefined);
                          }}
                          className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs hover:bg-rose-200 cursor-pointer"
                          title="حذف الملف"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        لم يتم رفع مذكرة لهذه الحصة حتى الآن (اختياري).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Student Grades Roster (القسم السفلي - ٢٤ درجة) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      القسم السفلي: رصد درجات طلاب الفصل للحصة رقم ({workbenchSessionNumber})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      معايير التقييم الـ ٦ (إجمالي ٢٤ درجة): امتحان (١٠) + واجب (١٠) + حضور (١) + تفاعل (١) + صلاة (١) + أدوات (١)
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full">
                    {classStudents.length} طلاب بفصلك
                  </span>
                </div>

                {classStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    لا يوجد طلاب معتمدين مسجلين في هذا الفصل حالياً. عند قبول الطلاب الجدد سيظهرون هنا مباشرة لرصد درجاتهم.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classStudents.map((st) => {
                      const stData = batchGradesMap[st.id] || {
                        exam: 0,
                        homework: 0,
                        attendance: 0,
                        participation: 0,
                        prayer: 0,
                        tools: 0,
                        notes: '',
                      };
                      const totalLive =
                        Number(stData.exam || 0) +
                        Number(stData.homework || 0) +
                        Number(stData.attendance || 0) +
                        Number(stData.participation || 0) +
                        Number(stData.prayer || 0) +
                        Number(stData.tools || 0);

                      return (
                        <div
                          key={st.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 hover:border-amber-300 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                                👤
                              </span>
                              <div>
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {st.name}
                                </span>
                                <span className="text-[10px] text-slate-400 mr-2 font-mono">
                                  {st.phone}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                                المجموع للحصة: {totalLive} / ٢٤ درجة
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                            {/* 1. Exam (0 to 10) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>1. الامتحان</span>
                                <span className="text-slate-400">/ 10</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: {
                                        ...stData,
                                        exam: Math.max(0, Math.round(((stData.exam || 0) - 0.5) * 10) / 10),
                                      },
                                    }))
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.5}
                                  value={stData.exam}
                                  onChange={(e) => {
                                    const val = Math.min(10, Math.max(0, Number(e.target.value)));
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: { ...stData, exam: val },
                                    }));
                                  }}
                                  className="w-full text-center font-black rounded border border-slate-300 dark:border-slate-700 py-0.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: {
                                        ...stData,
                                        exam: Math.min(10, Math.round(((stData.exam || 0) + 0.5) * 10) / 10),
                                      },
                                    }))
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* 2. Homework (0 to 10) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>2. الواجب</span>
                                <span className="text-slate-400">/ 10</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: {
                                        ...stData,
                                        homework: Math.max(0, Math.round(((stData.homework || 0) - 0.5) * 10) / 10),
                                      },
                                    }))
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  step={0.5}
                                  value={stData.homework}
                                  onChange={(e) => {
                                    const val = Math.min(10, Math.max(0, Number(e.target.value)));
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: { ...stData, homework: val },
                                    }));
                                  }}
                                  className="w-full text-center font-black rounded border border-slate-300 dark:border-slate-700 py-0.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBatchGradesMap((prev) => ({
                                      ...prev,
                                      [st.id]: {
                                        ...stData,
                                        homework: Math.min(10, Math.round(((stData.homework || 0) + 0.5) * 10) / 10),
                                      },
                                    }))
                                  }
                                  className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* 3. Attendance (0 or 1) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>3. الحضور / QR</span>
                                <span className="text-emerald-600">/ 1</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setBatchGradesMap((prev) => ({
                                    ...prev,
                                    [st.id]: { ...stData, attendance: stData.attendance ? 0 : 1 },
                                  }))
                                }
                                className={`w-full py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  stData.attendance
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {stData.attendance ? 'حاضر (١) ✓' : 'غائب (٠)'}
                              </button>
                            </div>

                            {/* 4. Participation (0 or 1) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>4. التفاعل</span>
                                <span className="text-amber-600">/ 1</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setBatchGradesMap((prev) => ({
                                    ...prev,
                                    [st.id]: { ...stData, participation: stData.participation ? 0 : 1 },
                                  }))
                                }
                                className={`w-full py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  stData.participation
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {stData.participation ? 'تفاعل (١) ✓' : 'لم يشارك (٠)'}
                              </button>
                            </div>

                            {/* 5. Prayer (0 or 1) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>5. الصلاة</span>
                                <span className="text-blue-600">/ 1</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setBatchGradesMap((prev) => ({
                                    ...prev,
                                    [st.id]: { ...stData, prayer: stData.prayer ? 0 : 1 },
                                  }))
                                }
                                className={`w-full py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  stData.prayer
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {stData.prayer ? 'صلى (١) ✓' : 'لم يحضر (٠)'}
                              </button>
                            </div>

                            {/* 6. Tools (0 or 1) */}
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span>6. الأدوات</span>
                                <span className="text-purple-600">/ 1</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setBatchGradesMap((prev) => ({
                                    ...prev,
                                    [st.id]: { ...stData, tools: stData.tools ? 0 : 1 },
                                  }))
                                }
                                className={`w-full py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  stData.tools
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {stData.tools ? 'معه الأدوات (١) ✓' : 'ناقص (٠)'}
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="pt-1">
                            <input
                              type="text"
                              placeholder="ملاحظات أو تشجيع للطالب..."
                              value={stData.notes || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBatchGradesMap((prev) => ({
                                  ...prev,
                                  [st.id]: { ...stData, notes: val },
                                }));
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submit Batch Grades Button */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                    🚀 <strong>نشر اللقاء ورصد الدرجات:</strong> الضغط على الزر يقوم بإنشاء ونشر الحصة رقم ({workbenchSessionNumber}) مباشرة في شاشات الطلاب، وتفعيل تسجيل حضورهم بالـ QR، وتثبيت كافة درجات الطلاب الـ ٢٤ فوراً.
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-900/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Save className="w-5 h-5" />
                    <span>🚀 نشر اللقاء الدراسي للفصل وتثبيت الحصة والدرجات</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Post Success Notice */}
          {postSuccessNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <strong>تم إرسال المادة التعليمية بنجاح!</strong> كما طلبت، المنشور الآن في حالة <strong className="underline">«قيد المراجعة»</strong> ولن يظهر للطلاب إلا بعد موافقة واعتماد الأدمن المسؤول.
                </div>
              </div>
            </div>
          )}

          {/* Main Submission Form: Pre-meeting Readiness (الحضور والتحضير) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                تأكيد الحضور ورفع تحضير درس الاجتماع القادم
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يرجى إتمام هذا التقرير قبل موعد الاجتماع ليظهر مباشرة في لوحة إدارة المدرسة وأمانة الخدمة.
            </p>
          </div>

          {currentSubmission && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم تسجيل استجابتك: {currentSubmission.submittedAt}</span>
            </div>
          )}
        </div>

        {isSubmittedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>تم إرسال تقريرك بنجاح!</strong> تم إشعار أمين الخدمة ومسؤول النظام برفعك للتحضير أو حالة حضورك.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Status Switch: Attending vs Absent */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              هل ستحضر اجتماع الجمعة القادم بإذن المسيح؟ <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus('attending')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  status === 'attending'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'attending' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">حاضر بإذن المسيح ✅</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">سأتواجد وأقوم برفع تحضير الدرس كمرفق</div>
                  </div>
                </div>
                {status === 'attending' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setStatus('absent')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  status === 'absent'
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 font-bold ring-2 ring-rose-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">معتذر لظرف طارئ ❌</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">يتطلب ذكر سبب الاعتذار لتسجيله للإدارة</div>
                  </div>
                </div>
                {status === 'absent' && <CheckCircle2 className="w-5 h-5 text-rose-600" />}
              </button>
            </div>
          </div>

          {/* If Absent */}
          {status === 'absent' ? (
            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
                سبب الاعتذار عن حضور الاجتماع: <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="برجاء توضيح سبب الاعتذار وهل تم التنسيق مع خادم بديل؟"
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-right"
              />
            </div>
          ) : (
            /* If Attending */
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  بيانات ومرفق تحضير الدرس الأسبوعي:
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  يسمع في لوحة تحكم الأدمن فوراً
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الدرس / الموضوع
                  </label>
                  <input
                    type="text"
                    required
                    value={prepTitle}
                    onChange={(e) => setPrepTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الشاهد الكتابي والآية الذهبية
                  </label>
                  <input
                    type="text"
                    required
                    value={prepBibleVerse}
                    onChange={(e) => setPrepBibleVerse(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  إرفاق ملف التحضير:
                </label>
                <div className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 bg-amber-50/40 dark:bg-slate-800/80 text-center">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {attachmentName ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        تم إرفاق: {attachmentName}
                      </span>
                    ) : (
                      'اضغط لاختيار ملف المذكرة'
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 15 * 1024 * 1024) {
                          alert('حجم الملف كبير جداً. الحد الأقصى ١٥ ميجابايت.');
                          return;
                        }
                        setAttachmentName(f.name);
                        const ext = f.name.split('.').pop()?.toLowerCase();
                        if (ext === 'pdf') setAttachmentType('pdf');
                        else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) setAttachmentType('image');
                        else setAttachmentType('document');

                        const reader = new FileReader();
                        reader.onload = () => {
                          setAttachmentData(reader.result as string);
                        };
                        reader.readAsDataURL(f);
                      }
                    }}
                    className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التحضير لأمين الخدمة</span>
            </button>
          </div>
        </form>
      </div>

      {/* Educational Post Creation Section (يتطلب موافقة الأدمن) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                نشر مذكرات ومسابقات كتابية للطلاب
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              «لما الخادم ينزل حاجة متتنشرش غير لما الأدمن يوافق عليها» - يتم مراجعة كل محتوى واعتماده رسمياً.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مذكرة / مسابقة جديدة</span>
          </button>
        </div>

        {/* My Posts Roster with Status Badges */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            منشوراتي السابقة وحالة موافقة الإدارة:
          </h4>

          {myPosts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">لم تقم بإضافة منشورات بعد.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{post.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        post.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : post.status === 'pending_approval'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {post.status === 'approved'
                        ? 'معتمد ومنشور للطلاب ✅'
                        : post.status === 'pending_approval'
                        ? 'قيد مراجعة الأدمن ⏳'
                        : 'مرفوض ❌'}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                    <span className="text-slate-400 font-mono">📅 {post.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => deleteLessonPost(post.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 font-bold cursor-pointer"
                      title="حذف هذا المنشور"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Class Students Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-700" />
              قائمة طلاب فصلي ({classObj.name})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              «الخادم هو اللي يحط الدرجات وأمين الخدمة يقدر يتحكم برضه» - رصد وتعديل درجات الحصص (24 درجة).
            </p>
          </div>

          <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full font-bold">
            {classStudents.length} طلاب مسجلين
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classStudents.map((st) => {
            const scoreSummary = getStudentScoreSummary(st.id);
            const studentGrades = getStudentSessionGrades(st.id);
            return (
              <div
                key={st.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{st.name}</div>
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                      {scoreSummary.isCalculated
                        ? `${scoreSummary.yearWorkScore} / 60 معتمدة`
                        : `${scoreSummary.yearWorkScore} نقطة تراكمية (${scoreSummary.gradedSessionsCount} / 8)`}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <div>الهاتف: <strong className="font-mono">{st.phone}</strong></div>
                    {st.guardianPhone && <div>ولي الأمر: <strong className="font-mono">{st.guardianPhone}</strong></div>}
                  </div>

                  {/* Graded Sessions with Dates */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>الحصص المرصودة وتواريخها:</span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                        {studentGrades.length} من 8
                      </span>
                    </div>

                    {studentGrades.length === 0 ? (
                      <div className="text-[10px] text-slate-400 py-1">
                        لم تُسجل درجات بعد لهذا الطالب.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                        {studentGrades.map((g) => (
                          <div
                            key={g.id}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[11px]"
                          >
                            <span className="truncate max-w-[110px] font-medium" title={g.sessionTitle}>
                              {g.sessionTitle}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              📅 {g.date}
                            </span>
                            <span className="font-black text-amber-800 dark:text-amber-300">
                              {sessionTotal(g)} / 24
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Unified Action: Link to Top 8-Session Flexible Workbench */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('sessions-workbench');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                >
                  <span>رصد وتعديل الدرجات في الحصص بالأعلى 👆</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Create New Educational Material / Post */}
      {isPostModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => setIsPostModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              إضافة مذكرة درس أو مسابقة للنشر بالفصل
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              ⚠️ تنبيه: المنشور سيذهب أولاً للوحة تحكم الأدمن، ولن يتم نشره للطلاب إلا بعد اعتماده رسمياً.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              {/* Target Class Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الفصل المستهدف للمذكرة: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={postTargetClass}
                  onChange={(e) => setPostTargetClass(e.target.value as ClassId)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageRange})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المذكرة / المسابقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مذكرة شرح رسالة غلاطية وأسئلة الآيات"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  الشاهد الكتابي والآية الحافظة
                </label>
                <input
                  type="text"
                  placeholder="مثال: غلاطية ٥ : ٢٢"
                  value={postVerse}
                  onChange={(e) => setPostVerse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نص المذكرة أو إرشادات المسابقة <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب التوجيهات أو ملخص الدرس..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  رفع ملف المذكرة المرفقة (PDF أو مستند):
                </label>

                {postFileData ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="text-right truncate">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={postAttachmentName}>
                          {postAttachmentName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {postFileSize || 'جاهز للرفع'} • {postFileType?.includes('pdf') ? 'مستند PDF' : 'مستند'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPostFileData(undefined);
                        setPostAttachmentName('');
                        setPostFileType(undefined);
                        setPostFileSize(undefined);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      إزالة الملف ✕
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                    <Upload className="w-6 h-6 text-amber-600" />
                    <div className="text-center">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        اضغط هنا لرفع ملف المذكرة (PDF أو Word) من جهازك 📄
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        يدعم ملفات PDF و DOCX حتى 15 ميجابايت
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,application/pdf,.doc,.docx"
                      onChange={handlePostPdfFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="اسم الملف الظاهر للطلاب (اختياري)..."
                    value={postAttachmentName}
                    onChange={(e) => setPostAttachmentName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  إرسال للأدمن للموافقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Clarity Confirmation Modal: Session Published & Sent to Students */}
      {workbenchPublishSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setWorkbenchPublishSuccessModal(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden text-right p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto shadow-inner text-2xl">
              🚀
            </div>

            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-700">
                تم نشر اللقاء وتثبيته رسمياً بنجاح ✅
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                وصل اللقاء الدراسي لكل مخدومي فصلك!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم ترحيل بيانات الحصة فوراً إلى السيرفر المركزي وقاعدة البيانات المركزية وشاشات جميع طلاب الفصل.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الحصة والترم:</span>
                <strong className="text-slate-900 dark:text-slate-100">الحصة رقم ({workbenchPublishSuccessModal.sessionNumber})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">السفر والأصحاحات:</span>
                <strong className="text-amber-700 dark:text-amber-400">سفر {workbenchPublishSuccessModal.bookTitle} ({workbenchPublishSuccessModal.chapters})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الآيات الحافظة للدرس:</span>
                <strong className={workbenchPublishSuccessModal.versesCount > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                  {workbenchPublishSuccessModal.versesCount > 0 ? `تم تضمين (${workbenchPublishSuccessModal.versesCount}) آيات حافظة بالشواهد ✅` : 'لم تُحدد'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">مذكرة وملف الدرس (PDF):</span>
                <strong className={workbenchPublishSuccessModal.hasAttachment ? 'text-emerald-600' : 'text-slate-400'}>
                  {workbenchPublishSuccessModal.hasAttachment ? 'مرفوع ومتاح للتحميل الفوري ✅' : 'بدون ملف مرفق'}
                </strong>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500">درجات الطلاب المرصودة:</span>
                <strong className="text-emerald-700 dark:text-emerald-300">
                  تم حفظ درجات {workbenchPublishSuccessModal.studentsCount} طلاب بالفصل بنجاح
                </strong>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setWorkbenchPublishSuccessModal(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg cursor-pointer transition-all"
              >
                تم، إغلاق نافذة التأكيد
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* QR Attendance Modal */}
      {selectedSessionForQr && (
        <QrAttendanceModal
          session={selectedSessionForQr}
          mode="servant_display"
          onClose={() => setSelectedSessionForQr(null)}
        />
      )}

      {/* Bible Book Assignment Modal for Servant */}
      {isAssignBookModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setIsAssignBookModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-amber-600" />
                  <span>تحديد السفر المقرر لدراسة فصل: {classObj.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اختر السفر المطلوب من العهد القديم (٤٦ سفراً) أو الجديد (٢٧ سفراً). السفر المختار سيكون هو السفر الوحيد المفتوح للطلاب، وستُقفل باقي الأسفار أمامهم.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignBookModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <BibleCanonExplorer
              currentBookId={currentClassAssigned?.bookId || 'genesis'}
              onSelectBook={(book) => handleAssignBook(book)}
              userRole="servant"
              assignedBookIds={currentClassAssigned ? [currentClassAssigned.bookId] : []}
              onAssignBook={handleAssignBook}
            />
          </div>
        </div>
      )}

      {/* Custom Book Overview / Notes Modal for Servant */}
      {isEditOverviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setIsEditOverviewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>✍️ تخصيص نبذة ومعلومات السفر لطلاب فصلك</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  سفر «{currentClassAssigned?.bookName || 'سفر التكوين'}» — ما تكتبه هنا سيظهر لطلاب فصلك مباشرة في شاشاتهم بدلاً من أو مع النبذة التلقائية.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOverviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomOverview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اكتب نبذة أو مقدمة أو توجيهات دراسية خاصة لطلابك حول هذا السفر:
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="مثال: يركز هذا السفر على أمانة الله في المواعيد، وسندرس فيه خمس شخصيات رئيسية... يرجى قراءة الأصحاحات وحفظ الشواهد الأسبوعية..."
                  value={customOverviewDraft}
                  onChange={(e) => setCustomOverviewDraft(e.target.value)}
                  className="w-full p-3.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 leading-relaxed font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
                💡 <strong>ملاحظة:</strong> يمكنك تعديل هذه النبذة في أي وقت، وستتحدث تلقائياً في شاشات الطلاب المشتركين في الفصل فور حفظها.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOverviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ واعتماد النبذة للطلاب ✅</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

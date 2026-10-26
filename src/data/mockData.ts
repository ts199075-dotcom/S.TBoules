import { ClassInfo, UserProfile, BibleSession, SessionGrade, ServantAttendanceSubmission, AppNotification, ServantLessonPost } from '../types';

export const CLASSES_LIST: ClassInfo[] = [
  {
    id: 'primary_4',
    name: 'فصل سنة رابعة ابتدائي',
    stageName: 'الصف الرابع الابتدائي',
    description: 'بدايات العهد القديم، الخلقة، الآباء البطاركة، وقصص الأمانة',
    ageRange: '٩ - ١٠ سنوات',
    iconName: 'BookOpen',
  },
  {
    id: 'primary_5',
    name: 'فصل سنة خامسة ابتدائي',
    stageName: 'الصف الخامس الابتدائي',
    description: 'خروج بني إسرائيل، موسى النبي، خيمة الاجتماع، ومحبة الله',
    ageRange: '١٠ - ١١ سنة',
    iconName: 'Sparkles',
  },
  {
    id: 'primary_6',
    name: 'فصل سنة سادسة ابتدائي',
    stageName: 'الصف السادس الابتدائي',
    description: 'يشوع، القضاة، الملوك والأنبياء، والاستعداد للمرحلة الإعدادية',
    ageRange: '١١ - ١٢ سنة',
    iconName: 'Compass',
  },
  {
    id: 'prep_1',
    name: 'فصل أولى إعدادي',
    stageName: 'الصف الأول الإعدادي',
    description: 'أسفار الحكمة، المزامير، وعصر النعمة وتجسد الكلمة',
    ageRange: '١٢ - ١٣ سنة',
    iconName: 'GraduationCap',
  },
  {
    id: 'prep_2_3',
    name: 'فصل ثانية وثالثة إعدادي',
    stageName: 'الصف الثاني والثالث الإعدادي',
    description: 'دراسة متعمقة في رسائل بولس الرسول والعهد الجديد',
    ageRange: '١٣ - ١٥ سنة',
    iconName: 'Flame',
  },
  {
    id: 'secondary',
    name: 'فصل مرحلة ثانوي',
    stageName: 'المرحلة الثانوية',
    description: 'الدفاعيات، العقيدة الأرثوذكسية، والفهم اللاهوتي المعاصر للشباب',
    ageRange: '١٥ - ١٨ سنة',
    iconName: 'Shield',
  },
  {
    id: 'adults',
    name: 'فصل مرحلة الكبار',
    stageName: 'الجامعيون والخريجون والكبار',
    description: 'تفسير آبائي معمق، لاهوت كتابي، وتطبيقات عملية للحياة المسيحية',
    ageRange: '١٨+ سنة',
    iconName: 'Crown',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin-ts',
    name: 'أمين الخدمة ومسؤول النظام',
    email: 'ts199075@gmail.com',
    phone: '01000000000',
    password: '987321987',
    age: 35,
    role: 'admin',
    status: 'active',
    registeredAt: '2026-09-01',
    notes: 'الحساب الرئيسي لإدارة مدرسة سانت بولس للكتاب المقدس',
  },
];

// Clean session templates ready for each class
export const INITIAL_SESSIONS: BibleSession[] = [
  {
    id: 'sess-p4-1',
    title: 'اللقاء الأول: خلقة العالم ومحبة الله الفائقة',
    classId: 'primary_4',
    date: '2026-10-24',
    biblePassage: 'تكوين ١ : ١ - تكوين ٢ : ٧',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P4-101',
    qrActive: true,
  },
  {
    id: 'sess-p5-1',
    title: 'اللقاء الأول: خروج الشعب وخروف الفصح',
    classId: 'primary_5',
    date: '2026-10-24',
    biblePassage: 'خروج ١٢ : ١ - خروج ١٢ : ١٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P5-101',
    qrActive: true,
  },
  {
    id: 'sess-p6-1',
    title: 'اللقاء الأول: يشوع بن نون وعبور الأردن',
    classId: 'primary_6',
    date: '2026-10-24',
    biblePassage: 'يشوع ٣ : ١ - يشوع ٣ : ١٧',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P6-101',
    qrActive: true,
  },
  {
    id: 'sess-prep1-1',
    title: 'اللقاء الأول: مزامير داود النبي والرجاء المسياني',
    classId: 'prep_1',
    date: '2026-10-24',
    biblePassage: 'مزمور ٢٢ : ١ - مزمور ٢٢ : ٣١',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-PR1-101',
    qrActive: true,
  },
  {
    id: 'sess-prep23-1',
    title: 'اللقاء الأول: دعوة القديس بولس ورسالته إلى غلاطية',
    classId: 'prep_2_3',
    date: '2026-10-24',
    biblePassage: 'غلاطية ١ : ١ - غلاطية ١ : ٢٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-PR23-101',
    qrActive: true,
  },
  {
    id: 'sess-sec-1',
    title: 'اللقاء الأول: لاهوت الفداء وبر الله في رسالة رومية',
    classId: 'secondary',
    date: '2026-10-24',
    biblePassage: 'رومية ٣ : ٢١ - رومية ٥ : ١',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-SEC-101',
    qrActive: true,
  },
  {
    id: 'sess-adults-1',
    title: 'اللقاء الأول: المدخل الآبائي لدراسة العهد الجديد',
    classId: 'adults',
    date: '2026-10-24',
    biblePassage: 'عبرانيين ١ : ١ - عبرانيين ٢ : ٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-AD-101',
    qrActive: true,
  },
];

// Clean slate for grades, exam scores, servant submissions, posts, and notifications
export const INITIAL_SESSION_GRADES: SessionGrade[] = [];

export const INITIAL_FINAL_EXAM_SCORES: Record<string, number> = {};

export const INITIAL_SERVANT_SUBMISSIONS: ServantAttendanceSubmission[] = [];

export const INITIAL_LESSON_POSTS: ServantLessonPost[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const SAMPLE_USERS: UserProfile[] = [
  { id: 'stud-p4-1', name: 'مارك مينا إبراهيم', role: 'student', classId: 'primary_4', age: 9, status: 'active', phone: '01011112222', registeredAt: '2026-10-10' },
  { id: 'stud-p4-2', name: 'مارينا يوسف سمير', role: 'student', classId: 'primary_4', age: 10, status: 'active', phone: '01011112223', registeredAt: '2026-10-11' },
  { id: 'stud-p5-1', name: 'بيتر هاني سامي', role: 'student', classId: 'primary_5', age: 11, status: 'active', phone: '01022223331', registeredAt: '2026-10-10' },
  { id: 'stud-p5-2', name: 'سارة إيهاب كامل', role: 'student', classId: 'primary_5', age: 11, status: 'active', phone: '01022223332', registeredAt: '2026-10-12' },
  { id: 'stud-p6-1', name: 'ديفيد رفيق عادل', role: 'student', classId: 'primary_6', age: 12, status: 'active', phone: '01033334441', registeredAt: '2026-10-10' },
  { id: 'stud-p6-2', name: 'كاترين عماد فوزي', role: 'student', classId: 'primary_6', age: 12, status: 'active', phone: '01033334442', registeredAt: '2026-10-13' },
  { id: 'stud-pr1-1', name: 'كيرلس مجدي ناصف', role: 'student', classId: 'prep_1', age: 13, status: 'active', phone: '01044445551', registeredAt: '2026-10-10' },
  { id: 'stud-pr1-2', name: 'فيرونيكا ماجد فخري', role: 'student', classId: 'prep_1', age: 13, status: 'active', phone: '01044445552', registeredAt: '2026-10-14' },
  { id: 'stud-pr2-1', name: 'أبانوب فادي نصحي', role: 'student', classId: 'prep_2_3', age: 14, status: 'active', phone: '01055556661', registeredAt: '2026-10-10' },
  { id: 'stud-pr2-2', name: 'مريم صبحي غالي', role: 'student', classId: 'prep_2_3', age: 15, status: 'active', phone: '01055556662', registeredAt: '2026-10-15' },
  { id: 'stud-sec-1', name: 'توماس رمزي لطيف', role: 'student', classId: 'secondary', age: 16, status: 'active', phone: '01066667771', registeredAt: '2026-10-10' },
  { id: 'stud-sec-2', name: 'مونيكا رفعت عزيز', role: 'student', classId: 'secondary', age: 17, status: 'active', phone: '01066667772', registeredAt: '2026-10-16' },
  { id: 'stud-ad-1', name: 'فادي نسيم وهبة', role: 'student', classId: 'adults', age: 22, status: 'active', phone: '01077778881', registeredAt: '2026-10-10' },
  { id: 'stud-ad-2', name: 'كرستين جورج لمعي', role: 'student', classId: 'adults', age: 24, status: 'active', phone: '01077778882', registeredAt: '2026-10-17' },
  { id: 'serv-1', name: 'الخادم مينا عاطف', role: 'servant', classId: 'prep_2_3', age: 30, status: 'active', phone: '01099990001', registeredAt: '2026-09-15' },
  { id: 'serv-2', name: 'الخادمة ليديا عادل', role: 'servant', classId: 'primary_4', age: 28, status: 'active', phone: '01099990002', registeredAt: '2026-09-15' },
  { id: 'stud-pending-1', name: 'يوحنا سامح عازر', role: 'student', classId: 'prep_2_3', age: 14, status: 'pending', phone: '01088889991', registeredAt: '2026-10-25' },
];

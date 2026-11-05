import { ClassInfo, UserProfile, BibleSession, SessionGrade, ServantAttendanceSubmission, AppNotification, ServantLessonPost, LibraryBook, AcademicTerm } from '../types';

export const INITIAL_TERMS: AcademicTerm[] = [
  {
    id: 'term_1',
    title: 'الترم الأول',
    bookSubject: 'سفر التكوين',
    description: 'البدايات، الخلقة، سقوط الإنسان، والرموز المسيانية في الآباء البطاركة (٨ لقاءات)',
    sessionsCount: 8,
    isCurrent: true,
    startDate: '2026-10-01',
  },
  {
    id: 'term_2',
    title: 'الترم الثاني',
    bookSubject: 'سفر الخروج',
    description: 'خروج الشعب، خروف الفصح، عبور البحر، وخيمة الاجتماع ورموز الفداء (٨ لقاءات)',
    sessionsCount: 8,
    isCurrent: false,
    startDate: '2027-02-01',
  },
  {
    id: 'term_3',
    title: 'الترم الثالث',
    bookSubject: 'سفر اللاويين والعدد',
    description: 'الذبائح الخمس، يوم الكفارة العظيم، والحية النحاسية ورموز الصليب (٨ لقاءات)',
    sessionsCount: 8,
    isCurrent: false,
    startDate: '2027-06-01',
  },
];

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

// Clean slate: No default mock sessions - the user can freely create and manage their own
export const INITIAL_SESSIONS: BibleSession[] = [];

// Clean slate for grades, exam scores, servant submissions, posts, and notifications
export const INITIAL_SESSION_GRADES: SessionGrade[] = [];

export const INITIAL_FINAL_EXAM_SCORES: Record<string, number> = {};

export const INITIAL_SERVANT_SUBMISSIONS: ServantAttendanceSubmission[] = [];

export const INITIAL_LESSON_POSTS: ServantLessonPost[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// No sample dummy students or servants - only real registered accounts
export const SAMPLE_USERS: UserProfile[] = [];

// No default mock library books - the user can upload and manage real books and references
export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [];



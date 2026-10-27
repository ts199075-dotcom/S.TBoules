import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { ClassId } from '../types';
import {
  X,
  BookOpen,
  GraduationCap,
  Trophy,
  Users,
  Bell,
  FileText,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Printer,
  Award,
  Layers,
  PartyPopper,
  FileCheck,
  Megaphone,
} from 'lucide-react';

interface MasterMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, subTab?: string, classId?: ClassId) => void;
  onOpenFeatures: () => void;
}

export const MasterMenuDrawer: React.FC<MasterMenuDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenFeatures,
}) => {
  const { currentUser, classes, users, theme, toggleTheme, logout } = useApp();

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden" dir="rtl">
      {/* High-priority Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer (From Right in RTL) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-[99999]">
        <div className="w-screen max-w-md bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col text-right">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/50 shrink-0">
                <img
                  src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
                  alt="القديس بولس"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-black text-sm text-amber-50 leading-tight">
                  القائمة الشاملة للمدرسة
                </h3>
                <p className="text-[11px] text-amber-200/80">
                  كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Quick Bar */}
          {currentUser && (
            <div className="px-4 py-2.5 bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="leading-tight">
                  <div className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</div>
                  <div className="text-[10px] text-stone-500 font-mono" dir="ltr">{currentUser.email || currentUser.phone}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                {isAdmin ? '👑 مسؤول النظام' : currentUser.role === 'servant' ? '✝️ خادم' : '📖 مخدوم'}
              </span>
            </div>
          )}

          {/* Drawer Body - Scrollable Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
            {/* 1. SECTIONS / CLASSES (الـ ٧ فصول) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  الفصول الدراسية السبعة (انتقال فوري)
                </span>
                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-stone-500">
                  ٧ فصول
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {classes.map((cls) => {
                  const studentCount = users.filter((u) => u.role === 'student' && u.classId === cls.id && u.status === 'active').length;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        onClose();
                        if (isAdmin) {
                          onNavigate('admin', 'classes', cls.id);
                        } else {
                          onNavigate('home');
                        }
                      }}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-600/50 bg-stone-50/60 dark:bg-stone-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-right flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></span>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">{cls.name}</div>
                          <div className="text-[10px] text-stone-500">{cls.ageRange}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
                        {studentCount} طلاب
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CORE ACADEMIC & ADMINISTRATIVE ACTIONS */}
            <div className="space-y-2">
              <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-blue-600" />
                سيكشن الطلاب والدرجات والخدام
              </span>

              <div className="space-y-1.5">
                {/* كشف الطلاب لجميع الفصول */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'students');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">كشف الطلاب (إضافة / نقل / حذف)</div>
                      <div className="text-[10px] text-stone-500">كشف شامل بكل الطلاب وتوزيعهم على الفصول</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>

                {/* كشف الخدام ومتابعة الحضور والتحضير */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'servants');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">كشف الخدام ومساعدو الإدارة</div>
                      <div className="text-[10px] text-stone-500">متابعة حضور الخادم، هل رفع الدرس، وتعيين فصله ورتبته</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>

                {/* رصد الدرجات وأعمال السنة */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'scores');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">رصد الدرجات وكشف الأوائل</div>
                      <div className="text-[10px] text-stone-500">متوسط ٨ حصص (٦٠) + امتحان نهائي (٤٠) = ١٠٠</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>
              </div>
            </div>

            {/* 3. ANNOUNCEMENTS, REPORTS, & CEREMONIES (الاعلانات والتقارير والحفلات) */}
            <div className="space-y-2">
              <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                الإعلانات والتقارير والحفلات
              </span>

              <div className="space-y-1.5">
                {/* الإعلانات والمنشورات الموجهة لفصل معين */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'post_approvals');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">الإعلانات والمذكرات الموجهة</div>
                      <div className="text-[10px] text-stone-500">نشر مذكرات وإعلانات مخصصة لفصل بعينه</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>

                {/* التقارير والإحصائيات وطباعة الكشوفات */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'reports');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">التقارير والكشوفات والطباعة</div>
                      <div className="text-[10px] text-stone-500">طباعة كشف درجات الفصل، الحضور والغياب، والإحصائيات</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>

                {/* الحفلات والمناسبات والتكريمات */}
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('admin', 'events');
                  }}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-right cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <PartyPopper className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">الحفلات والمناسبات وتكريم الأوائل</div>
                      <div className="text-[10px] text-stone-500">حفلة ختام العام، يوم التكريم، وتوزيع الكؤوس والشهادات</div>
                    </div>
                  </div>
                  <span className="text-stone-400 text-xs">←</span>
                </button>
              </div>
            </div>

            {/* 4. PLATFORM FEATURES GUIDE & TOOLS */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => {
                  onClose();
                  onOpenFeatures();
                }}
                className="w-full p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>📋 دليل كافة مميزات المنصة (شرح تفصيلي)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-700" />}
                  <span>{theme === 'dark' ? 'الوضع المضيء' : 'الوضع الليلي'}</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

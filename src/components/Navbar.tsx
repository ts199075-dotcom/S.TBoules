import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Bell,
  Users,
  Shield,
  GraduationCap,
  Sparkles,
  LogOut,
  ChevronDown,
  UserPlus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
}) => {
  const {
    currentUser,
    users,
    switchUserById,
    logout,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    resetDemoData,
    theme,
    toggleTheme,
    lessonPosts,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingRequestsCount = users.filter((u) => u.status === 'pending').length;
  const pendingPostsCount = lessonPosts.filter((p) => p.status === 'pending_approval').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-900/10 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top micro bar for Church Affiliation & Quick Role Switcher Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-amber-200/90 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-medium text-amber-100">
              كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
            </span>
            <span className="hidden md:inline text-amber-400/50">|</span>
            <span className="hidden md:inline text-amber-200/80">
              مدرسة القديس بولس الرسول للكتاب المقدس
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Role Tester Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 border border-amber-700/50 text-[11px] transition-colors cursor-pointer"
                title="تبديل سريع بين الأدوار لتجربة المنصة"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>تبديل الحساب: <strong>{currentUser?.name || 'غير مسجل'}</strong></span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showDemoSwitcher && (
                <div
                  className="absolute left-0 sm:right-auto sm:left-0 mt-1 w-72 bg-slate-900 border border-amber-700/40 rounded-xl shadow-2xl p-2 z-50 text-slate-100"
                  onClick={() => setShowDemoSwitcher(false)}
                >
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-amber-400 border-b border-slate-800">
                    اختر شخصية لتجربة كافة صلاحيات المنصة فوراً:
                  </div>
                  <div className="space-y-1 mt-1 max-h-72 overflow-y-auto">
                    {users.slice(0, 9).map((u) => {
                      const isSelected = currentUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUserById(u.id);
                            if (u.role === 'admin' || u.role === 'assistant') setCurrentTab('admin');
                            else if (u.role === 'servant') setCurrentTab('servant');
                            else setCurrentTab('student');
                          }}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/30'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-[12px]">{u.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {u.role === 'admin' && '👑 مسؤول النظام وأمين الخدمة'}
                              {u.role === 'assistant' && '🛡️ مساعد الإدارة ورصد الدرجات'}
                              {u.role === 'servant' && '✝️ خادم فصل دراسي'}
                              {u.role === 'student' && u.status === 'active' && '📖 طالب مفعل'}
                              {u.role === 'student' && u.status === 'pending' && '⏳ طالب جديد (معلق)'}
                            </div>
                          </div>
                          {u.status === 'pending' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                              معلق
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetDemoData();
                        setShowDemoSwitcher(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-slate-400 hover:text-amber-300 text-[11px] py-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      إعادة ضبط البيانات النموذجية
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo with St. Paul Avatar */}
        <div
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-600/40 shadow-md group-hover:scale-105 transition-transform bg-amber-100 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
              alt="القديس بولس الرسول"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                مدرسة سانت بولس للكتاب المقدس
              </span>
              <span className="hidden sm:inline-block text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                ٧ فصول دراسية
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate max-w-xs sm:max-w-md">
              كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            الرئيسية والأنشطة
          </button>

          {currentUser?.role === 'student' && (
            <button
              onClick={() => setCurrentTab('student')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'student'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              لوحة المخدوم (الدرجات و QR)
            </button>
          )}

          {currentUser?.role === 'servant' && (
            <button
              onClick={() => setCurrentTab('servant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'servant'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              لوحة الخادم (التحضير و QR)
            </button>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'assistant') && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-slate-900 dark:bg-amber-600 text-amber-300 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 dark:text-amber-200" />
              لوحة التحكم الشاملة
              {(pendingRequestsCount > 0 || pendingPostsCount > 0) && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequestsCount + pendingPostsCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User profile, Theme Toggle & actions */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'التحويل للوضع المضيء (Light)' : 'التحويل للوضع الليلي (Dark Mode)'}
            aria-label="تبديل الوضع الليلي والنهاري"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="الإشعارات والتحديثات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      التنبيهات والإشعارات الفورية
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      لا توجد إشعارات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !n.read ? 'bg-amber-50/50 dark:bg-amber-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Badge or Login / Register buttons */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400/50 bg-white dark:bg-slate-800 shadow-2xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    {currentUser.role === 'admin' && 'مسؤول النظام'}
                    {currentUser.role === 'assistant' && 'مساعد إدارة'}
                    {currentUser.role === 'servant' && 'خادم'}
                    {currentUser.role === 'student' && 'مخدوم'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.phone}</p>
                    <div className="mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {currentUser.status === 'active' ? 'حساب مفعل ✅' : 'قيد المراجعة ⏳'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {currentUser.role === 'student' && (
                      <button
                        onClick={() => setCurrentTab('student')}
                        className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        لوحة درجاتي
                      </button>
                    )}
                    {currentUser.role === 'servant' && (
                      <button
                        onClick={() => setCurrentTab('servant')}
                        className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        لوحة الخادم والتحضير
                      </button>
                    )}
                    {(currentUser.role === 'admin' || currentUser.role === 'assistant') && (
                      <button
                        onClick={() => setCurrentTab('admin')}
                        className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        لوحة التحكم الشاملة
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={logout}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                دخول
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                إنشاء حساب
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Bell,
  Users,
  Shield,
  GraduationCap,
  LogOut,
  ChevronDown,
  UserPlus,
  Clock,
  Sun,
  Moon,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { ClassId } from '../types';
import { MasterMenuDrawer } from './MasterMenuDrawer';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigateMaster?: (tab: string, subTab?: string, classId?: ClassId) => void;
  onOpenFeaturesGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onNavigateMaster,
  onOpenFeaturesGuide,
}) => {
  const {
    currentUser,
    users,
    logout,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    theme,
    toggleTheme,
    lessonPosts,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingRequestsCount = users.filter((u) => u.status === 'pending').length;
  const pendingPostsCount = lessonPosts.filter((p) => p.status === 'pending_approval').length;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Top micro bar for Church Affiliation & Logged in user info */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-3 sm:px-6 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span className="font-medium text-stone-200 truncate">
              كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
            </span>
            <span className="hidden md:inline text-stone-600">|</span>
            <span className="hidden md:inline text-stone-400">
              مدرسة سانت بولس للكتاب المقدس
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            {currentUser ? (
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-medium">
                  {isAdmin ? '👑 مسؤول النظام:' : '👤 الحساب:'}
                </span>
                <span className="text-stone-200 font-semibold truncate max-w-[150px] sm:max-w-none">
                  {currentUser.email || currentUser.name}
                </span>
              </div>
            ) : (
              <span className="text-stone-400 hidden sm:inline">مرحباً بك</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand / Logo with St. Paul Avatar */}
        <div
          onClick={() => {
            setCurrentTab('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-600/50 shadow-xs group-hover:scale-105 transition-transform bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg"
              alt="القديس بولس الرسول"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                مدرسة سانت بولس
              </span>
              <span className="hidden lg:inline-block text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium px-2 py-0.2 rounded border border-stone-200 dark:border-stone-700">
                الكتاب المقدس
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block truncate">
              كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            الرئيسية
          </button>

          {currentUser?.role === 'student' && (
            <button
              onClick={() => setCurrentTab('student')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'student'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
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
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              لوحة الخادم (التحضير و QR)
            </button>
          )}

          {/* ADMIN ONLY TAB - Strictly for Admin role */}
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-stone-900 dark:bg-amber-700 text-amber-200 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              لوحة تحكم الأدمن
              {(pendingRequestsCount > 0 || pendingPostsCount > 0) && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequestsCount + pendingPostsCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'التحويل للوضع المضيء' : 'التحويل للوضع الليلي'}
            aria-label="تبديل الوضع الليلي والنهاري"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="الإشعارات والتحديثات"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Fully Responsive Notifications Popover */}
            {showNotifications && (
              <>
                {/* Backdrop overlay for mobile and desktop click-outside */}
                <div
                  className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-2xs"
                  onClick={() => setShowNotifications(false)}
                />

                <div
                  className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-[100] overflow-hidden text-right"
                  dir="rtl"
                >
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                        التنبيهات والإشعارات ({notifications.length})
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-stone-500 hover:text-rose-600 cursor-pointer"
                      >
                        مسح الكل
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400">
                        لا توجد إشعارات جديدة حالياً
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 ${
                            !n.read ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-stone-800 dark:text-stone-200">{n.title}</span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Current User Menu & Direct Logout */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1 sm:p-1.5 sm:pl-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-600/50 bg-white dark:bg-stone-800 shadow-2xs transition-all cursor-pointer"
                  title="بيانات الحساب والقائمة"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-900 dark:bg-amber-700 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.name.slice(0, 1)}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      {isAdmin ? '👑 مسؤول النظام' : currentUser.role === 'servant' ? '✝️ خادم' : '📖 مخدوم'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {/* Fully Responsive User Menu Popover */}
                {showUserMenu && (
                  <>
                    {/* Backdrop overlay */}
                    <div
                      className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-2xs"
                      onClick={() => setShowUserMenu(false)}
                    />

                    <div
                      className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-[100] p-2 text-right"
                      dir="rtl"
                    >
                      <div className="p-2.5 border-b border-stone-100 dark:border-stone-800 text-xs">
                        <p className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</p>
                        <p className="text-[11px] text-stone-500 font-mono" dir="ltr">{currentUser.email || currentUser.phone}</p>
                        <div className="mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {currentUser.status === 'active' ? 'حساب مفعل ✅' : 'قيد المراجعة ⏳'}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        {currentUser.role === 'student' && (
                          <button
                            onClick={() => {
                              setCurrentTab('student');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-right px-2.5 py-2 rounded-lg text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            لوحة درجاتي
                          </button>
                        )}

                        {currentUser.role === 'servant' && (
                          <button
                            onClick={() => {
                              setCurrentTab('servant');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-right px-2.5 py-2 rounded-lg text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            لوحة الخادم والتحضير
                          </button>
                        )}

                        {/* ADMIN ONLY BUTTON */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setCurrentTab('admin');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-right px-2.5 py-2 rounded-lg text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-amber-600" />
                            لوحة التحكم الشاملة (الأدمن)
                          </button>
                        )}
                      </div>

                      <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>تسجيل الخروج من الحساب</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Quick Logout Button in Top Bar */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer shadow-2xs"
                title="تسجيل الخروج المباشر من الحساب"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                دخول
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>حساب جديد</span>
              </button>
            </div>
          )}

          {/* Master Menu (Three Bars ☰) Button - Visible on All Screens as Requested */}
          <button
            onClick={() => setMasterMenuOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-200 border border-amber-600/30 transition-all cursor-pointer font-bold text-xs"
            title="القائمة الشاملة (الفصول، الطلاب، الدرجات، الخدام، الإعلانات، التقارير، الحفلات)"
            aria-label="القائمة الشاملة"
          >
            <Menu className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">القائمة الشاملة ☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Bar */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-4 py-3 space-y-2 text-right">
          <button
            onClick={() => {
              setCurrentTab('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              currentTab === 'home'
                ? 'bg-amber-700 text-white'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>الصفحة الرئيسية</span>
          </button>

          {currentUser?.role === 'student' && (
            <button
              onClick={() => {
                setCurrentTab('student');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                currentTab === 'student'
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>لوحة المخدوم (الدرجات و QR)</span>
            </button>
          )}

          {currentUser?.role === 'servant' && (
            <button
              onClick={() => {
                setCurrentTab('servant');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                currentTab === 'servant'
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>لوحة الخادم (التحضير و QR)</span>
            </button>
          )}

          {/* ADMIN ONLY ON MOBILE */}
          {isAdmin && (
            <button
              onClick={() => {
                setCurrentTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                currentTab === 'admin'
                  ? 'bg-stone-900 dark:bg-amber-700 text-amber-200 dark:text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>لوحة التحكم الشاملة (الأدمن)</span>
              </div>
              {(pendingRequestsCount > 0 || pendingPostsCount > 0) && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequestsCount + pendingPostsCount}
                </span>
              )}
            </button>
          )}

          {/* User Status & Mobile Logout Button */}
          {currentUser && (
            <div className="pt-2.5 mt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="p-2.5 bg-stone-100 dark:bg-stone-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono" dir="ltr">{currentUser.email || currentUser.phone}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  {isAdmin ? '👑 مسؤول النظام' : currentUser.role === 'servant' ? '✝️ خادم' : '📖 مخدوم'}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          )}
        </div>
      )}
      {/* Master Menu Drawer component */}
      <MasterMenuDrawer
        isOpen={masterMenuOpen}
        onClose={() => setMasterMenuOpen(false)}
        onNavigate={(tab, subTab, classId) => {
          if (onNavigateMaster) {
            onNavigateMaster(tab, subTab, classId);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenFeatures={() => {
          if (onOpenFeaturesGuide) {
            onOpenFeaturesGuide();
          }
        }}
      />
    </header>
  );
};

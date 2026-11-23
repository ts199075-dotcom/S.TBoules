import React from 'react';
import { getQuotaUpgradeUrl } from '../firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const rawMessage = this.state.error?.message || '';
      let parsedError = rawMessage;
      try {
        const parsed = JSON.parse(rawMessage);
        if (parsed?.error) {
          parsedError = parsed.error;
        }
      } catch {
        /* plain string */
      }
      const isQuota =
        parsedError.includes('Quota exceeded') ||
        parsedError.includes('Free daily read units');

      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✝️
            </div>
            <h2 className="text-xl font-black">مدرسة القديس بولس للكتاب المقدس</h2>
            {isQuota ? (
              <div className="space-y-2 text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                <p>تم الوصول إلى الحد اليومي المجاني لعمليات القراءة في Firebase Firestore. سيتم تجديد الحصة غداً أو يمكنك الترقية من لوحة تحكم Firebase.</p>
                <a
                  href={getQuotaUpgradeUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs underline text-amber-700 dark:text-amber-400"
                >
                  فتح إعدادات قاعدة البيانات في Firebase Console
                </a>
              </div>
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                حدث تحديث في الجلسة أو تعذر إتمام العملية السحابية. يمكنك العودة للصفحة الرئيسية الآن.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

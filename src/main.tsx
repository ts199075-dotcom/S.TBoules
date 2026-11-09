import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Mobile Android Native Tactile Haptics
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, [role="button"], a, input[type="submit"], input[type="button"], .interactive-icon')) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* ignore */
        }
      }
    }
  }, { passive: true });
}

createRoot(document.getElementById('root')!).render(<App />);

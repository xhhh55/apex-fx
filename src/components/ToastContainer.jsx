/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { Toast } from '../utils/api.js';

const ICONS = {
  error:   '⚠️',
  success: '✅',
  info:    'ℹ️',
  warning: '🔔',
};

const TITLES = {
  error:   { en: 'Error',   ar: 'خطأ' },
  success: { en: 'Success', ar: 'نجاح' },
  info:    { en: 'Info',    ar: 'معلومة' },
  warning: { en: 'Warning', ar: 'تحذير' },
};

const DURATION = 5000; // ms

let _id = 0;

export default function ToastContainer({ lang = 'en' }) {
  const isAr = lang === 'ar';
  const [toasts, setToasts] = useState([]);

  const add = useCallback(({ msg, type = 'error' }) => {
    const id = ++_id;
    setToasts(prev => [...prev.slice(-4), { id, msg, type, removing: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, DURATION);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  useEffect(() => {
    const unsub = Toast.subscribe(add);
    return unsub;
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      style={{ direction: isAr ? 'rtl' : 'ltr' }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          className={`toast toast-${t.type}${t.removing ? ' removing' : ''}`}
        >
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <div className="toast-body">
            <div className="toast-title">{TITLES[t.type]?.[isAr ? 'ar' : 'en']}</div>
            <div className="toast-msg">{t.msg}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => remove(t.id)}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="toast-progress"
            style={{ animationDuration: `${DURATION}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

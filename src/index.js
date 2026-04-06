import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/ToastContainer';
import reportWebVitals from './reportWebVitals';

// Suppress "Script error." from cross-origin scripts (e.g. TradingView widget)
window.addEventListener('error', e => {
  if (e.message === 'Script error.' || e.message === '') e.stopImmediatePropagation();
}, true);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
      <ToastContainer />
    </AppProvider>
  </React.StrictMode>
);

// ── Service Worker (PWA + Offline + Push Notifications) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        // Check for updates every 30 minutes
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch(() => {
        // SW registration failed (e.g. Firefox private mode) — app works fine
      });
  });
}

reportWebVitals();

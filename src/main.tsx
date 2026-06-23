import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent external script errors (e.g. browser extensions or cross-origin iframe sandbox limits) from generating false positive crashes
if (typeof window !== "undefined") {
  const isIgnoredError = (msg: string, source?: string) => {
    if (!source || source === "") return true; // If no source URL is present, it's cross-origin
    if (!msg) return false;
    const normalized = msg.toLowerCase();
    return (
      normalized.includes("script error") || 
      normalized.includes("resizeobserver") ||
      normalized.includes("extension") ||
      normalized.includes("cross-origin")
    );
  };

  window.onerror = (message, source, lineno, colno, error) => {
    const msgStr = typeof message === "string" ? message : (message?.toString() || "");
    const srcStr = typeof source === "string" ? source : "";
    if (isIgnoredError(msgStr, srcStr) || msgStr === "Script error." || msgStr === "Script error") {
      return true; // Prevents the firing of the default event handler and suppresses console issue
    }
    return false;
  };

  window.addEventListener("error", (e) => {
    const msg = e.message || (e.error && e.error.message) || "";
    const src = e.filename || "";
    if (isIgnoredError(msg, src) || msg === "Script error." || msg === "Script error") {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    const msg = (e.reason && e.reason.message) || "";
    if (isIgnoredError(msg)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

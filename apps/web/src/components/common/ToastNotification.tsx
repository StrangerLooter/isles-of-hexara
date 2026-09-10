'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ToastNotificationProps {
  logs?: string[];
  errorToast?: string | null;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  logs = [],
  errorToast,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevLogsLengthRef = useRef<number>(logs.length);

  // Error toast trigger
  useEffect(() => {
    if (errorToast) {
      const id = 'err_' + Date.now();
      setToasts((prev) => [...prev.slice(-3), { id, message: errorToast, type: 'error' }]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Log events trigger
  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current) {
      const newEntries = logs.slice(prevLogsLengthRef.current);
      prevLogsLengthRef.current = logs.length;

      newEntries.forEach((msg, idx) => {
        const id = 'log_' + Date.now() + '_' + idx;
        const isSuccess =
          msg.includes('built') ||
          msg.includes('upgraded') ||
          msg.includes('won') ||
          msg.includes('claimed') ||
          msg.includes('Victory');
        setToasts((prev) => [
          ...prev.slice(-3),
          { id, message: msg, type: isSuccess ? 'success' : 'info' },
        ]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      });
    } else {
      prevLogsLengthRef.current = logs.length;
    }
  }, [logs]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200 ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : toast.type === 'success'
              ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              : 'bg-[#1c0c04]/90 border-amber-800/60 text-amber-200 shadow-lg'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : toast.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span className="text-xs font-bold leading-tight">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

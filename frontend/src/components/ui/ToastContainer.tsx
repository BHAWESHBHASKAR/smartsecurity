'use client';

import { createContext, useContext, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (type: ToastType, message: string, duration = 5000) => {
    const toastProps = {
      title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Info',
      description: message,
      variant: type === 'error' ? 'destructive' as const : 'default' as const,
      duration,
    };

    toast(toastProps);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

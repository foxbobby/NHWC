'use client';

import { useState, useCallback } from 'react';
import { generateId } from '@/lib/utils';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'success', duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'error', duration });
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'warning', duration });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ message, type: 'info', duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  };
}
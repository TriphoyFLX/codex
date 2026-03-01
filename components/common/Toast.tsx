import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { create } from 'zustand';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },
  clearToasts: () => set({ toasts: [] })
}));

// Utility hooks for easy toast usage
export const useToast = () => {
  const addToast = useToastStore(state => state.addToast);
  
  return {
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message, duration: 7000 }),
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
  };
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const Icon = icons[type];
  return <Icon size={20} />;
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore(state => state.removeToast);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);
  
  return (
    <div 
      className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastIcon}>
        <ToastIcon type={toast.type} />
      </div>
      
      <div className={styles.toastContent}>
        <div className={styles.toastTitle}>
          {toast.title}
        </div>
        {toast.message && (
          <div className={styles.toastMessage}>
            {toast.message}
          </div>
        )}
      </div>
      
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className={styles.toastAction}
        >
          {toast.action.label}
        </button>
      )}
      
      <button
        onClick={() => removeToast(toast.id)}
        className={styles.toastClose}
        aria-label="Закрыть уведомление"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore(state => state.toasts);
  
  if (toasts.length === 0) return null;
  
  return createPortal(
    <div className={styles.toastContainer} aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
};
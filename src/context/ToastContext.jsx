import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AppToast from '../components/alerts/AppToast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [activeToasts, setActiveToasts] = useState([]);
  const [queue, setQueue] = useState([]);

  const activeToastsRef = useRef([]);
  const queueRef = useRef([]);
  activeToastsRef.current = activeToasts;
  queueRef.current = queue;

  const removeToast = useCallback((id) => {
    setActiveToasts((prevActive) => {
      const nextActive = prevActive.filter((t) => t.id !== id);
      
      // If there's room and items are in the queue, pull the first one
      if (nextActive.length < 3 && queueRef.current.length > 0) {
        const nextQueue = [...queueRef.current];
        const pulled = nextQueue.shift();
        setQueue(nextQueue);
        
        // Start its dismiss timer
        setTimeout(() => {
          removeToast(pulled.id);
        }, pulled.duration);

        return [...nextActive, pulled];
      }
      return nextActive;
    });
  }, [queueRef]);

  const addToast = useCallback((message, variant = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const duration = variant === 'error' ? 6000 : 4000;
    const newToast = { id, message, variant, duration };

    if (activeToastsRef.current.length < 3) {
      setActiveToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        removeToast(id);
      }, duration);
    } else {
      setQueue((prev) => [...prev, newToast]);
    }
  }, [removeToast]);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const toastApi = { success, error, warning, info, activeToasts, removeToast };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <AppToast />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

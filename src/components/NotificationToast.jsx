import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const NotificationToast = () => {
  const { notifications, clearNotification } = useApp();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px',
      width: '100%'
    }}>
      {notifications.map((n) => (
        <ToastItem key={n.id} item={n} onDismiss={clearNotification} />
      ))}
    </div>
  );
};

const ToastItem = ({ item, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, 6000); // Auto dismiss after 6s
    return () => clearTimeout(timer);
  }, [item, onDismiss]);

  const getStyle = () => {
    switch (item.type) {
      case 'success':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.95)',
          borderLeft: '4px solid #047857',
          boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.95)',
          borderLeft: '4px solid #b45309',
          boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          borderLeft: '4px solid #b91c1c',
          boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
        };
      case 'info':
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          borderLeft: '4px solid #1d4ed8',
          boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
        };
    }
  };

  return (
    <div 
      className="glass"
      style={{
        padding: '0.85rem 1.1rem',
        borderRadius: 'var(--radius-sm)',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.75rem',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        fontSize: '0.85rem',
        lineHeight: '1.4',
        pointerEvents: 'auto',
        ...getStyle()
      }}
    >
      <div style={{ flex: 1 }}>{item.text}</div>
      <button 
        onClick={() => onDismiss(item.id)} 
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: '1',
          padding: '0 2px'
        }}
      >
        &times;
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

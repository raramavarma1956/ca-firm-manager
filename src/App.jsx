import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRDashboard } from './components/HRDashboard';
import { PartnerDashboard } from './components/PartnerDashboard';
import { NotificationToast } from './components/NotificationToast';

function AppContent() {
  const { sessionUser, loading } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const [showIosBanner, setShowIosBanner] = useState(() => {
    return !sessionStorage.getItem('ios_pwa_dismissed');
  });
  const [showIosModal, setShowIosModal] = useState(false);

  // Check iOS device and standalone mode
  const isIOS = typeof navigator !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && 
    !window.MSStream;
  const isStandalone = typeof window !== 'undefined' && 
    (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));

  // Capture PWA install prompt for Chromium
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPwaBanner(false);
  };

  const dismissIosBanner = () => {
    setShowIosBanner(false);
    sessionStorage.setItem('ios_pwa_dismissed', 'true');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#090d16'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <>
      {/* Global Toast Alerts */}
      <NotificationToast />

      {/* iOS Safari Installation Banner */}
      {isIOS && !isStandalone && showIosBanner && (
        <div style={{ padding: '0.75rem 1rem 0 1rem', backgroundColor: '#090d16' }}>
          <div className="pwa-banner" style={{ border: '1px solid rgba(59, 130, 246, 0.4)', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%)' }}>
            <div className="pwa-banner-text">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <span>📱</span> Install CA Practice on iPhone
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Add to your Home Screen for full-screen camera check-ins & instant access.
              </p>
            </div>
            <div className="pwa-actions" style={{ flexShrink: 0 }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowIosModal(true)} 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                How to Install
              </button>
              <button 
                className="btn btn-outline" 
                onClick={dismissIosBanner} 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div className="modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🍏</span> Install on your iPhone
              </h3>
              <button className="btn btn-outline btn-icon" onClick={() => setShowIosModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Follow these 3 easy steps in Apple Safari to install CA Practice Manager directly to your home screen:
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>1</div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Tap the Share Button</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Look at the bottom navigation toolbar in Safari and tap the Share icon (<span style={{ fontSize: '1.1rem' }}>⎋</span> or square with arrow pointing up).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>2</div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Select "Add to Home Screen"</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Scroll down the options list in the share sheet and tap <strong>Add to Home Screen</strong> (<span style={{ fontSize: '1rem' }}>⊞</span>).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>3</div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Tap "Add" in Top Right</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Confirm the app title and tap <strong>Add</strong>. The CA Practice icon will appear on your iPhone screen!
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowIosModal(false)} style={{ width: '100%' }}>
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chrome / Android PWA Banner */}
      {!isIOS && showPwaBanner && deferredPrompt && (
        <div style={{ padding: '1rem 2rem 0 2rem', backgroundColor: '#090d16' }}>
          <div className="pwa-banner">
            <div className="pwa-banner-text">
              <h4>Install CA Practice Manager</h4>
              <p>Add this utility app to your home screen for rapid check-ins, offline access, and desktop shortcuts.</p>
            </div>
            <div className="pwa-actions">
              <button className="btn btn-secondary" onClick={handlePwaInstall} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                Install App
              </button>
              <button className="btn btn-outline" onClick={() => setShowPwaBanner(false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      {!sessionUser ? (
        <Login />
      ) : sessionUser.role === 'Employee' ? (
        <EmployeeDashboard />
      ) : sessionUser.role === 'HR' ? (
        <HRDashboard />
      ) : sessionUser.role === 'Partner' ? (
        <PartnerDashboard />
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#090d16' }}>
          <h3>Invalid account configuration. Role mapping error.</h3>
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Back to Login</button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

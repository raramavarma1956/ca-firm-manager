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

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show install banner
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowPwaBanner(false);
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

      {/* PWA Banner (If supported and banner is toggled) */}
      {showPwaBanner && deferredPrompt && (
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

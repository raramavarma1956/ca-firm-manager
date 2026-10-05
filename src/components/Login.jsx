import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const Login = () => {
  const { login, signup, mockDb, addNotification, getSettings } = useApp();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    if (getSettings) {
      getSettings().then(s => {
        if (active) setSettings(s);
      }).catch(err => console.error('Failed to load settings in Login:', err));
    }
    return () => { active = false; };
  }, [getSettings]);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [otp, setOtp] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('password123');
  const [signupDivision, setSignupDivision] = useState('Audit & Assurance Services');
  const [signupBranch, setSignupBranch] = useState('branch-1');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 2FA state
  const [require2FA, setRequire2FA] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password, require2FA ? otp : null);
        if (res && res.require2FA) {
          setRequire2FA(true);
          setOtpSentTo(res.otpSentTo);
        }
      } else {
        // Signup
        await signup(signupName, signupEmail, signupPassword, signupDivision, signupBranch);
        addNotification('Application submitted. Waiting for Administrator approval.', 'success');
        setMode('login');
        setEmail(signupEmail);
        setPassword(signupPassword);
        // Clear fields
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('password123');
      }
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (userEmail) => {
    setMode('login');
    setEmail(userEmail);
    setPassword('password123');
    setRequire2FA(false);
    setOtp('');
    setError(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #090d16 100%)'
    }}>
      <div 
        className="glass" 
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-lg), 0 0 50px rgba(59, 130, 246, 0.1)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-grad)',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            marginBottom: '0.75rem',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            CA
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            {settings?.firm_name || 'Varma Raja & Associates'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Staff Attendance & Practice Suite' : 'Employee Self-Onboarding'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <span style={{ fontSize: '0.8rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <>
              {!require2FA ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@cafirm.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control text-center"
                    placeholder="000000"
                    required
                    style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                    A 2FA code is simulated for {otpSentTo}.<br />
                    <strong>Enter: 123456</strong>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Arjun Mehta"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="arjun@cafirm.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allocate Division</label>
                <select
                  className="form-control form-select"
                  value={signupDivision}
                  onChange={(e) => setSignupDivision(e.target.value)}
                >
                  <option value="Audit & Assurance Services">Audit & Assurance Services</option>
                  <option value="Other Professional Services">Other Professional Services</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Branch</label>
                <select
                  className="form-control form-select"
                  value={signupBranch}
                  onChange={(e) => setSignupBranch(e.target.value)}
                >
                  {(() => {
                    try {
                      const branches = mockDb.settings?.branches ? JSON.parse(mockDb.settings.branches) : [];
                      if (branches.length > 0) {
                        return branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ));
                      }
                    } catch (e) {}
                    return (
                      <>
                        <option value="branch-1">Bangalore Head Office (Indiranagar)</option>
                        <option value="branch-2">Bangalore Branch (Koramangala)</option>
                      </>
                    );
                  })()}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary mt-2" 
            style={{ width: '100%', height: '42px' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '18px', height: '18px' }} />
            ) : mode === 'login' ? (
              require2FA ? 'Verify & Login' : 'Sign In'
            ) : (
              'Apply for Onboarding'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--primary)' }}
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? 'Apply as Employee (Self-Onboard)' : 'Already registered? Sign In'}
          </button>
        </div>

        {mode === 'login' && !require2FA && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
              Quick Demo Access
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {mockDb.profiles?.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="btn btn-outline"
                  style={{ 
                    padding: '0.4rem 0.5rem', 
                    fontSize: '0.75rem', 
                    justifyContent: 'flex-start',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => selectDemoUser(p.email)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{p.name.split(' ')[0]}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

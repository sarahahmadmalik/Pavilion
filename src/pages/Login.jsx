import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Spinner } from '../components/common/Loader.jsx';
import { BrandLogo } from '../components/common/BrandLogo.jsx';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { DEMO_ACCOUNTS } from '../lib/demoAccounts.js';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sun, Moon, Users } from 'lucide-react';

export const Login = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (lockoutUntil > now) {
      const secs = Math.ceil((lockoutUntil - now) / 1000);
      setErrorMessage(`Too many failed sign-in attempts. Please wait ${secs} seconds and try again.`);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      setFailedAttempts(0);
      setLockoutUntil(0);
      onLoginSuccess();
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000);
        setFailedAttempts(0);
        setErrorMessage('Too many failed sign-in attempts. Sign-in is paused for 30 seconds for your security.');
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  const handleDemoAccountLogin = async (account) => {
    setShowDemoMenu(false);
    setErrorMessage('');
    setEmail(account.email);
    setPassword(account.password);
    setIsSubmitting(true);
    const res = await login(account.email, account.password);
    setIsSubmitting(false);
    if (res.success) onLoginSuccess();
    else setErrorMessage(res.message);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-page)',
      padding: '1.5rem',
      position: 'relative'
    }}>
      {/* Top Demo Quick-Login + Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Demo Accounts"
          >
            <Users size={15} color="var(--color-primary)" />
            <span>Demo</span>
          </button>

          {showDemoMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '250px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-dropdown)',
              padding: '0.4rem',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'popUpMenu 0.15s ease-out'
            }}>
              <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                Select Demo User
              </div>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDemoAccountLogin(acc)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.6rem',
                    fontSize: '0.8125rem'
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{acc.name}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: acc.role === 'super_admin' ? 'var(--color-primary-light)' : acc.role === 'admin' ? 'var(--status-blue-bg)' : 'var(--status-green-bg)',
                    color: acc.role === 'super_admin' ? 'var(--color-primary)' : acc.role === 'admin' ? 'var(--status-blue-text)' : 'var(--status-green-text)'
                  }}>
                    {acc.roleLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ borderRadius: 'var(--radius-full)' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      {/* Main Centered Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '2.5rem 2rem',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* PAVILION Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <BrandLogo size={50} showText={true} lightText={false} subtitle="Community & Guest House" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Sign in to your account
          </h2>
          {!configured && (
            <p style={{ fontSize: '0.78rem', color: 'var(--status-amber-text)', marginTop: '0.45rem' }}>
              Connect your Supabase project in <code>.env</code> to sign in.
            </p>
          )}
        </div>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-red-bg)',
            color: 'var(--status-red-text)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="user@pavilion-ops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-control"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ borderRadius: '4px' }}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? <Spinner size={18} color="#ffffff" /> : 'Login'}
          </button>
        </form>

      </div>

      <footer style={{ marginTop: '2rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        © 2026 PAVILION. All Rights Reserved.
      </footer>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="Forgot Password Policy Notice"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--border-focus)'
          }}>
            <h4 style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9375rem' }}>
              Self-Service Reset Unavailable
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              For enhanced institutional security, password resets cannot be performed self-service.
              Please contact the <strong>Super Admin</strong> administrator to issue a new secure password on your behalf via the User Management panel.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowForgotPasswordModal(false)}>
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

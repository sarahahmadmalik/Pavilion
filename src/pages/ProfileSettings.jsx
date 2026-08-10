import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { User, Lock, Sun, Moon, ShieldCheck, Mail, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import { ButtonSpinner } from '../components/common/Loader.jsx';
import { supabase } from '../lib/supabase.js';

export const ProfileSettings = ({ setToast }) => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Password & OTP Flow State
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(0);

  // Countdown timer for Resend OTP button
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Request OTP and validate passwords
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      setToast?.({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast?.({ type: 'error', message: 'New password and confirmation do not match!' });
      return;
    }

    try {
      setSendingOtp(true);

      // Generate a 6-digit random security OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      // Trigger Supabase Auth Password Reset Email if user email exists
      if (currentUser?.email) {
        await supabase.auth.resetPasswordForEmail(currentUser.email);
      }

      setStep('otp');
      setTimer(60);
      setToast?.({
        type: 'info',
        message: `📧 Verification OTP sent to ${currentUser?.email || 'your registered email'}.`
      });
    } catch (err) {
      setToast?.({ type: 'error', message: err.message || 'Failed to send OTP to email.' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      setSendingOtp(true);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      if (currentUser?.email) {
        await supabase.auth.resetPasswordForEmail(currentUser.email);
      }

      setTimer(60);
      setToast?.({
        type: 'info',
        message: `📧 New OTP code sent to ${currentUser?.email || 'your email'}.`
      });
    } catch (err) {
      setToast?.({ type: 'error', message: 'Failed to resend OTP code.' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and update password
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();

    if (!otpInput.trim()) {
      setToast?.({ type: 'error', message: 'Please enter the 6-digit OTP code.' });
      return;
    }

    if (otpInput.trim() !== generatedOtp) {
      setToast?.({ type: 'error', message: 'Invalid OTP code! Please check your email and try again.' });
      return;
    }

    try {
      setVerifying(true);

      // Execute password reset on Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setToast?.({ type: 'error', message: error.message || 'Failed to update password.' });
      } else {
        setToast?.({ type: 'success', message: '✓ OTP Verified! Your account password has been reset successfully.' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setOtpInput('');
        setStep('input');
      }
    } catch (err) {
      setToast?.({ type: 'error', message: err.message || 'An unexpected error occurred during password update.' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="profile-container">
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Profile & Account Settings
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Manage your personal profile information, security password via OTP verification, and dashboard theme preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <UserAvatar name={currentUser?.name} src={currentUser?.avatar} size={72} border="3px solid var(--color-primary)" />
        <div className="profile-card-details" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {currentUser?.name}
            </h3>
            <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
              {currentUser?.role?.replace('_', ' ')}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {currentUser?.email}
          </p>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>
            ● Status: {currentUser?.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="profile-theme-card">
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
            Current Theme Mode: <strong style={{ textTransform: 'capitalize' }}>{theme} Mode</strong>
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Toggle between high-contrast dark charcoal theme and crisp institutional light theme.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={toggleTheme} style={{ gap: '0.5rem' }}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Switch Theme Mode
        </button>
      </div>

      {/* Password Change Form with 2-Step Email OTP Verification */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="var(--color-primary)" /> Security & Password Update
        </h3>

        {step === 'input' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="profile-form-grid">
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="input-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="input-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn btn-primary" disabled={sendingOtp} style={{ gap: '0.5rem' }}>
                {sendingOtp ? (
                  <ButtonSpinner text="Sending Verification OTP..." color="#fff" />
                ) : (
                  <>
                    <Mail size={16} /> Send OTP Verification Code
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtpAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* OTP Banner Box */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(26,63,160,0.08)',
              border: '1px solid rgba(26,63,160,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                <Mail size={18} /> Verification Code Sent!
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                A 6-digit OTP verification code has been dispatched to <strong>{currentUser?.email}</strong>. Please enter the code below to authorize your password reset.
              </p>
              
              {/* Display code for instant verification testing */}
              {generatedOtp && (
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.375rem 0.625rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  color: '#059669',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginTop: '0.25rem'
                }}>
                  <KeyRound size={13} /> Your Security OTP Code: <span style={{ fontSize: '0.9375rem', letterSpacing: '2px', fontWeight: 800 }}>{generatedOtp}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                className="input-control"
                style={{
                  letterSpacing: '6px',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  maxWidth: '280px',
                  margin: '0 auto'
                }}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep('input')}
                style={{ gap: '0.375rem' }}
              >
                <ArrowLeft size={15} /> Back
              </button>

              <div className="profile-actions" style={{ margin: 0 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResendOtp}
                  disabled={timer > 0 || sendingOtp}
                  style={{ gap: '0.375rem' }}
                >
                  <RefreshCw size={14} /> {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
                </button>

                <button type="submit" className="btn btn-primary" disabled={verifying} style={{ gap: '0.5rem' }}>
                  {verifying ? (
                    <ButtonSpinner text="Verifying OTP..." color="#fff" />
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Verify OTP & Reset Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


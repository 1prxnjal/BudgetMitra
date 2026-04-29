import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Lock, Mail, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // ── Google Sign-In via Supabase ───────────────────────────────
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    console.log('Initiating Google Sign-In with redirect:', window.location.origin);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    });
    if (error) { 
      console.error('Google Sign-In Error:', error);
      setError(error.message); 
      setLoading(false); 
    }
  };

  // ── Email Sign-In ─────────────────────────────────────────────
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email    = e.target.email.value.trim();
    const password = e.target.password.value;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid login credentials') ||
          signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('Wrong email or password. If you are new, click "Create Account" below.');
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }
    navigate('/dashboard');
  };

  // ── Email Sign-Up ─────────────────────────────────────────────
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email    = e.target.email.value.trim();
    const password = e.target.password.value;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: email.split('@')[0] } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // If email confirmation disabled in Supabase → user is logged in immediately
    // If enabled → show message
    setError('✅ Account created! If you see a confirmation email, click the link. Otherwise you are already logged in.');
    setLoading(false);
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        * { box-sizing: border-box; }
        .login-page-wrapper {
          display: flex; height: 100vh; width: 100vw;
          background-color: white; overflow: hidden;
        }
        .login-left {
          flex: 1.2; background-color: #1A237E; color: white;
          padding: 60px; display: flex; flex-direction: column;
          justify-content: space-between; position: relative;
        }
        .login-brand { display: flex; align-items: center; gap: 15px; z-index: 10; }
        .login-brand h1 { font-size: 2rem; font-weight: 700; margin: 0; }
        .login-hero-text h2 { font-size: 2.8rem; font-weight: 700; line-height: 1.2; max-width: 500px; }
        .login-social-proof { display: flex; align-items: center; gap: 15px; z-index: 10; }
        .avatar-group { display: flex; }
        .avatar-group img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #1A237E; margin-left: -10px; object-fit: cover; }
        .avatar-group img:first-child { margin-left: 0; }
        .login-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: white; }
        .login-form-container { width: 100%; max-width: 400px; }
        .login-title { font-size: 2rem; font-weight: 700; margin-bottom: 10px; color: #1a1a1a; }
        .login-subtitle { color: #6B7280; margin-bottom: 30px; font-size: 0.95rem; }

        .google-btn {
          width: 100%; padding: 13px; border: 1.5px solid #E5E7EB;
          border-radius: 10px; background: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 0.95rem; font-weight: 600; color: #374151;
          transition: background 0.18s, box-shadow 0.18s;
          margin-bottom: 25px;
        }
        .google-btn:hover { background: #F9FAFB; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider { display: flex; align-items: center; text-align: center; margin: 0 0 25px; color: #A0A0C0; font-size: 0.85rem; }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #E5E7EB; }
        .divider span { padding: 0 15px; }

        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.9rem; font-weight: 600; color: #374151; }
        .input-with-icon { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; color: #9CA3AF; }
        .input-with-icon input { width: 100%; padding: 12px 12px 12px 45px; border: 1px solid #E5E7EB; border-radius: 8px; outline: none; font-size: 1rem; font-family: inherit; }
        .input-with-icon input:focus { border-color: #1A237E; }
        .eye-btn { position: absolute; right: 14px; background: none; border: none; color: #9CA3AF; cursor: pointer; }

        .login-submit-btn {
          background-color: #00695C; color: white; padding: 14px;
          border-radius: 8px; border: none; font-size: 1rem; font-weight: 600;
          cursor: pointer; margin-top: 10px; font-family: inherit;
          transition: background 0.18s;
        }
        .login-submit-btn:hover { background-color: #004D40; }
        .login-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .error-msg { background: #FEF2F2; color: #DC2626; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; border: 1px solid #FECACA; }
        .success-msg { background: #F0FDF4; color: #059669; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; border: 1px solid #BBF7D0; }
        .signup-prompt { text-align: center; margin-top: 30px; font-size: 0.9rem; color: #6B7280; }
      `}</style>

      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <CreditCard size={40} color="white" />
          <h1>BudgetMitra</h1>
        </div>
        <div className="login-hero-text">
          <h2>Your Smart Budget Saathi for a secure financial future.</h2>
        </div>
        <div className="login-social-proof">
          <div className="avatar-group">
            <img src="/developer.jpg" alt="user" />
            <img src="/developer2.jpg" alt="user" />
            <img src="/developer3.jpg" alt="user" />
          </div>
          <span>Join 10,000+ smart savers</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="login-subtitle">
            {isSignUp ? 'Join BudgetMitra and start tracking smarter.' : 'Sign in to access your dashboard.'}
          </p>

          {/* Google Sign-In */}
          <button className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="divider"><span>or use email</span></div>

          {/* Sign In / Sign Up tab toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
                background: !isSignUp ? 'white' : 'transparent',
                color: !isSignUp ? '#1A237E' : '#6B7280',
                boxShadow: !isSignUp ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >Sign In</button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
                background: isSignUp ? 'white' : 'transparent',
                color: isSignUp ? '#1A237E' : '#6B7280',
                boxShadow: isSignUp ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >Create Account</button>
          </div>

          {error && (
            <div className={error.startsWith('✅') ? 'success-msg' : 'error-msg'} style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="login-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input name="email" type="email" placeholder="name@example.com" required />
              </div>
            </div>
            <div className="input-group">
              <label>Password {isSignUp && <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '0.8rem' }}>(min. 6 characters)</span>}</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required minLength={6} />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.78rem', color: '#9CA3AF' }}>
            Your data is securely stored with Supabase 🔒
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { loadBudgetState, saveBudgetState } from './lib/db';
import LoginPage      from './pages/LoginPage';
import Dashboard      from './pages/Dashboard';
import FinancialOverview from './pages/FinancialOverview';
import OnboardingPage from './pages/OnboardingPage';
import ChatPage       from './pages/ChatPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage    from './pages/ProfilePage';
import LoanManagerPage from './pages/LoanManagerPage';
import PortfolioPage from './pages/PortfolioPage';
import SecurityPage    from './pages/SecurityPage';

// Simple placeholder for new routes
const Placeholder = ({ title }) => (
  <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontSize: '1.5rem', fontWeight: 700, color: '#1E293B' }}>
    {title} Page Coming Soon...
  </div>
);

function App() {
  const [supabaseUser, setSupabaseUser] = useState(undefined); // undefined = loading
  const [budgetState,  setBudgetState]  = useState(undefined); // undefined = loading budget
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const saveTimerRef = useRef(null);

  // ── 1. Listen to Supabase auth state ──────────────────────────
  useEffect(() => {
    // Detect if we are returning from Google (tokens are in the URL hash #)
    const isRedirecting = window.location.hash.includes('access_token');
    
    console.log('App: Mount. URL:', window.location.href, 'Hash Detect:', isRedirecting);
    
    // Ensure loading screen stays for at least 1.5s
    setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 1500);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: getSession returned:', session ? 'UserFound' : 'NoUser');
      
      // If we are redirecting, we wait for onAuthStateChange to fire SIGNED_IN
      // We DO NOT set supabaseUser to null yet to keep the loading screen up.
      if (!session && !isRedirecting) {
        setSupabaseUser(null);
      } else if (session) {
        setSupabaseUser(session.user);
        fetchBudgetState(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('App: Auth Event:', event, 'User:', session?.user?.email || 'None');
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const u = session?.user ?? null;
        setSupabaseUser(u);
        if (u) fetchBudgetState(u);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setBudgetState(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── 2. Load budget state from Supabase after login ────────────
  const fetchBudgetState = async (user) => {
    setBudgetState(undefined);
    const data = await loadBudgetState(user.id);
    if (data) {
      setBudgetState({
        income:            data.income,
        available_balance: data.available_balance,
        investments:       data.profile_data?.investments || 0,
        fd:                data.profile_data?.fd || 0,
        savings:           data.profile_data?.savings || 0,
        loans:             data.profile_data?.loans || [],
        transactions:      data.transactions || [],
        profile_data:      data.profile_data || {},
      });
    } else {
      // If null, it means first login, user needs onboarding
      setBudgetState(null);
    }
  };

  // ── 3. Auto-save to Supabase whenever budgetState changes ─────
  //       Debounced by 1.5 s to avoid hammering the DB on every keystroke
  useEffect(() => {
    if (!supabaseUser || !budgetState) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveBudgetState(supabaseUser.id, budgetState);
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [budgetState, supabaseUser]);

  // ── 4. Derive user object for legacy props ─────────────────────
  const user = supabaseUser ? {
    id:      supabaseUser.id,
    name:    supabaseUser.user_metadata?.full_name
          || supabaseUser.user_metadata?.name
          || supabaseUser.email?.split('@')[0]
          || 'User',
    email:   supabaseUser.email,
    picture: supabaseUser.user_metadata?.avatar_url || null,
    joined:  supabaseUser.created_at ? new Date(supabaseUser.created_at).getFullYear() : 2024
  } : null;

  // ── 5. Handlers ───────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setBudgetState(undefined);
    // Clear local profile picture cache on logout
    localStorage.removeItem('budgetMitra_avatar');
  };

  const handleUpdateBudget = (newData) => {
    // Automatically calculate available balance: Income + sum of all transactions
    const txTotal = (newData.transactions || []).reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const calculatedBalance = (parseFloat(newData.income) || 0) + txTotal;
    
    setBudgetState({
      ...newData,
      available_balance: calculatedBalance
    });
  };

  // ── 6. Loading state (Premium Redesign) ──────────────────────
  if (supabaseUser === undefined || (supabaseUser && budgetState === undefined) || !minLoadingTimePassed) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E1B4B 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Animated Particles */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '4px', height: '4px', background: '#38BDF8', borderRadius: '50%', filter: 'blur(1px)', animation: 'float 6s infinite alternate' }}></div>
          <div style={{ position: 'absolute', top: '60%', left: '80%', width: '6px', height: '6px', background: '#F59E0B', borderRadius: '50%', filter: 'blur(2px)', animation: 'float 8s infinite alternate-reverse' }}></div>
          <div style={{ position: 'absolute', top: '10%', right: '10%', width: '3px', height: '3px', background: 'white', borderRadius: '50%', animation: 'blink 3s infinite' }}></div>
          <div style={{ position: 'absolute', bottom: '25%', left: '40%', width: '5px', height: '5px', background: '#12C29B', borderRadius: '50%', filter: 'blur(1px)', animation: 'float 5s infinite alternate' }}></div>
        </div>

        <style>{`
          @keyframes float { from { transform: translate(0, 0); opacity: 0.3; } to { transform: translate(20px, 20px); opacity: 0.8; } }
          @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
          @keyframes pulse-logo { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); } 70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255,255,255,0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0); } }
          @keyframes progress-slide { 0% { left: -100%; } 100% { left: 100%; } }
          @keyframes spin-sync { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        <div style={{ textAlign: 'center', zIndex: 10, width: '400px' }}>
          {/* Logo Section */}
          <div style={{ 
            width: '120px', height: '120px', background: 'white', borderRadius: '50%', 
            margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'pulse-logo 3s infinite ease-in-out'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#12C29B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>BudgetMitra</h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 40px' }}>Smart Budget Saathi</p>

          {/* Progress Bar */}
          <div style={{ 
            width: '280px', height: '6px', background: 'rgba(255,255,255,0.1)', 
            borderRadius: '100px', margin: '0 auto 24px', position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ 
              position: 'absolute', top: 0, bottom: 0, width: '50%', 
              background: 'linear-gradient(90deg, #12C29B, #06B6D4)', 
              borderRadius: '100px', animation: 'progress-slide 2s infinite ease-in-out' 
            }}></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#CBD5E1', fontSize: '0.95rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin-sync 2s linear infinite' }}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <p style={{ margin: 0 }}>Namaste! Your Smart Saathi is preparing your dashboard...</p>
          </div>

          {/* Footer Section */}
          <div style={{ marginTop: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                border: '3px solid rgba(18, 194, 155, 0.3)', 
                padding: '3px',
                background: 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  <img src="/developer.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Developer" />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8', margin: '0 0 24px' }}>Developed by the BudgetMitra Team</p>

            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              padding: '10px 20px', borderRadius: '100px', 
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
              fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              AES-256 Encrypted Connection
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px', opacity: 0.3 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 7. Route helpers ──────────────────────────────────────────
  const isLoggedIn = !!user;
  const hasOnboarded = !!budgetState;

  const protectedRoute = (element) => {
    if (!isLoggedIn)    return <Navigate to="/login" />;
    if (!hasOnboarded)  return <Navigate to="/onboarding" />;
    return element;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route path="/onboarding"
          element={
            !isLoggedIn ? <Navigate to="/login" /> :
            hasOnboarded ? <Navigate to="/dashboard" /> :
            <OnboardingPage onComplete={handleUpdateBudget} />
          }
        />
        <Route path="/dashboard"
          element={protectedRoute(<Dashboard user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/overview"
          element={protectedRoute(<FinancialOverview user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/chat"
          element={protectedRoute(<ChatPage user={user} onLogout={handleLogout} budgetState={budgetState} />)}
        />
        <Route path="/transactions"
          element={protectedRoute(<TransactionsPage user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/profile"
          element={protectedRoute(<ProfilePage user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/loan-manager"
          element={protectedRoute(<LoanManagerPage user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/security"
          element={protectedRoute(<SecurityPage user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/portfolio"
          element={protectedRoute(<PortfolioPage user={user} onLogout={handleLogout} budgetState={budgetState} onUpdateBudget={handleUpdateBudget} />)}
        />
        <Route path="/reports"     element={protectedRoute(<Placeholder title="Reports" />)} />
        
        <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;

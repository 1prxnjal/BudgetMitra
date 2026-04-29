import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Bot, CreditCard, LogOut, Shield, User, X, Trash2, Landmark, Plus, PieChart as PieIcon
} from 'lucide-react';

function AddSavingsModal({ isOpen, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    onConfirm(parseFloat(amount));
    setAmount('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalSlide 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div style={{ width: '64px', height: '64px', background: '#E6F8F3', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Landmark size={30} color="#12C29B" />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>Add to Savings</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>Enter the amount you'd like to add to your current balance.</p>
        <form onSubmit={handleSubmit}>
          <input 
            type="number" 
            autoFocus
            placeholder="₹ 0.00" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E2E8F0', marginBottom: '24px', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', outline: 'none', color: '#1E293B' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#12C29B', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(18, 194, 155, 0.2)' }}>Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogoutModal({ onClose, onConfirm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '380px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalSlide 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: '64px', height: '64px', background: '#FEE2E2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <LogOut size={30} color="#EF4444" />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>Logging Out?</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '28px', lineHeight: 1.6 }}>Are you sure you want to end your session? You will need to log in again to access your dashboard.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>Stay</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, onLogout, balance, onUpdateBudget, budgetState }) {
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('budgetMitra_avatar') || null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  // Sync if profile picture is updated while sidebar is mounted
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'budgetMitra_avatar' || !e.key) {
        setAvatarUrl(localStorage.getItem('budgetMitra_avatar') || null);
      }
    };
    window.addEventListener('storage', onStorage);

    // Also poll every 2s for same-tab updates (localStorage events don't fire in same tab)
    const interval = setInterval(() => {
      const current = localStorage.getItem('budgetMitra_avatar') || null;
      setAvatarUrl(prev => prev !== current ? current : prev);
    }, 2000);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  const handleAddSavings = (amount) => {
    if (!onUpdateBudget || !budgetState) return;
    
    const newLogEntry = {
      id: Date.now(),
      amount: amount,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      description: 'Added from Sidebar'
    };

    onUpdateBudget({
      ...budgetState,
      savings: (budgetState.savings || 0) + amount,
      profile_data: {
        ...(budgetState.profile_data || {}),
        savings_log: [newLogEntry, ...(budgetState.profile_data?.savings_log || [])]
      }
    });
  };

  const displayName = user?.name || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sidebar" style={{ width: '260px', background: '#1A237E', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <style>{`
        .sidebar-logo-section { padding: 24px 24px 16px; }
        .sidebar-brand-name { font-size: 1.4rem; font-weight: 800; color: white; letter-spacing: -0.5px; }
        .sidebar-tagline { font-size: 0.72rem; color: #12C29B; margin: 2px 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        .sidebar-user-card {
          margin: 0 14px 10px;
          background: rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sidebar-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          overflow: hidden; flex-shrink: 0;
          border: 2px solid #12C29B;
          background: #0D1A6B;
          display: flex; align-items: center; justify-content: center;
        }
        .sidebar-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-avatar-initials { font-size: 1rem; font-weight: 700; color: #12C29B; }
        .sidebar-user-info { overflow: hidden; }
        .sidebar-user-name { font-size: 0.88rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-user-email { font-size: 0.7rem; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }

        .sidebar-nav { flex: 1; padding: 6px 10px; display: flex; flex-direction: column; gap: 3px; }
        .nav-link-item { 
          display: flex; align-items: center; gap: 12px; padding: 11px 14px; 
          border-radius: 10px; color: rgba(255,255,255,0.55); text-decoration: none; font-weight: 500;
          font-size: 0.9rem; transition: all 0.18s;
        }
        .nav-link-item:hover { background: rgba(255,255,255,0.07); color: white; }
        .nav-link-item.active { background: rgba(18,194,155,0.15); color: white; border-left: 3px solid #12C29B; padding-left: 11px; }
        
        .sidebar-footer { padding: 10px 10px 20px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 2px; }
        .logout-btn { 
          width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 14px; 
          background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-weight: 500;
          border-radius: 10px; font-size: 0.88rem; transition: all 0.18s;
        }
        .logout-btn:hover { color: #FF6B6B; background: rgba(255,107,107,0.08); }

        .add-savings-btn {
          margin: 10px 4px 5px;
          background: #12C29B;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.85rem;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(18, 194, 155, 0.2);
        }
        .add-savings-btn:hover { background: #0FB08C; transform: translateY(-1px); }
      `}</style>

      {/* Brand */}
      <div className="sidebar-logo-section">
        <div className="sidebar-brand-name">BudgetMitra</div>
        <div className="sidebar-tagline">Your Smart Saathi</div>
      </div>

      {/* User Card with Avatar */}
      <Link to="/profile" style={{ textDecoration: 'none' }}>
        <div className="sidebar-user-card" style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
          <div className="sidebar-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} />
              : user?.picture
                ? <img src={user.picture} alt={displayName} />
                : <span className="sidebar-avatar-initials">{initials}</span>
            }
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-email">{user?.email || 'budgetmitra.app'}</div>
          </div>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/overview" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <CreditCard size={18} /> Financial Overview
        </NavLink>
        <NavLink to="/transactions" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Expenses
        </NavLink>
        <NavLink to="/loan-manager" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <Landmark size={18} /> Loan Manager
        </NavLink>
        <NavLink to="/portfolio" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <PieIcon size={18} /> Wealth Portfolio
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `nav-link-item ${isActive ? 'active' : ''}`}>
          <Bot size={18} /> Saathi AI
        </NavLink>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="add-savings-btn" onClick={() => setShowSavingsModal(true)}>
          <Plus size={16} /> Add Savings
        </button>
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          <LogOut size={17} /> Sign Out
        </button>
      </div>

      {showSavingsModal && <AddSavingsModal isOpen={true} onClose={() => setShowSavingsModal(false)} onConfirm={handleAddSavings} />}
      {showLogoutModal && <LogoutModal onClose={() => setShowLogoutModal(false)} onConfirm={onLogout} />}
    </div>
  );
}

export default Sidebar;


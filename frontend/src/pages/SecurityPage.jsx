import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { 
  Shield, Key, Smartphone, Laptop, LogOut, History, 
  Bot, AlertTriangle, CheckCircle2, ChevronRight, Bell, Maximize2, X, Info
} from 'lucide-react';

// --- Custom Alert/Confirm Modal ---
function CustomAlertModal({ isOpen, onClose, title, message, icon: Icon, confirmText = "OK", type = "info" }) {
  if (!isOpen) return null;
  const isDanger = type === "danger";
  const isSuccess = type === "success";
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalSlide 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div style={{ 
          width: '64px', height: '64px', 
          borderRadius: '50%', 
          background: isDanger ? '#FEE2E2' : isSuccess ? '#DCFCE7' : '#E0E7FF', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <Icon size={32} color={isDanger ? '#EF4444' : isSuccess ? '#10B981' : '#4F46E5'} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '12px', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '32px' }}>{message}</p>
        <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: isDanger ? '#EF4444' : isSuccess ? '#10B981' : '#1E293B', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{confirmText}</button>
      </div>
    </div>
  );
}

// --- Shared Toast Component ---
function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: '#1A237E', color: 'white',
      padding: '13px 22px', borderRadius: '12px',
      fontWeight: 600, fontSize: '0.9rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '10px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
    }}>
      <CheckCircle2 size={18} color="#12C29B" /> {message}
    </div>
  );
}

function SecurityPage({ user, onLogout, budgetState, onUpdateBudget }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', icon: Info });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: msg }), 3000);
  }, []);

  const showAlert = (title, message, type = 'info', icon = Info) => {
    setAlertConfig({ isOpen: true, title, message, type, icon });
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showAlert("Current Password Required", "Please enter your current password to authorize this change.", "info", Shield);
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Passwords Mismatch", "The new password and confirmation password do not match. Please re-type them.", "danger", AlertTriangle);
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Password Too Short", "For your security, passwords must be at least 6 characters long.", "info", Key);
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      showAlert("Authentication Failed", "The current password you entered is incorrect. Please try again.", "danger", Shield);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    if (updateError) {
      showAlert("Update Failed", "We couldn't update your password: " + updateError.message, "danger", AlertTriangle);
    } else {
      showToast("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert("Security Success", "Your account password has been updated. You're all set!", "success", CheckCircle2);
    }
  };

  const securityLogs = [
    { event: 'Password Changed', date: 'Just now', status: 'completed' },
    { event: 'App Settings Updated', date: 'Today, 10:20 AM', status: 'completed' },
    { event: 'New Login Detected', date: 'Yesterday, 09:15 AM', status: 'completed' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA', overflow: 'hidden' }}>
      <Sidebar user={user} onLogout={onLogout} balance={budgetState?.available_balance || 0} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <header style={{ 
          padding: '24px 40px', background: 'white', borderBottom: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Security Settings</h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Bell size={20} color="#1A237E" style={{ cursor: 'pointer' }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E6F8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #12C29B' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#12C29B' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <div style={{ width: 40, height: 40, background: '#EEF2FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={20} color="#4F46E5" />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Change Password</h2>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '8px' }}>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '10px', background: '#F9FAFB', fontSize: '0.95rem', outline: 'none' }}
                  placeholder="Enter your current password"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '8px' }}>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '10px', background: '#F9FAFB', fontSize: '0.95rem', outline: 'none' }}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: '8px' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '10px', background: '#F9FAFB', fontSize: '0.95rem', outline: 'none' }}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleUpdatePassword}
                  disabled={loading}
                  style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: '#0D9488', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderLeft: '5px solid #12C29B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: 40, height: 40, background: '#ECFDF5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} color="#0D9488" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Two-Factor Authentication</h2>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '4px 0 0' }}>Adds an extra layer of security to your account.</p>
                  </div>
                </div>
                <div 
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  style={{ width: 48, height: 24, background: twoFactorEnabled ? '#0D9488' : '#D1D5DB', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                >
                  <div style={{ width: 18, height: 18, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: twoFactorEnabled ? 27 : 3, transition: '0.3s' }} />
                </div>
              </div>

              <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#1A237E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={28} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Google Authenticator</h3>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '4px 0 0' }}>Setup with Google Authenticator for secure one-time codes.</p>
                  </div>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Security Log</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {securityLogs.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #0D9488', background: 'white' }} />
                      {idx !== securityLogs.length - 1 && <div style={{ width: 2, flex: 1, background: '#F3F4F6', margin: '4px 0' }} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>{log.event}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0 0' }}>{log.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, background: '#1A237E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Security Assistant</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>Ask Smart Saathi about setting up advanced encryption or reviewing your privacy settings.</p>
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#FFEDD5', color: '#D97706', fontWeight: 800, cursor: 'pointer', justifyContent: 'center' }}>
                <Bot size={18} /> Talk to Saathi
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      <CustomAlertModal 
        isOpen={alertConfig.isOpen} 
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        icon={alertConfig.icon}
      />
    </div>
  );
}

export default SecurityPage;



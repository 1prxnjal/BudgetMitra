import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  User, Mail, Phone, MapPin, Camera, Edit2, Shield, Bell, 
  ChevronRight, ArrowRight, Bot, Trash2, Plus, LogOut, CheckCircle2,
  Lock, Wallet, Target, CreditCard, Activity, X, Info, Brain, Key,
  TrendingUp, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- Reusable Premium Modal Components ---
function CustomModal({ isOpen, onClose, title, children, footer, icon: Icon }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalSlide 0.3s ease-out', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {Icon && <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color="#1A237E" /></div>}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ marginTop: '32px' }}>{footer}</div>}
      </div>
    </div>
  );
}

function ProfilePage({ user, onLogout, budgetState, onUpdateBudget }) {
  // --- Sync Profile Data with Global Budget State ---
  const [profile, setProfile] = useState(() => {
    const defaults = {
      name: user?.name || 'User',
      email: user?.email || '',
      phone: '+91 98765 43210',
      location: 'New Delhi, India',
      bio: 'Financial enthusiast and early-stage investor.',
      categories: ['Shopping', 'Food', 'Rent', 'Transport', 'Entertainment', 'Health', 'Bills'],
      notifications: { email: true, push: true, monthly: false },
      aiPreferences: { personality: 'Professional', focus: 'Wealth Growth', memory: [] }
    };

    // Prioritize budgetState.profile_data (synced to Supabase)
    const profileData = budgetState?.profile_data || {};
    
    return {
      ...defaults,
      ...profileData,
      notifications: { ...defaults.notifications, ...(profileData.notifications || {}) },
      aiPreferences: { ...defaults.aiPreferences, ...(profileData.aiPreferences || {}) },
      // Identity fields from auth
      name: user?.name || profileData.name || defaults.name,
      email: user?.email || profileData.email || defaults.email
    };
  });

  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('budgetMitra_avatar') || null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Financial Form States
  const [financials, setFinancials] = useState({
    income: budgetState?.income || 0
  });

  // --- Sync local state to budgetState on change ---
  const saveProfile = useCallback(() => {
    onUpdateBudget({
      ...budgetState,
      income: parseFloat(financials.income) || 0,
      profile_data: profile
    });
    showToast('Profile saved!');
  }, [profile, financials, budgetState, onUpdateBudget]);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const showAlert = (title, message, type = 'info') => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const toggleNotification = (field) => {
    setProfile(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: !prev.notifications[field] }
    }));
  };

  const removeCategory = (cat) => {
    setProfile(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== cat)
    }));
  };

  const addCategory = () => {
    if (!newCategory.trim() || profile.categories.includes(newCategory)) return;
    setProfile(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    setNewCategory('');
  };

  // --- Password Form State ---
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '', error: '' });
  const [passLoading, setPassLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setPassForm(prev => ({ ...prev, error: '' }));
    if (!passForm.new || passForm.new.length < 6) return setPassForm(prev => ({ ...prev, error: 'Password must be at least 6 characters' }));
    if (passForm.new !== passForm.confirm) return setPassForm(prev => ({ ...prev, error: 'Passwords do not match' }));
    
    setPassLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passForm.current,
    });
    
    if (signInError) {
      setPassLoading(false);
      return setPassForm(prev => ({ ...prev, error: 'Incorrect current password. Please try again.' }));
    }
    
    const { error: updateError } = await supabase.auth.updateUser({ password: passForm.new });
    setPassLoading(false);
    
    if (updateError) setPassForm(prev => ({ ...prev, error: updateError.message }));
    else {
      showToast('Password updated!');
      setIsPassModalOpen(false);
      setPassForm({ current: '', new: '', confirm: '', error: '' });
    }
  };

  const chatHistory = JSON.parse(localStorage.getItem('budgetMitra_chat_history') || '[]');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA' }}>
      <Sidebar user={user} onLogout={onLogout} balance={budgetState?.available_balance || 0} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'white', padding: '3px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '20px', background: '#E6F8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem', fontWeight: 800, color: '#12C29B' }}>{profile.name[0]}</span>}
                </div>
              </div>
              <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '28px', height: '28px', borderRadius: '8px', background: '#1A237E', color: 'white', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <Camera size={12} /><input type="file" style={{ display: 'none' }} onChange={(e) => {
                  const f = e.target.files[0];
                  if(f) {
                    const r = new FileReader();
                    r.onload = (ev) => { setAvatarUrl(ev.target.result); localStorage.setItem('budgetMitra_avatar', ev.target.result); showToast('Avatar updated!'); };
                    r.readAsDataURL(f);
                  }
                }} />
              </label>
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Profile Settings</h1>
              <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '4px 0 0' }}>Manage your profile and financial preferences</p>
            </div>
          </div>
          <button onClick={saveProfile} style={{ background: '#12C29B', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(18, 194, 155, 0.2)' }}>Save Changes</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          {/* Left Column: Personal & Financial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* General Info */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <User size={20} color="#1A237E" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Personal Details</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Full Name</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Phone Number</label>
                  <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem' }} />
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Bio / Financial Motto</label>
                  <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', height: '80px', resize: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
            </section>

            {/* Financial Settings */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Wallet size={20} color="#12C29B" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Financial Profile</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Monthly Income</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontWeight: 700 }}>₹</span>
                    <input type="number" value={financials.income} onChange={e => setFinancials({...financials, income: e.target.value})} style={{ width: '100%', padding: '12px 12px 12px 28px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '1.1rem', fontWeight: 700 }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Category Management */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Target size={20} color="#FF7043" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Expense Categories</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                {profile.categories.map((cat, i) => (
                  <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
                    {cat} <X size={14} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => removeCategory(cat)} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Add custom category..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }} />
                <button onClick={addCategory} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#F1F5F9', color: '#1A237E', fontWeight: 700, cursor: 'pointer' }}>Add Tag</button>
              </div>
            </section>
          </div>

          {/* Right Column: AI & Security */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Saathi AI */}
            <section style={{ background: '#0D1B3E', borderRadius: '24px', padding: '32px', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Bot size={24} color="#12C29B" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Saathi Preferences</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Focus Area</label>
                  <select value={profile.aiPreferences.focus} onChange={e => setProfile({...profile, aiPreferences: {...profile.aiPreferences, focus: e.target.value}})} style={{ width: '100%', marginTop: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}>
                    <option style={{color: 'black'}}>Wealth Growth</option>
                    <option style={{color: 'black'}}>Debt Reduction</option>
                    <option style={{color: 'black'}}>Budget Discipline</option>
                  </select>
                </div>
                <div onClick={() => setIsMemoryModalOpen(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><Brain size={18} color="#12C29B" /><span style={{ fontSize: '0.9rem' }}>Recent AI Memories</span></div>
                  <ChevronRight size={16} />
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '24px' }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[{id:'email', label:'Email Alerts', icon:Mail}, {id:'push', label:'Push Notifications', icon:Bell}].map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={16} color="#64748B" /></div><span style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>{item.label}</span></div>
                    <div onClick={() => toggleNotification(item.id)} style={{ width: 36, height: 18, borderRadius: 10, background: profile.notifications[item.id] ? '#12C29B' : '#E2E8F0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                      <div style={{ width: 14, height: 14, background: 'white', borderRadius: '50%', position: 'absolute', left: profile.notifications[item.id] ? 20 : 2, top: 2, transition: '0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security Quick Link */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}><div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={16} color="#1A237E" /></div><span style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>Password & Security</span></div>
                <button onClick={() => { setPassForm({ current: '', new: '', confirm: '' }); setIsPassModalOpen(true); }} style={{ color: '#1A237E', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Update</button>
              </div>
            </section>

            <button onClick={onLogout} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#FEE2E2', color: '#EF4444', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}><LogOut size={18} /> Sign Out</button>
          </div>
        </div>
      </div>

      {/* Modernized Update Password Modal */}
      <CustomModal 
        isOpen={isPassModalOpen} 
        onClose={() => setIsPassModalOpen(false)} 
        title="Security Settings" 
        icon={Shield}
        footer={
          <button 
            onClick={handleUpdatePassword} 
            disabled={passLoading} 
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #1A237E 0%, #0D1B3E 100%)', 
              color: 'white', 
              fontWeight: 800, 
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer', 
              boxShadow: '0 10px 20px rgba(26, 35, 126, 0.2)',
              opacity: passLoading ? 0.7 : 1,
              transition: 'all 0.3s'
            }}
          >
            {passLoading ? 'Verifying...' : 'Update Password'}
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Honeypot fields to trick aggressive browser autofill */}
          <input type="text" name="email" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <input type="password" name="password" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />

          <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '10px' }}>
            <Info size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400E', lineHeight: 1.5 }}>For security, please enter your current password before choosing a new one.</p>
          </div>

          {passForm.error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '10px', animation: 'shake 0.4s ease-in-out' }}>
              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-5px); }
                  75% { transform: translateX(5px); }
                }
              `}</style>
              <X size={18} color="#EF4444" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#B91C1C', fontWeight: 600 }}>{passForm.error}</p>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Current Password" 
                autoComplete="new-password"
                readOnly
                onFocus={(e) => e.target.readOnly = false}
                value={passForm.current} 
                onChange={e => setPassForm({...passForm, current: e.target.value})} 
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '2px solid #F1F5F9', outline: 'none', background: '#F8FAFC', fontSize: '0.95rem' }} 
              />
            </div>

            <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

            <div style={{ position: 'relative' }}>
              <Key size={16} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="New Secure Password" 
                autoComplete="new-password"
                readOnly
                onFocus={(e) => e.target.readOnly = false}
                value={passForm.new} 
                onChange={e => setPassForm({...passForm, new: e.target.value})} 
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '2px solid #F1F5F9', outline: 'none', background: '#F8FAFC', fontSize: '0.95rem' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <CheckCircle2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                autoComplete="new-password"
                readOnly
                onFocus={(e) => e.target.readOnly = false}
                value={passForm.confirm} 
                onChange={e => setPassForm({...passForm, confirm: e.target.value})} 
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '14px', border: '2px solid #F1F5F9', outline: 'none', background: '#F8FAFC', fontSize: '0.95rem' }} 
              />
            </div>
          </div>
        </div>
      </CustomModal>

      <CustomModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} title="Saathi Memory" icon={Brain}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chatHistory.length ? chatHistory.slice(-10).map((m, i) => <div key={i} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', fontSize: '0.85rem', color: '#475569' }}>{m.content || m.text}</div>) : <p style={{ textAlign: 'center', color: '#94A3B8' }}>No memories yet.</p>}
        </div>
      </CustomModal>

      {/* Toast Alert */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: '#1A237E', color: 'white', padding: '13px 22px', borderRadius: '12px', fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', opacity: toast.visible ? 1 : 0, transform: toast.visible ? 'translateY(0)' : 'translateY(16px)', transition: '0.3s', pointerEvents: 'none' }}><CheckCircle2 size={18} color="#12C29B" /> {toast.message}</div>
    </div>
  );
}

export default ProfilePage;

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  PieChart as PieIcon, Wallet, Landmark, TrendingUp, ArrowUpRight, 
  Plus, Search, Filter, Calendar, CheckCircle2, Info, ChevronRight, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

function PortfolioPage({ user, onLogout, budgetState, onUpdateBudget }) {
  const balance = budgetState?.available_balance || 0;
  const [localInvestments, setLocalInvestments] = useState(budgetState?.investments || 0);
  const [localFD, setLocalFD] = useState(budgetState?.fd || 0);
  const [localSavings, setLocalSavings] = useState(budgetState?.savings || 0);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Sync local state if budgetState updates externally
  useEffect(() => {
    setLocalInvestments(budgetState?.investments || 0);
    setLocalFD(budgetState?.fd || 0);
    setLocalSavings(budgetState?.savings || 0);
  }, [budgetState]);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const handleSave = () => {
    const newSavings = parseFloat(localSavings) || 0;
    const diff = newSavings - (budgetState?.savings || 0);
    
    let updatedLog = budgetState?.profile_data?.savings_log || [];
    if (diff !== 0) {
      const newLogEntry = {
        id: Date.now(),
        amount: Math.abs(diff),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        description: diff > 0 ? 'Manual Increase' : 'Manual Adjustment'
      };
      updatedLog = [newLogEntry, ...updatedLog];
    }

    const investmentsVal = parseFloat(localInvestments) || 0;
    const fdVal = parseFloat(localFD) || 0;

    onUpdateBudget({
      ...budgetState,
      investments: investmentsVal,
      fd: fdVal,
      savings: newSavings,
      profile_data: {
        ...(budgetState.profile_data || {}),
        investments: investmentsVal,
        fd: fdVal,
        savings: newSavings,
        savings_log: updatedLog,
        loans: budgetState.loans || [] // Explicitly preserve loans
      }
    });
    showToast('Portfolio updated successfully! ✨');
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    border: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar user={user} onLogout={onLogout} balance={balance} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#1E1B4B' }}>Wealth Portfolio</h1>
            <p style={{ color: '#64748B', marginTop: '4px', fontSize: '1rem' }}>Manage your long-term assets and growth.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: '#E6F8F3', color: '#12C29B', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} /> Portfolio Up 12.4%
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Savings</span>
              <Wallet size={20} color="#12C29B" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>₹ {localSavings.toLocaleString()}</h2>
            <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: '#12C29B' }}></div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Investments</span>
              <PieIcon size={20} color="#4F46E5" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>₹ {localInvestments.toLocaleString()}</h2>
            <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: '65%', height: '100%', background: '#4F46E5' }}></div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Fixed Deposits</span>
              <Landmark size={20} color="#D97706" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>₹ {localFD.toLocaleString()}</h2>
            <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ width: '30%', height: '100%', background: '#D97706' }}></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          {/* Manage Portfolio Inputs */}
          <section style={{ ...cardStyle, padding: '40px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={24} color="#12C29B" /> Update Portfolio Values
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '-10px 0 10px' }}>Keep your asset values updated for accurate financial health tracking.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Total Savings</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94A3B8' }}>₹</span>
                  <input 
                    type="number" 
                    value={localSavings} 
                    onChange={(e) => setLocalSavings(e.target.value)}
                    style={{ width: '100%', padding: '14px 14px 14px 36px', borderRadius: '14px', border: '2px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Mutual Funds & Stocks</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94A3B8' }}>₹</span>
                  <input 
                    type="number" 
                    value={localInvestments} 
                    onChange={(e) => setLocalInvestments(e.target.value)}
                    style={{ width: '100%', padding: '14px 14px 14px 36px', borderRadius: '14px', border: '2px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Fixed Deposits (FD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94A3B8' }}>₹</span>
                  <input 
                    type="number" 
                    value={localFD} 
                    onChange={(e) => setLocalFD(e.target.value)}
                    style={{ width: '100%', padding: '14px 14px 14px 36px', borderRadius: '14px', border: '2px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B' }}
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                style={{ marginTop: '10px', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #12C29B 0%, #00695C 100%)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(18,194,155,0.2)' }}
              >
                Save Portfolio Settings
              </button>
            </div>
          </section>

          {/* Allocation Breakdown & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section style={cardStyle}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Asset Allocation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Equity (Stocks/MF)', value: localInvestments, color: '#4F46E5' },
                  { label: 'Debt (FD/Bonds)', value: localFD, color: '#D97706' },
                  { label: 'Savings', value: localSavings, color: '#12C29B' }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontWeight: 700 }}>₹ {parseFloat(item.value || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '10px' }}>
                      <div style={{ width: `${Math.min(100, (item.value / (parseFloat(localInvestments) + parseFloat(localFD) + parseFloat(localSavings) || 1)) * 100)}%`, height: '100%', background: item.color, borderRadius: '10px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...cardStyle, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Savings Activity</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#12C29B', background: '#E6F8F3', padding: '4px 8px', borderRadius: '6px' }}>HISTORY</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                {budgetState?.profile_data?.savings_log?.length > 0 ? (
                  budgetState.profile_data.savings_log.map((log) => {
                    const isIncrease = log.description.toLowerCase().includes('add') || log.description.toLowerCase().includes('increase');
                    return (
                      <div key={log.id} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F5F9' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{log.description}</p>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: '#94A3B8' }}>{log.date}</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isIncrease ? '#12C29B' : '#D97706' }}>
                          {isIncrease ? '+' : '±'}₹{log.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>No recent savings activity.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div style={{ 
        position: 'fixed', bottom: 40, right: 40, zIndex: 10000, 
        background: '#1E1B4B', color: 'white', padding: '16px 24px', 
        borderRadius: '16px', fontWeight: 700, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
        display: 'flex', alignItems: 'center', gap: '12px', 
        opacity: toast.visible ? 1 : 0, transform: toast.visible ? 'translateY(0)' : 'translateY(20px)', 
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', pointerEvents: 'none' 
      }}>
        <div style={{ width: 32, height: 32, background: '#12C29B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={18} color="white" />
        </div>
        {toast.message}
      </div>
    </div>
  );
}

export default PortfolioPage;

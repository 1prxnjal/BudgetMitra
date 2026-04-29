import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Plus, Info, Bell, Trash2, TrendingUp, PieChart as PieIcon, BarChart3, ArrowRight, Landmark, Clock
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Reusable Premium Confirm Modal ---
function CustomConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'modalSlide 0.3s ease-out', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <style>{`
          @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div style={{ width: '64px', height: '64px', background: '#FEE2E2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trash2 size={28} color="#EF4444" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function FinancialOverview({ user, onLogout, budgetState, onUpdateBudget }) {
  const transactions = budgetState?.transactions || [];
  const balance = budgetState?.available_balance || 0;
  const income = budgetState?.income || 0;

  // Loan Data from centralized state
  const loans = budgetState?.loans || [];

  // Calculate loan stats
  const totalLoanPrincipal = loans.reduce((acc, l) => acc + (l.principal || 0), 0);
  const totalEMI = loans.reduce((acc, l) => acc + (l.emi || 0), 0);
  const totalPaidMonths = loans.reduce((acc, l) => acc + (l.paidMonths || 0), 0);
  const totalTenureMonths = loans.reduce((acc, l) => acc + (l.tenure || 0) * 12, 0);
  const totalProgress = totalTenureMonths > 0 ? (totalPaidMonths / totalTenureMonths) * 100 : 0;

  // Filter loans for upcoming EMIs (within 7 days)
  const today = new Date();
  const currentDay = today.getDate();
  const upcomingLoans = loans.filter(l => {
    const due = l.dueDate || 5;
    return due >= currentDay && due <= currentDay + 7;
  });

  // Confirmation modal state
  const [deleteIdx, setDeleteIdx] = useState(null);

  // Read saved avatar from localStorage
  const [avatarUrl, setAvatarUrl] = React.useState(() => localStorage.getItem('budgetMitra_avatar') || null);
  React.useEffect(() => {
    const onStorage = () => setAvatarUrl(localStorage.getItem('budgetMitra_avatar') || null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [txMerchant, setTxMerchant] = useState('');
  const [txCategory, setTxCategory] = useState('Shopping');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const confirmDelete = () => {
    if (deleteIdx === null) return;
    const txToDelete = transactions[deleteIdx];
    const newTxList = transactions.filter((_, i) => i !== deleteIdx);
    onUpdateBudget({
      ...budgetState,
      available_balance: balance - txToDelete.amount,
      transactions: newTxList
    });
    setDeleteIdx(null);
  };

  const expensesByCategory = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

  const barData = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      label: 'Expenses (₹)',
      data: Object.values(expensesByCategory),
      backgroundColor: '#12C29B',
      borderRadius: 8
    }]
  };

  const pieData = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      data: Object.values(expensesByCategory),
      backgroundColor: ['#1A237E', '#12C29B', '#FF7043', '#FFCA28', '#26A69A', '#7E57C2'],
      borderWidth: 0
    }]
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA' }}>
      <Sidebar user={user} onLogout={onLogout} balance={balance} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          {/* Top-left: greeting with avatar */}
          <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'opacity 0.2s' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #12C29B', flexShrink: 0, background: '#E6F8F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? (
                <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : user?.picture ? (
                <img src={user.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
              ) : (
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#12C29B' }}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Financial Overview</h1>
              <p style={{ color: '#6B7280', marginTop: '2px', fontSize: '0.85rem' }}>Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</p>
            </div>
          </Link>
          <Link to="/transactions" style={{ background: '#12C29B', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(18,194,155,0.2)' }}>
            Add Daily Expense <ArrowRight size={18} />
          </Link>
        </header>

        {/* Financial Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 8px' }}>TOTAL SAVINGS</p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>₹ {(budgetState?.savings || 0).toLocaleString()}</h2>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#12C29B', fontSize: '0.8rem', fontWeight: 700 }}>
              <TrendingUp size={14} /> <span>Stable Path</span>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 8px' }}>INVESTMENTS</p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4F46E5', margin: 0 }}>₹ {(budgetState?.investments || 0).toLocaleString()}</h2>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#4F46E5', fontSize: '0.8rem', fontWeight: 700 }}>
              <PieIcon size={14} /> <span>Portfolio Value</span>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
            <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 8px' }}>FIXED DEPOSITS</p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', margin: 0 }}>₹ {(budgetState?.fd || 0).toLocaleString()}</h2>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '0.8rem', fontWeight: 700 }}>
              <Landmark size={14} /> <span>Secure Savings</span>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><Landmark size={80} /></div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 8px' }}>LOAN PORTFOLIO</p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1A237E', margin: 0 }}>₹ {totalLoanPrincipal.toLocaleString()}</h2>
            <div style={{ marginTop: '12px', width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px' }}>
              <div style={{ width: `${totalProgress}%`, height: '100%', background: '#1A237E', borderRadius: '3px' }}></div>
            </div>
          </div>
        </div>
        
        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}><BarChart3 size={20} /> Spending by Category</h3>
            <div style={{ height: '250px' }}>
              <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}><PieIcon size={20} /> Expense Distribution</h3>
            <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Activities & Loan Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          {/* Recent Activity */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Activity</h2>
              <Link to="/transactions" style={{ color: '#12C29B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>View All</Link>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #EEE', color: '#A0A0C0', fontSize: '0.8rem' }}>
                  <th style={{ padding: '15px 0' }}>Merchant</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #FAFAFA' }}>
                    <td style={{ padding: '15px 0', fontWeight: 600 }}>{tx.merchant}</td>
                    <td><span style={{ fontSize: '0.75rem', background: '#F3F4F6', padding: '4px 10px', borderRadius: '12px' }}>{tx.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.amount > 0 ? '#12C29B' : '#1E1E1E' }}>
                      {tx.amount > 0 ? '+ ' : '- '}₹ {Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => setDeleteIdx(idx)} style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', opacity: 0.5 }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loan Insights & Upcoming EMIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: '#0D1B3E', color: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={18} color="#12C29B" /> Upcoming EMIs</h3>
                <Link to="/loan-manager" style={{ color: '#12C29B', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>Manager</Link>
              </div>
              
              {upcomingLoans.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {upcomingLoans.map(loan => (
                    <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{loan.type}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Due: {loan.dueDate}th</p>
                      </div>
                      <span style={{ fontWeight: 800, color: '#12C29B' }}>₹ {loan.emi.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Landmark size={32} style={{ opacity: 0.1, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>No EMIs due in the next 7 days.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CustomConfirmModal 
        isOpen={deleteIdx !== null} 
        onClose={() => setDeleteIdx(null)} 
        onConfirm={confirmDelete}
        title="Delete Transaction?"
        message="This will remove the transaction and update your balance. This action cannot be undone."
      />
    </div>
  );
}

export default FinancialOverview;

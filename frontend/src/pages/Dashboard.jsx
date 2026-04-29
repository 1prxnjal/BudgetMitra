import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  Search, Bell, Settings, Globe, ShieldCheck, Star,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  TrendingUp, Landmark, PieChart, Wallet, CreditCard,
  ExternalLink, Calendar, ShoppingBag, Utensils, Zap, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard({ user, onLogout, budgetState, onUpdateBudget }) {
  const transactions = budgetState?.transactions || [];
  const balance = budgetState?.available_balance || 0;
  const income = budgetState?.income || 0;
  const profile = budgetState?.profile_data || {};

  // 1. Financial Health Score Calculation (Simplified Logic)
  // Base score 70. Add for income, subtract for high expenses.
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = transactions
    .filter(t => t.amount < 0 && t.date.startsWith(monthKey))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const expenseRatio = income > 0 ? (monthlyExpenses / income) : 0;
  let healthScore = 80;
  if (expenseRatio > 0.7) healthScore -= 15;
  else if (expenseRatio < 0.3) healthScore += 10;
  if (balance > income) healthScore += 5;
  healthScore = Math.min(Math.max(healthScore, 0), 100);

  // 2. Category Insights
  const expensesByCategory = transactions
    .filter(t => t.amount < 0 && t.date.startsWith(monthKey))
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

  const topCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0] || ["Dining Out", 0];

  // 3. Savings Rate & Utilization
  const savingsRate = income > 0 ? Math.round(((income - monthlyExpenses) / income) * 100) : 0;
  const budgetUtilization = income > 0 ? Math.round((monthlyExpenses / (income * 0.8)) * 100) : 0; // Assuming 80% as budget limit

  // 4. Portfolio Values from budgetState
  const investmentsVal = budgetState?.investments || 0;
  const fdVal = budgetState?.fd || 0;
  const savingsVal = budgetState?.savings || 0;

  // 5. Next Bill Calculation from Loans
  const [nextBill, setNextBill] = useState(null);
  useEffect(() => {
    const savedLoans = budgetState?.loans || [];
    if (savedLoans.length > 0) {
      const today = new Date();
      const currentDay = today.getDate();

      const upcoming = savedLoans.map(loan => {
        let daysUntil = loan.dueDate - currentDay;
        if (daysUntil < 0) {
          // Calculate days until same day next month
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, loan.dueDate);
          daysUntil = Math.ceil((nextMonth - today) / (1000 * 60 * 60 * 24));
        }
        return { ...loan, daysUntil };
      }).sort((a, b) => a.daysUntil - b.daysUntil)[0];

      setNextBill(upcoming);
    } else {
      setNextBill(null);
    }
  }, [budgetState?.loans]);

  // 6. Search Logic
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const filteredTransactions = transactions.filter(tx =>
    tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Read saved avatar
  const [avatarUrl, setAvatarUrl] = React.useState(() => localStorage.getItem('budgetMitra_avatar') || null);
  React.useEffect(() => {
    const onStorage = () => setAvatarUrl(localStorage.getItem('budgetMitra_avatar') || null);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getHealthStatus = (score) => {
    if (score >= 90) return { label: 'Elite', color: '#12C29B', bg: 'rgba(18,194,155,0.1)' };
    if (score >= 70) return { label: 'Healthy', color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' };
    if (score >= 60) return { label: 'Standard', color: '#D97706', bg: 'rgba(217,119,6,0.1)' };
    return { label: 'At Risk', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
  };
  const status = getHealthStatus(healthScore);

  // Shared Styles
  const cardStyle = {
    background: 'white',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    border: '1px solid #F1F5F9'
  };

  const labelStyle = { color: '#64748B', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar user={user} onLogout={onLogout} balance={balance} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR / RIBBON (Adjusted Size) */}
        <div style={{ height: '100px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ position: 'relative', width: '450px' }}>
            <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              style={{ width: '100%', padding: '12px 16px 12px 52px', borderRadius: '12px', border: '1px solid #FB923C', background: '#FFF7ED', outline: 'none', fontSize: '0.95rem', fontWeight: 500, transition: 'all 0.2s' }}
              onFocus={(e) => {
                if (searchQuery.length > 0) setShowSearchResults(true);
                e.target.style.borderColor = '#EA580C';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#FB923C';
                e.target.style.background = '#FFF7ED';
                e.target.style.boxShadow = 'none';
              }}
            />

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9', overflow: 'hidden', zIndex: 1000 }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>{filteredTransactions.length} RESULTS FOUND</span>
                  <button onClick={() => setShowSearchResults(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={14} /></button>
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                    <div key={idx} style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FAFAFA', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={16} color="#64748B" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{tx.merchant}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>{tx.date}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: tx.amount > 0 ? '#12C29B' : '#1E293B' }}>
                        {tx.amount > 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  )) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>No results found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/profile" style={{ color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1A237E'; }}>
              <Settings size={22} />
            </Link>

            <div style={{ width: '1px', height: '32px', background: '#E2E8F0', margin: '0 8px' }}></div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{user?.name || 'User'}</p>
            </div>
            <Link to="/profile" style={{ width: 48, height: 48, borderRadius: '14px', overflow: 'hidden', border: '2px solid #F1F5F9', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <img src={avatarUrl || user?.picture || 'https://via.placeholder.com/48'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* TOP GRID: PROFILE + 3 KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>

            {/* PROFILE CARD */}
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #312E81 0%, #1E1B4B 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 20, right: 20, background: status.bg, color: status.color, padding: '6px 16px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${status.color}` }}>
                {status.label} Status
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', marginTop: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${status.color}`, padding: '4px' }}>
                    <img src={avatarUrl || user?.picture} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 5, right: 5, width: 14, height: 14, background: status.color, borderRadius: '50%', border: '2px solid #1E1B4B' }}></div>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Namaste, {user?.name?.split(' ')[0]}</h2>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '4px 0' }}>Active since {user?.joined || 2024}</p>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Financial Health Score</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{healthScore} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>/ 100</span></span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ width: `${healthScore}%`, height: '100%', background: status.color, borderRadius: '100px' }}></div>
                </div>
                <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', marginTop: '10px', letterSpacing: '1px' }}>{status.label} Financial Standing</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                <Link to="/profile" style={{ flex: 1, padding: '14px', background: 'white', color: '#1E1B4B', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Go to Profile Settings</Link>
              </div>
            </div>

            {/* KPI ROW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {/* SAVINGS */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <p style={labelStyle}>Savings</p>
                  <div style={{ width: 40, height: 40, background: '#ECFDF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <Landmark size={20} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>₹ {savingsVal.toLocaleString()}</h3>
              </div>

              {/* INVESTMENTS */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <p style={labelStyle}>Investments</p>
                  <div style={{ width: 40, height: 40, background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <PieChart size={20} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>₹ {investmentsVal.toLocaleString()}</h3>
              </div>

              {/* FIXED DEPOSITS */}
              <div style={{ ...cardStyle, border: '2px solid #FDBA74' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <p style={labelStyle}>Fixed Deposits</p>
                  <div style={{ width: 40, height: 40, background: '#FFF7ED', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>₹ {fdVal.toLocaleString()}</h3>
              </div>

              {/* MONTHLY SUMMARY PROGRESS CARD (Spans bottom KPI row) */}
              <div style={{ ...cardStyle, gridColumn: 'span 3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Monthly Summary</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Performance</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, background: '#12C29B', borderRadius: '50%' }}></div> Income
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, background: '#1E1B4B', borderRadius: '50%' }}></div> Expenses
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Monthly Cash Flow</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>₹ {income.toLocaleString()} <span style={{ opacity: 0.3, fontWeight: 400 }}>/</span> ₹ {monthlyExpenses.toLocaleString()}</p>
                </div>
                <div style={{ width: '100%', height: '32px', background: '#F1F5F9', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(10, income / (income + monthlyExpenses) * 100)}%`, height: '100%', background: '#12C29B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>INCOME</div>
                  <div style={{ width: `${Math.max(10, monthlyExpenses / (income + monthlyExpenses) * 100)}%`, height: '100%', background: '#1E1B4B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>EXPENSE</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '32px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>SAVINGS RATE <span style={{ color: '#12C29B' }}>{savingsRate}%</span></span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Goal: 40%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '100px' }}>
                      <div style={{ width: `${savingsRate}%`, height: '100%', background: '#12C29B', borderRadius: '100px' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>BUDGET UTILIZATION <span style={{ color: budgetUtilization > 90 ? '#EF4444' : '#12C29B' }}>{budgetUtilization}%</span></span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>of ₹ {(income * 0.8).toLocaleString()} Limit</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '100px' }}>
                      <div style={{ width: `${Math.min(budgetUtilization, 100)}%`, height: '100%', background: budgetUtilization > 90 ? '#EF4444' : '#D97706', borderRadius: '100px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECOND ROW: QUICK STATS (CATEGORY/BILL) + TRANSACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* TOP CATEGORY */}
              <div style={cardStyle}>
                <div style={{ width: 32, height: 32, background: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', marginBottom: '12px' }}>
                  <ShoppingBag size={18} />
                </div>
                <p style={{ ...labelStyle, fontSize: '0.65rem' }}>Top Category</p>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0' }}>{topCategory[0]}</h4>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444' }}>₹ {topCategory[1].toLocaleString()}</p>
              </div>

              {/* NEXT BILL */}
              <div style={cardStyle}>
                <div style={{ width: 32, height: 32, background: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', marginBottom: '12px' }}>
                  <Calendar size={18} />
                </div>
                <p style={{ ...labelStyle, fontSize: '0.65rem' }}>Next Bill Due</p>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '4px 0' }}>
                  {nextBill ? `${nextBill.lender} ${nextBill.type.split(' ')[0]}` : 'No Pending Bills'}
                </h4>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: nextBill?.daysUntil < 5 ? '#EF4444' : '#D97706' }}>
                  {nextBill ? (nextBill.daysUntil === 0 ? 'Due Today' : `Due in ${nextBill.daysUntil} days`) : 'All clear!'}
                </p>
                {nextBill && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>₹ {nextBill.emi.toLocaleString()}</p>}
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Transactions</h3>
                <Link to="/transactions" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#312E81', textDecoration: 'none' }}>View All</Link>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '12px 0' }}>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 4).map((tx, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: 40, height: 40, background: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                            {tx.category === 'Food' ? <Utensils size={18} /> : tx.category === 'Income' ? <Wallet size={18} /> : <ShoppingBag size={18} />}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{tx.merchant}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>{tx.id ? `Order #${tx.id.slice(0, 6)}` : 'Verified Transaction'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', background: '#F1F5F9', borderRadius: '6px', textTransform: 'uppercase' }}>{tx.category}</span>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: '#64748B' }}>{tx.date}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: tx.amount > 0 ? '#12C29B' : '#1E293B' }}>
                        {tx.amount > 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#12C29B', textTransform: 'uppercase' }}>Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>



        </div>
      </div>
    </div>
  );
}

export default Dashboard;

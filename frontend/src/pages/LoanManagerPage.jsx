import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Briefcase, Download, Plus, Landmark, Car, User, 
  ArrowRight, Calculator, Clock, CheckCircle2, AlertCircle, Trash2, X, Bot, Calendar, ChevronRight, Info
} from 'lucide-react';

// --- Premium Custom Modal Component ---
function CustomConfirmModal({ isOpen, onClose, onConfirm, title, message, icon: Icon, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
  if (!isOpen) return null;
  const isDanger = type === "danger";
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
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
          background: isDanger ? '#FEE2E2' : '#F0FDFA', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <Icon size={32} color={isDanger ? '#EF4444' : '#0D9488'} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '12px', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '32px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{cancelText}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: isDanger ? '#EF4444' : '#0D9488', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(13, 148, 136, 0.2)' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function LoanManagerPage({ user, onLogout, budgetState, onUpdateBudget }) {
  // --- Loan Data State ---
  const loans = budgetState?.loans || [];
  const setLoans = (updatedLoans) => {
    onUpdateBudget({
      ...budgetState,
      loans: updatedLoans,
      profile_data: { ...budgetState.profile_data, loans: updatedLoans }
    });
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, loanId: null });
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', title: '' });

  const [newLoan, setNewLoan] = useState({
    type: 'Home Loan',
    lender: '',
    principal: '',
    emi: '',
    tenure: '',
    paidMonths: 0,
    dueDate: 5
  });



  // --- EMI Calculator State ---
  const [calcAmount, setCalcAmount] = useState(1000000);
  const [calcRate, setCalcRate] = useState(8.5);
  const [calcTenure, setCalcTenure] = useState(5);
  const [calcEmi, setCalcEmi] = useState(0);
  const [calcInterest, setCalcInterest] = useState(0);

  useEffect(() => {
    const p = calcAmount;
    const r = calcRate / 12 / 100;
    const n = calcTenure * 12;
    if (r === 0) {
      setCalcEmi(p / n);
      setCalcInterest(0);
    } else {
      const emiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setCalcEmi(emiVal);
      setCalcInterest((emiVal * n) - p);
    }
  }, [calcAmount, calcRate, calcTenure]);

  // --- Derived Data ---
  const upcomingBills = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return loans.map(loan => {
      let nextDueYear = currentYear;
      let nextDueMonth = currentMonth;
      
      // If the due day has passed this month, move to next month
      if (currentDay > loan.dueDate) {
        nextDueMonth++;
        if (nextDueMonth > 11) {
          nextDueMonth = 0;
          nextDueYear++;
        }
      }
      
      const nextDue = new Date(nextDueYear, nextDueMonth, loan.dueDate);
      const isOverdue = currentDay > loan.dueDate && currentDay <= loan.dueDate + 5; // Recently passed
      
      return { ...loan, nextDue, isOverdue };
    }).sort((a, b) => a.nextDue - b.nextDue);
  }, [loans]);

  const totalOutstanding = loans.reduce((acc, curr) => acc + curr.principal, 0);
  const totalEmi = loans.reduce((acc, curr) => acc + curr.emi, 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleAddLoan = () => {
    if (!newLoan.lender || !newLoan.principal || !newLoan.emi) {
      setAlertInfo({ isOpen: true, title: 'Missing Info', message: 'Please provide all details to register your loan account.' });
      return;
    }
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    const loanToAdd = {
      ...newLoan,
      id: `${newLoan.type === 'Home Loan' ? 'HL' : 'AL'}-${id}`,
      principal: Number(newLoan.principal),
      emi: Number(newLoan.emi),
      tenure: Number(newLoan.tenure),
      dueDate: Number(newLoan.dueDate),
      rateType: 'Fixed Rate'
    };
    setLoans([...loans, loanToAdd]);
    setShowAddModal(false);
    setNewLoan({ type: 'Home Loan', lender: '', principal: '', emi: '', tenure: '', paidMonths: 0, dueDate: 5 });
  };

  const executeDelete = () => {
    setLoans(loans.filter(l => l.id !== confirmDelete.loanId));
    setConfirmDelete({ isOpen: false, loanId: null });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>
      <Sidebar user={user} onLogout={onLogout} balance={budgetState?.available_balance || 0} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Portfolio</h1>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '4px' }}>Centralized hub for tracking and managing your liabilities</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: '#0D9488', fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}
            >
              <Plus size={18} /> Apply New Loan
            </button>
          </div>
        </header>

        {/* Top Summary Card & Calculator */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', display: 'flex', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
            <div style={{ flex: 1, borderRight: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '16px', letterSpacing: '0.05em' }}>TOTAL OUTSTANDING</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>{formatCurrency(totalOutstanding)}</h2>
            </div>
            <div style={{ flex: 1, paddingLeft: '32px', borderRight: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '16px', letterSpacing: '0.05em' }}>EMI THIS MONTH</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0D9488', margin: 0 }}>{formatCurrency(totalEmi)}</h2>
            </div>
            <div style={{ flex: 1, paddingLeft: '32px' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '16px', letterSpacing: '0.05em' }}>ACTIVE ACCOUNTS</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B', margin: 0 }}>{loans.length}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Landmark size={14} color="#64748B" /></div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={14} color="#64748B" /></div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#64748B" /></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', marginBottom: '20px' }}>EMI Calculator</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '8px' }}>Loan Amount (₹)</label>
              <input type="number" value={calcAmount} onChange={e => setCalcAmount(Number(e.target.value))} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.9rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '8px' }}>Rate (%)</label>
                <input type="number" step="0.1" value={calcRate} onChange={e => setCalcRate(Number(e.target.value))} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '8px' }}>Tenure (Yrs)</label>
                <input type="number" value={calcTenure} onChange={e => setCalcTenure(Number(e.target.value))} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.9rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Monthly EMI</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{formatCurrency(calcEmi)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Total Interest</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{formatCurrency(calcInterest)}</span>
            </div>
          </div>
        </div>

        {/* Active Portfolio Table */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Active Portfolio</h3>
            <button style={{ background: 'none', border: 'none', color: '#0D9488', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>View History</button>
          </div>
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Details</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lender</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMI & Principal</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repayment Progress</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => {
                  const totalMonths = loan.tenure * 12;
                  const progress = Math.round((loan.paidMonths / totalMonths) * 100);
                  const isDueSoon = loan.dueDate - new Date().getDate() < 7 && loan.dueDate >= new Date().getDate();
                  
                  return (
                    <tr key={loan.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '8px', background: loan.type.includes('Home') ? '#CCFBF1' : '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {loan.type.includes('Home') ? <Landmark size={20} color="#0D9488" /> : <Car size={20} color="#4338CA" />}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{loan.type}</p>
                            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>#{loan.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', margin: 0 }}>{loan.lender}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Pay Day: {loan.dueDate}th</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0D9488', margin: 0 }}>{formatCurrency(loan.emi)}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>of {formatCurrency(loan.principal)}</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ width: '200px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                            <span>{progress}% paid</span>
                            <span>{loan.paidMonths}/{totalMonths} mos</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          textAlign: 'center',
                          background: isDueSoon ? '#FEF3C7' : '#DCFCE7',
                          color: isDueSoon ? '#D97706' : '#16A34A',
                          display: 'inline-block'
                        }}>
                          {isDueSoon ? 'DUE SOON' : 'ON TRACK'}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button onClick={() => setConfirmDelete({ isOpen: true, loanId: loan.id })} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          {/* Upcoming Schedule */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginBottom: '24px' }}>Upcoming Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {upcomingBills.map((bill, idx) => {
                const isOverdue = bill.isOverdue;
                const monthName = bill.nextDue.toLocaleString('default', { month: 'short' }).toUpperCase();
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '60px', height: '60px', 
                      borderRadius: '12px', 
                      borderLeft: `4px solid ${isOverdue ? '#EF4444' : '#0D9488'}`,
                      background: isOverdue ? '#FEF2F2' : '#F0FDFA',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: isOverdue ? '#B91C1C' : '#0D9488', margin: 0 }}>{monthName}</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 800, color: isOverdue ? '#B91C1C' : '#0D9488', margin: 0 }}>{String(bill.nextDue.getDate()).padStart(2, '0')}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{bill.lender} {bill.type} EMI</p>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>A/c ending in •••• {bill.id.split('-')[1]}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>{formatCurrency(bill.emi)}</p>
                      <span style={{ 
                        fontSize: '0.65rem', fontWeight: 800, 
                        color: isOverdue ? '#EF4444' : '#64748B',
                        padding: '2px 8px', borderRadius: '4px',
                        background: isOverdue ? '#FEE2E2' : '#F1F5F9'
                      }}>{isOverdue ? 'OVERDUE' : 'PENDING'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add Loan Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>New Loan Account</h2>
                <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} color="#64748B" /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>Loan Type</label>
                    <select value={newLoan.type} onChange={e => setNewLoan({...newLoan, type: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }}>
                      <option>Home Loan</option><option>Car Loan</option><option>Personal Loan</option><option>Education Loan</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>Lender Name</label>
                    <input type="text" placeholder="e.g. SBI" value={newLoan.lender} onChange={e => setNewLoan({...newLoan, lender: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>Principal Amount (₹)</label>
                    <input type="number" placeholder="5,00,000" value={newLoan.principal} onChange={e => setNewLoan({...newLoan, principal: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>Monthly EMI (₹)</label>
                    <input type="number" placeholder="12,500" value={newLoan.emi} onChange={e => setNewLoan({...newLoan, emi: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>EMI Pay Day (1-31)</label>
                    <input type="number" min="1" max="31" value={newLoan.dueDate} onChange={e => setNewLoan({...newLoan, dueDate: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '8px' }}>Tenure (Years)</label>
                    <input type="number" value={newLoan.tenure} onChange={e => setNewLoan({...newLoan, tenure: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', display: 'block' }}>EMIs Paid till now</label>
                  <input type="number" placeholder="0" value={newLoan.paidMonths} onChange={e => setNewLoan({...newLoan, paidMonths: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '0.9rem', outline: 'none' }} />
                </div>

                <button onClick={handleAddLoan} style={{ marginTop: '12px', padding: '16px', borderRadius: '12px', border: 'none', background: '#0D9488', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}>Create Loan Account</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modals */}
        <CustomConfirmModal 
          isOpen={confirmDelete.isOpen} 
          onClose={() => setConfirmDelete({ isOpen: false, loanId: null })}
          onConfirm={executeDelete}
          title="Remove Loan Account?"
          message="This action will remove the loan from your active portfolio. This cannot be undone."
          icon={Trash2}
          confirmText="Yes, Remove"
          type="danger"
        />

        <CustomConfirmModal 
          isOpen={alertInfo.isOpen} 
          onClose={() => setAlertInfo({ isOpen: false, message: '', title: '' })}
          onConfirm={() => setAlertInfo({ isOpen: false, message: '', title: '' })}
          title={alertInfo.title}
          message={alertInfo.message}
          icon={Info}
          confirmText="Got it"
          type="info"
        />
      </div>
    </div>
  );
}

export default LoanManagerPage;





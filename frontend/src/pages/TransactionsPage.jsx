import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, ChevronLeft, ChevronRight, Lightbulb, TrendingUp, X, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const CATEGORY_COLORS = {
  Food:       { bg: '#FEF3C7', text: '#D97706' },
  Shopping:   { bg: '#EDE9FE', text: '#7C3AED' },
  Travel:     { bg: '#DBEAFE', text: '#2563EB' },
  Utilities:  { bg: '#E0F2FE', text: '#0284C7' },
  Health:     { bg: '#FCE7F3', text: '#DB2777' },
  Rent:       { bg: '#FEE2E2', text: '#DC2626' },
  Education:  { bg: '#D1FAE5', text: '#059669' },
  Income:     { bg: '#D1FAE5', text: '#059669' },
  Other:      { bg: '#F3F4F6', text: '#6B7280' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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

function TransactionsPage({ user, onLogout, budgetState, onUpdateBudget }) {
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);

  // categories
  const categories = budgetState?.profile_data?.categories || ['Shopping', 'Food', 'Rent', 'Transport', 'Entertainment', 'Health', 'Bills'];
  const allCategories = [...new Set(['Income', ...categories])];

  // form fields
  const [txMerchant,  setTxMerchant]  = useState('');
  const [txCategory,  setTxCategory]  = useState(allCategories[1] || 'Food');
  const [txAmount,    setTxAmount]    = useState('');
  const [txDate,      setTxDate]      = useState(today.toISOString().split('T')[0]);
  const [txNote,      setTxNote]      = useState('');

  // Confirmation state
  const [deleteIdx, setDeleteIdx] = useState(null);

  const transactions = budgetState?.transactions || [];
  const balance      = budgetState?.available_balance || 0;

  // ── group transactions by date ──────────────────────────────
  const txByDate = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const dayTotals = (date) =>
    (txByDate[date] || []).reduce((s, t) => s + t.amount, 0);

  // ── calendar grid helpers ───────────────────────────────────
  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();
  const cells     = [...Array(firstDay).fill(null),
                     ...Array(daysInMon).fill(0).map((_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const dateStr = (d) =>
    `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); };

  // ── selected day transactions ───────────────────────────────
  const selectedTxs = txByDate[selectedDate] || [];
  const selectedTotal = selectedTxs.reduce((s, t) => s + t.amount, 0);

  // ── stats ───────────────────────────────────────────────────
  const monthKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const monthExpenses = transactions
    .filter(t => t.amount < 0 && t.date.startsWith(monthKey))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // ── add expense ─────────────────────────────────────────────
  const handleAdd = (e) => {
    e.preventDefault();
    if (!txMerchant || !txAmount) return;
    const amt = parseFloat(txAmount);
    const newTx = {
      merchant: txMerchant,
      category: txCategory,
      date: txDate,
      amount: txCategory === 'Income' ? Math.abs(amt) : -Math.abs(amt),
      note: txNote,
    };
    onUpdateBudget({
      ...budgetState,
      available_balance: balance + newTx.amount,
      transactions: [newTx, ...transactions],
    });
    setTxMerchant(''); setTxAmount(''); setTxNote('');
    setShowForm(false);
    setSelectedDate(txDate);
  };

  // ── delete ──────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (deleteIdx === null) return;
    const tx = transactions[deleteIdx];
    onUpdateBudget({
      ...budgetState,
      available_balance: balance - tx.amount,
      transactions: transactions.filter((_, i) => i !== deleteIdx),
    });
    setDeleteIdx(null);
  };



  // ── styles ──────────────────────────────────────────────────
  const card = { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' };
  const inp  = { padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl  = { fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '6px', display: 'block' };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA' }}>
      <Sidebar user={user} onLogout={onLogout} balance={balance} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* ── Header ── */}
        <header style={{ padding: '22px 36px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1A237E', margin: 0 }}>Expenses</h1>
            <p style={{ color: '#6B7280', margin: '4px 0 0', fontSize: '0.85rem' }}>Track spends day-by-day with calendar view</p>
          </div>
          <button
            onClick={() => { setTxDate(selectedDate); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#12C29B', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            <Plus size={18} /> Add Expense
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', padding: '28px 36px' }}>
          {/* ══ LEFT: Calendar + Day Detail ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Calendar Card */}
            <div style={card}>
              {/* Month nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={prevMonth} style={{ border: 'none', background: '#F3F4F6', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1A237E' }}>{MONTHS[calMonth]} {calYear}</h2>
                <button onClick={nextMonth} style={{ border: 'none', background: '#F3F4F6', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
              </div>

              {/* Day labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', padding: '6px 0' }}>{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const ds      = dateStr(day);
                  const hasTx   = txByDate[ds]?.length > 0;
                  const dayTotal = dayTotals(ds);
                  const isToday  = ds === today.toISOString().split('T')[0];
                  const isSel    = ds === selectedDate;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(ds)}
                      style={{
                        borderRadius: '10px', padding: '8px 4px', textAlign: 'center',
                        cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                        background: isSel ? '#1A237E' : isToday ? '#E6F8F3' : hasTx ? '#F0FDF4' : 'transparent',
                        border: isToday && !isSel ? '1px solid #12C29B' : '1px solid transparent',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: isSel || isToday ? 700 : 500, color: isSel ? 'white' : '#1F2937' }}>{day}</div>
                      {hasTx && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {(txByDate[ds] || []).slice(0, 3).map((_, di) => (
                              <div key={di} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : '#12C29B' }} />
                            ))}
                          </div>
                          <div style={{ fontSize: '0.6rem', marginTop: '2px', color: isSel ? 'rgba(255,255,255,0.85)' : dayTotal < 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                            {dayTotal < 0 ? '-' : '+'}₹{Math.abs(dayTotal) >= 1000 ? (Math.abs(dayTotal)/1000).toFixed(1)+'k' : Math.abs(dayTotal)}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                {[['#12C29B','Has expenses'], ['#1A237E','Selected'], ['#E6F8F3','Today']].map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#6B7280' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '3px', background: color }} />{label}
                  </div>
                ))}
              </div>
            </div>

            {/* Day Detail Panel */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1A237E' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                    {selectedTxs.length} transaction{selectedTxs.length !== 1 ? 's' : ''} &nbsp;•&nbsp;
                    <span style={{ color: selectedTotal < 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                      {selectedTotal < 0 ? '-' : '+'}₹{Math.abs(selectedTotal).toLocaleString()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => { setTxDate(selectedDate); setShowForm(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#E6F8F3', color: '#00695C', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  <Plus size={14} /> Add to this day
                </button>
              </div>

              {selectedTxs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
                  <Calendar size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No expenses on this day</p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>Click "Add to this day" to record one</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedTxs.map((tx) => {
                    const globalIdx = transactions.findIndex(t => t === tx);
                    const colors = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other;
                    return (
                      <div key={globalIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '8px', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                            {tx.category === 'Food' ? '🍽️' : tx.category === 'Travel' ? '✈️' : tx.category === 'Shopping' ? '🛍️' : tx.category === 'Health' ? '💊' : tx.category === 'Utilities' ? '💡' : tx.category === 'Income' ? '💰' : tx.category === 'Rent' ? '🏠' : '📌'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1F2937' }}>{tx.merchant}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                              <span style={{ fontSize: '0.7rem', background: colors.bg, color: colors.text, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{tx.category}</span>
                              {tx.note && <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{tx.note}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 700, color: tx.amount > 0 ? '#059669' : '#1F2937', fontSize: '0.95rem' }}>
                            {tx.amount > 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                          </span>
                          <button onClick={() => setDeleteIdx(globalIdx)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', opacity: 0.6 }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Stats + AI Tip + Recent ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Month Stats */}
            <div style={{ background: '#1A237E', color: 'white', padding: '24px', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>THIS MONTH</p>
              <h2 style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: 800 }}>₹{monthExpenses.toLocaleString()}</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{MONTHS[calMonth]} {calYear}</p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#12C29B', fontSize: '0.82rem' }}>
                <TrendingUp size={14} /> <span>Tracking {transactions.filter(t => t.date.startsWith(monthKey)).length} transactions</span>
              </div>
            </div>

            {/* Category Breakdown */}
            {(() => {
              const cats = {};
              transactions.filter(t => t.amount < 0 && t.date.startsWith(monthKey)).forEach(t => {
                cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
              });
              const entries = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0, 5);
              if (!entries.length) return null;
              return (
                <div style={card}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#1A237E' }}>Category Breakdown</h3>
                  {entries.map(([cat, amt]) => {
                    const pct = monthExpenses ? Math.round((amt / monthExpenses) * 100) : 0;
                    const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                    return (
                      <div key={cat} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{cat}</span>
                          <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>₹{amt.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors.text, borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}


          </div>
        </div>
      </div>

      {/* ══ Add Expense Modal ══ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '460px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1A237E', fontWeight: 700 }}>Add Expense</h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>DATE</label>
                <input style={inp} type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>MERCHANT / DESCRIPTION</label>
                <input style={inp} type="text" placeholder="e.g. Swiggy, BigBazaar" value={txMerchant} onChange={e => setTxMerchant(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={lbl}>CATEGORY</label>
                  <select style={inp} value={txCategory} onChange={e => setTxCategory(e.target.value)}>
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>AMOUNT (₹)</label>
                  <input style={inp} type="number" min="0" placeholder="0.00" value={txAmount} onChange={e => setTxAmount(e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={lbl}>NOTE (optional)</label>
                <input style={inp} type="text" placeholder="e.g. Monthly grocery run" value={txNote} onChange={e => setTxNote(e.target.value)} />
              </div>
              <button type="submit" style={{ padding: '13px', background: '#12C29B', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: '4px' }}>
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ Confirm Delete Modal ══ */}
      <CustomConfirmModal 
        isOpen={deleteIdx !== null} 
        onClose={() => setDeleteIdx(null)} 
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        message="This will remove the transaction permanently and update your balance."
      />
    </div>
  );
}

export default TransactionsPage;

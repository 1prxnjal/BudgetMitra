import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, ArrowRight, TrendingUp, CreditCard } from 'lucide-react';

function OnboardingPage({ onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [source, setSource] = useState('Salary');

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({ 
        income: parseFloat(income) || 0,
        transactions: [{
          merchant: "Initial Income",
          category: "Income",
          date: new Date().toISOString().split('T')[0],
          amount: parseFloat(income) || 0
        }]
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="onboarding-page-wrapper">
      <style>{`
        .onboarding-page-wrapper {
          height: 100vh;
          width: 100vw;
          background-color: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .onboarding-card {
          width: 100%;
          max-width: 1000px;
          height: 650px;
          background: white;
          border-radius: 20px;
          display: flex;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        .onboarding-sidebar {
          width: 350px;
          background-color: #283593;
          color: white;
          padding: 40px;
          display: flex;
          flex-direction: column;
        }
        .onboarding-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 40px;
        }
        .logo-box {
          width: 30px;
          height: 30px;
          background: #12C29B;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .onboarding-message-card {
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .saathi-avatar {
          width: 35px;
          height: 35px;
          background: #E6F8F3;
          color: #12C29B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .onboarding-message-card h3 { font-size: 1rem; margin-bottom: 10px; }
        .onboarding-message-card p { font-size: 0.8rem; color: #E0E0E0; line-height: 1.5; }
        
        .onboarding-steps-list { display: flex; flex-direction: column; gap: 20px; }
        .step-item { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.4); font-size: 0.9rem; }
        .step-item.completed { color: white; }
        .step-icon { width: 24px; height: 24px; border: 1px solid currentColor; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; }
        .step-item.completed .step-icon { background: #12C29B; border-color: #12C29B; }

        .onboarding-main { flex: 1; padding: 50px 70px; display: flex; flex-direction: column; }
        .onboarding-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; }
        .step-count { font-size: 0.8rem; font-weight: 700; color: #6B7280; }
        .progress-bar-container { flex: 1; height: 6px; background: #EEE; border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #00695C; transition: width 0.3s; }
        
        .step-content h1 { font-size: 1.8rem; font-weight: 700; color: #1a1a1a; margin-bottom: 10px; }
        .step-desc { color: #6B7280; font-size: 0.9rem; margin-bottom: 30px; }
        
        .amount-input-box { display: flex; align-items: center; border: 2px solid #00695C; border-radius: 12px; padding: 12px 20px; margin-bottom: 30px; }
        .currency-symbol { font-size: 1.5rem; color: #BBB; margin-right: 10px; }
        .amount-input-box input { flex: 1; border: none; font-size: 2rem; font-weight: 700; outline: none; }
        
        .source-buttons { display: flex; gap: 10px; margin-bottom: 30px; }
        .source-buttons button { padding: 8px 20px; border-radius: 20px; border: 1px solid #DDD; background: white; cursor: pointer; color: #6B7280; }
        .source-buttons button.active { background: #E6F2F0; border-color: #00695C; color: #00695C; }
        
        .tip-box { background: #F3F4F6; padding: 12px 15px; border-radius: 8px; display: flex; gap: 10px; align-items: center; font-size: 0.85rem; }
        .onboarding-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #EEE; padding-top: 20px; }
        .continue-btn { background: #00695C; color: white; padding: 12px 30px; border-radius: 8px; border: none; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }
      `}</style>

      <div className="onboarding-card">
        <div className="onboarding-sidebar">
          <div className="onboarding-logo">
            <div className="logo-box"><CreditCard size={18} color="white" /></div>
            <span>BudgetMitra</span>
          </div>
          <div className="onboarding-message-card">
            <div className="saathi-avatar"><Bot size={18} /></div>
            <h3>Namaste! Let's build your financial foundation.</h3>
            <p>I'm your Smart Budget Saathi. We'll set up your profile in 3 quick steps.</p>
          </div>
          <div className="onboarding-steps-list">
            <div className={`step-item ${step >= 1 ? 'completed' : ''}`}>
              <div className="step-icon">{step > 1 ? <CheckCircle size={14} /> : 1}</div>
              <span>Monthly Income</span>
            </div>
            <div className={`step-item ${step >= 2 ? 'completed' : ''}`}>
              <div className="step-icon">{step > 2 ? <CheckCircle size={14} /> : 2}</div>
              <span>Savings Goals</span>
            </div>
            <div className={`step-item ${step >= 3 ? 'completed' : ''}`}>
              <div className="step-icon">3</div>
              <span>Existing Loans</span>
            </div>
          </div>
        </div>

        <div className="onboarding-main">
          <div className="onboarding-header">
            <span className="step-count">STEP {step} OF 3</span>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(step/3)*100}%` }}></div>
            </div>
          </div>

          <div className="step-content">
            {step === 1 && (
              <>
                <h1>What's your monthly income?</h1>
                <p className="step-desc">Enter your base income to help Saathi calculate safe spending limits.</p>
                <div className="amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input type="number" placeholder="0.00" value={income} onChange={(e) => setIncome(e.target.value)} />
                </div>
                <div className="source-buttons">
                  {['Salary', 'Business', 'Freelance'].map(s => (
                    <button key={s} className={source === s ? 'active' : ''} onClick={() => setSource(s)}>{s}</button>
                  ))}
                </div>
                <div className="tip-box">
                  <TrendingUp size={16} color="#00695C" />
                  <p>Enter your <strong>net income</strong> for accurate planning.</p>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h1>What's your savings goal?</h1>
                <p className="step-desc">Set a target for your monthly savings.</p>
                <div className="amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input type="number" placeholder="10,000" />
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h1>Any existing loans or EMIs?</h1>
                <p className="step-desc">This helps us calculate your fixed expenses.</p>
                <div className="amount-input-box">
                  <span className="currency-symbol">₹</span>
                  <input type="number" placeholder="0.00" />
                </div>
              </>
            )}
          </div>

          <div className="onboarding-footer">
            <button className="skip-btn" style={{background: 'none', border: 'none', color: '#6B7280', fontWeight: 600, cursor: 'pointer'}} onClick={() => onComplete({ income: 0, available_balance: 0, transactions: [] })}>Skip</button>
            <button className="continue-btn" onClick={handleContinue}>
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;

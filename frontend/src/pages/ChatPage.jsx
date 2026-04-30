import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Bot, Send, Paperclip, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function ChatPage({ user, onLogout, budgetState, onUpdateBudget }) {
  const [messages, setMessages] = useState([
    { user: '', assistant: "Namaste! I'm Saathi, your live personal finance assistant. How can I help you with your budget today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('English');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const isAtBottom = useRef(true);
  const messagesEndRef = useRef(null);

  const fetchSuggestions = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/suggest_prompts`, { budget_context: budgetState });
      setSuggestedPrompts(res.data);
    } catch (err) {
      setSuggestedPrompts(["Analyze spending 📊", "Save more? 💰", "Debt tips 🏦", "Invest 📈"]);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);



  const handleSendMessage = async (forcedMessage = null) => {
    const textToSend = forcedMessage || inputText;
    if (!textToSend.trim() || isTyping) return;
    
    // Show dots immediately
    setMessages(prev => [...prev, { user: textToSend, assistant: "" }]);
    setInputText('');
    isAtBottom.current = true;
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: language,
          history: messages.slice(-10),
          budget_context: budgetState
        })
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].assistant = fullText;
          return newMsgs;
        });
      }
    } catch (error) {
      console.error('Streaming Error:', error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].assistant = "Oops! Saathi's brain is a bit slow today. Please refresh.";
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
      fetchSuggestions(); // Get new suggestions based on latest context
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F7F8FA' }}>
      <Sidebar user={user} onLogout={onLogout} balance={budgetState?.available_balance || 0} onUpdateBudget={onUpdateBudget} budgetState={budgetState} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 40px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: 40, height: 40, background: '#E6F8F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#12C29B' }}>
              <Bot size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Budget Saathi</h2>
              <span style={{ fontSize: '0.8rem', color: '#12C29B' }}>● Live AI Assistant</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} color="#6B7280" />
            <select style={{ border: 'none', background: 'none', fontSize: '0.9rem', color: '#6B7280', outline: 'none' }} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="हिन्दी">हिन्दी</option>
            </select>
          </div>
        </div>

        <div 
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '25px' }}
        >
          {messages.map((msg, idx) => (
            <React.Fragment key={idx}>
              {msg.user && (
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: '#1A237E', color: 'white', padding: '15px 20px', borderRadius: '18px 18px 2px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  {msg.user}
                </div>
              )}
              {msg.assistant !== undefined && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '75%', display: 'flex', gap: '15px' }}>
                  <div style={{ width: 32, height: 32, background: '#E6F8F3', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#12C29B', marginTop: '5px' }}>
                    <Bot size={18} />
                  </div>
                  <div style={{ background: 'white', color: '#1E1E1E', padding: '15px 25px', borderRadius: '2px 18px 18px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', lineHeight: '1.6', fontSize: '0.95rem', minWidth: '100px' }}>
                    {(msg.assistant === "") ? (
                      <div className="typing-indicator" style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '30px', padding: '5px 0' }}>
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <style>{`
                          .typing-indicator .dot { 
                            width: 10px; height: 10px; background: #12C29B; border-radius: 50%; 
                            animation: bounce-up-down 1s infinite ease-in-out; 
                          }
                          .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
                          .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
                          @keyframes bounce-up-down {
                            0%, 100% { transform: translateY(0); opacity: 0.4; }
                            50% { transform: translateY(-10px); opacity: 1; }
                          }
                        `}</style>
                      </div>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.assistant}
                        </ReactMarkdown>
                        <style>{`
                          .markdown-content { font-family: 'Inter', sans-serif; color: #1e293b; }
                          .markdown-content h3 { margin: 20px 0 10px 0; font-size: 1.2rem; font-weight: 700; color: #1A237E; display: flex; align-items: center; gap: 8px; }
                          .markdown-content p { margin: 0 0 12px 0; line-height: 1.6; }
                          .markdown-content strong { color: #059669; font-weight: 700; }
                          .markdown-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
                          .markdown-content ul, .markdown-content ol { margin: 0 0 15px 0; padding-left: 20px; }
                          .markdown-content li { margin-bottom: 6px; }
                          
                          /* Premium Table Styling */
                          .markdown-content table { width: 100%; border-collapse: collapse; margin: 15px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
                          .markdown-content th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 0.85rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.025em; border-bottom: 2px solid #e2e8f0; }
                          .markdown-content td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
                          .markdown-content tr:last-child td { border-bottom: none; }
                          .markdown-content tr:hover { background: #f1f5f9; }
                        `}</style>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '20px 40px', background: 'white', borderTop: '1px solid #E5E7EB' }}>
          {/* AI-Generated Quick Suggestions */}
          <div className="quick-prompts" style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                style={{
                  whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: '20px', border: '1px solid #E5E7EB',
                  background: '#F9FAFB', color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#12C29B'; e.currentTarget.style.color = '#12C29B'; e.currentTarget.style.background = '#F0FDF4'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.background = '#F9FAFB'; }}
              >
                {prompt}
              </button>
            ))}
            <style>{`
              .quick-prompts::-webkit-scrollbar { display: none; }
              .quick-prompts { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
          </div>

          <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Paperclip size={20} color="#6B7280" />
            <input 
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '10px 0', fontSize: '1rem' }}
              placeholder="Ask Saathi anything about your finances..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              style={{ background: '#12C29B', color: 'white', border: 'none', width: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

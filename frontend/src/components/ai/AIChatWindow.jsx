import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiLayers, FiMinimize2, FiInfo, FiTrash2 } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';
import api from '../../services/api/client.js';
import MDEditor from "@uiw/react-md-editor";

const QUICK_QUERIES = {
  admin: [
    "Dormant groups report?",
    "Faculty workload summary?",
    "System health overview?",
    "Project domain comparison?"
  ],
  teacher: [
    "At-risk groups?",
    "Summarize my groups?",
    "Grading support?",
    "Recent meeting summaries?"
  ],
  student: [
    "My priorities this week?",
    "Upcoming deadlines?",
    "Roadmap for my project?",
    "Summary of last meeting?"
  ]
};

const ROLE_CONFIG = {
  admin:   { label: 'Admin Command Center',  colors: { from: '#4f46e5', to: '#3730a3' }, shadow: 'rgba(79,70,229,0.35)'  },
  teacher: { label: 'Faculty AI Assistant',  colors: { from: '#10b981', to: '#059669' }, shadow: 'rgba(16,185,129,0.35)' },
  student: { label: 'Academic Coach AI',     colors: { from: '#f59e0b', to: '#d97706' }, shadow: 'rgba(245,158,11,0.35)' },
};

const AIChatWindow = ({ role = 'student', isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  useEffect(() => {
    if (isOpen && history.length === 0) {
      const fetchHistory = async () => {
        try {
          const response = await api.get('/api/chat/history');
          if (response.data.success && response.data.data.history.length > 0) {
            setHistory(response.data.data.history);
          }
        } catch (err) {
          console.error("Failed to fetch chat history:", err);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  const clearChat = async () => {
    try {
      setHistory([]);
      await api.delete('/api/chat/history');
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const handleSend = async (text) => {
    const input = (text || message).trim();
    if (!input) return;

    setHistory(prev => [...prev, { role: 'user', content: input }]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/chat', {
        message: input,
        history: history.slice(-5),
      });

      if (response.data.success) {
        setHistory(prev => [...prev, { role: 'assistant', content: response.data.data.response }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting to the system intelligence core right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const roleGradient = {
    background: `linear-gradient(135deg, ${config.colors.from}, ${config.colors.to})`,
  };

  return (
    <div
      className={`fixed bottom-[10px] right-6 w-[420px] max-w-[calc(100vw-56px)] flex flex-col z-[1000]
        rounded-3xl overflow-hidden
        bg-white/80 backdrop-blur-2xl
        border border-white/60
        shadow-2xl
        transition-all duration-500 ease-out origin-bottom-right
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
      `}
      style={{
        maxHeight: 'calc(114vh - 110px)',
        height: '700px',
        boxShadow: `0 25px 50px -12px ${config.shadow}, 0 0 0 1px rgba(255,255,255,0.3) inset`
      }}
    >
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/50 border-b border-black/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-md" style={roleGradient}>
            <FaBrain size={15} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">{config.label}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Online · Groq LLaMA</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-all"
            >
              <FiTrash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <FiMinimize2 size={15} />
          </button>
        </div>
      </div>

      {/* --- Messages --- */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.1)_transparent]">
        {history.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-8">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={roleGradient}>
              <FaBrain size={22} />
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-[220px] leading-relaxed">
              Ask me anything. I have full context of your dashboard data.
            </p>
          </div>
        )}

        {history.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
          {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 mr-2 mt-0.5 shadow" style={roleGradient}>
                <FaBrain size={11} />
              </div>
            )}
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 text-[0.84rem] leading-relaxed shadow-sm
                ${msg.role === 'user'
                  ? 'text-white rounded-br-sm shadow-md'
                  : 'bg-white/90 text-slate-700 rounded-bl-sm border border-slate-200/50 backdrop-blur-sm'
                }`}
              style={msg.role === 'user' ? roleGradient : {}}
            >
              {msg.role === 'assistant' ? (
                <div data-color-mode="light" className="prose prose-sm max-w-none">
                  <MDEditor.Markdown
                    source={msg.content}
                    style={{
                      background: 'transparent',
                      fontSize: '0.84rem',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      lineHeight: '1.65',
                    }}
                  />
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow" style={roleGradient}>
              <FaBrain size={11} />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="px-4 pb-5 pt-3 bg-slate-50/70 border-t border-slate-100 shrink-0">
        {/* Quick Query Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_QUERIES[role]?.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider
                bg-white border border-slate-200 rounded-full shadow-sm
                hover:border-indigo-400 hover:text-indigo-600 hover:shadow-indigo-100 hover:shadow-md
                active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4 py-2 shadow-sm transition-all focus-within:border-indigo-400 focus-within:shadow-indigo-100 focus-within:shadow-md">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 py-1.5"
            placeholder="Ask something..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !message.trim()}
            className="h-8 w-8 rounded-xl text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:scale-100"
            style={roleGradient}
          >
            <FiSend size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatWindow;

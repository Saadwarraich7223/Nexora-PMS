import React from 'react';
import { FiX } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';

const ROLE_CONFIG = {
  admin:   { colors: { from: '#4f46e5', to: '#3730a3' }, shadow: 'rgba(79,70,229,0.45)'  },
  teacher: { colors: { from: '#10b981', to: '#059669' }, shadow: 'rgba(16,185,129,0.45)' },
  student: { colors: { from: '#f59e0b', to: '#d97706' }, shadow: 'rgba(245,158,11,0.45)' },
};

const AIChatBadge = ({ role = 'student', isOpen, onClick }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const bgStyle = {
    background: `linear-gradient(135deg, ${config.colors.from}, ${config.colors.to})`,
    boxShadow: `0 8px 24px -4px ${config.shadow}`,
  };

  return (
    <button
      onClick={onClick}
      aria-label="Toggle AI Assistance"
      style={bgStyle}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 32px -4px ${config.shadow}`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = bgStyle.boxShadow)}
      className={`fixed bottom-7 right-7 z-[1001] h-12 w-12 rounded-xl text-white flex items-center justify-center
        transition-all duration-300
        ${isOpen
          ? 'opacity-0 scale-50 pointer-events-none translate-y-2'
          : 'opacity-100 scale-100 translate-y-0 hover:scale-110 active:scale-95'
        }`}
    >
      <div className="relative">
        {isOpen ? (
          <FiX size={18} />
        ) : (
          <>
            <FaBrain size={18} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.15em] opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700">
        AI Intelligence
      </div>
    </button>
  );
};

export default AIChatBadge;

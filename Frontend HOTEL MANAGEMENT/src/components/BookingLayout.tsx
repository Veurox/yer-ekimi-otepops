import React from 'react';
import { Building2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BookingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: '#fff',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={32} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>OtelOPS</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.85 }}>Online Rezervasyon</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/login" style={{
            color: '#fff',
            textDecoration: 'none',
            fontSize: '0.85rem',
            opacity: 0.85,
            padding: '0.4rem 0.8rem',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px'
          }}>
            Personel Girişi
          </a>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border-color, #e5e7eb)',
        fontSize: '0.8rem',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>
          &copy; 2025 OtelOPS Hotel Management System &mdash; Tum haklari saklidir.
        </p>
        <p style={{ margin: '0.25rem 0 0' }}>
          Destek: info@otelops.com | +90 212 555 00 00
        </p>
      </footer>
    </div>
  );
};

export default BookingLayout;

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { canAccessRoute } from '../utils/permissions';
import {
  Home,
  DoorOpen,
  Users,
  Calendar,
  Wrench,
  UtensilsCrossed,
  Package,
  MessageSquare,
  UserCircle,
  LogOut,
  Moon,
  Sun,
  Search,
} from 'lucide-react';
import './Layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/rooms', icon: DoorOpen, label: 'Odalar' },
    { path: '/staff', icon: Users, label: 'Personel' },
    { path: '/guests', icon: UserCircle, label: 'Misafirler' },
    { path: '/reservations', icon: Calendar, label: 'Rezervasyonlar' },
    { path: '/maintenance', icon: Wrench, label: 'Teknik Servis' },
    { path: '/room-service', icon: UtensilsCrossed, label: 'Oda Servisi' },
    { path: '/inventory', icon: Package, label: 'Envanter' },
    { path: '/search', icon: Search, label: 'Arama' },
    { path: '/ai-assistant', icon: MessageSquare, label: 'AI Asistan' },
  ];

  const customerMenuItems = [
    { path: '/', icon: Home, label: 'Oda Bilgilerim' },
    { path: '/my-room-service', icon: UtensilsCrossed, label: 'Oda Servisi' },
    { path: '/my-maintenance', icon: Wrench, label: 'Arıza Bildirimi' },
  ];

  // Kullanıcının rolüne göre menü öğelerini seç ve filtrele
  const displayMenuItems = user?.role === 'customer' 
    ? customerMenuItems
    : (user?.role ? menuItems.filter(item => canAccessRoute(user.role, item.path)) : menuItems);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏨 OtelOPS</h2>
        </div>

        <nav className="sidebar-nav">
          {displayMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>OtelOPS</h1>
          </div>

          <div className="header-right">
            <button onClick={toggleTheme} className="icon-btn" title={theme === 'light' ? 'Koyu Mod' : 'Açık Mod'}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="user-menu">
              <UserCircle size={20} />
              <span>{user?.firstName} {user?.lastName}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary logout-btn">
              <LogOut size={18} />
              Çıkış
            </button>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

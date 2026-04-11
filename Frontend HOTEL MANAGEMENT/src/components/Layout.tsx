import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
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
  CreditCard,
  FileText,
  BarChart2,
  Tag,
  Shield,
  Heart,
  Zap,
  Star,
  ClipboardList,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import './Layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: Home, label: t('nav.dashboard') },
    { path: '/rooms', icon: DoorOpen, label: t('nav.rooms') },
    { path: '/staff', icon: Users, label: t('nav.staff') },
    { path: '/guests', icon: UserCircle, label: t('nav.guests') },
    { path: '/reservations', icon: Calendar, label: t('nav.reservations') },
    { path: '/maintenance', icon: Wrench, label: t('nav.maintenance') },
    { path: '/room-service', icon: UtensilsCrossed, label: t('nav.roomService') },
    { path: '/inventory', icon: Package, label: t('nav.inventory') },
    { path: '/search', icon: Search, label: t('nav.search') },
    { path: '/ai-assistant', icon: MessageSquare, label: t('nav.aiAssistant') },
    { path: '/payments', icon: CreditCard, label: t('nav.payments') },
    { path: '/invoices', icon: FileText, label: t('nav.invoices') },
    { path: '/reports', icon: BarChart2, label: t('nav.reports') },
    { path: '/rate-plans', icon: Tag, label: t('nav.ratePlans') },
    { path: '/audit-log', icon: Shield, label: t('nav.auditLog') },
    { path: '/guest-crm', icon: Heart, label: t('nav.guestCrm') },
    { path: '/dynamic-pricing', icon: Zap, label: t('nav.dynamicPricing') },
    { path: '/loyalty', icon: Star, label: t('nav.loyalty') },
    { path: '/surveys', icon: ClipboardList, label: t('nav.surveys') },
    { path: '/pos', icon: ShoppingCart, label: t('nav.pos') },
    { path: '/housekeeping', icon: Sparkles, label: t('nav.housekeeping') },
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
            <LanguageSwitcher />
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

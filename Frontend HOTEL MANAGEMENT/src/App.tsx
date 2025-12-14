import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HotelProvider } from './context/HotelContext';
import { canAccessRoute } from './utils/permissions';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerRoomService from './pages/CustomerRoomService';
import CustomerMaintenance from './pages/CustomerMaintenance';
import Rooms from './pages/Rooms';
import StaffPage from './pages/Staff';
import GuestsPage from './pages/Guests';
import ReservationsPage from './pages/Reservations';
import MaintenancePage from './pages/Maintenance';
import RoomServicePage from './pages/RoomService';
import InventoryPage from './pages/Inventory';
import SearchPage from './pages/Search';
import AIAssistantPage from './pages/AIAssistant';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; path: string }> = ({ children, path }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!canAccessRoute(user.role, path)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>🚫 Erişim Engellendi</h2>
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Customer routes */}
        {user?.role === 'customer' ? (
          <>
            <Route path="/" element={<CustomerDashboard />} />
            <Route path="/my-room-service" element={<ProtectedRoute path="/my-room-service"><CustomerRoomService /></ProtectedRoute>} />
            <Route path="/my-maintenance" element={<ProtectedRoute path="/my-maintenance"><CustomerMaintenance /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            {/* Staff routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<ProtectedRoute path="/rooms"><Rooms /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute path="/staff"><StaffPage /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute path="/guests"><GuestsPage /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute path="/reservations"><ReservationsPage /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute path="/maintenance"><MaintenancePage /></ProtectedRoute>} />
            <Route path="/room-service" element={<ProtectedRoute path="/room-service"><RoomServicePage /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute path="/inventory"><InventoryPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute path="/search"><SearchPage /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute path="/ai-assistant"><AIAssistantPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <HotelProvider>
            <AppRoutes />
          </HotelProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

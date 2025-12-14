import React from 'react';
import { useHotel } from '../context/HotelContext';
import { DoorOpen, Users, Calendar, Wrench, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { rooms, staff, reservations, maintenanceRequests, guests } = useHotel();

  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;

  const activeReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked-in').length;
  const pendingMaintenance = maintenanceRequests.filter(m => m.status !== 'completed').length;

  const stats = [
    {
      title: 'Toplam Oda',
      value: rooms.length,
      icon: DoorOpen,
      color: '#3b82f6',
      details: `${availableRooms} Müsait, ${occupiedRooms} Dolu`,
    },
    {
      title: 'Aktif Rezervasyon',
      value: activeReservations,
      icon: Calendar,
      color: '#10b981',
      details: `${reservations.filter(r => r.status === 'pending').length} Bekleyen`,
    },
    {
      title: 'Personel',
      value: staff.length,
      icon: Users,
      color: '#8b5cf6',
      details: `${staff.filter(s => s.shift === 'morning').length} Sabah Vardiyası`,
    },
    {
      title: 'Bakım Talebi',
      value: pendingMaintenance,
      icon: Wrench,
      color: pendingMaintenance > 0 ? '#ef4444' : '#6b7280',
      details: maintenanceRequests.length > 0 ? `${pendingMaintenance} Açık` : 'Talep yok',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-hero" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>Dashboard</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>
          OtelOPS'a hoş geldiniz. Günlük operasyonları buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ 
            borderLeft: `4px solid ${stat.color}`,
            transform: 'translateY(0)',
            transition: 'all 0.3s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-details">{stat.details}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Oda Durumu</h3>
          <div className="room-status-chart">
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(availableRooms / rooms.length) * 100}%`, backgroundColor: '#10b981' }}></div>
              <span>Müsait: {availableRooms}</span>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(occupiedRooms / rooms.length) * 100}%`, backgroundColor: '#3b82f6' }}></div>
              <span>Dolu: {occupiedRooms}</span>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(cleaningRooms / rooms.length) * 100}%`, backgroundColor: '#f59e0b' }}></div>
              <span>Temizleniyor: {cleaningRooms}</span>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(maintenanceRooms / rooms.length) * 100}%`, backgroundColor: '#ef4444' }}></div>
              <span>Bakımda: {maintenanceRooms}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Son Rezervasyonlar</h3>
          {reservations.length === 0 ? (
            <p className="empty-state">Henüz rezervasyon yok</p>
          ) : (
            <div className="recent-list">
              {reservations.slice(0, 5).map((reservation) => {
                const guest = guests.find(g => g.id === reservation.guestId);
                const room = rooms.find(r => r.id === reservation.roomId);
                return (
                  <div key={reservation.id} className="recent-item">
                    <div>
                      <strong>{guest?.name || 'Bilinmeyen'}</strong>
                      <span className="text-muted"> - Oda {room?.number}</span>
                    </div>
                    <span className={`badge badge-${reservation.status === 'confirmed' ? 'success' : 'warning'}`}>
                      {reservation.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {pendingMaintenance > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <span>
            <strong>{pendingMaintenance} bakım talebi</strong> bekliyor. Teknik Servis bölümünden kontrol edin.
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

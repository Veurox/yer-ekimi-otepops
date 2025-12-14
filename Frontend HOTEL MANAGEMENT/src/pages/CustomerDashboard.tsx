import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useHotel } from '../context/HotelContext';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Wrench, DoorOpen, ShoppingBag } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { rooms, roomServiceOrders, maintenanceRequests } = useHotel();

  // Müşterinin odası
  const myRoom = rooms.find(r => r.number === user?.roomNumber);
  
  // Müşterinin siparişleri
  const myOrders = roomServiceOrders.filter(o => {
    const room = rooms.find(r => r.id === o.roomId);
    return room?.number === user?.roomNumber;
  });

  // Müşterinin arıza kayıtları
  const myMaintenanceRequests = maintenanceRequests.filter(m => {
    const room = rooms.find(r => r.id === m.roomId);
    return room?.number === user?.roomNumber;
  });

  const activeOrders = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const activeMaintenanceRequests = myMaintenanceRequests.filter(m => m.status !== 'completed').length;

  return (
    <div>
      <div style={{ 
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '3rem 2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>Hoş Geldiniz, {user?.firstName} {user?.lastName}!</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Oda {user?.roomNumber} - Konfor ve hizmet için buradayız
        </p>
      </div>

      {/* Oda Bilgisi */}
      <div className="card" style={{ 
        marginBottom: '2rem', 
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
        color: 'white',
        border: 'none',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '70px', 
            height: '70px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}>
            <DoorOpen size={36} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>Odanız: {user?.roomNumber}</h3>
            {myRoom && (
              <>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>{myRoom.type.toUpperCase()} Oda • Kat {myRoom.floor}</p>
                <p style={{ margin: 0, marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>
                  Özellikler: {myRoom.features.join(', ')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Link to="/my-room-service" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '0.5rem', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>Oda Servisi</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  {activeOrders} aktif sipariş
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/my-maintenance" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '0.5rem', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>Arıza Bildirimi</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  {activeMaintenanceRequests} açık talep
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Son Siparişlerim */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShoppingBag size={24} />
          Son Siparişlerim
        </h3>
        {myOrders.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            Henüz sipariş vermediniz
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün Sayısı</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.orderedAt).toLocaleString('tr-TR')}</td>
                  <td>{order.items.length} ürün</td>
                  <td>{order.totalPrice} TL</td>
                  <td>
                    <span className={`badge ${
                      order.status === 'delivered' ? 'badge-success' :
                      order.status === 'preparing' ? 'badge-warning' :
                      order.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {order.status === 'pending' ? 'Bekliyor' :
                       order.status === 'preparing' ? 'Hazırlanıyor' :
                       order.status === 'delivered' ? 'Teslim Edildi' : 'İptal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Arıza Taleplerim */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Wrench size={24} />
          Arıza Taleplerim
        </h3>
        {myMaintenanceRequests.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            Arıza kaydınız bulunmamaktadır
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Başlık</th>
                <th>Öncelik</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {myMaintenanceRequests.slice(0, 5).map((request) => (
                <tr key={request.id}>
                  <td>{new Date(request.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>{request.title}</td>
                  <td>
                    <span className={`badge ${
                      request.priority === 'urgent' ? 'badge-danger' :
                      request.priority === 'high' ? 'badge-danger' :
                      request.priority === 'medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {request.priority === 'urgent' ? 'Acil' :
                       request.priority === 'high' ? 'Yüksek' :
                       request.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      request.status === 'completed' ? 'badge-success' :
                      request.status === 'in-progress' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {request.status === 'completed' ? 'Tamamlandı' :
                       request.status === 'in-progress' ? 'Devam Ediyor' : 'Bekliyor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

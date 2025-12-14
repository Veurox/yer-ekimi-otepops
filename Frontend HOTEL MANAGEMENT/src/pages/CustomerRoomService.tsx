import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHotel } from '../context/HotelContext';
import { UtensilsCrossed, Plus, X } from 'lucide-react';

const CustomerRoomService: React.FC = () => {
  const { user } = useAuth();
  const { menuItems, roomServiceOrders, addRoomServiceOrder, rooms } = useHotel();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ menuItemId: string; quantity: number }[]>([]);

  const myRoom = rooms.find(r => r.number === user?.roomNumber);
  const myOrders = roomServiceOrders.filter(o => {
    const room = rooms.find(r => r.id === o.roomId);
    return room?.number === user?.roomNumber;
  });

  const handleAddItem = (menuItemId: string) => {
    const existing = selectedItems.find(item => item.menuItemId === menuItemId);
    if (existing) {
      setSelectedItems(selectedItems.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { menuItemId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.menuItemId !== menuItemId));
  };

  const handleQuantityChange = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
    } else {
      setSelectedItems(selectedItems.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmitOrder = () => {
    if (!myRoom || selectedItems.length === 0) return;

    addRoomServiceOrder({
      roomId: myRoom.id,
      items: selectedItems,
      totalPrice: calculateTotal(),
      status: 'pending',
      orderedAt: new Date().toISOString(),
    });

    setSelectedItems([]);
    setShowOrderModal(false);
    alert('Siparişiniz alındı! Mutfağımız hazırlamaya başladı.');
  };

  const availableMenuItems = menuItems.filter(m => m.available);
  const groupedMenu = availableMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Oda Servisi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Oda {user?.roomNumber} • {myOrders.filter(o => o.status !== 'delivered').length} aktif sipariş
          </p>
        </div>
        <button onClick={() => setShowOrderModal(true)} className="btn btn-primary">
          <Plus size={20} /> Yeni Sipariş Ver
        </button>
      </div>

      {/* Siparişlerim */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Siparişlerim</h3>
        {myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <UtensilsCrossed size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Henüz sipariş vermediniz</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürünler</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.orderedAt).toLocaleString('tr-TR')}</td>
                  <td>
                    {order.items.map(item => {
                      const menuItem = menuItems.find(m => m.id === item.menuItemId);
                      return menuItem ? `${menuItem.name} (x${item.quantity})` : '';
                    }).join(', ')}
                  </td>
                  <td><strong>{order.totalPrice} TL</strong></td>
                  <td>
                    <span className={`badge ${
                      order.status === 'delivered' ? 'badge-success' :
                      order.status === 'preparing' ? 'badge-warning' :
                      order.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {order.status === 'pending' ? '⏳ Bekliyor' :
                       order.status === 'preparing' ? '👨‍🍳 Hazırlanıyor' :
                       order.status === 'delivered' ? '✅ Teslim Edildi' : '❌ İptal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sipariş Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Yeni Sipariş Ver</h3>

            {/* Menü */}
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>{category}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {items.map((item) => {
                    const inCart = selectedItems.find(si => si.menuItemId === item.id);
                    return (
                      <div 
                        key={item.id} 
                        className="card" 
                        style={{ 
                          cursor: 'pointer',
                          border: inCart ? '2px solid #10b981' : '1px solid #e5e7eb',
                          backgroundColor: inCart ? '#f0fdf4' : 'white'
                        }}
                        onClick={() => handleAddItem(item.id)}
                      >
                        <h4 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {item.description}
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#10b981' }}>
                          {item.price} TL
                        </p>
                        {inCart && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                            ✓ Sepette: {inCart.quantity} adet
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Sepet */}
            {selectedItems.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Sepetiniz</h4>
                {selectedItems.map(item => {
                  const menuItem = menuItems.find(m => m.id === item.menuItemId);
                  if (!menuItem) return null;
                  return (
                    <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem' }}>
                      <div>
                        <strong>{menuItem.name}</strong>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                          {menuItem.price} TL
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          +
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.menuItemId)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.25rem' }}>Toplam:</strong>
                  <strong style={{ fontSize: '1.5rem', color: '#10b981' }}>{calculateTotal()} TL</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button 
                onClick={handleSubmitOrder} 
                className="btn btn-primary"
                disabled={selectedItems.length === 0}
              >
                Siparişi Onayla
              </button>
              <button onClick={() => setShowOrderModal(false)} className="btn btn-secondary">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRoomService;

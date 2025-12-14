import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { MenuItem } from '../types';
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';

const menuItemSchema = Yup.object({
  name: Yup.string().required('Ürün adı gerekli'),
  category: Yup.string().required('Kategori gerekli'),
  price: Yup.number().required('Fiyat gerekli').min(0),
  description: Yup.string().required('Açıklama gerekli'),
});

const RoomServicePage: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, roomServiceOrders, addRoomServiceOrder, updateRoomServiceOrder, deleteRoomServiceOrder, rooms } = useHotel();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [view, setView] = useState<'menu' | 'orders'>('menu');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const menuFormik = useFormik({
    initialValues: { name: '', category: 'Ana Yemek', price: 0, description: '', available: true },
    validationSchema: menuItemSchema,
    onSubmit: (values) => {
      if (editingItem) {
        updateMenuItem(editingItem.id, values);
      } else {
        addMenuItem(values);
      }
      setShowMenuModal(false);
      setEditingItem(null);
      menuFormik.resetForm();
    },
  });

  const orderFormik = useFormik({
    initialValues: { roomId: '', items: [{ menuItemId: '', quantity: 1 }] },
    onSubmit: (values) => {
      const totalPrice = values.items.reduce((sum, item) => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return sum + (menuItem?.price || 0) * item.quantity;
      }, 0);

      addRoomServiceOrder({
        ...values,
        totalPrice,
        status: 'pending',
        orderedAt: new Date().toISOString(),
      });

      setShowOrderModal(false);
      orderFormik.resetForm();
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Oda Servisi Yönetimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            {menuItems.length} menü ürünü • {roomServiceOrders.filter(o => o.status !== 'delivered').length} aktif sipariş
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowOrderModal(true)} className="btn btn-success">
            <ShoppingCart size={20} /> Yeni Sipariş
          </button>
          <button onClick={() => { setEditingItem(null); setShowMenuModal(true); }} className="btn btn-primary">
            <Plus size={20} /> Menü Ürünü Ekle
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setView('menu')} className={`btn ${view === 'menu' ? 'btn-primary' : 'btn-secondary'}`}>
              Menü ({menuItems.length})
            </button>
            <button onClick={() => setView('orders')} className={`btn ${view === 'orders' ? 'btn-primary' : 'btn-secondary'}`}>
              Siparişler ({roomServiceOrders.length})
            </button>
          </div>

          {view === 'menu' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Kategori Filtre:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '0.5rem' }}
              >
                <option value="all">Tümü</option>
                <option value="Ana Yemek">Ana Yemek</option>
                <option value="Aperatif">Aperatif</option>
                <option value="Tatlı">Tatlı</option>
                <option value="İçecek">İçecek</option>
                <option value="Kahvaltı">Kahvaltı</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {view === 'menu' ? (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Fiyat</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.filter(item => filterCategory === 'all' || item.category === filterCategory).length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Menü ürünü yok</td></tr>
              ) : (
                menuItems
                  .filter(item => filterCategory === 'all' || item.category === filterCategory)
                  .map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.description}</td>
                      <td>{item.price} TL</td>
                      <td>
                        <span className={`badge ${item.available ? 'badge-success' : 'badge-danger'}`}>
                          {item.available ? 'Mevcut' : 'Tükendi'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => { setEditingItem(item); menuFormik.setValues(item); setShowMenuModal(true); }} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => window.confirm('Silmek istediğinizden emin misiniz?') && deleteMenuItem(item.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Oda</th>
                <th>Ürünler</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {roomServiceOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Sipariş yok</td></tr>
              ) : (
                roomServiceOrders.map((order) => {
                  const room = rooms.find(r => r.id === order.roomId);
                  return (
                    <tr key={order.id}>
                      <td><strong>Oda {room?.number}</strong></td>
                      <td>{order.items.length} ürün</td>
                      <td>{order.totalPrice} TL</td>
                      <td>
                        <select value={order.status} onChange={(e) => updateRoomServiceOrder(order.id, { status: e.target.value as any })} className="form-input" style={{ width: 'auto', padding: '0.5rem' }}>
                          <option value="pending">Bekliyor</option>
                          <option value="preparing">Hazırlanıyor</option>
                          <option value="delivered">Teslim Edildi</option>
                          <option value="cancelled">İptal</option>
                        </select>
                      </td>
                      <td>{new Date(order.orderedAt).toLocaleString('tr-TR')}</td>
                      <td>
                        <button
                          onClick={() => window.confirm('Siparişi silmek istediğinizden emin misiniz?') && deleteRoomServiceOrder(order.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem' }}
                          title="Siparişi Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
            <form onSubmit={menuFormik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input type="text" className="form-input" {...menuFormik.getFieldProps('name')} />
                {menuFormik.touched.name && menuFormik.errors.name && <div className="form-error">{menuFormik.errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-input" {...menuFormik.getFieldProps('category')}>
                  <option>Ana Yemek</option>
                  <option>Aperatif</option>
                  <option>Tatlı</option>
                  <option>İçecek</option>
                  <option>Kahvaltı</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fiyat (TL)</label>
                <input type="number" className="form-input" {...menuFormik.getFieldProps('price')} />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea className="form-input" rows={3} {...menuFormik.getFieldProps('description')} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Güncelle' : 'Ekle'}</button>
                <button type="button" onClick={() => setShowMenuModal(false)} className="btn btn-secondary">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Sipariş</h3>
            <form onSubmit={orderFormik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Oda</label>
                <select className="form-input" {...orderFormik.getFieldProps('roomId')}>
                  <option value="">Oda Seçiniz</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>Oda {room.number} ({room.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ürün</label>
                <select className="form-input" value={orderFormik.values.items[0].menuItemId} onChange={(e) => orderFormik.setFieldValue('items.0.menuItemId', e.target.value)}>
                  <option value="">Ürün Seçiniz</option>
                  {menuItems.filter(m => m.available).map(item => (
                    <option key={item.id} value={item.id}>{item.name} - {item.price} TL</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Adet</label>
                <input type="number" min="1" className="form-input" value={orderFormik.values.items[0].quantity} onChange={(e) => orderFormik.setFieldValue('items.0.quantity', parseInt(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Sipariş Oluştur</button>
                <button type="button" onClick={() => setShowOrderModal(false)} className="btn btn-secondary">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomServicePage;

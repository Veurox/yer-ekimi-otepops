import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { InventoryItem, InventoryCategory } from '../types';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

const inventorySchema = Yup.object({
  name: Yup.string().required('Ürün adı gerekli'),
  category: Yup.string().required('Kategori gerekli'),
  quantity: Yup.number().required('Miktar gerekli').min(0),
  unit: Yup.string().required('Birim gerekli'),
  minQuantity: Yup.number().required('Minimum stok gerekli').min(0),
  pricePerUnit: Yup.number().required('Birim fiyat gerekli').min(0),
  supplier: Yup.string(),
});

const InventoryPage: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'quantity'>('name');
  const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'all'>('all');

  const formik = useFormik({
    initialValues: {
      name: '',
      category: 'cleaning' as InventoryCategory,
      quantity: 0,
      unit: 'adet',
      minQuantity: 10,
      pricePerUnit: 0,
      supplier: '',
    },
    validationSchema: inventorySchema,
    onSubmit: (values) => {
      const itemData = {
        ...values,
        lastRestocked: new Date().toISOString(),
      };

      if (editingItem) {
        updateInventoryItem(editingItem.id, itemData);
      } else {
        addInventoryItem(itemData);
      }

      setShowModal(false);
      setEditingItem(null);
      formik.resetForm();
    },
  });

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    formik.setValues({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minQuantity: item.minQuantity,
      pricePerUnit: item.pricePerUnit,
      supplier: item.supplier || '',
    });
    setShowModal(true);
  };

  const handleStockUpdate = (id: string, change: number) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + change);
      updateInventoryItem(id, {
        quantity: newQuantity,
        lastRestocked: change > 0 ? new Date().toISOString() : item.lastRestocked,
      });
    }
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity);

  const getCategoryLabel = (category: InventoryCategory) => {
    const labels = {
      cleaning: 'Temizlik',
      food: 'Yiyecek',
      beverages: 'İçecek',
      toiletries: 'Banyo Malzemeleri',
      linens: 'Çarşaf/Havlu',
      other: 'Diğer',
    };
    return labels[category];
  };

  const filteredAndSortedInventory = [...inventory]
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      return 0;
    });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Envanter ve Stok Takibi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            {inventory.length} ürün • {lowStockItems.length} düşük stok
          </p>
        </div>
        <button onClick={() => { setEditingItem(null); formik.resetForm(); setShowModal(true); }} className="btn btn-primary">
          <Plus size={20} /> Yeni Ürün Ekle
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Sıralama:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem' }}
            >
              <option value="name">İsim (A-Z)</option>
              <option value="category">Kategori</option>
              <option value="quantity">Stok Miktarı</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Kategori Filtre:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem' }}
            >
              <option value="all">Tümü</option>
              <option value="cleaning">Temizlik</option>
              <option value="food">Yiyecek</option>
              <option value="beverages">İçecek</option>
              <option value="toiletries">Banyo Malzemeleri</option>
              <option value="linens">Çarşaf/Havlu</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} />
          <span>
            <strong>{lowStockItems.length} ürün</strong> minimum stok seviyesinin altında! Tedarik gerekiyor.
          </span>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Kategori</th>
              <th>Stok</th>
              <th>Birim</th>
              <th>Min. Stok</th>
              <th>Birim Fiyat</th>
              <th>Tedarikçi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Henüz envanter eklenmemiş</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedInventory.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id} style={isLowStock ? { backgroundColor: '#fef3c7' } : {}}>
                    <td>
                      <strong>{item.name}</strong>
                      {isLowStock && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>⚠️</span>}
                    </td>
                    <td>{getCategoryLabel(item.category)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => handleStockUpdate(item.id, -1)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>-</button>
                        <strong>{item.quantity}</strong>
                        <button onClick={() => handleStockUpdate(item.id, 1)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>+</button>
                      </div>
                    </td>
                    <td>{item.unit}</td>
                    <td>{item.minQuantity}</td>
                    <td>{item.pricePerUnit} TL</td>
                    <td>{item.supplier || '-'}</td>
                    <td>
                      <button onClick={() => openEditModal(item)} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => window.confirm('Silmek istediğinizden emin misiniz?') && deleteInventoryItem(item.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Ürün Adı</label>
                <input type="text" className="form-input" {...formik.getFieldProps('name')} />
                {formik.touched.name && formik.errors.name && <div className="form-error">{formik.errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-input" {...formik.getFieldProps('category')}>
                  <option value="cleaning">Temizlik</option>
                  <option value="food">Yiyecek</option>
                  <option value="beverages">İçecek</option>
                  <option value="toiletries">Banyo Malzemeleri</option>
                  <option value="linens">Çarşaf/Havlu</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Miktar</label>
                <input type="number" className="form-input" {...formik.getFieldProps('quantity')} />
              </div>
              <div className="form-group">
                <label className="form-label">Birim</label>
                <input type="text" className="form-input" placeholder="adet, kg, lt" {...formik.getFieldProps('unit')} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Stok</label>
                <input type="number" className="form-input" {...formik.getFieldProps('minQuantity')} />
              </div>
              <div className="form-group">
                <label className="form-label">Birim Fiyat (TL)</label>
                <input type="number" step="0.01" className="form-input" {...formik.getFieldProps('pricePerUnit')} />
              </div>
              <div className="form-group">
                <label className="form-label">Tedarikçi</label>
                <input type="text" className="form-input" {...formik.getFieldProps('supplier')} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Güncelle' : 'Ekle'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;

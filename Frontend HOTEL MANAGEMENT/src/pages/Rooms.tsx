import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { Room, RoomStatus, RoomType } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

const roomSchema = Yup.object({
  number: Yup.string().required('Oda numarası gerekli'),
  type: Yup.string().required('Oda tipi gerekli'),
  price: Yup.number().required('Fiyat gerekli').min(0, 'Fiyat 0\'dan büyük olmalı'),
  floor: Yup.number().required('Kat gerekli').min(1, 'Kat 1\'den büyük olmalı'),
  features: Yup.array().of(Yup.string()),
});

const AVAILABLE_FEATURES = [
  'WiFi', 'TV', 'Klima', 'Minibar', 'Balkon',
  'Jakuzi', 'Deniz Manzarası', 'Kasa', 'Saç Kurutma Makinesi',
  'Ütü', 'Çalışma Masası', 'Oda Servisi', 'Sigara İçilmez'
];

const Rooms: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      number: '',
      type: 'single' as RoomType,
      price: 0,
      floor: 1,
      features: [] as string[],
      status: 'available' as RoomStatus,
    },
    validationSchema: roomSchema,
    onSubmit: (values) => {
      if (editingRoom) {
        updateRoom(editingRoom.id, values);
      } else {
        // Send only CreateRoomDto fields (no status, no currentGuest)
        const createRoomData = {
          number: values.number,
          type: values.type,
          price: values.price,
          floor: values.floor,
          features: values.features
        };
        addRoom(createRoomData as any);
      }

      setShowModal(false);
      setEditingRoom(null);
      formik.resetForm();
    },
  });

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    formik.setValues({
      number: room.number,
      type: room.type,
      price: room.price,
      floor: room.floor,
      features: room.features,
      status: room.status,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingRoom(null);
    formik.resetForm();
    setShowModal(true);
  };

  const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
    updateRoom(roomId, { status: newStatus });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteRoom(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Oda Yönetimi</h2>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={20} /> Yeni Oda Ekle
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Oda No</th>
              <th>Tip</th>
              <th>Kat</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>Özellikler</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rooms
              .sort((a, b) => {
                // Extract numeric part from room number for proper sorting
                const numA = parseInt(a.number) || 0;
                const numB = parseInt(b.number) || 0;
                return numA - numB;
              })
              .map((room) => (
                <tr key={room.id}>
                  <td><strong>{room.number}</strong></td>
                  <td>{room.type}</td>
                  <td>{room.floor}</td>
                  <td>{room.price} TL</td>
                  <td>
                    <select
                      value={room.status}
                      onChange={(e) => handleStatusChange(room.id, e.target.value as RoomStatus)}
                      className="form-input"
                      style={{ width: 'auto', padding: '0.5rem' }}
                    >
                      <option value="available">Müsait</option>
                      <option value="occupied">Dolu</option>
                      <option value="cleaning">Temizleniyor</option>
                      <option value="maintenance">Bakımda</option>
                      <option value="reserved">Rezerve</option>
                    </select>
                  </td>
                  <td>{room.features.join(', ')}</td>
                  <td>
                    <button onClick={() => openEditModal(room)} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.5rem' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRoom ? 'Oda Düzenle' : 'Yeni Oda Ekle'}</h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Oda Numarası</label>
                <input
                  type="text"
                  className="form-input"
                  {...formik.getFieldProps('number')}
                />
                {formik.touched.number && formik.errors.number && (
                  <div className="form-error">{formik.errors.number}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Oda Tipi</label>
                <select className="form-input" {...formik.getFieldProps('type')}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                  <option value="deluxe">Deluxe</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fiyat (TL)</label>
                <input
                  type="number"
                  className="form-input"
                  {...formik.getFieldProps('price')}
                />
                {formik.touched.price && formik.errors.price && (
                  <div className="form-error">{formik.errors.price}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Kat</label>
                <input
                  type="number"
                  className="form-input"
                  {...formik.getFieldProps('floor')}
                />
                {formik.touched.floor && formik.errors.floor && (
                  <div className="form-error">{formik.errors.floor}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Özellikler</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.375rem' }}>
                  {AVAILABLE_FEATURES.map((feature) => (
                    <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="features"
                        value={feature}
                        checked={formik.values.features.includes(feature)}
                        onChange={(e) => {
                          const { checked, value } = e.target;
                          if (checked) {
                            formik.setFieldValue('features', [...formik.values.features, value]);
                          } else {
                            formik.setFieldValue(
                              'features',
                              formik.values.features.filter((f) => f !== value)
                            );
                          }
                        }}
                      />
                      {feature}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Güncelle' : 'Ekle'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Odayı Sil</h3>
            <p>Bu odayı silmek istediğinizden emin misiniz?</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={confirmDelete} className="btn btn-danger">
                Sil
              </button>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { Guest } from '../types';
import { Plus, Edit, Trash2, UserCircle } from 'lucide-react';

const guestSchema = Yup.object({
  name: Yup.string().required('İsim gerekli'),
  email: Yup.string().email('Geçerli email giriniz').required('Email gerekli'),
  phone: Yup.string().required('Telefon gerekli'),
  idNumber: Yup.string().required('TC Kimlik No gerekli').length(11, 'TC Kimlik No 11 haneli olmalı'),
  address: Yup.string().required('Adres gerekli'),
});

const GuestsPage: React.FC = () => {
  const { guests, addGuest, updateGuest, deleteGuest, reservations } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      address: '',
    },
    validationSchema: guestSchema,
    onSubmit: (values) => {
      const guestData = {
        ...values,
        totalSpent: editingGuest?.totalSpent || 0,
        visits: editingGuest?.visits || 0,
        isPrimaryGuest: editingGuest?.isPrimaryGuest ?? false,
        isActive: editingGuest?.isActive ?? true,
      };

      if (editingGuest) {
        updateGuest(editingGuest.id, guestData);
      } else {
        addGuest(guestData);
      }

      setShowModal(false);
      setEditingGuest(null);
      formik.resetForm();
    },
  });

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    formik.setValues({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      idNumber: guest.idNumber,
      address: guest.address,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingGuest(null);
    formik.resetForm();
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteGuest(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const isGuestStaying = (guestId: string) => {
    return reservations.some(r => {
      const isLinked = r.guestId === guestId || r.guests?.some(g => g.id === guestId);
      return isLinked && r.status === 'checked-in';
    });
  };

  const hasGuestStayed = (guestId: string) => {
    return reservations.some(r => {
      const isLinked = r.guestId === guestId || r.guests?.some(g => g.id === guestId);
      return isLinked && r.status === 'checked-out';
    });
  };

  const filteredGuests = guests.filter(guest => {
    if (filter === 'current') return isGuestStaying(guest.id);
    if (filter === 'past') return hasGuestStayed(guest.id) && !isGuestStaying(guest.id);
    return true;
  });

  const currentGuests = guests.filter(g => isGuestStaying(g.id));
  const pastGuests = guests.filter(g => hasGuestStayed(g.id) && !isGuestStaying(g.id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Misafir Yönetimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Toplam {guests.length} misafir • {currentGuests.length} konaklayan
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={20} /> Yeni Misafir Ekle
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tümü ({guests.length})
          </button>
          <button
            onClick={() => setFilter('current')}
            className={`btn ${filter === 'current' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Konaklayanlar ({currentGuests.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Geçmiş Misafirler ({pastGuests.length})
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>İsim</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>TC Kimlik No</th>
              <th>Durum</th>
              <th>Ziyaret</th>
              <th>Harcama</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <UserCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Misafir bulunamadı</p>
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => {
                const staying = isGuestStaying(guest.id);
                const past = hasGuestStayed(guest.id);

                return (
                  <tr key={guest.id}>
                    <td><strong>{guest.name}</strong></td>
                    <td>{guest.email}</td>
                    <td>{guest.phone}</td>
                    <td>{guest.idNumber}</td>
                    <td>
                      {staying ? (
                        <span className="badge badge-success">Konaklıyor</span>
                      ) : past ? (
                        <span className="badge badge-info">Geçmiş Misafir</span>
                      ) : (
                        <span className="badge badge-warning">Kayıt</span>
                      )}
                    </td>
                    <td>{guest.visits} kez</td>
                    <td>{guest.totalSpent.toLocaleString('tr-TR')} TL</td>
                    <td>
                      <button
                        onClick={() => openEditModal(guest)}
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem', padding: '0.5rem' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem' }}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingGuest ? 'Misafir Düzenle' : 'Yeni Misafir Ekle'}</h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">İsim Soyisim</label>
                <input
                  type="text"
                  className="form-input"
                  {...formik.getFieldProps('name')}
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="form-error">{formik.errors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  {...formik.getFieldProps('email')}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="form-error">{formik.errors.email}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Telefon</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="5551234567"
                  {...formik.getFieldProps('phone')}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="form-error">{formik.errors.phone}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">TC Kimlik No</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={11}
                  {...formik.getFieldProps('idNumber')}
                />
                {formik.touched.idNumber && formik.errors.idNumber && (
                  <div className="form-error">{formik.errors.idNumber}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Adres</label>
                <textarea
                  className="form-input"
                  rows={3}
                  {...formik.getFieldProps('address')}
                />
                {formik.touched.address && formik.errors.address && (
                  <div className="form-error">{formik.errors.address}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingGuest ? 'Güncelle' : 'Ekle'}
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
            <h3>Misafiri Sil</h3>
            <p>Bu misafiri silmek istediğinizden emin misiniz?</p>
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

export default GuestsPage;

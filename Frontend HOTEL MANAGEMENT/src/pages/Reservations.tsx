import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { Reservation, ReservationStatus, CreateReservationPayload } from '../types';
import { Plus, Edit, Calendar, CheckCircle, XCircle, LogOut, LogIn } from 'lucide-react';

const reservationSchema = Yup.object({
  roomId: Yup.string().required('Oda seçimi gerekli'),
  checkInDate: Yup.string().required('Giriş tarihi gerekli'),
  checkOutDate: Yup.string().required('Çıkış tarihi gerekli'),
  numberOfGuests: Yup.number().required('Misafir sayısı gerekli').min(1, 'En az 1 misafir olmalı'),
  primaryGuestName: Yup.string().required('Ad Soyad gerekli'),
  primaryGuestIdNumber: Yup.string().required('TCKN/Pasaport No gerekli').length(11, 'TCKN 11 haneli olmalıdır'),
  primaryGuestEmail: Yup.string().email('Geçerli email giriniz'),
  primaryGuestPhone: Yup.string().required('Telefon gerekli'),
  totalAmount: Yup.number().min(0),
  paidAmount: Yup.number().min(0),
  specialRequests: Yup.string(),
  additionalGuests: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required(),
      idNumber: Yup.string(),
      phone: Yup.string(),
      email: Yup.string(),
      address: Yup.string()
    })
  )
});

const ReservationsPage: React.FC = () => {
  const {
    reservations, addReservation, updateReservation, checkInReservation, checkOutReservation,
    rooms, guests
  } = useHotel();

  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'checked-in' | 'checked-out'>('all');

  const [searchTerm, setSearchTerm] = useState('');

  // State for additional guest adding
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [additionalGuestSearch, setAdditionalGuestSearch] = useState('');

  const formik = useFormik({
    initialValues: {
      roomId: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      numberOfGuests: 1,
      specialRequests: '',
      paymentMethod: 'cash',
      paidAmount: 0,
      totalAmount: 0,
      // Guest Info
      primaryGuestName: '',
      primaryGuestEmail: '',
      primaryGuestPhone: '',
      primaryGuestIdNumber: '',
      primaryGuestAddress: '',
      additionalGuests: [] as { name: string; idNumber: string; phone: string; email: string; address: string }[]
    },
    validationSchema: reservationSchema,
    onSubmit: async (values) => {
      const room = rooms.find(r => r.id === values.roomId);
      // Auto-calculate total if 0
      let total = values.totalAmount;
      if (total <= 0 && room) {
        const nights = Math.ceil(
          (new Date(values.checkOutDate).getTime() - new Date(values.checkInDate).getTime()) / 86400000
        );
        total = room.price * nights;
      }

      // Calculate total guests count (Primary + Additional)
      // Check if manual numberOfGuests is less than actual people count
      const peopleCount = 1 + values.additionalGuests.length;
      const finalNumberOfGuests = Math.max(values.numberOfGuests, peopleCount);

      if (editingReservation) {
        // Update logic (simplified for now, mostly status/room/dates)
        await updateReservation(editingReservation.id, {
          roomId: values.roomId,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          numberOfGuests: finalNumberOfGuests,
          specialRequests: values.specialRequests,
          paidAmount: values.paidAmount,
          totalAmount: values.totalAmount,
          paymentMethod: values.paymentMethod
        });
      } else {
        // New Reservation
        const payload: CreateReservationPayload = {
          roomId: values.roomId,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          numberOfGuests: finalNumberOfGuests,
          specialRequests: values.specialRequests,
          totalAmount: total,
          paidAmount: values.paidAmount,
          paymentMethod: values.paymentMethod,
          primaryGuestName: values.primaryGuestName,
          primaryGuestEmail: values.primaryGuestEmail,
          primaryGuestPhone: values.primaryGuestPhone,
          primaryGuestIdNumber: values.primaryGuestIdNumber,
          primaryGuestAddress: values.primaryGuestAddress,
          additionalGuests: values.additionalGuests
        };
        await addReservation(payload);
      }

      setShowModal(false);
      setEditingReservation(null);
      formik.resetForm();
    },
  });

  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    // Find primary guest details
    const guest = guests.find(g => g.id === reservation.guestId);

    // Find additional guests (guests in reservation list but not the primary one)
    const otherGuests = reservation.guests?.filter(g => g.id !== reservation.guestId).map(g => ({
      name: g.name,
      idNumber: g.idNumber,
      phone: g.phone,
      email: g.email,
      address: g.address
    })) || [];

    formik.setValues({
      ...formik.initialValues,
      roomId: reservation.roomId,
      checkInDate: reservation.checkInDate.split('T')[0],
      checkOutDate: reservation.checkOutDate.split('T')[0],
      numberOfGuests: reservation.numberOfGuests,
      specialRequests: reservation.specialRequests || '',
      paidAmount: reservation.paidAmount || 0,
      totalAmount: reservation.totalAmount || 0,
      paymentMethod: reservation.paymentMethod || 'cash',

      // Populate guest details so the summary card appears
      primaryGuestName: guest?.name || '',
      primaryGuestIdNumber: guest?.idNumber || '',
      primaryGuestPhone: guest?.phone || '',
      primaryGuestEmail: guest?.email || '',
      primaryGuestAddress: guest?.address || '',
      additionalGuests: otherGuests
    });

    if (guest) {
      setSearchTerm(guest.name);
    } else {
      setSearchTerm('');
    }

    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingReservation(null);
    formik.resetForm();
    setShowModal(true);
  };

  const handleStatusChange = async (reservationId: string, newStatus: ReservationStatus) => {
    if (newStatus === 'checked-in') {
      await checkInReservation(reservationId);
    } else if (newStatus === 'checked-out') {
      await checkOutReservation(reservationId);
    } else {
      updateReservation(reservationId, { status: newStatus });
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Bekliyor' },
      confirmed: { class: 'badge-info', text: 'Onaylandı' },
      'checked-in': { class: 'badge-success', text: 'Giriş Yapıldı' },
      'checked-out': { class: 'badge-secondary', text: 'Çıkış Yapıldı' },
      cancelled: { class: 'badge-danger', text: 'İptal' },
    };
    return badges[status];
  };

  const filteredReservations = reservations.filter(res => {
    if (filter === 'all') return true;
    return res.status === filter;
  });

  // Filter rooms available for dates could be complex, simplified here
  const availableRooms = rooms;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Rezervasyon Yönetimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Toplam {reservations.length} rezervasyon
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={20} /> Yeni Rezervasyon
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'confirmed', 'checked-in', 'checked-out'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'Tümü' : getStatusBadge(f as ReservationStatus).text}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Misafir</th>
              <th>Oda</th>
              <th>Tarihler</th>
              <th>Misafir Sayısı</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Rezervasyon bulunamadı</p>
                </td>
              </tr>
            ) : (
              filteredReservations.map((reservation) => {
                const room = rooms.find(r => r.id === reservation.roomId);
                const badge = getStatusBadge(reservation.status);
                // Primary guest name from guests array if populated by backend
                const guestName = reservation.guests?.find(g => g.isPrimaryGuest)?.name || 'Yükleniyor...';

                return (
                  <tr key={reservation.id}>
                    <td>
                      <strong>{guestName}</strong>

                      {/* Additional Guests List */}
                      {reservation.guests && reservation.guests.filter(g => !g.isPrimaryGuest).length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem' }}>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', listStyleType: 'disc' }}>
                            {reservation.guests.filter(g => !g.isPrimaryGuest).map(g => (
                              <li key={g.id}>{g.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {reservation.guests?.find(g => g.isPrimaryGuest)?.phone}
                      </div>
                    </td>
                    <td>
                      <div>Oda {room?.number}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{room?.type}</div>
                    </td>
                    <td>
                      <div>{new Date(reservation.checkInDate).toLocaleDateString('tr-TR')} &rarr;</div>
                      <div>{new Date(reservation.checkOutDate).toLocaleDateString('tr-TR')}</div>
                    </td>
                    <td>{reservation.numberOfGuests} kişi</td>
                    <td>
                      <div>Top: {reservation.totalAmount?.toLocaleString('tr-TR')} TL</div>
                      <div style={{ fontSize: '0.8rem', color: reservation.isPaid ? 'green' : 'red' }}>
                        {reservation.isPaid ? 'Ödendi' : `Kalan: ${(reservation.totalAmount - reservation.paidAmount).toLocaleString('tr-TR')} TL`}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badge.class}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => openEditModal(reservation)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem' }}
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>

                        {reservation.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                            className="btn btn-success"
                            style={{ padding: '0.5rem' }}
                            title="Onayla"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(reservation.id, 'checked-in')}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem' }}
                            title="Check-in Yap"
                          >
                            <LogIn size={16} />
                          </button>
                        )}

                        {reservation.status === 'checked-in' && (
                          <button
                            onClick={() => handleStatusChange(reservation.id, 'checked-out')}
                            className="btn btn-warning"
                            style={{ padding: '0.5rem' }}
                            title="Check-out Yap"
                          >
                            <LogOut size={16} />
                          </button>
                        )}

                        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                            className="btn btn-danger"
                            style={{ padding: '0.5rem' }}
                            title="İptal"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
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
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <h3>{editingReservation ? 'Rezervasyon Düzenle' : 'Yeni Rezervasyon'}</h3>
            <form onSubmit={formik.handleSubmit}>

              {!editingReservation && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4>Misafir Seçimi</h4>

                    <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                      <label className="form-label">Misafir</label>

                      {/* Selected Guest View */}
                      {formik.values.primaryGuestName ? (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.375rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              backgroundColor: '#166534',
                              color: 'white',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <CheckCircle size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#166534' }}>{formik.values.primaryGuestName}</div>
                              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                                {formik.values.primaryGuestIdNumber ? `TCKN: ${formik.values.primaryGuestIdNumber}` : ''}
                                {formik.values.primaryGuestPhone ? ` • Tel: ${formik.values.primaryGuestPhone}` : ''}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              formik.setFieldValue('primaryGuestName', '');
                              formik.setFieldValue('primaryGuestIdNumber', '');
                              formik.setFieldValue('primaryGuestPhone', '');
                              formik.setFieldValue('primaryGuestEmail', '');
                              formik.setFieldValue('primaryGuestAddress', '');
                              setSearchTerm('');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                          >
                            Değiştir
                          </button>
                        </div>
                      ) : (
                        /* Search Input View */
                        <>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="İsim, TCKN veya Telefon ile misafir arayın..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoComplete="off"
                          />

                          {searchTerm.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 50,
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              marginTop: '0.25rem'
                            }}>
                              {guests
                                .filter(g => {
                                  // Active Reservation Check
                                  const activeStatuses = ['pending', 'confirmed', 'checked-in'];
                                  const hasActiveRes = reservations.some(r => {
                                    if (!r.guestId || !g.id) return false;
                                    const isSameGuest = String(r.guestId).toLowerCase() === String(g.id).toLowerCase();
                                    const status = String(r.status).toLowerCase();
                                    return isSameGuest && activeStatuses.includes(status);
                                  });
                                  if (hasActiveRes) return false;

                                  // Search Term Check
                                  const term = searchTerm.toLowerCase();
                                  return (
                                    g.name.toLowerCase().includes(term) ||
                                    g.idNumber.includes(term) ||
                                    g.phone.includes(term)
                                  );
                                })
                                .map(guest => (
                                  <div
                                    key={guest.id}
                                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                    onClick={() => {
                                      formik.setFieldValue('primaryGuestName', guest.name);
                                      formik.setFieldValue('primaryGuestIdNumber', guest.idNumber);
                                      formik.setFieldValue('primaryGuestPhone', guest.phone);
                                      formik.setFieldValue('primaryGuestEmail', guest.email);
                                      formik.setFieldValue('primaryGuestAddress', guest.address);
                                      setSearchTerm(''); // Clear search term to close dropdown effectively (though view switches anyway)
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    <div style={{ fontWeight: 500 }}>{guest.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                      {guest.idNumber} • {guest.phone}
                                    </div>
                                  </div>
                                ))}
                              {guests.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div style={{ padding: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                                  Sonuç bulunamadı.
                                </div>
                              )}
                            </div>
                          )}
                          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                            * Rezervasyon oluşturmak için listeden bir misafir seçmelisiniz.
                          </small>
                        </>
                      )}

                      {formik.submitCount > 0 && !formik.values.primaryGuestName && (
                        <div className="form-error" style={{ marginTop: '0.5rem' }}>
                          Lütfen bir misafir seçiniz.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Guests Section */}
                  <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Diğer Misafirler</h4>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {1 + formik.values.additionalGuests.length} / {rooms.find(r => r.id === formik.values.roomId)?.capacity || '?'} Kişi
                      </span>
                    </div>

                    {/* List of Additional Guests */}
                    {formik.values.additionalGuests.length > 0 && (
                      <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                        {formik.values.additionalGuests.map((guest, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                {index + 2}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{guest.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{guest.idNumber}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newGuests = [...formik.values.additionalGuests];
                                newGuests.splice(index, 1);
                                formik.setFieldValue('additionalGuests', newGuests);
                              }}
                              className="btn btn-danger"
                              style={{ padding: '0.25rem', height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Kaldır"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Guest Control */}
                    {!isAddingGuest ? (
                      <button
                        type="button"
                        onClick={() => {
                          const room = rooms.find(r => r.id === formik.values.roomId);
                          if (!room) {
                            alert('Lütfen önce bir oda seçiniz.');
                            return;
                          }
                          const max = room.capacity;
                          const current = 1 + formik.values.additionalGuests.length;
                          if (current >= max) {
                            alert(`Bu oda en fazla ${max} kişiliktir.`);
                            return;
                          }
                          setIsAddingGuest(true);
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Plus size={16} /> Misafir Ekle
                      </button>
                    ) : (
                      <div className="card" style={{ padding: '0.75rem', border: '1px solid #3b82f6' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Misafir ara..."
                            value={additionalGuestSearch}
                            onChange={(e) => setAdditionalGuestSearch(e.target.value)}
                            autoFocus
                          />
                          {additionalGuestSearch.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 60,
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              maxHeight: '150px',
                              overflowY: 'auto',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                              {guests
                                .filter(g => {
                                  // Should not specific same guest twice
                                  if (g.name === formik.values.primaryGuestName) return false;
                                  const alreadyAdded = formik.values.additionalGuests.some(ag => ag.name === g.name);
                                  if (alreadyAdded) return false;

                                  const term = additionalGuestSearch.toLowerCase();
                                  return (
                                    g.name.toLowerCase().includes(term) ||
                                    g.idNumber.includes(term)
                                  );
                                })
                                .map(g => (
                                  <div
                                    key={g.id}
                                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                    onClick={() => {
                                      const newGuest = {
                                        name: g.name,
                                        idNumber: g.idNumber,
                                        phone: g.phone,
                                        email: g.email,
                                        address: g.address
                                      };
                                      formik.setFieldValue('additionalGuests', [...formik.values.additionalGuests, newGuest]);
                                      setAdditionalGuestSearch('');
                                      setIsAddingGuest(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{g.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{g.idNumber}</div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => { setIsAddingGuest(false); setAdditionalGuestSearch(''); }}
                            style={{ fontSize: '0.85rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <h4>Konaklama Detayları</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Oda Seçimi</label>
                  <select className="form-input" {...formik.getFieldProps('roomId')}>
                    <option value="">Oda Seçiniz</option>
                    {availableRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.number} - {room.type} ({room.status}) - {room.price} TL
                      </option>
                    ))}
                  </select>
                  {formik.touched.roomId && formik.errors.roomId && (
                    <div className="form-error">{formik.errors.roomId}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Misafir Sayısı</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    {...formik.getFieldProps('numberOfGuests')}
                  />
                  {formik.touched.numberOfGuests && formik.errors.numberOfGuests && (
                    <div className="form-error">{formik.errors.numberOfGuests}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Giriş Tarihi</label>
                  <input type="date" className="form-input" {...formik.getFieldProps('checkInDate')} />
                  {formik.touched.checkInDate && formik.errors.checkInDate && (
                    <div className="form-error">{formik.errors.checkInDate}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Çıkış Tarihi</label>
                  <input type="date" className="form-input" {...formik.getFieldProps('checkOutDate')} />
                  {formik.touched.checkOutDate && formik.errors.checkOutDate && (
                    <div className="form-error">{formik.errors.checkOutDate}</div>
                  )}
                </div>
              </div>


              <>
                <h4>Ödeme Bilgileri</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Ödenen Tutar</label>
                    <input type="number" className="form-input" min="0" {...formik.getFieldProps('paidAmount')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Toplam Tutar (0=Otomatik)</label>
                    <input type="number" className="form-input" min="0" {...formik.getFieldProps('totalAmount')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ödeme Yöntemi</label>
                    <select className="form-input" {...formik.getFieldProps('paymentMethod')}>
                      <option value="cash">Nakit</option>
                      <option value="credit_card">Kredi Kartı</option>
                      <option value="bank_transfer">Havale/EFT</option>
                    </select>
                  </div>
                </div>
              </>


              <div className="form-group">
                <label className="form-label">Özel İstekler</label>
                <textarea
                  className="form-input"
                  rows={3}
                  {...formik.getFieldProps('specialRequests')}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReservation ? 'Güncelle' : 'Rezervasyon Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default ReservationsPage;

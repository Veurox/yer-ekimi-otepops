import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { useHotel } from '../context/HotelContext';
import { MaintenancePriority } from '../types';
import { Plus, Wrench } from 'lucide-react';

const maintenanceSchema = Yup.object({
  title: Yup.string().required('Başlık gerekli'),
  description: Yup.string().required('Açıklama gerekli'),
  priority: Yup.string().required('Öncelik gerekli'),
});

const CustomerMaintenance: React.FC = () => {
  const { user } = useAuth();
  const { maintenanceRequests, addMaintenanceRequest, rooms } = useHotel();
  const [showModal, setShowModal] = useState(false);

  const myRoom = rooms.find(r => r.number === user?.roomNumber);
  const myRequests = maintenanceRequests.filter(m => {
    const room = rooms.find(r => r.id === m.roomId);
    return room?.number === user?.roomNumber;
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium' as MaintenancePriority,
    },
    validationSchema: maintenanceSchema,
    onSubmit: (values) => {
      if (!myRoom) return;

      addMaintenanceRequest({
        roomId: myRoom.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: 'pending',
        reportedBy: user ? `${user.firstName} ${user.lastName}` : 'Müşteri',
        createdAt: new Date().toISOString(),
      });

      setShowModal(false);
      formik.resetForm();
      alert('Arıza kaydınız alındı! En kısa sürede ilgilenilecektir.');
    },
  });

  const getPriorityBadge = (priority: MaintenancePriority) => {
    const badges = {
      low: { class: 'badge-info', text: 'Düşük' },
      medium: { class: 'badge-warning', text: 'Orta' },
      high: { class: 'badge-danger', text: 'Yüksek' },
      urgent: { class: 'badge-danger', text: '🚨 ACİL' },
    };
    return badges[priority];
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { class: 'badge-warning', text: '⏳ Bekliyor' },
      'in-progress': { class: 'badge-info', text: '🔧 Devam Ediyor' },
      completed: { class: 'badge-success', text: '✅ Tamamlandı' },
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Arıza ve Talep Bildirimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Oda {user?.roomNumber} • {myRequests.filter(r => r.status !== 'completed').length} açık talep
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={20} /> Yeni Arıza Bildir
        </button>
      </div>

      {/* Bilgilendirme */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#1e40af' }}>
          💡 Bilgi
        </h4>
        <p style={{ margin: 0, color: '#1e40af', fontSize: '0.875rem' }}>
          Odanızda herhangi bir arıza veya eksiklik tespit ettiğinizde buradan bildirebilirsiniz. 
          Teknik ekibimiz en kısa sürede ilgilenecektir.
        </p>
      </div>

      {/* Taleplerim */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Arıza ve Taleplerim</h3>
        {myRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Wrench size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Henüz arıza kaydınız bulunmamaktadır</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Başlık</th>
                <th>Açıklama</th>
                <th>Öncelik</th>
                <th>Durum</th>
                <th>Atanan</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((request) => {
                const priorityBadge = getPriorityBadge(request.priority);
                const statusBadge = getStatusBadge(request.status);

                return (
                  <tr key={request.id}>
                    <td>{new Date(request.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td><strong>{request.title}</strong></td>
                    <td style={{ maxWidth: '300px' }}>{request.description}</td>
                    <td>
                      <span className={`badge ${priorityBadge.class}`}>
                        {priorityBadge.text}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>{request.assignedTo ? 'Teknisyen atandı' : 'Atanmadı'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Yeni Arıza Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Arıza Bildirimi</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Oda {user?.roomNumber} için arıza bildirimi
            </p>

            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Başlık</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Klima çalışmıyor"
                  {...formik.getFieldProps('title')}
                />
                {formik.touched.title && formik.errors.title && (
                  <div className="form-error">{formik.errors.title}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Detaylı Açıklama</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Lütfen sorunu detaylı açıklayın..."
                  {...formik.getFieldProps('description')}
                />
                {formik.touched.description && formik.errors.description && (
                  <div className="form-error">{formik.errors.description}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Öncelik Seviyesi</label>
                <select className="form-input" {...formik.getFieldProps('priority')}>
                  <option value="low">Düşük - Acil değil</option>
                  <option value="medium">Orta - Normal talep</option>
                  <option value="high">Yüksek - Önemli</option>
                  <option value="urgent">Acil - Hemen müdahale gerekli</option>
                </select>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Acil durumlar (su kaçağı, elektrik arızası vb.) için "Acil" seçeneğini kullanın
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  Arıza Bildir
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMaintenance;

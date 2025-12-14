import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../types';
import { Plus, Edit, Wrench, CheckCircle, Clock } from 'lucide-react';

const maintenanceSchema = Yup.object({
  roomId: Yup.string().required('Oda seçimi gerekli'),
  title: Yup.string().required('Başlık gerekli'),
  description: Yup.string().required('Açıklama gerekli'),
  priority: Yup.string().required('Öncelik gerekli'),
  assignedTo: Yup.string(),
});

const MaintenancePage: React.FC = () => {
  const { maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest, rooms, staff, updateRoom } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const formik = useFormik({
    initialValues: {
      roomId: '',
      title: '',
      description: '',
      priority: 'medium' as MaintenancePriority,
      assignedTo: '',
    },
    validationSchema: maintenanceSchema,
    onSubmit: (values) => {
      const requestData = {
        ...values,
        status: editingRequest?.status || ('pending' as MaintenanceStatus),
        reportedBy: 'Sistem',
        createdAt: editingRequest?.createdAt || new Date().toISOString(),
        assignedTo: values.assignedTo || undefined,
      };

      if (editingRequest) {
        updateMaintenanceRequest(editingRequest.id, requestData);
      } else {
        addMaintenanceRequest(requestData);
        // Odayı bakım durumuna al
        updateRoom(values.roomId, { status: 'maintenance' });
      }

      setShowModal(false);
      setEditingRequest(null);
      formik.resetForm();
    },
  });

  const openEditModal = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    formik.setValues({
      roomId: request.roomId,
      title: request.title,
      description: request.description,
      priority: request.priority,
      assignedTo: request.assignedTo || '',
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingRequest(null);
    formik.resetForm();
    setShowModal(true);
  };

  const handleStatusChange = (requestId: string, newStatus: MaintenanceStatus, roomId: string) => {
    updateMaintenanceRequest(requestId, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });

    // Bakım tamamlandığında odayı müsait duruma al
    if (newStatus === 'completed') {
      updateRoom(roomId, { status: 'available' });
    }
  };

  const getPriorityBadge = (priority: MaintenancePriority) => {
    const badges = {
      low: { class: 'badge-info', text: 'Düşük' },
      medium: { class: 'badge-warning', text: 'Orta' },
      high: { class: 'badge-danger', text: 'Yüksek' },
      urgent: { class: 'badge-danger', text: '🚨 ACİL' },
    };
    // @ts-ignore
    return badges[priority] || { class: 'badge-secondary', text: priority };
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Bekliyor' },
      'in-progress': { class: 'badge-info', text: 'Devam Ediyor' },
      completed: { class: 'badge-success', text: 'Tamamlandı' },
    };
    // @ts-ignore
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const filteredRequests = maintenanceRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const technicians = staff.filter(s => s.role === 'maintenance');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Teknik Servis Yönetimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            {maintenanceRequests.filter(r => r.status !== 'completed').length} açık talep
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={20} /> Yeni Arıza Kaydı
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tümü ({maintenanceRequests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-secondary'}`}
          >
            Bekleyen ({maintenanceRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`btn ${filter === 'in-progress' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Devam Eden ({maintenanceRequests.filter(r => r.status === 'in-progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn ${filter === 'completed' ? 'btn-success' : 'btn-secondary'}`}
          >
            Tamamlanan ({maintenanceRequests.filter(r => r.status === 'completed').length})
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>Başlık</th>
              <th>Açıklama</th>
              <th>Öncelik</th>
              <th>Durum</th>
              <th>Atanan</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Wrench size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Bakım talebi bulunamadı</p>
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => {
                const room = rooms.find(r => r.id === request.roomId);
                const assignedStaff = staff.find(s => s.id === request.assignedTo);
                const priorityBadge = getPriorityBadge(request.priority);
                const statusBadge = getStatusBadge(request.status);

                return (
                  <tr key={request.id}>
                    <td><strong>Oda {room?.number || 'N/A'}</strong></td>
                    <td>{request.title}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {request.description}
                    </td>
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
                    <td>{assignedStaff ? `${assignedStaff.firstName} ${assignedStaff.lastName}` : 'Atanmadı'}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => openEditModal(request)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem' }}
                          title="Düzenle"
                        >
                          <Edit size={16} />
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'in-progress', request.roomId)}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem' }}
                            title="Başlat"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                        {request.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'completed', request.roomId)}
                            className="btn btn-success"
                            style={{ padding: '0.5rem' }}
                            title="Tamamla"
                          >
                            <CheckCircle size={16} />
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRequest ? 'Bakım Talebi Düzenle' : 'Yeni Arıza Kaydı'}</h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Oda</label>
                <select className="form-input" {...formik.getFieldProps('roomId')}>
                  <option value="">Oda Seçiniz</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Oda {room.number} - Kat {room.floor}
                    </option>
                  ))}
                </select>
                {formik.touched.roomId && formik.errors.roomId && (
                  <div className="form-error">{formik.errors.roomId}</div>
                )}
              </div>

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
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Detaylı açıklama..."
                  {...formik.getFieldProps('description')}
                />
                {formik.touched.description && formik.errors.description && (
                  <div className="form-error">{formik.errors.description}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Öncelik</label>
                <select className="form-input" {...formik.getFieldProps('priority')}>
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Teknisyen Ata</label>
                <select className="form-input" {...formik.getFieldProps('assignedTo')}>
                  <option value="">Atanmadı</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingRequest ? 'Güncelle' : 'Kaydet'}
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

export default MaintenancePage;

import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useHotel } from '../context/HotelContext';
import { Staff, StaffRole, ShiftType } from '../types';
import { ROLE_LABELS } from '../utils/permissions';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

const staffSchema = Yup.object({
  userName: Yup.string().required('Kullanıcı adı gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı'),
  firstName: Yup.string().required('İsim gerekli'),
  lastName: Yup.string().required('Soyisim gerekli'),
  email: Yup.string().email('Geçerli email giriniz').required('Email gerekli'),
  phoneNumber: Yup.string().required('Telefon gerekli'),
  role: Yup.string().required('Rol gerekli'),
  shift: Yup.string().required('Vardiya gerekli'),
  salary: Yup.number().required('Maaş gerekli').min(0, 'Maaş 0\'dan büyük olmalı'),
  hireDate: Yup.string().required('İşe giriş tarihi gerekli'),
});

const StaffPage: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      userName: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'receptionist' as StaffRole,
      shift: 'morning' as ShiftType,
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      isActive: true,
    },
    validationSchema: staffSchema,
    validate: (values) => {
      const errors: any = {};
      if (!editingStaff && !values.password) {
        errors.password = 'Şifre gerekli';
      }
      return errors;
    },
    onSubmit: (values) => {
      if (editingStaff) {
        const { password, ...rest } = values;
        const updateData = password ? values : rest;
        updateStaff(editingStaff.id, updateData);
      } else {
        const { password, ...staffData } = values;
        addStaff({ ...staffData, password } as Omit<Staff, 'id'>);
      }

      setShowModal(false);
      setEditingStaff(null);
      formik.resetForm();
    },
  });

  const openEditModal = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    formik.setValues({
      userName: staffMember.userName || '',
      password: '',
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber,
      role: staffMember.role,
      shift: staffMember.shift,
      salary: staffMember.salary,
      hireDate: staffMember.hireDate,
      isActive: staffMember.isActive,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    formik.resetForm();
    setShowModal(true);
  };

  const getShiftLabel = (shift: ShiftType) => {
    const labels = {
      morning: 'Sabah (08:00-16:00)',
      afternoon: 'Öğleden Sonra (16:00-00:00)',
      night: 'Gece (00:00-08:00)',
    };
    return labels[shift];
  };


  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteStaff(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Personel Yönetimi</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Toplam {staff.length} personel</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={20} /> Yeni Personel Ekle
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Kullanıcı Adı</th>
              <th>İsim</th>
              <th>Soyisim</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Rol</th>
              <th>Vardiya</th>
              <th>Maaş</th>
              <th>İşe Giriş</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>Henüz personel eklenmemiş</p>
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.userName}</td>
                  <td><strong>{member.firstName}</strong></td>
                  <td><strong>{member.lastName}</strong></td>
                  <td>{member.email}</td>
                  <td>{member.phoneNumber}</td>
                  <td>
                    <span className="badge badge-info">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td>{getShiftLabel(member.shift)}</td>
                  <td>{member.salary.toLocaleString('tr-TR')} TL</td>
                  <td>{new Date(member.hireDate).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <button
                      onClick={() => openEditModal(member)}
                      className="btn btn-secondary"
                      style={{ marginRight: '0.5rem', padding: '0.5rem' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="form-group">
                <label className="form-label">Kullanıcı Adı</label>
                <input
                  type="text"
                  className="form-input"
                  {...formik.getFieldProps('userName')}
                />
                {formik.touched.userName && formik.errors.userName && (
                  <div className="form-error">{formik.errors.userName}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Şifre {editingStaff && <span style={{ fontWeight: 'normal', fontSize: '0.8em' }}>(Değiştirmek istemiyorsanız boş bırakın)</span>}
                </label>
                <input
                  type="password"
                  className="form-input"
                  {...formik.getFieldProps('password')}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="form-error">{formik.errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">İsim</label>
                <input
                  type="text"
                  className="form-input"
                  {...formik.getFieldProps('firstName')}
                />
                {formik.touched.firstName && formik.errors.firstName && (
                  <div className="form-error">{formik.errors.firstName}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Soyisim</label>
                <input
                  type="text"
                  className="form-input"
                  {...formik.getFieldProps('lastName')}
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <div className="form-error">{formik.errors.lastName}</div>
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
                  {...formik.getFieldProps('phoneNumber')}
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <div className="form-error">{formik.errors.phoneNumber}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-input" {...formik.getFieldProps('role')}>
                  <option value="receptionist">Resepsiyonist</option>
                  <option value="housekeeping">Temizlik Personeli</option>
                  <option value="maintenance">Teknisyen</option>
                  <option value="room-service">Oda Servisi/Mutfak</option>
                  <option value="manager">Yönetici</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vardiya</label>
                <select className="form-input" {...formik.getFieldProps('shift')}>
                  <option value="morning">Sabah (08:00-16:00)</option>
                  <option value="afternoon">Öğleden Sonra (16:00-00:00)</option>
                  <option value="night">Gece (00:00-08:00)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maaş (TL)</label>
                <input
                  type="number"
                  className="form-input"
                  {...formik.getFieldProps('salary')}
                />
                {formik.touched.salary && formik.errors.salary && (
                  <div className="form-error">{formik.errors.salary}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">İşe Giriş Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  {...formik.getFieldProps('hireDate')}
                />
                {formik.touched.hireDate && formik.errors.hireDate && (
                  <div className="form-error">{formik.errors.hireDate}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingStaff ? 'Güncelle' : 'Ekle'}
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
            <h3>Personeli Sil</h3>
            <p>Bu personeli silmek istediğinizden emin misiniz?</p>
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

export default StaffPage;

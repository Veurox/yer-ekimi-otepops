import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { PosTransaction, RoomChargesSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, CreditCard, X, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './POS.css';

const CATEGORIES = ['Restaurant', 'Bar', 'Spa', 'Minibar', 'Laundry', 'Other'];

const categoryLabel: Record<string, string> = {
  Restaurant: 'Restoran',
  Bar: 'Bar',
  Spa: 'Spa',
  Minibar: 'Minibar',
  Laundry: 'Çamaşırhane',
  Other: 'Diğer',
};

const statusBadge: Record<string, string> = {
  Pending: 'badge-warning',
  ChargedToRoom: 'badge-success',
  Paid: 'badge-info',
  Cancelled: 'badge-danger',
};

const statusLabel: Record<string, string> = {
  Pending: 'Bekliyor',
  ChargedToRoom: 'Odaya Eklendi',
  Paid: 'Ödendi',
  Cancelled: 'İptal',
};

const POSPage: React.FC = () => {
  const { user } = useAuth();
  const [reservationId, setReservationId] = useState('');
  const [summary, setSummary] = useState<RoomChargesSummary | null>(null);
  const [allTransactions, setAllTransactions] = useState<PosTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'all'>('all');

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Restaurant',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await hotelService.getPosTransactions();
      setAllTransactions(res.data);
    } catch {
      setError('İşlemler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const searchReservation = async () => {
    if (!reservationId.trim()) return;
    setLoading(true);
    setError('');
    setSummary(null);
    try {
      const res = await hotelService.getRoomCharges(reservationId.trim());
      setSummary(res.data);
    } catch {
      setError('Rezervasyon bulunamadı veya POS kaydı yok.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!summary || !form.description || !form.amount) return;
    setSaving(true);
    setError('');
    try {
      await hotelService.createPosTransaction({
        reservationId: summary.reservationId,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        createdBy: user ? `${user.firstName} ${user.lastName}` : 'Staff',
      });
      setForm({ description: '', amount: '', category: 'Restaurant' });
      setShowForm(false);
      await searchReservation();
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'İşlem eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleChargeToRoom = async (transactionId: string) => {
    setSaving(true);
    try {
      await hotelService.chargeToRoom(transactionId);
      if (summary) await searchReservation();
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Oda hesabına eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (transactionId: string) => {
    if (!window.confirm('Bu işlemi iptal etmek istediğinize emin misiniz?')) return;
    setSaving(true);
    try {
      await hotelService.cancelPosTransaction(transactionId);
      if (summary) await searchReservation();
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'İptal işlemi başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <ShoppingCart size={28} style={{ marginRight: 10, verticalAlign: 'middle' }} />
          POS – Satış & Oda Hesabı
        </h1>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('all')}
        >
          Tüm İşlemler
        </button>
        <button
          className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} style={{ marginRight: 4 }} />
          Rezervasyona Göre
        </button>
      </div>

      {/* All Transactions Tab */}
      {activeTab === 'all' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Tüm POS İşlemleri</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loading}>
              Yenile
            </button>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Yükleniyor…</p>
          ) : allTransactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Henüz POS işlemi yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Oda</th>
                    <th>Misafir</th>
                    <th>Açıklama</th>
                    <th>Kategori</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.roomNumber}</strong></td>
                      <td>{t.guestName}</td>
                      <td>{t.description}</td>
                      <td><span className="badge badge-info">{categoryLabel[t.category] || t.category}</span></td>
                      <td><strong>{t.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></td>
                      <td><span className={`badge ${statusBadge[t.status] || 'badge-secondary'}`}>{statusLabel[t.status] || t.status}</span></td>
                      <td>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {t.status === 'Pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleChargeToRoom(t.id)} disabled={saving} title="Odaya Ekle">
                                <CreditCard size={14} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)} disabled={saving} title="İptal">
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search by Reservation Tab */}
      {activeTab === 'search' && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Rezervasyon Ara</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                className="form-control"
                style={{ flex: 1, minWidth: 260 }}
                placeholder="Rezervasyon ID girin…"
                value={reservationId}
                onChange={e => setReservationId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchReservation()}
              />
              <button className="btn btn-primary" onClick={searchReservation} disabled={loading}>
                <Search size={16} style={{ marginRight: 4 }} />
                Ara
              </button>
            </div>
          </div>

          {summary && (
            <>
              {/* Summary Card */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Oda {summary.roomNumber} — {summary.guestName}</h3>
                    <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>Rezervasyon: {summary.reservationId}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>POS Toplamı</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                      {summary.totalCharges.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Genel Toplam: {summary.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowForm(!showForm)}
                >
                  <Plus size={16} style={{ marginRight: 4 }} />
                  Yeni Satış Ekle
                </button>
              </div>

              {/* Add Transaction Form */}
              {showForm && (
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid #3b82f6' }}>
                  <h4 style={{ marginTop: 0 }}>Yeni POS Satışı</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Açıklama</label>
                      <input
                        className="form-control"
                        placeholder="ör. Akşam yemeği, Kahvaltı…"
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tutar (₺)</label>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-control"
                        value={form.category}
                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{categoryLabel[c]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                      {saving ? 'Kaydediliyor…' : 'Ekle'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
                  </div>
                </div>
              )}

              {/* Charges Table */}
              <div className="card">
                <h4 style={{ marginTop: 0 }}>Satış Listesi</h4>
                {summary.charges.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '1.5rem' }}>Bu rezervasyona ait POS kaydı yok.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Açıklama</th>
                        <th>Kategori</th>
                        <th>Tutar</th>
                        <th>Durum</th>
                        <th>Oluşturan</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.charges.map(t => (
                        <tr key={t.id}>
                          <td>{t.description}</td>
                          <td><span className="badge badge-info">{categoryLabel[t.category] || t.category}</span></td>
                          <td><strong>{t.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></td>
                          <td><span className={`badge ${statusBadge[t.status] || 'badge-secondary'}`}>{statusLabel[t.status] || t.status}</span></td>
                          <td>{t.createdBy}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {t.status === 'Pending' && (
                                <>
                                  <button className="btn btn-success btn-sm" onClick={() => handleChargeToRoom(t.id)} disabled={saving} title="Odaya Ekle">
                                    <CreditCard size={14} /> Odaya Ekle
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)} disabled={saving} title="İptal">
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                              {t.status === 'ChargedToRoom' && (
                                <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={14} /> Eklendi
                                </span>
                              )}
                              {t.status === 'Pending' && (
                                <span style={{ color: '#f59e0b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={14} />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}><strong>Toplam POS</strong></td>
                        <td><strong style={{ color: '#ef4444' }}>{summary.totalCharges.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></td>
                        <td colSpan={3} />
                      </tr>
                      <tr>
                        <td colSpan={2}><strong>Rezervasyon Tutarı</strong></td>
                        <td><strong>{summary.reservationAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></td>
                        <td colSpan={3} />
                      </tr>
                      <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                        <td colSpan={2}><strong>Genel Toplam</strong></td>
                        <td><strong style={{ fontSize: '1.1rem' }}>{summary.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default POSPage;

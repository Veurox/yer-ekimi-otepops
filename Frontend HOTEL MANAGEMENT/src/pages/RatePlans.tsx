import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { RatePlan, CreateRatePlanPayload, CalculatedRate } from '../types';
import { Tag, Plus, Edit, Trash2, Calculator, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DISPLAY_TO_DOW = [1, 2, 3, 4, 5, 6, 0];

const emptyForm = (): CreateRatePlanPayload => ({
  name: '', description: '', adjustmentType: 'Percentage', adjustmentValue: 0,
  isActive: true, priority: 1, validFrom: '', validTo: '',
  applicableDays: [0, 1, 2, 3, 4, 5, 6], roomTypeRates: [],
});

const RatePlansPage: React.FC = () => {
  const [plans, setPlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRatePlanPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [calcRoomId, setCalcRoomId] = useState('');
  const [calcCheckIn, setCalcCheckIn] = useState('');
  const [calcCheckOut, setCalcCheckOut] = useState('');
  const [calcResult, setCalcResult] = useState<CalculatedRate | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    setLoading(true);
    try { const res = await hotelService.getRatePlans(); setPlans(res.data); }
    catch { setError('Rate planları yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setShowForm(true); setError(''); };

  const openEdit = (plan: RatePlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name, description: plan.description, adjustmentType: plan.adjustmentType,
      adjustmentValue: plan.adjustmentValue, isActive: plan.isActive, priority: plan.priority,
      validFrom: plan.validFrom ? plan.validFrom.substring(0, 10) : '',
      validTo: plan.validTo ? plan.validTo.substring(0, 10) : '',
      applicableDays: [...plan.applicableDays],
      roomTypeRates: plan.roomTypeRates.map(r => ({ roomType: r.roomType, fixedPricePerNight: r.fixedPricePerNight, additionalAdjustment: r.additionalAdjustment })),
    });
    setShowForm(true); setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Plan adı gerekli.'); return; }
    setSaving(true); setError('');
    try {
      const payload: CreateRatePlanPayload = { ...form, validFrom: form.validFrom || undefined, validTo: form.validTo || undefined };
      if (editingId) await hotelService.updateRatePlan(editingId, payload);
      else await hotelService.createRatePlan(payload);
      setShowForm(false); await loadPlans();
    } catch (e: any) { setError(e?.response?.data?.message || 'Kayıt başarısız.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu rate planı silinsin mi?')) return;
    try { await hotelService.deleteRatePlan(id); await loadPlans(); }
    catch (e: any) { setError(e?.response?.data?.message || 'Silme başarısız.'); }
  };

  const toggleDay = (dow: number) => {
    setForm(f => ({
      ...f,
      applicableDays: f.applicableDays.includes(dow)
        ? f.applicableDays.filter(d => d !== dow)
        : [...f.applicableDays, dow],
    }));
  };

  const handleCalc = async () => {
    if (!calcRoomId.trim() || !calcCheckIn || !calcCheckOut) { setCalcError('Tüm alanlar gerekli.'); return; }
    setCalcLoading(true); setCalcError(''); setCalcResult(null);
    try { const res = await hotelService.calculateRate(calcRoomId.trim(), calcCheckIn, calcCheckOut); setCalcResult(res.data); }
    catch (e: any) { setCalcError(e?.response?.data?.message || 'Hesaplama başarısız.'); }
    finally { setCalcLoading(false); }
  };

  const adjustLabel = (plan: RatePlan) => {
    const sign = plan.adjustmentValue >= 0 ? '+' : '';
    return plan.adjustmentType === 'Percentage' ? `${sign}${plan.adjustmentValue}%` : `${sign}${plan.adjustmentValue.toLocaleString('tr-TR')} ₺`;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <Tag size={24} style={{ color: '#646cff' }} />
        </div>
        <div>
          <h2>Rate Plan Yönetimi</h2>
          <p>Fiyat planları ve oran hesaplama</p>
        </div>
        <div className="page-header-actions">
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Yeni Plan
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Planı Düzenle' : 'Yeni Rate Plan'}</h3>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Plan Adı *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input" placeholder="Örn: Yaz Sezonu" />
            </div>
            <div className="form-group">
              <label className="form-label">Öncelik (düşük = daha önemli)</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Açıklama</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Ayarlama Tipi</label>
              <select value={form.adjustmentType} onChange={e => setForm(f => ({ ...f, adjustmentType: e.target.value as 'Percentage' | 'FixedAmount' }))}
                className="form-input">
                <option value="Percentage">Yüzde (%)</option>
                <option value="FixedAmount">Sabit Tutar (₺)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                Değer {form.adjustmentType === 'Percentage' ? '(% — negatif = indirim)' : '(₺ — negatif = indirim)'}
              </label>
              <input type="number" value={form.adjustmentValue} onChange={e => setForm(f => ({ ...f, adjustmentValue: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Geçerlilik Başlangıcı</label>
              <input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Geçerlilik Bitişi</label>
              <input type="date" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
                className="form-input" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Geçerli Günler</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {DAY_LABELS.map((label, i) => {
                  const dow = DISPLAY_TO_DOW[i];
                  const active = form.applicableDays.includes(dow);
                  return (
                    <button key={i} type="button" onClick={() => toggleDay(dow)}
                      className={`badge ${active ? 'badge-info' : 'badge-gray'}`}
                      style={{ cursor: 'pointer', border: active ? '2px solid #646cff' : '2px solid transparent' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" style={{ fontSize: '0.875rem' }}>Aktif</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Check size={14} style={{ marginRight: '0.25rem' }} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">
              <X size={14} style={{ marginRight: '0.25rem' }} /> İptal
            </button>
          </div>
        </div>
      )}

      {/* Plans Table */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Plan Adı</th>
                <th>Ayarlama</th>
                <th>Öncelik</th>
                <th>Geçerlilik</th>
                <th>Günler</th>
                <th style={{ textAlign: 'center' }}>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Rate plan bulunamadı</td></tr>
              )}
              {plans.map(plan => (
                <React.Fragment key={plan.id}>
                  <tr>
                    <td>
                      <button onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                        {expandedId === plan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {plan.name}
                      </button>
                      {plan.description && <p className="text-muted text-xs" style={{ paddingLeft: '1.25rem' }}>{plan.description}</p>}
                    </td>
                    <td style={{ fontWeight: 700, color: plan.adjustmentValue >= 0 ? '#10b981' : '#ef4444' }}>{adjustLabel(plan)}</td>
                    <td className="text-muted">{plan.priority}</td>
                    <td className="text-muted text-xs">
                      {plan.validFrom ? new Date(plan.validFrom).toLocaleDateString('tr-TR') : '—'}
                      {' – '}
                      {plan.validTo ? new Date(plan.validTo).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {DISPLAY_TO_DOW.map((dow, i) => (
                          <span key={i} className={`badge ${plan.applicableDays.includes(dow) ? 'badge-info' : 'badge-gray'}`}
                            style={{ padding: '0.125rem 0.375rem', fontSize: '0.6875rem' }}>
                            {DAY_LABELS[i]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-gray'}`}>
                        {plan.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(plan)} className="btn btn-secondary" style={{ padding: '0.375rem' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="btn btn-danger" style={{ padding: '0.375rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === plan.id && plan.roomTypeRates.length > 0 && (
                    <tr>
                      <td colSpan={7} style={{ backgroundColor: '#f9fafb', padding: '0.75rem 1.5rem' }}>
                        <p className="text-muted text-xs" style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Oda Tipi Fiyat Geçersizmeleri</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {plan.roomTypeRates.map(r => (
                            <div key={r.id} className="card" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
                              <strong>{r.roomType}</strong>
                              {r.fixedPricePerNight != null && <span style={{ color: '#646cff', marginLeft: '0.5rem' }}>{r.fixedPricePerNight.toLocaleString('tr-TR')} ₺/gece</span>}
                              {r.additionalAdjustment != null && r.additionalAdjustment !== 0 && (
                                <span style={{ color: r.additionalAdjustment > 0 ? '#10b981' : '#ef4444', marginLeft: '0.5rem' }}>
                                  {r.additionalAdjustment > 0 ? '+' : ''}{r.additionalAdjustment.toLocaleString('tr-TR')} ₺
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rate Calculator */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calculator size={20} style={{ color: '#646cff' }} />
          <h3>Fiyat Hesaplayıcı</h3>
        </div>
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Oda ID</label>
            <input type="text" value={calcRoomId} onChange={e => setCalcRoomId(e.target.value)}
              className="form-input" placeholder="Oda UUID..." />
          </div>
          <div className="form-group">
            <label className="form-label">Giriş Tarihi</label>
            <input type="date" value={calcCheckIn} onChange={e => setCalcCheckIn(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Çıkış Tarihi</label>
            <input type="date" value={calcCheckOut} onChange={e => setCalcCheckOut(e.target.value)} className="form-input" />
          </div>
        </div>
        {calcError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{calcError}</div>}
        <button onClick={handleCalc} disabled={calcLoading} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
          <Calculator size={14} style={{ marginRight: '0.25rem' }} /> {calcLoading ? 'Hesaplanıyor...' : 'Hesapla'}
        </button>
        {calcResult && (
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div className="grid-4" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div>
                <p className="text-muted text-xs">Oda</p>
                <p style={{ fontWeight: 700 }}>{calcResult.roomNumber} <span className="text-muted">({calcResult.roomType})</span></p>
              </div>
              <div>
                <p className="text-muted text-xs">Baz Fiyat</p>
                <p style={{ fontWeight: 700 }}>{calcResult.basePrice.toLocaleString('tr-TR')} ₺/gece</p>
              </div>
              <div>
                <p className="text-muted text-xs">Uygulanan Plan</p>
                <p style={{ fontWeight: 500, color: '#646cff' }}>{calcResult.appliedRatePlan ?? 'Yok'}</p>
              </div>
              <div>
                <p className="text-muted text-xs">İndirim</p>
                <p style={{ fontWeight: 500, color: calcResult.discountAmount > 0 ? '#10b981' : '#6b7280' }}>
                  {calcResult.discountAmount > 0 ? `-${calcResult.discountAmount.toLocaleString('tr-TR')} ₺` : '—'}
                </p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted">{calcResult.nightCount} gece × {calcResult.finalPricePerNight.toLocaleString('tr-TR')} ₺</span>
              <div style={{ textAlign: 'right' }}>
                <p className="text-muted text-xs">Toplam</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#646cff' }}>{calcResult.totalPrice.toLocaleString('tr-TR')} ₺</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatePlansPage;

import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { DynamicPricingRule, CreateDynamicPricingRulePayload, DynamicPriceResult } from '../types';
import { useHotel } from '../context/HotelContext';
import { Zap, Plus, Edit, Trash2, Calculator, Check, X } from 'lucide-react';

const TRIGGER_LABELS: Record<string, string> = {
  OccupancyBased: 'Doluluk Bazlı', DaysBefore: "Check-in'e Gün Kala", SeasonBased: 'Sezon Bazlı',
};

const emptyRule = (): CreateDynamicPricingRulePayload => ({
  name: '', trigger: 'OccupancyBased', thresholdValue: 80, adjustmentPercent: 10, isActive: true, priority: 1,
});

const DynamicPricingPage: React.FC = () => {
  const { rooms } = useHotel();
  const [rules, setRules] = useState<DynamicPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDynamicPricingRulePayload>(emptyRule());
  const [saving, setSaving] = useState(false);

  const [calcRoomId, setCalcRoomId] = useState('');
  const [calcCheckIn, setCalcCheckIn] = useState('');
  const [calcResult, setCalcResult] = useState<DynamicPriceResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    setLoading(true);
    try { const res = await hotelService.getDynamicPricingRules(); setRules(res.data); }
    catch { setError('Kurallar yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyRule()); setShowForm(true); };

  const openEdit = (rule: DynamicPricingRule) => {
    setEditingId(rule.id);
    setForm({ name: rule.name, trigger: rule.trigger, thresholdValue: rule.thresholdValue, adjustmentPercent: rule.adjustmentPercent, isActive: rule.isActive, priority: rule.priority });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { setError('Kural adı zorunlu.'); return; }
    setSaving(true); setError('');
    try {
      if (editingId) await hotelService.updateDynamicPricingRule(editingId, form);
      else await hotelService.createDynamicPricingRule(form);
      setShowForm(false); await loadRules();
    } catch (e: any) { setError(e?.response?.data?.message || 'Kayıt başarısız.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu kural silinsin mi?')) return;
    try { await hotelService.deleteDynamicPricingRule(id); await loadRules(); }
    catch { setError('Silme başarısız.'); }
  };

  const handleCalc = async () => {
    if (!calcRoomId || !calcCheckIn) { setError('Oda ve tarih seçin.'); return; }
    setCalcLoading(true); setCalcResult(null);
    try { const res = await hotelService.calculateDynamicPrice(calcRoomId, calcCheckIn); setCalcResult(res.data); }
    catch { setError('Hesaplama başarısız.'); }
    finally { setCalcLoading(false); }
  };

  const triggerDescription = (rule: DynamicPricingRule) => {
    if (rule.trigger === 'OccupancyBased') return `Doluluk >= %${rule.thresholdValue}`;
    if (rule.trigger === 'DaysBefore') return `Check-in'e <= ${rule.thresholdValue} gün`;
    return `Eşik: ${rule.thresholdValue}`;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
          <Zap size={24} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2>Dinamik Fiyatlandırma</h2>
          <p>Doluluk ve zaman bazlı otomatik fiyat ayarlama</p>
        </div>
        <div className="page-header-actions">
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Yeni Kural
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Kuralı Düzenle' : 'Yeni Kural'}</h3>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kural Adı *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input" placeholder="Örn: Yüksek Doluluk Zammı" />
            </div>
            <div className="form-group">
              <label className="form-label">Öncelik</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Tetikleyici</label>
              <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as DynamicPricingRule['trigger'] }))}
                className="form-input">
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">
                {form.trigger === 'OccupancyBased' ? 'Eşik Doluluk (%)' : form.trigger === 'DaysBefore' ? 'Gün Sayısı' : 'Eşik Değer'}
              </label>
              <input type="number" value={form.thresholdValue} onChange={e => setForm(f => ({ ...f, thresholdValue: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Ayarlama (% — negatif = indirim)</label>
              <input type="number" value={form.adjustmentPercent} onChange={e => setForm(f => ({ ...f, adjustmentPercent: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="dp_active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="dp_active" style={{ fontSize: '0.875rem' }}>Aktif</label>
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

      {/* Rules Table */}
      <div className="card" style={{ padding: 0, marginBottom: '1.5rem' }}>
        {loading ? <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Kural Adı</th>
                <th>Tetikleyici</th>
                <th>Koşul</th>
                <th>Ayarlama</th>
                <th>Öncelik</th>
                <th style={{ textAlign: 'center' }}>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Kural bulunamadı</td></tr>}
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td><strong>{rule.name}</strong></td>
                  <td><span className="badge badge-warning">{TRIGGER_LABELS[rule.trigger]}</span></td>
                  <td className="text-muted text-xs">{triggerDescription(rule)}</td>
                  <td style={{ fontWeight: 700, color: rule.adjustmentPercent >= 0 ? '#10b981' : '#ef4444' }}>
                    {rule.adjustmentPercent >= 0 ? '+' : ''}{rule.adjustmentPercent}%
                  </td>
                  <td className="text-muted">{rule.priority}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(rule)} className="btn btn-secondary" style={{ padding: '0.375rem' }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="btn btn-danger" style={{ padding: '0.375rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Calculator */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calculator size={20} style={{ color: '#f59e0b' }} />
          <h3>Dinamik Fiyat Hesaplayıcı</h3>
        </div>
        <div className="filter-bar">
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">Oda</label>
            <select value={calcRoomId} onChange={e => setCalcRoomId(e.target.value)} className="form-input">
              <option value="">Oda seç...</option>
              {rooms.map(r => <option key={r.id} value={r.id}>Oda {r.number} — {r.type} ({r.price}₺)</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-in Tarihi</label>
            <input type="date" value={calcCheckIn} onChange={e => setCalcCheckIn(e.target.value)} className="form-input" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleCalc} disabled={calcLoading} className="btn btn-primary">
              <Calculator size={14} style={{ marginRight: '0.25rem' }} /> {calcLoading ? 'Hesaplanıyor...' : 'Hesapla'}
            </button>
          </div>
        </div>
        {calcResult && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
            <div className="grid-3" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <p className="text-muted text-xs">Baz Fiyat</p>
                <p style={{ fontWeight: 700 }}>{calcResult.basePrice.toLocaleString('tr-TR')} ₺/gece</p>
              </div>
              <div>
                <p className="text-muted text-xs">Toplam Ayarlama</p>
                <p style={{ fontWeight: 700, color: calcResult.totalAdjustmentPercent >= 0 ? '#10b981' : '#ef4444' }}>
                  {calcResult.totalAdjustmentPercent >= 0 ? '+' : ''}{calcResult.totalAdjustmentPercent}%
                </p>
              </div>
              <div>
                <p className="text-muted text-xs">Dinamik Fiyat</p>
                <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#f59e0b' }}>{calcResult.adjustedPrice.toLocaleString('tr-TR')} ₺/gece</p>
              </div>
            </div>
            {calcResult.appliedRules.length > 0 && (
              <div>
                <p className="text-muted text-xs" style={{ marginBottom: '0.25rem' }}>Uygulanan Kurallar:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {calcResult.appliedRules.map((r, i) => (
                    <span key={i} className="badge badge-warning">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPricingPage;

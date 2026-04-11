import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { GuestSurvey, SubmitSurveyPayload, SurveyStats } from '../types';
import { useHotel } from '../context/HotelContext';
import { MessageSquare, Star, ThumbsUp, BarChart2, Plus, Check } from 'lucide-react';

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; size?: number }> = ({ value, onChange, size = 20 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <button key={i} type="button" onClick={() => onChange?.(i)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: onChange ? 'pointer' : 'default' }}>
        <Star size={size} style={{ color: i <= value ? '#f59e0b' : '#d1d5db', fill: i <= value ? '#f59e0b' : 'none' }} />
      </button>
    ))}
  </div>
);

const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
    <span style={{ width: 160, flexShrink: 0, fontSize: '0.875rem' }}>{label}</span>
    <div className="progress-bar" style={{ flex: 1 }}>
      <div className="progress-fill" style={{ width: `${(value / 5) * 100}%`, backgroundColor: '#f59e0b' }} />
    </div>
    <span style={{ fontWeight: 700, width: 32, textAlign: 'right', fontSize: '0.875rem' }}>{value.toFixed(1)}</span>
  </div>
);

const emptyForm = (): SubmitSurveyPayload => ({
  guestId: '', reservationId: '', overallRating: 5, roomCleanliness: 5,
  staffFriendliness: 5, foodQuality: 5, valueForMoney: 5, comments: '', wouldRecommend: true,
});

const SurveysPage: React.FC = () => {
  const { guests, reservations } = useHotel();
  const [surveys, setSurveys] = useState<GuestSurvey[]>([]);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubmitSurveyPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'list' | 'stats'>('stats');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sv, st] = await Promise.all([hotelService.getSurveys(1, 50), hotelService.getSurveyStats()]);
      setSurveys(sv.data);
      setStats(st.data);
    } catch { setError('Anket verileri yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.guestId || !form.reservationId) { setError('Misafir ve rezervasyon gerekli.'); return; }
    setSaving(true); setError('');
    try {
      await hotelService.submitSurvey(form);
      setShowForm(false);
      setForm(emptyForm());
      await loadData();
    } catch (e: any) { setError(e?.response?.data?.message || 'Anket gönderilemedi.'); }
    finally { setSaving(false); }
  };

  const guestName = (guestId: string) => guests.find(g => g.id === guestId)?.name ?? guestId.substring(0, 8);
  const guestReservations = form.guestId ? reservations.filter(r => r.guestId === form.guestId && r.status === 'checked-out') : [];

  const RATING_FIELDS: { label: string; key: keyof SubmitSurveyPayload }[] = [
    { label: 'Genel Değerlendirme', key: 'overallRating' },
    { label: 'Oda Temizliği', key: 'roomCleanliness' },
    { label: 'Personel Güler Yüzlülüğü', key: 'staffFriendliness' },
    { label: 'Yiyecek Kalitesi', key: 'foodQuality' },
    { label: 'Fiyat/Performans', key: 'valueForMoney' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
          <MessageSquare size={24} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h2>Misafir Anketleri</h2>
          <p>Memnuniyet değerlendirmeleri ve geri bildirimler</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Anket Ekle
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Survey Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Yeni Anket</h3>

          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Misafir *</label>
              <select value={form.guestId} onChange={e => setForm(f => ({ ...f, guestId: e.target.value, reservationId: '' }))}
                className="form-input">
                <option value="">Misafir seç...</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rezervasyon *</label>
              <select value={form.reservationId} onChange={e => setForm(f => ({ ...f, reservationId: e.target.value }))}
                className="form-input" disabled={!form.guestId}>
                <option value="">Rezervasyon seç...</option>
                {guestReservations.map(r => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.checkInDate).toLocaleDateString('tr-TR')} → {new Date(r.checkOutDate).toLocaleDateString('tr-TR')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#f9fafb', marginBottom: '1rem' }}>
            {RATING_FIELDS.map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <span style={{ width: 200, flexShrink: 0, fontSize: '0.875rem' }}>{label}</span>
                <StarRating value={form[key] as number} onChange={v => setForm(f => ({ ...f, [key]: v }))} />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Yorumlar</label>
            <textarea value={form.comments ?? ''} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))}
              rows={3} placeholder="Misafir yorumu..." className="form-input" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="wouldRecommend" checked={form.wouldRecommend}
              onChange={e => setForm(f => ({ ...f, wouldRecommend: e.target.checked }))} />
            <ThumbsUp size={16} style={{ color: '#3b82f6' }} />
            <label htmlFor="wouldRecommend" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Öneririm</label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
              <Check size={14} style={{ marginRight: '0.25rem' }} /> {saving ? 'Kaydediliyor...' : 'Anketi Kaydet'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">İptal</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-group">
        {[
          { id: 'stats', label: 'İstatistikler', icon: <BarChart2 size={14} /> },
          { id: 'list', label: 'Anket Listesi', icon: <MessageSquare size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'list' | 'stats')}
            className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Yükleniyor...</p>}

      {/* Stats Tab */}
      {!loading && tab === 'stats' && stats && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <p className="text-muted text-xs">Toplam Anket</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{stats.totalSurveys}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <p className="text-muted text-xs">Genel Ortalama</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{stats.averageOverall.toFixed(1)}</p>
                <StarRating value={Math.round(stats.averageOverall)} size={16} />
              </div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <p className="text-muted text-xs">Tavsiye Oranı</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>%{stats.recommendationRate.toFixed(0)}</p>
                <ThumbsUp size={20} style={{ color: '#10b981' }} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Kategori Puanları</h3>
            <StatBar label="Genel Değerlendirme" value={stats.averageOverall} />
            <StatBar label="Oda Temizliği" value={stats.averageRoomCleanliness} />
            <StatBar label="Personel" value={stats.averageStaffFriendliness} />
            <StatBar label="Yiyecek Kalitesi" value={stats.averageFoodQuality} />
            <StatBar label="Fiyat/Performans" value={stats.averageValueForMoney} />
          </div>
        </>
      )}

      {/* List Tab */}
      {!loading && tab === 'list' && (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Misafir</th>
                <th>Tarih</th>
                <th>Genel</th>
                <th style={{ textAlign: 'center' }}>Temizlik</th>
                <th style={{ textAlign: 'center' }}>Personel</th>
                <th style={{ textAlign: 'center' }}>Yiyecek</th>
                <th style={{ textAlign: 'center' }}>Değer</th>
                <th style={{ textAlign: 'center' }}>Öneri</th>
                <th>Yorum</th>
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Anket bulunamadı</td></tr>
              )}
              {surveys.map(s => (
                <tr key={s.id}>
                  <td><strong>{guestName(s.guestId)}</strong></td>
                  <td className="text-muted text-xs">{new Date(s.submittedAt).toLocaleDateString('tr-TR')}</td>
                  <td><StarRating value={s.overallRating} size={14} /></td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.roomCleanliness}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.staffFriendliness}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.foodQuality}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.valueForMoney}</td>
                  <td style={{ textAlign: 'center' }}>
                    {s.wouldRecommend
                      ? <ThumbsUp size={14} style={{ color: '#10b981' }} />
                      : <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Hayır</span>}
                  </td>
                  <td className="text-muted text-xs" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.comments || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SurveysPage;

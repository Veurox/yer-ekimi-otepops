import React, { useState } from 'react';
import { hotelService } from '../services/hotelService';
import { GuestProfile, AddPreferencePayload, AddNotePayload } from '../types';
import { useHotel } from '../context/HotelContext';
import { UserCircle, Plus, Trash2, AlertCircle, Search, Tag, StickyNote } from 'lucide-react';

const VIP_COLORS: Record<string, string> = {
  Bronze: '#d97706', Silver: '#6b7280', Gold: '#eab308', Platinum: '#8b5cf6',
};

const PREF_CATEGORIES = ['RoomPreference', 'Food', 'Pillow', 'Temperature', 'Other'];

const GuestCRMPage: React.FC = () => {
  const { guests } = useHotel();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPrefForm, setShowPrefForm] = useState(false);
  const [prefForm, setPrefForm] = useState<AddPreferencePayload>({ category: 'RoomPreference', key: '', value: '', notes: '' });

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState<AddNotePayload>({ note: '', isImportant: false });

  const filteredGuests = guests.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone?.includes(searchTerm)
  );

  const loadProfile = async (guestId: string) => {
    setSelectedGuestId(guestId);
    setLoading(true); setError('');
    try { const res = await hotelService.getGuestProfile(guestId); setProfile(res.data); }
    catch { setError('Profil yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleAddPreference = async () => {
    if (!prefForm.key || !prefForm.value) return;
    try {
      await hotelService.addGuestPreference(selectedGuestId, prefForm);
      await loadProfile(selectedGuestId);
      setShowPrefForm(false);
      setPrefForm({ category: 'RoomPreference', key: '', value: '', notes: '' });
    } catch { setError('Tercih eklenemedi.'); }
  };

  const handleDeletePreference = async (id: string) => {
    try { await hotelService.deleteGuestPreference(id); await loadProfile(selectedGuestId); }
    catch { setError('Tercih silinemedi.'); }
  };

  const handleAddNote = async () => {
    if (!noteForm.note) return;
    try {
      await hotelService.addGuestNote(selectedGuestId, noteForm);
      await loadProfile(selectedGuestId);
      setShowNoteForm(false);
      setNoteForm({ note: '', isImportant: false });
    } catch { setError('Not eklenemedi.'); }
  };

  const handleDeleteNote = async (id: string) => {
    try { await hotelService.deleteGuestNote(id); await loadProfile(selectedGuestId); }
    catch { setError('Not silinemedi.'); }
  };

  const handleRecalculate = async () => {
    try { await hotelService.recalculateGuestStats(selectedGuestId); await loadProfile(selectedGuestId); }
    catch { setError('İstatistikler güncellenemedi.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
          <UserCircle size={24} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h2>Misafir CRM</h2>
          <p>Misafir tercihleri, notlar ve konaklama geçmişi</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="split-layout">
        {/* Guest List */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Misafir ara..." className="form-input" style={{ paddingLeft: '2rem' }} />
            </div>
          </div>
          <div className="sidebar-list">
            {filteredGuests.map(g => (
              <button key={g.id} onClick={() => loadProfile(g.id)}
                className={`sidebar-item ${selectedGuestId === g.id ? 'sidebar-item-active' : ''}`}>
                <p>{g.name}</p>
                <p>{g.email || g.phone}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Panel */}
        <div>
          {loading && <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</div>}

          {!loading && !profile && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Soldan bir misafir seçin</div>
          )}

          {!loading && profile && (
            <>
              {/* Stats */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem' }}>{profile.name}</h3>
                    <p className="text-muted">{profile.email} · {profile.phone}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {profile.vipLevel && (
                      <span className="badge" style={{ backgroundColor: `${VIP_COLORS[profile.vipLevel]}20`, color: VIP_COLORS[profile.vipLevel] }}>
                        {profile.vipLevel}
                      </span>
                    )}
                    <button onClick={handleRecalculate} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      İstatistik Güncelle
                    </button>
                  </div>
                </div>
                <div className="grid-4">
                  {[
                    { label: 'Toplam Konaklama', value: profile.totalStays, color: '#3b82f6' },
                    { label: 'Toplam Harcama', value: `${profile.totalSpent.toLocaleString('tr-TR')} ₺`, color: '#10b981' },
                    { label: 'Sadakat Puanı', value: `${profile.loyaltyPoints} puan`, color: '#8b5cf6' },
                    { label: 'Son Oda Tipleri', value: profile.recentRoomTypes.join(', ') || '—', color: '#6b7280' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: `${s.color}10`, borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <p className="text-muted text-xs">{s.label}</p>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={16} style={{ color: '#646cff' }} />
                    <h3 style={{ fontSize: '0.9375rem' }}>Tercihler ({profile.preferences.length})</h3>
                  </div>
                  <button onClick={() => setShowPrefForm(!showPrefForm)} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    <Plus size={14} style={{ marginRight: '0.25rem' }} /> Ekle
                  </button>
                </div>

                {showPrefForm && (
                  <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                    <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <select value={prefForm.category} onChange={e => setPrefForm(f => ({ ...f, category: e.target.value }))} className="form-input">
                          {PREF_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Anahtar</label>
                        <input type="text" value={prefForm.key} onChange={e => setPrefForm(f => ({ ...f, key: e.target.value }))}
                          placeholder="ör: kat_tercihi" className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Değer</label>
                        <input type="text" value={prefForm.value} onChange={e => setPrefForm(f => ({ ...f, value: e.target.value }))}
                          placeholder="ör: üst kat" className="form-input" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Not (opsiyonel)</label>
                        <input type="text" value={prefForm.notes ?? ''} onChange={e => setPrefForm(f => ({ ...f, notes: e.target.value }))}
                          className="form-input" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleAddPreference} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Kaydet</button>
                      <button onClick={() => setShowPrefForm(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>İptal</button>
                    </div>
                  </div>
                )}

                {profile.preferences.length === 0
                  ? <p className="text-muted">Tercih kaydı yok</p>
                  : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {profile.preferences.map(p => (
                        <div key={p.id} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.6875rem' }}>{p.category}</span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span>{p.key}: <strong>{p.value}</strong></span>
                          {p.notes && <span className="text-muted text-xs">({p.notes})</span>}
                          <button onClick={() => handleDeletePreference(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, marginLeft: '0.25rem' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Notes */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StickyNote size={16} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '0.9375rem' }}>Personel Notları ({profile.notes.length})</h3>
                  </div>
                  <button onClick={() => setShowNoteForm(!showNoteForm)} className="btn btn-warning" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    <Plus size={14} style={{ marginRight: '0.25rem' }} /> Ekle
                  </button>
                </div>

                {showNoteForm && (
                  <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                    <textarea value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Not yazın..." rows={3} className="form-input" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={noteForm.isImportant}
                          onChange={e => setNoteForm(f => ({ ...f, isImportant: e.target.checked }))} />
                        <AlertCircle size={14} style={{ color: '#ef4444' }} /> Önemli
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleAddNote} className="btn btn-warning" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Kaydet</button>
                        <button onClick={() => setShowNoteForm(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>İptal</button>
                      </div>
                    </div>
                  </div>
                )}

                {profile.notes.length === 0 && <p className="text-muted">Not yok</p>}
                {profile.notes.map(n => (
                  <div key={n.id} style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${n.isImportant ? '#fecaca' : '#e5e7eb'}`,
                    backgroundColor: n.isImportant ? 'rgba(239, 68, 68, 0.05)' : '#f9fafb',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        {n.isImportant && <AlertCircle size={14} style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />}
                        <p style={{ fontSize: '0.875rem' }}>{n.note}</p>
                      </div>
                      <button onClick={() => handleDeleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, flexShrink: 0, marginLeft: '0.5rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-muted text-xs" style={{ marginTop: '0.375rem' }}>
                      {n.addedBy ?? 'Sistem'} · {new Date(n.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestCRMPage;

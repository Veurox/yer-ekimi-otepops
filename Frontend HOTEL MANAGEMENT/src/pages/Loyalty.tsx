import React, { useState } from 'react';
import { hotelService } from '../services/hotelService';
import { LoyaltySummary, RedeemPointsPayload } from '../types';
import { useHotel } from '../context/HotelContext';
import { Star, Search, Gift, TrendingUp, TrendingDown, Award } from 'lucide-react';

const VIP_COLORS: Record<string, string> = {
  Bronze: '#d97706', Silver: '#6b7280', Gold: '#eab308', Platinum: '#8b5cf6',
};

const LoyaltyPage: React.FC = () => {
  const { guests, reservations } = useHotel();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [earnResId, setEarnResId] = useState('');
  const [earnAmount, setEarnAmount] = useState(0);
  const [earnLoading, setEarnLoading] = useState(false);

  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(100);
  const [redeemDesc, setRedeemDesc] = useState('Puan Kullanımı');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const filteredGuests = guests.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadSummary = async (guestId: string) => {
    setSelectedGuestId(guestId);
    setLoading(true); setError('');
    try { const res = await hotelService.getLoyaltySummary(guestId); setSummary(res.data); }
    catch { setError('Sadakat özeti yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleEarn = async () => {
    if (!earnResId || earnAmount <= 0) { setError('Rezervasyon ve tutar gerekli.'); return; }
    setEarnLoading(true);
    try {
      await hotelService.earnLoyaltyPoints({ guestId: selectedGuestId, reservationId: earnResId, amountSpent: earnAmount });
      await loadSummary(selectedGuestId);
      setEarnResId(''); setEarnAmount(0);
    } catch (e: any) { setError(e?.response?.data?.message || 'Puan eklenemedi.'); }
    finally { setEarnLoading(false); }
  };

  const handleRedeem = async () => {
    if (redeemPoints <= 0) return;
    setRedeemLoading(true);
    try {
      const payload: RedeemPointsPayload = { guestId: selectedGuestId, points: redeemPoints, description: redeemDesc };
      await hotelService.redeemLoyaltyPoints(payload);
      await loadSummary(selectedGuestId);
      setShowRedeem(false);
    } catch (e: any) { setError(e?.response?.data?.message || 'Puan kullanılamadı.'); }
    finally { setRedeemLoading(false); }
  };

  const vipColor = summary?.vipLevel ? VIP_COLORS[summary.vipLevel] ?? VIP_COLORS.Bronze : VIP_COLORS.Bronze;
  const guestReservations = reservations.filter(r => r.guestId === selectedGuestId);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
          <Star size={24} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h2>Sadakat Programı</h2>
          <p>Puan kazanma, harcama ve VIP seviye yönetimi</p>
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
              <button key={g.id} onClick={() => loadSummary(g.id)}
                className={`sidebar-item ${selectedGuestId === g.id ? 'sidebar-item-active' : ''}`}>
                <p>{g.name}</p>
                <p>{g.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary Panel */}
        <div>
          {loading && <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</div>}

          {!loading && !summary && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Soldan bir misafir seçin</div>
          )}

          {!loading && summary && (
            <>
              {/* VIP Card */}
              <div className="card" style={{ borderLeft: `4px solid ${vipColor}`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Award size={20} style={{ color: vipColor }} />
                      <span className="badge" style={{ backgroundColor: `${vipColor}20`, color: vipColor }}>{summary.vipLevel ?? 'Bronze'}</span>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{summary.guestName}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-muted text-xs">Toplam Puan</p>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: vipColor }}>{summary.totalPoints.toLocaleString('tr-TR')}</p>
                    <p className="text-muted text-xs">= {(Math.floor(summary.totalPoints / 100) * 10).toLocaleString('tr-TR')} ₺ indirim hakkı</p>
                  </div>
                </div>
              </div>

              {/* Earn / Redeem */}
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                {/* Earn */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <TrendingUp size={16} style={{ color: '#10b981' }} />
                    <h3 style={{ fontSize: '0.9375rem' }}>Puan Ekle</h3>
                  </div>
                  <div className="form-group">
                    <select value={earnResId} onChange={e => setEarnResId(e.target.value)} className="form-input">
                      <option value="">Rezervasyon seç...</option>
                      {guestReservations.map(r => (
                        <option key={r.id} value={r.id}>
                          Oda {r.roomId.substring(0, 6)}... · {new Date(r.checkInDate).toLocaleDateString('tr-TR')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <input type="number" value={earnAmount} onChange={e => setEarnAmount(Number(e.target.value))}
                      placeholder="Harcama tutarı (₺)" min={0} className="form-input" />
                  </div>
                  <p className="text-muted text-xs" style={{ marginBottom: '0.5rem' }}>10 ₺ = 1 puan</p>
                  <button onClick={handleEarn} disabled={earnLoading} className="btn btn-success" style={{ width: '100%' }}>
                    {earnLoading ? 'İşleniyor...' : `+${Math.floor(earnAmount / 10)} puan ekle`}
                  </button>
                </div>

                {/* Redeem */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Gift size={16} style={{ color: '#8b5cf6' }} />
                    <h3 style={{ fontSize: '0.9375rem' }}>Puan Kullan</h3>
                  </div>
                  {showRedeem ? (
                    <>
                      <div className="form-group">
                        <input type="number" value={redeemPoints} onChange={e => setRedeemPoints(Number(e.target.value))}
                          min={100} step={100} max={summary.totalPoints} className="form-input" />
                      </div>
                      <p className="text-muted text-xs" style={{ marginBottom: '0.5rem' }}>100 puan = 10 ₺ · Kullanılacak: {redeemPoints} = {redeemPoints / 100 * 10} ₺</p>
                      <div className="form-group">
                        <input type="text" value={redeemDesc} onChange={e => setRedeemDesc(e.target.value)} className="form-input" />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleRedeem} disabled={redeemLoading || redeemPoints > summary.totalPoints}
                          className="btn btn-primary" style={{ flex: 1 }}>
                          {redeemLoading ? 'İşleniyor...' : 'Onayla'}
                        </button>
                        <button onClick={() => setShowRedeem(false)} className="btn btn-secondary" style={{ flex: 1 }}>İptal</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                        Mevcut: <strong>{summary.totalPoints} puan</strong> = {Math.floor(summary.totalPoints / 100) * 10} ₺
                      </p>
                      <button onClick={() => setShowRedeem(true)} disabled={summary.totalPoints < 100}
                        className="btn btn-primary" style={{ width: '100%', opacity: summary.totalPoints < 100 ? 0.5 : 1 }}>
                        Puan Kullan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Transaction History */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '0.9375rem' }}>İşlem Geçmişi</h3>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Tür</th>
                      <th>Puan</th>
                      <th>Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentTransactions.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>İşlem yok</td></tr>
                    )}
                    {summary.recentTransactions.map(t => (
                      <tr key={t.id}>
                        <td className="text-muted text-xs">{new Date(t.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td>
                          <span className={`badge ${
                            t.transactionType === 'Earned' ? 'badge-success' :
                            t.transactionType === 'Redeemed' ? 'badge-purple' :
                            t.transactionType === 'Bonus' ? 'badge-info' : 'badge-gray'
                          }`}>{t.transactionType}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: t.points >= 0 ? '#10b981' : '#ef4444' }}>
                          {t.points >= 0 ? <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> : <TrendingDown size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                          {t.points >= 0 ? '+' : ''}{t.points}
                        </td>
                        <td>{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPage;

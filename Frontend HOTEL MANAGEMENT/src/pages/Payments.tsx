import React, { useState } from 'react';
import { hotelService } from '../services/hotelService';
import { ReservationPaymentSummary, CreatePaymentPayload } from '../types';
import { CreditCard, Plus, RotateCcw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const [reservationId, setReservationId] = useState('');
  const [summary, setSummary] = useState<ReservationPaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<CreatePaymentPayload>>({
    method: 'Cash', type: 'Reservation', amount: 0,
  });
  const [saving, setSaving] = useState(false);

  const searchPayments = async () => {
    if (!reservationId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await hotelService.getPaymentSummary(reservationId.trim());
      setSummary(res.data);
    } catch {
      setError('Rezervasyon bulunamadı.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!summary || !newPayment.amount || newPayment.amount <= 0) return;
    setSaving(true);
    try {
      await hotelService.addPayment({ ...newPayment, reservationId: summary.reservationId } as CreatePaymentPayload);
      setShowAddForm(false);
      setNewPayment({ method: 'Cash', type: 'Reservation', amount: 0 });
      await searchPayments();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Ödeme eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const reason = window.prompt('İade nedeni (opsiyonel):');
    if (reason === null) return;
    setSaving(true);
    try {
      await hotelService.refundPayment(paymentId, reason || undefined);
      await searchPayments();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'İade işlemi başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle size={14} style={{ color: '#10b981' }} />;
    if (status === 'Refunded') return <RotateCcw size={14} style={{ color: '#f59e0b' }} />;
    if (status === 'Failed') return <AlertCircle size={14} style={{ color: '#ef4444' }} />;
    return <Clock size={14} style={{ color: '#3b82f6' }} />;
  };

  const methodLabel: Record<string, string> = {
    Cash: 'Nakit', CreditCard: 'Kredi Kartı', DebitCard: 'Banka Kartı',
    BankTransfer: 'Havale/EFT', Online: 'Online',
  };

  const typeLabel: Record<string, string> = {
    Reservation: 'Rezervasyon', RoomService: 'Oda Servisi',
    Deposit: 'Depozito', Refund: 'İade', AdditionalCharge: 'Ek Ücret',
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <CreditCard size={24} style={{ color: '#646cff' }} />
        </div>
        <div>
          <h2>Ödeme Yönetimi</h2>
          <p>Rezervasyon ödemelerini görüntüle ve yönet</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Rezervasyon ID</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={reservationId}
            onChange={e => setReservationId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchPayments()}
            placeholder="Rezervasyon ID girin..."
            className="form-input"
            style={{ flex: 1 }}
          />
          <button onClick={searchPayments} disabled={loading} className="btn btn-primary">
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #6b7280' }}>
              <p className="text-muted text-xs">Toplam Tutar</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {summary.totalAmount.toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #10b981' }}>
              <p className="text-muted text-xs">Ödenen</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                {summary.paidAmount.toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: `4px solid ${summary.isPaid ? '#10b981' : '#ef4444'}` }}>
              <p className="text-muted text-xs">Kalan</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: summary.isPaid ? '#10b981' : '#ef4444' }}>
                {summary.remainingAmount.toLocaleString('tr-TR')} ₺
              </p>
              <span className={`badge ${summary.isPaid ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '0.5rem' }}>
                {summary.isPaid ? '✓ Ödendi' : '⚠ Bekliyor'}
              </span>
            </div>
          </div>

          {/* Add Payment Button */}
          {!summary.isPaid && (
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={() => setShowAddForm(v => !v)} className="btn btn-success">
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                Ödeme Ekle
              </button>
            </div>
          )}

          {/* Add Payment Form */}
          {showAddForm && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Yeni Ödeme</h3>
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tutar (₺)</label>
                  <input
                    type="number"
                    value={newPayment.amount || ''}
                    onChange={e => setNewPayment(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="form-input"
                    placeholder={`Kalan: ${summary.remainingAmount} ₺`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ödeme Yöntemi</label>
                  <select
                    value={newPayment.method}
                    onChange={e => setNewPayment(p => ({ ...p, method: e.target.value }))}
                    className="form-input"
                  >
                    {Object.entries(methodLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tür</label>
                  <select
                    value={newPayment.type}
                    onChange={e => setNewPayment(p => ({ ...p, type: e.target.value }))}
                    className="form-input"
                  >
                    {Object.entries(typeLabel).filter(([v]) => v !== 'Refund').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Referans No (opsiyonel)</label>
                  <input
                    type="text"
                    value={newPayment.referenceNumber || ''}
                    onChange={e => setNewPayment(p => ({ ...p, referenceNumber: e.target.value }))}
                    className="form-input"
                    placeholder="Banka/POS ref..."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleAddPayment} disabled={saving} className="btn btn-primary">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">İptal</button>
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Yöntem</th>
                  <th>Tür</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {summary.payments.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Ödeme kaydı yok</td></tr>
                )}
                {summary.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(p.paidAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: 600, color: p.type === 'Refund' ? '#ef4444' : '#10b981' }}>
                      {p.type === 'Refund' ? '-' : '+'}{p.amount.toLocaleString('tr-TR')} ₺
                    </td>
                    <td>{methodLabel[p.method] ?? p.method}</td>
                    <td>{typeLabel[p.type] ?? p.type}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {statusIcon(p.status)}
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'Completed' && p.type !== 'Refund' && (
                        <button onClick={() => handleRefund(p.id)} className="btn btn-warning" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                          <RotateCcw size={12} style={{ marginRight: '0.25rem' }} /> İade
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentsPage;

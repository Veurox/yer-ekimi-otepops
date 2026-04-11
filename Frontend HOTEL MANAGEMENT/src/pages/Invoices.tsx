import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { Invoice, GenerateInvoicePayload } from '../types';
import { FileText, Plus, CheckCircle, XCircle, Printer } from 'lucide-react';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [showGenForm, setShowGenForm] = useState(false);
  const [genPayload, setGenPayload] = useState<GenerateInvoicePayload>({ reservationId: '', discount: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await hotelService.getInvoices();
      setInvoices(res.data);
    } catch { setError('Faturalar yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!genPayload.reservationId.trim()) { setError('Rezervasyon ID gerekli.'); return; }
    setSaving(true); setError('');
    try {
      await hotelService.generateInvoice(genPayload);
      setShowGenForm(false);
      setGenPayload({ reservationId: '', discount: 0 });
      await loadInvoices();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Fatura oluşturulamadı.');
    } finally { setSaving(false); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await hotelService.markInvoicePaid(id);
      await loadInvoices();
      if (selected?.id === id) {
        const res = await hotelService.getInvoiceById(id);
        setSelected(res.data);
      }
    } catch (e: any) { setError(e?.response?.data?.message || 'İşlem başarısız.'); }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bu fatura iptal edilsin mi?')) return;
    try {
      await hotelService.cancelInvoice(id);
      await loadInvoices();
      if (selected?.id === id) setSelected(null);
    } catch (e: any) { setError(e?.response?.data?.message || 'İptal başarısız.'); }
  };

  const handlePrint = (invoice: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Fatura ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #4f46e5; } table { width:100%; border-collapse:collapse; margin-top:16px; }
        th,td { border:1px solid #ddd; padding:8px; text-align:left; font-size:13px; }
        th { background:#f5f5f5; } .total { font-weight:bold; font-size:16px; }
        .header { display:flex; justify-content:space-between; margin-bottom:24px; }
        .badge { display:inline-block; padding:4px 10px; border-radius:4px; font-size:12px; }
        .paid { background:#d1fae5; color:#065f46; } .issued { background:#e0e7ff; color:#3730a3; }
      </style></head>
      <body>
      <div class="header">
        <div><h1>OtelOPS</h1><p style="color:#888">Otel Yönetim Sistemi</p></div>
        <div style="text-align:right">
          <h2 style="margin:0">FATURA</h2>
          <p style="margin:4px 0; font-size:18px; font-weight:bold; color:#4f46e5">${invoice.invoiceNumber}</p>
          <span class="badge ${invoice.status.toLowerCase()}">${invoice.status}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div><strong>Fatura Alanı:</strong><br>${invoice.guestName}<br>${invoice.billingAddress || ''}<br>${invoice.guestEmail || ''}</div>
        <div>
          <p><strong>Oda:</strong> ${invoice.roomNumber}</p>
          <p><strong>Giriş:</strong> ${new Date(invoice.checkInDate).toLocaleDateString('tr-TR')}</p>
          <p><strong>Çıkış:</strong> ${new Date(invoice.checkOutDate).toLocaleDateString('tr-TR')}</p>
          <p><strong>Düzenleme:</strong> ${new Date(invoice.issuedAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>Açıklama</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
        <tbody>
          ${invoice.lineItems.map(li => `
            <tr><td>${li.description}</td><td>${li.quantity}</td>
            <td>${li.unitPrice.toLocaleString('tr-TR')} ₺</td>
            <td>${li.totalPrice.toLocaleString('tr-TR')} ₺</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:16px;text-align:right">
        <p>Ara Toplam: <strong>${invoice.subTotal.toLocaleString('tr-TR')} ₺</strong></p>
        ${invoice.discount > 0 ? `<p>İndirim: <strong style="color:green">-${invoice.discount.toLocaleString('tr-TR')} ₺</strong></p>` : ''}
        <p>KDV (%${Math.round(invoice.taxRate * 100)}): <strong>${invoice.taxAmount.toLocaleString('tr-TR')} ₺</strong></p>
        <p class="total">GENEL TOPLAM: ${invoice.totalAmount.toLocaleString('tr-TR')} ₺</p>
      </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Issued: 'badge-info', Paid: 'badge-success',
      Cancelled: 'badge-gray', Draft: 'badge-warning',
    };
    const labels: Record<string, string> = { Issued: 'Düzenlendi', Paid: 'Ödendi', Cancelled: 'İptal', Draft: 'Taslak' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`}>{labels[status] ?? status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <FileText size={24} style={{ color: '#646cff' }} />
        </div>
        <div>
          <h2>Fatura Yönetimi</h2>
          <p>Toplam {invoices.length} fatura</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => { setShowGenForm(v => !v); setError(''); }} className="btn btn-primary">
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Fatura Oluştur
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Generate Form */}
      {showGenForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Yeni Fatura Oluştur</h3>
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Rezervasyon ID *</label>
              <input type="text" value={genPayload.reservationId}
                onChange={e => setGenPayload(p => ({ ...p, reservationId: e.target.value }))}
                className="form-input" placeholder="UUID girin..." />
            </div>
            <div className="form-group">
              <label className="form-label">İndirim (₺)</label>
              <input type="number" value={genPayload.discount ?? 0}
                onChange={e => setGenPayload(p => ({ ...p, discount: Number(e.target.value) }))}
                className="form-input" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Notlar</label>
              <input type="text" value={genPayload.notes ?? ''}
                onChange={e => setGenPayload(p => ({ ...p, notes: e.target.value }))}
                className="form-input" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleGenerate} disabled={saving} className="btn btn-primary">
              {saving ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button onClick={() => setShowGenForm(false)} className="btn btn-secondary">İptal</button>
          </div>
        </div>
      )}

      {/* Invoice List + Detail */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div className="card" style={{ flex: 1, padding: 0 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Misafir</th>
                  <th>Oda</th>
                  <th style={{ textAlign: 'right' }}>Toplam</th>
                  <th style={{ textAlign: 'center' }}>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}
                    onClick={() => setSelected(inv)}
                    style={{ cursor: 'pointer', backgroundColor: selected?.id === inv.id ? 'rgba(99, 102, 241, 0.08)' : undefined }}>
                    <td style={{ fontFamily: 'monospace', color: '#646cff' }}>{inv.invoiceNumber}</td>
                    <td><strong>{inv.guestName}</strong></td>
                    <td>{inv.roomNumber}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{inv.totalAmount.toLocaleString('tr-TR')} ₺</td>
                    <td style={{ textAlign: 'center' }}>{statusBadge(inv.status)}</td>
                    <td className="text-muted">{new Date(inv.issuedAt).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Fatura bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card" style={{ width: 320, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#646cff' }}>{selected.invoiceNumber}</span>
              {statusBadge(selected.status)}
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
              <p><strong>Misafir:</strong> {selected.guestName}</p>
              <p><strong>Oda:</strong> {selected.roomNumber} ({selected.nightCount} gece)</p>
              <p><strong>Giriş:</strong> {new Date(selected.checkInDate).toLocaleDateString('tr-TR')}</p>
              <p><strong>Çıkış:</strong> {new Date(selected.checkOutDate).toLocaleDateString('tr-TR')}</p>
              {selected.billingAddress && <p><strong>Adres:</strong> {selected.billingAddress}</p>}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              <div className="detail-row"><span>Oda Ücreti</span><span>{selected.roomCharges.toLocaleString('tr-TR')} ₺</span></div>
              {selected.roomServiceCharges > 0 && (
                <div className="detail-row"><span>Oda Servisi</span><span>{selected.roomServiceCharges.toLocaleString('tr-TR')} ₺</span></div>
              )}
              {selected.discount > 0 && (
                <div className="detail-row" style={{ color: '#10b981' }}><span>İndirim</span><span>-{selected.discount.toLocaleString('tr-TR')} ₺</span></div>
              )}
              <div className="detail-row"><span>KDV (%{Math.round(selected.taxRate * 100)})</span><span>{selected.taxAmount.toLocaleString('tr-TR')} ₺</span></div>
              <div className="detail-row" style={{ fontWeight: 700, fontSize: '1rem', borderTop: '2px solid #e5e7eb', paddingTop: '0.5rem' }}>
                <span>TOPLAM</span><span>{selected.totalAmount.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => handlePrint(selected)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Printer size={14} /> Yazdır / PDF
              </button>
              {selected.status === 'Issued' && (
                <>
                  <button onClick={() => handleMarkPaid(selected.id)} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={14} /> Ödendi İşaretle
                  </button>
                  <button onClick={() => handleCancel(selected.id)} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <XCircle size={14} /> Faturayı İptal Et
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;

import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { DashboardSummary, OccupancyReport, RevenueReport, ReservationStatistics, PosTransaction } from '../types';
import { BarChart2, TrendingUp, Calendar, Home, ArrowUpRight, ArrowDownRight, Download, ShoppingCart, Printer } from 'lucide-react';
import { printReport, buildTableHtml, buildStatGridHtml } from '../utils/printExport';

const exportCsv = (filename: string, rows: string[][], headers: string[]) => {
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

type ReportTab = 'dashboard' | 'occupancy' | 'revenue' | 'reservations' | 'pos';

const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<ReportTab>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [resStats, setResStats] = useState<ReservationStatistics | null>(null);
  const [posTransactions, setPosTransactions] = useState<PosTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => {
    if (tab === 'occupancy') loadOccupancy();
    if (tab === 'revenue') loadRevenue();
    if (tab === 'reservations') loadResStats();
    if (tab === 'pos') loadPosData();
  }, [tab, fromDate, toDate]);

  const loadDashboard = async () => {
    setLoading(true);
    try { const r = await hotelService.getDashboardSummary(); setSummary(r.data); }
    catch { } finally { setLoading(false); }
  };

  const loadOccupancy = async () => {
    setLoading(true);
    try { const r = await hotelService.getOccupancyReport(fromDate, toDate); setOccupancy(r.data); }
    catch { } finally { setLoading(false); }
  };

  const loadRevenue = async () => {
    setLoading(true);
    try { const r = await hotelService.getRevenueReport(fromDate, toDate); setRevenue(r.data); }
    catch { } finally { setLoading(false); }
  };

  const loadResStats = async () => {
    setLoading(true);
    try { const r = await hotelService.getReservationStats(fromDate, toDate); setResStats(r.data); }
    catch { } finally { setLoading(false); }
  };

  const loadPosData = async () => {
    setLoading(true);
    try {
      const r = await hotelService.getPosTransactions();
      const filtered = r.data.filter(t => {
        const d = new Date(t.createdAt).toISOString().split('T')[0];
        return d >= fromDate && d <= toDate;
      });
      setPosTransactions(filtered);
    } catch { } finally { setLoading(false); }
  };

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Anlık Durum', icon: <Home size={15} /> },
    { id: 'occupancy', label: 'Doluluk', icon: <Calendar size={15} /> },
    { id: 'revenue', label: 'Gelir', icon: <TrendingUp size={15} /> },
    { id: 'reservations', label: 'Rezervasyonlar', icon: <BarChart2 size={15} /> },
    { id: 'pos', label: 'POS Raporu', icon: <ShoppingCart size={15} /> },
  ];

  const renderPdfBtn = () => {
    if (tab === 'occupancy' && occupancy) {
      return (
        <button onClick={() => {
          const stats = buildStatGridHtml([
            { label: 'Doluluk Oranı', value: `%${occupancy.occupancyRate}` },
            { label: 'Dolu Gece', value: occupancy.occupiedNights },
            { label: 'Toplam Kapasite', value: occupancy.totalNights },
          ]);
          const table = buildTableHtml(
            ['Tarih', 'Dolu Oda', 'Toplam Oda', 'Doluluk %'],
            occupancy.dailyBreakdown.map(d => [new Date(d.date).toLocaleDateString('tr-TR'), d.occupiedRooms, d.totalRooms, `%${d.occupancyRate}`])
          );
          printReport(`Doluluk Raporu (${fromDate} – ${toDate})`, stats + table);
        }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Printer size={14} style={{ marginRight: '0.5rem' }} /> PDF
        </button>
      );
    }
    if (tab === 'revenue' && revenue) {
      return (
        <button onClick={() => {
          const stats = buildStatGridHtml([
            { label: 'Toplam Gelir', value: `${fmt(revenue.totalRevenue)} ₺` },
            { label: 'Oda Geliri', value: `${fmt(revenue.roomRevenue)} ₺` },
            { label: 'ADR', value: `${fmt(revenue.adr)} ₺` },
            { label: 'RevPAR', value: `${fmt(revenue.revPAR)} ₺` },
          ]);
          const table = buildTableHtml(
            ['Tarih', 'Gelir (₺)', 'Check-in', 'Check-out'],
            revenue.dailyBreakdown.map(d => [new Date(d.date).toLocaleDateString('tr-TR'), fmt(d.revenue), d.checkIns, d.checkOuts])
          );
          printReport(`Gelir Raporu (${fromDate} – ${toDate})`, stats + table);
        }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Printer size={14} style={{ marginRight: '0.5rem' }} /> PDF
        </button>
      );
    }
    if (tab === 'pos' && posTransactions.length > 0) {
      return (
        <button onClick={() => {
          const total = posTransactions.filter(t => t.status !== 'Cancelled').reduce((s, t) => s + t.amount, 0);
          const stats = buildStatGridHtml([
            { label: 'Toplam POS Ciro', value: `${fmt(total)} ₺` },
            { label: 'İşlem Sayısı', value: posTransactions.filter(t => t.status !== 'Cancelled').length },
          ]);
          const table = buildTableHtml(
            ['Tarih', 'Oda', 'Misafir', 'Açıklama', 'Kategori', 'Tutar (₺)', 'Durum'],
            posTransactions.map(t => [
              new Date(t.createdAt).toLocaleDateString('tr-TR'),
              t.roomNumber, t.guestName, t.description, t.category, fmt(t.amount), t.status
            ])
          );
          printReport(`POS Raporu (${fromDate} – ${toDate})`, stats + table);
        }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Printer size={14} style={{ marginRight: '0.5rem' }} /> PDF
        </button>
      );
    }
    return null;
  };

  const renderCsvBtn = () => {
    if (tab === 'occupancy' && occupancy) {
      return (
        <button onClick={() => exportCsv(`doluluk_${fromDate}_${toDate}.csv`,
          occupancy.dailyBreakdown.map(d => [d.date.substring(0,10), String(d.occupiedRooms), String(d.totalRooms), String(d.occupancyRate)+'%']),
          ['Tarih', 'Dolu Oda', 'Toplam Oda', 'Doluluk Oranı'])} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Download size={14} style={{ marginRight: '0.5rem' }} /> CSV İndir
        </button>
      );
    }
    if (tab === 'revenue' && revenue) {
      return (
        <button onClick={() => exportCsv(`gelir_${fromDate}_${toDate}.csv`,
          revenue.dailyBreakdown.map(d => [d.date.substring(0,10), String(d.revenue), String(d.checkIns), String(d.checkOuts)]),
          ['Tarih', 'Gelir (₺)', 'Check-in', 'Check-out'])} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Download size={14} style={{ marginRight: '0.5rem' }} /> CSV İndir
        </button>
      );
    }
    if (tab === 'reservations' && resStats) {
      return (
        <button onClick={() => exportCsv(`rezervasyonlar_${fromDate}_${toDate}.csv`,
          [['Toplam', String(resStats.totalReservations)], ['Onaylı', String(resStats.confirmedCount)],
           ['Check-in', String(resStats.checkedInCount)], ['Check-out', String(resStats.checkedOutCount)],
           ['İptal', String(resStats.cancelledCount)], ['İptal Oranı', resStats.cancellationRate+'%'],
           ['Ort. Konaklama', resStats.averageStayDuration+' gece']],
          ['Metrik', 'Değer'])} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Download size={14} style={{ marginRight: '0.5rem' }} /> CSV İndir
        </button>
      );
    }
    if (tab === 'pos' && posTransactions.length > 0) {
      return (
        <button onClick={() => exportCsv(`pos_${fromDate}_${toDate}.csv`,
          posTransactions.map(t => [
            new Date(t.createdAt).toLocaleDateString('tr-TR'),
            t.roomNumber, t.guestName, t.description,
            t.category, String(t.amount), t.status, t.createdBy
          ]),
          ['Tarih', 'Oda', 'Misafir', 'Açıklama', 'Kategori', 'Tutar (₺)', 'Durum', 'Oluşturan']
        )} className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Download size={14} style={{ marginRight: '0.5rem' }} /> CSV İndir
        </button>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <BarChart2 size={24} style={{ color: '#646cff' }} />
        </div>
        <div>
          <h2>Raporlar & Analizler</h2>
          <p>Otel performans metrikleri</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Date Range */}
      {tab !== 'dashboard' && (
        <div className="filter-bar">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-input" style={{ width: 'auto' }} />
          <span className="text-muted">—</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-input" style={{ width: 'auto' }} />
          {renderCsvBtn()}
          {renderPdfBtn()}
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Yükleniyor...</p>}

      {/* ── Dashboard Tab ── */}
      {tab === 'dashboard' && summary && !loading && (
        <>
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Toplam Oda', value: summary.totalRooms, sub: `${summary.occupiedRooms} dolu, ${summary.availableRooms} müsait`, color: '#646cff' },
              { label: 'Doluluk Oranı', value: `%${summary.occupancyRate}`, sub: 'Bu ay', color: '#3b82f6' },
              { label: 'Bugünkü Gelir', value: `${fmt(summary.todayRevenue)} ₺`, sub: 'Bugün', color: '#10b981' },
              { label: 'Aylık Gelir', value: `${fmt(summary.monthRevenue)} ₺`, sub: 'Bu ay', color: '#8b5cf6' },
            ].map(c => (
              <div key={c.label} className="card" style={{ borderLeft: `4px solid ${c.color}` }}>
                <p className="text-muted text-xs">{c.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{c.value}</p>
                <p className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #646cff' }}>
              <p className="text-muted text-xs">ADR (Ortalama Oda Geliri)</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#646cff' }}>{fmt(summary.monthADR)} ₺</p>
              <p className="text-muted text-xs">Average Daily Rate — bu ay</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <p className="text-muted text-xs">RevPAR (Müsait Oda Başına Gelir)</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{fmt(summary.monthRevPAR)} ₺</p>
              <p className="text-muted text-xs">Revenue Per Available Room — bu ay</p>
            </div>
          </div>

          {/* Room Status */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Oda Durumları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Müsait', count: summary.availableRooms, color: '#10b981' },
                { label: 'Dolu', count: summary.occupiedRooms, color: '#ef4444' },
                { label: 'Temizleniyor', count: summary.cleaningRooms, color: '#f59e0b' },
                { label: 'Bakımda', count: summary.maintenanceRooms, color: '#f97316' },
                { label: 'Bekleyen Rez.', count: summary.pendingReservations, color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: `${s.color}15`, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</p>
                  <p className="text-muted text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today Activity */}
          <div className="grid-2">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '0.5rem' }}>
                <ArrowUpRight size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-muted text-xs">Bugün Check-in</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.todayCheckIns}</p>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem' }}>
                <ArrowDownRight size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-muted text-xs">Bugün Check-out</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.todayCheckOuts}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Occupancy Tab ── */}
      {tab === 'occupancy' && occupancy && !loading && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #646cff' }}>
              <p className="text-muted text-xs">Doluluk Oranı</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#646cff' }}>%{occupancy.occupancyRate}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
              <p className="text-muted text-xs">Dolu Gece</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{occupancy.occupiedNights}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #6b7280' }}>
              <p className="text-muted text-xs">Toplam Kapasite</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{occupancy.totalNights}</p>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th style={{ textAlign: 'center' }}>Dolu Oda</th>
                  <th style={{ textAlign: 'center' }}>Toplam Oda</th>
                  <th style={{ textAlign: 'right' }}>Doluluk %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {occupancy.dailyBreakdown.slice(0, 30).map(d => (
                  <tr key={d.date}>
                    <td>{new Date(d.date).toLocaleDateString('tr-TR')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{d.occupiedRooms}</td>
                    <td style={{ textAlign: 'center' }} className="text-muted">{d.totalRooms}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>%{d.occupancyRate}</td>
                    <td style={{ width: 120 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${d.occupancyRate}%`, backgroundColor: '#646cff' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Revenue Tab ── */}
      {tab === 'revenue' && revenue && !loading && (
        <>
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Toplam Gelir', value: `${fmt(revenue.totalRevenue)} ₺`, color: '#10b981' },
              { label: 'Oda Geliri', value: `${fmt(revenue.roomRevenue)} ₺`, color: '#646cff' },
              { label: 'ADR', value: `${fmt(revenue.adr)} ₺`, color: '#8b5cf6' },
              { label: 'RevPAR', value: `${fmt(revenue.revPAR)} ₺`, color: '#3b82f6' },
            ].map(c => (
              <div key={c.label} className="card" style={{ borderLeft: `4px solid ${c.color}` }}>
                <p className="text-muted text-xs">{c.label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {revenue.byRoomType.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Oda Tipine Göre Gelir</h3>
              {revenue.byRoomType.map(rt => (
                <div key={rt.roomType} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{rt.roomType}</span>
                    <span className="text-muted">{fmt(rt.revenue)} ₺ · %{rt.occupancyRate} doluluk</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, (rt.revenue / (revenue.totalRevenue || 1)) * 100)}%`, backgroundColor: '#646cff' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th style={{ textAlign: 'right' }}>Gelir</th>
                  <th style={{ textAlign: 'center' }}>Check-in</th>
                  <th style={{ textAlign: 'center' }}>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {revenue.dailyBreakdown.map(d => (
                  <tr key={d.date}>
                    <td>{new Date(d.date).toLocaleDateString('tr-TR')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{fmt(d.revenue)} ₺</td>
                    <td style={{ textAlign: 'center' }}>{d.checkIns}</td>
                    <td style={{ textAlign: 'center' }}>{d.checkOuts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── POS Report Tab ── */}
      {tab === 'pos' && !loading && (
        <>
          {(() => {
            const total = posTransactions.reduce((s, t) => s + (t.status !== 'Cancelled' ? t.amount : 0), 0);
            const charged = posTransactions.filter(t => t.status === 'ChargedToRoom').reduce((s, t) => s + t.amount, 0);
            const pending = posTransactions.filter(t => t.status === 'Pending').reduce((s, t) => s + t.amount, 0);
            const byCategory: Record<string, number> = {};
            posTransactions.filter(t => t.status !== 'Cancelled').forEach(t => {
              byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
            });
            const catLabels: Record<string, string> = { Restaurant: 'Restoran', Bar: 'Bar', Spa: 'Spa', Minibar: 'Minibar', Laundry: 'Çamaşırhane', Other: 'Diğer' };
            return (
              <>
                <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Toplam POS Ciro', value: `${fmt(total)} ₺`, color: '#f59e0b' },
                    { label: 'Odaya Eklenen', value: `${fmt(charged)} ₺`, color: '#10b981' },
                    { label: 'Bekleyen', value: `${fmt(pending)} ₺`, color: '#ef4444' },
                    { label: 'İşlem Sayısı', value: posTransactions.filter(t => t.status !== 'Cancelled').length, color: '#3b82f6' },
                  ].map(c => (
                    <div key={c.label} className="card" style={{ borderLeft: `4px solid ${c.color}` }}>
                      <p className="text-muted text-xs">{c.label}</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: c.color }}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {Object.keys(byCategory).length > 0 && (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Kategoriye Göre Ciro</h3>
                    {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                      <div key={cat} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 500 }}>{catLabels[cat] || cat}</span>
                          <span className="text-muted">{fmt(amt)} ₺ · %{total > 0 ? Math.round(amt / total * 100) : 0}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="card" style={{ padding: 0 }}>
                  {posTransactions.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Bu tarih aralığında POS işlemi yok.</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tarih</th><th>Oda</th><th>Misafir</th><th>Açıklama</th>
                          <th>Kategori</th><th style={{ textAlign: 'right' }}>Tutar</th><th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posTransactions.slice(0, 50).map(t => (
                          <tr key={t.id}>
                            <td>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</td>
                            <td>{t.roomNumber}</td><td>{t.guestName}</td><td>{t.description}</td>
                            <td><span className="badge badge-info">{catLabels[t.category] || t.category}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(t.amount)} ₺</td>
                            <td><span className={`badge ${t.status === 'ChargedToRoom' ? 'badge-success' : t.status === 'Pending' ? 'badge-warning' : 'badge-secondary'}`}>{t.status === 'ChargedToRoom' ? 'Odaya Eklendi' : t.status === 'Pending' ? 'Bekliyor' : t.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ── Reservation Stats Tab ── */}
      {tab === 'reservations' && resStats && !loading && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <p className="text-muted text-xs">Toplam Rezervasyon</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{resStats.totalReservations}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <p className="text-muted text-xs">İptal Oranı</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>%{resStats.cancellationRate}</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <p className="text-muted text-xs">Ort. Konaklama</p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{resStats.averageStayDuration} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 400 }}>gece</span></p>
            </div>
          </div>

          <div className="grid-2">
            {/* Status breakdown */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Duruma Göre Dağılım</h3>
              {[
                { label: 'Bekliyor', count: resStats.pendingCount, color: '#f59e0b' },
                { label: 'Onaylandı', count: resStats.confirmedCount, color: '#3b82f6' },
                { label: 'Giriş Yapıldı', count: resStats.checkedInCount, color: '#10b981' },
                { label: 'Çıkış Yapıldı', count: resStats.checkedOutCount, color: '#6b7280' },
                { label: 'İptal', count: resStats.cancelledCount, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{s.count}</span>
                  <span className="text-muted text-xs" style={{ width: 40, textAlign: 'right' }}>
                    %{resStats.totalReservations > 0 ? Math.round(s.count / resStats.totalReservations * 100) : 0}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Ödeme Yöntemleri</h3>
              {resStats.topPaymentMethods.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>{m.name}</span>
                  <div className="progress-bar" style={{ width: 96 }}>
                    <div className="progress-fill" style={{ width: `${m.percentage}%`, backgroundColor: '#646cff' }} />
                  </div>
                  <span className="text-muted text-xs" style={{ width: 32, textAlign: 'right' }}>%{m.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { hotelService } from '../services/hotelService';
import { HousekeepingTask, HousekeepingSummary, Staff, Room } from '../types';
import { useHousekeepingHub } from '../hooks/useHousekeepingHub';
import { Sparkles, Plus, CheckCircle, Clock, AlertCircle, UserCheck, RefreshCw } from 'lucide-react';
import './Housekeeping.css';

const TASK_TYPES = ['DailyClean', 'DeepClean', 'TurnDown', 'LinenChange', 'CheckoutClean'];
const STATUSES = ['Pending', 'InProgress', 'Completed', 'Skipped'];

const taskTypeLabel: Record<string, string> = {
  DailyClean: 'Günlük Temizlik',
  DeepClean: 'Derin Temizlik',
  TurnDown: 'Gece Hazırlığı',
  LinenChange: 'Çarşaf Değişimi',
  CheckoutClean: 'Çıkış Temizliği',
};

const statusLabel: Record<string, string> = {
  Pending: 'Bekliyor',
  InProgress: 'Devam Ediyor',
  Completed: 'Tamamlandı',
  Skipped: 'Atlandı',
};

const statusBadge: Record<string, string> = {
  Pending: 'badge-warning',
  InProgress: 'badge-info',
  Completed: 'badge-success',
  Skipped: 'badge-secondary',
};

const priorityLabel: Record<number, string> = { 1: 'Düşük', 2: 'Normal', 3: 'Yüksek' };

const HousekeepingPage: React.FC = () => {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [summary, setSummary] = useState<HousekeepingSummary | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [today] = useState(new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState({
    roomId: '',
    taskType: 'DailyClean',
    priority: 2,
    assignedToId: '',
    notes: '',
    scheduledDate: today,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, summaryRes, roomsRes, staffRes] = await Promise.all([
        hotelService.getHousekeepingTasks({ date: today, status: filterStatus || undefined }),
        hotelService.getHousekeepingSummary(),
        hotelService.getRooms(),
        hotelService.getStaff(),
      ]);
      setTasks(tasksRes.data);
      setSummary(summaryRes.data);
      setRooms(roomsRes.data);
      setStaff(staffRes.data);
    } catch {
      setError('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [today, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates via SignalR
  useHousekeepingHub(useCallback((updatedTask: HousekeepingTask) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === updatedTask.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedTask;
        return next;
      }
      return [updatedTask, ...prev];
    });
    // Refresh summary too
    hotelService.getHousekeepingSummary().then(r => setSummary(r.data)).catch(() => {});
  }, []));

  const handleCreate = async () => {
    if (!form.roomId) { setError('Lütfen oda seçin.'); return; }
    setSaving(true);
    setError('');
    try {
      await hotelService.createHousekeepingTask({
        ...form,
        assignedToId: form.assignedToId || undefined,
        priority: Number(form.priority),
      });
      setShowForm(false);
      setForm({ roomId: '', taskType: 'DailyClean', priority: 2, assignedToId: '', notes: '', scheduledDate: today });
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Görev oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (taskId: string, status: string) => {
    setSaving(true);
    try {
      await hotelService.updateHousekeepingStatus(taskId, status);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Durum güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const assignStaff = async (taskId: string, staffId: string) => {
    if (!staffId) return;
    setSaving(true);
    try {
      await hotelService.assignHousekeepingStaff(taskId, staffId);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Personel atanamadı.');
    } finally {
      setSaving(false);
    }
  };

  const housekeepingStaff = staff.filter(s =>
    String(s.role).toLowerCase().includes('housekeeping') ||
    String(s.role).toLowerCase().includes('cleaner') ||
    String(s.role).toLowerCase().includes('temizlik')
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Sparkles size={28} style={{ marginRight: 10, verticalAlign: 'middle' }} />
          Temizlik Yönetimi
        </h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} style={{ marginRight: 4 }} />
          Yeni Görev
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Bekliyor', value: summary.pending, color: '#f59e0b', icon: <Clock size={20} /> },
            { label: 'Devam Ediyor', value: summary.inProgress, color: '#3b82f6', icon: <RefreshCw size={20} /> },
            { label: 'Tamamlandı', value: summary.completed, color: '#10b981', icon: <CheckCircle size={20} /> },
            { label: 'Toplam', value: summary.total, color: '#6b7280', icon: <Sparkles size={20} /> },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: `3px solid ${s.color}` }}>
              <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* New Task Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ marginTop: 0 }}>Yeni Temizlik Görevi</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Oda *</label>
              <select className="form-control" value={form.roomId} onChange={e => setForm(p => ({ ...p, roomId: e.target.value }))}>
                <option value="">Oda seçin…</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Oda {r.number} ({r.type})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Görev Türü</label>
              <select className="form-control" value={form.taskType} onChange={e => setForm(p => ({ ...p, taskType: e.target.value }))}>
                {TASK_TYPES.map(t => <option key={t} value={t}>{taskTypeLabel[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Öncelik</label>
              <select className="form-control" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))}>
                <option value={1}>Düşük</option>
                <option value={2}>Normal</option>
                <option value={3}>Yüksek</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Atanan Personel</label>
              <select className="form-control" value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}>
                <option value="">Atanmadı</option>
                {(housekeepingStaff.length > 0 ? housekeepingStaff : staff).map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tarih</label>
              <input className="form-control" type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notlar</label>
              <input className="form-control" placeholder="Özel talimatlar…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-success" onClick={handleCreate} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Görevi Oluştur'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>İptal</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Filtre:</span>
          {['', ...STATUSES].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s)}
            >
              {s ? statusLabel[s] : 'Tümü'}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={loadData} style={{ marginLeft: 'auto' }} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: 4 }} />
            Yenile
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Bugünün Görevleri — {new Date(today).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Yükleniyor…</p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Bugün için görev bulunmuyor.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Oda</th>
                  <th>Görev</th>
                  <th>Öncelik</th>
                  <th>Durum</th>
                  <th>Atanan</th>
                  <th>Notlar</th>
                  <th>Durum Güncelle</th>
                  <th>Personel Ata</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.roomNumber}</strong></td>
                    <td>{taskTypeLabel[t.taskType] || t.taskType}</td>
                    <td>
                      <span style={{
                        color: t.priority === 3 ? '#ef4444' : t.priority === 2 ? '#f59e0b' : '#6b7280',
                        fontWeight: t.priority === 3 ? 600 : 400,
                      }}>
                        {priorityLabel[t.priority] || t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[t.status] || 'badge-secondary'}`}>
                        {statusLabel[t.status] || t.status}
                      </span>
                    </td>
                    <td>
                      {t.assignedToName ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <UserCheck size={14} color="#10b981" /> {t.assignedToName}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Atanmadı</span>
                      )}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{t.notes || '—'}</td>
                    <td>
                      {t.status !== 'Completed' && t.status !== 'Skipped' && (
                        <select
                          className="form-control form-control-sm"
                          style={{ width: 130 }}
                          value={t.status}
                          onChange={e => updateStatus(t.id, e.target.value)}
                          disabled={saving}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{statusLabel[s]}</option>
                          ))}
                        </select>
                      )}
                      {(t.status === 'Completed' || t.status === 'Skipped') && (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={14} /> {statusLabel[t.status]}
                        </span>
                      )}
                    </td>
                    <td>
                      {t.status !== 'Completed' && t.status !== 'Skipped' && (
                        <select
                          className="form-control form-control-sm"
                          style={{ width: 140 }}
                          value={t.assignedToId || ''}
                          onChange={e => assignStaff(t.id, e.target.value)}
                          disabled={saving}
                        >
                          <option value="">Ata…</option>
                          {(housekeepingStaff.length > 0 ? housekeepingStaff : staff).map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeepingPage;

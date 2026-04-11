import React, { useState, useEffect } from 'react';
import { hotelService } from '../services/hotelService';
import { AuditLog } from '../types';
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ENTITY_BADGE: Record<string, string> = {
  Reservation: 'badge-info', Room: 'badge-purple', Guest: 'badge-success',
  Payment: 'badge-warning', Invoice: 'badge-danger', Staff: 'badge-gray',
};

const ACTION_BADGE: Record<string, string> = {
  Created: 'badge-success', Updated: 'badge-info', Deleted: 'badge-danger',
  CheckIn: 'badge-purple', CheckOut: 'badge-purple', Cancelled: 'badge-gray', Paid: 'badge-success',
};

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityId, setEntityId] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => { loadLogs(); }, [page, entityName, entityId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await hotelService.getAuditLogs({
        entityName: entityName || undefined,
        entityId: entityId || undefined,
        page, pageSize: PAGE_SIZE,
      });
      setLogs(res.data);
    } catch { setError('Denetim kayıtları yüklenemedi.'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const formatJson = (json?: string) => {
    if (!json) return null;
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
          <Shield size={24} style={{ color: '#646cff' }} />
        </div>
        <div>
          <h2>Denetim Günlüğü</h2>
          <p>Sistem üzerindeki tüm değişikliklerin kaydı</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Filters */}
      <form onSubmit={handleSearch} className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label className="form-label">Entity Tipi</label>
            <select value={entityName} onChange={e => { setEntityName(e.target.value); setPage(1); }} className="form-input">
              <option value="">Tümü</option>
              {Object.keys(ENTITY_BADGE).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">Entity ID</label>
            <input type="text" value={entityId} onChange={e => setEntityId(e.target.value)}
              placeholder="UUID filtrele..." className="form-input" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Search size={14} style={{ marginRight: '0.25rem' }} /> Ara
            </button>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Yükleniyor...</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Zaman</th>
                  <th>Entity</th>
                  <th>İşlem</th>
                  <th>Kullanıcı</th>
                  <th>Entity ID</th>
                  <th>Notlar</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Kayıt bulunamadı</td></tr>
                )}
                {logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr onClick={() => setExpanded(expanded === log.id ? null : log.id)} style={{ cursor: 'pointer' }}>
                      <td className="text-muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td>
                        <span className={`badge ${ENTITY_BADGE[log.entityName] ?? 'badge-gray'}`}>{log.entityName}</span>
                      </td>
                      <td>
                        <span className={`badge ${ACTION_BADGE[log.action] ?? 'badge-gray'}`}>{log.action}</span>
                      </td>
                      <td>{log.changedBy ?? '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} className="text-muted">{log.entityId.substring(0, 8)}...</td>
                      <td className="text-muted text-xs">{log.notes ?? '—'}</td>
                    </tr>
                    {expanded === log.id && (log.oldValues || log.newValues) && (
                      <tr>
                        <td colSpan={6} style={{ backgroundColor: '#f9fafb', padding: '0.75rem 1.5rem' }}>
                          <div className="grid-2" style={{ fontSize: '0.75rem' }}>
                            {log.oldValues && (
                              <div>
                                <p style={{ fontWeight: 500, color: '#ef4444', marginBottom: '0.25rem' }}>Önceki Değerler</p>
                                <pre style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: '0.375rem', overflow: 'auto', maxHeight: 160, fontSize: '0.75rem' }}>
                                  {formatJson(log.oldValues)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <p style={{ fontWeight: 500, color: '#10b981', marginBottom: '0.25rem' }}>Yeni Değerler</p>
                                <pre style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem', borderRadius: '0.375rem', overflow: 'auto', maxHeight: 160, fontSize: '0.75rem' }}>
                                  {formatJson(log.newValues)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <span className="text-xs">Sayfa {page}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;

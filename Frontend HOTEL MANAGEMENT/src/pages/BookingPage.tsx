import React, { useState } from 'react';
import { Search, BedDouble, Users, MapPin, Star, ChevronRight, ChevronLeft, CheckCircle, Calendar, CreditCard, Wifi, Tv, Bath, Wind, Coffee } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { AvailableRoom, PublicReservationRequest, BookingConfirmation } from '../types';
import './BookingPage.css';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={12} />,
  'TV': <Tv size={12} />,
  'Minibar': <Coffee size={12} />,
  'Klima': <Wind size={12} />,
  'Küvet': <Bath size={12} />,
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  'Single': 'Tek Kişilik',
  'Double': 'Çift Kişilik',
  'Suite': 'Suit',
  'Deluxe': 'Deluxe',
  'single': 'Tek Kişilik',
  'double': 'Çift Kişilik',
  'suite': 'Suit',
  'deluxe': 'Deluxe',
};

const BookingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Search
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  // Step 2: Room selection
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);

  // Step 3: Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Step 4: Confirmation
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      setError('Lütfen giriş ve çıkış tarihlerini seçin.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Çıkış tarihi, giriş tarihinden sonra olmalıdır.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await bookingService.searchAvailableRooms(checkIn, checkOut, guests);
      setRooms(result);
      setSelectedRoom(null);
      setStep(2);
    } catch (err: any) {
      if (!err.response) {
        setError('Sunucuya bağlanılamadı. Backend çalışıyor mu? (http://localhost:5097)');
      } else {
        setError(err.response?.data || `Hata ${err.response?.status}: Odalar aranırken bir sorun oluştu.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (room: AvailableRoom) => {
    setSelectedRoom(room);
  };

  const handleGuestSubmit = () => {
    if (!guestName.trim()) { setError('Ad Soyad zorunludur.'); return; }
    if (!guestEmail.trim()) { setError('E-posta zorunludur.'); return; }
    if (!guestPhone.trim()) { setError('Telefon zorunludur.'); return; }
    if (!guestIdNumber.trim() || guestIdNumber.length !== 11) { setError('TC Kimlik No 11 haneli olmalıdır.'); return; }
    if (!guestAddress.trim()) { setError('Adres zorunludur.'); return; }
    setError('');
    setStep(4);
  };

  const handleReserve = async () => {
    if (!selectedRoom) return;
    setLoading(true);
    setError('');
    try {
      const request: PublicReservationRequest = {
        roomId: selectedRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        specialRequests,
        primaryGuestName: guestName,
        primaryGuestEmail: guestEmail,
        primaryGuestPhone: guestPhone,
        primaryGuestIdNumber: guestIdNumber,
        primaryGuestAddress: guestAddress,
        additionalGuests: [],
      };
      const result = await bookingService.createReservation(request);
      setConfirmation(result);
      setStep(5);
    } catch (err: any) {
      setError(err.response?.data || 'Rezervasyon oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const nightCount = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;

  return (
    <div>
      {/* Step Indicator */}
      {step <= 4 && (
        <div className="booking-steps">
          {[
            { num: 1, label: 'Tarih Seçimi' },
            { num: 2, label: 'Oda Seçimi' },
            { num: 3, label: 'Misafir Bilgileri' },
            { num: 4, label: 'Onay' },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              {i > 0 && <div className={`booking-step-connector ${step > s.num - 1 ? 'active' : ''}`} />}
              <div className={`booking-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                <span className="booking-step-number">
                  {step > s.num ? <CheckCircle size={16} /> : s.num}
                </span>
                <span className="booking-step-label">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* STEP 1: Date & Guest Search */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginBottom: '0.75rem'
            }}>
              <Calendar size={28} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Oda Ara</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Tarihlerinizi seçin ve müsait odaları görün</p>
          </div>

          <div className="grid-3" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Giriş Tarihi</label>
              <input
                type="date"
                className="form-input"
                value={checkIn}
                min={today}
                onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Çıkış Tarihi</label>
              <input
                type="date"
                className="form-input"
                value={checkOut}
                min={checkIn || today}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Misafir Sayısı</label>
              <select className="form-input" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Misafir</option>)}
              </select>
            </div>
          </div>

          {checkIn && checkOut && (
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {nightCount} gece &middot; {formatDate(checkIn)} - {formatDate(checkOut)}
            </p>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{ padding: '0.75rem 2.5rem', fontSize: '1rem' }}>
              {loading ? 'Aranıyor...' : <><Search size={18} style={{ marginRight: 8 }} /> Oda Ara</>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Room Selection */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Müsait Odalar</h2>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                {formatDate(checkIn)} - {formatDate(checkOut)} &middot; {guests} misafir &middot; {nightCount} gece
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ChevronLeft size={16} style={{ marginRight: 4 }} /> Tarihi Değiştir
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <BedDouble size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
              <h3>Müsait Oda Bulunamadı</h3>
              <p style={{ color: '#6b7280' }}>Seçtiğiniz tarihlerde uygun oda bulunmamaktadır. Lütfen farklı tarihler deneyin.</p>
              <button className="btn btn-primary" onClick={() => setStep(1)} style={{ marginTop: '1rem' }}>
                Farklı Tarih Seç
              </button>
            </div>
          ) : (
            <div className={selectedRoom ? 'booking-has-sticky' : ''}>
              <div className="room-grid">
                {rooms.map(room => {
                  const isSelected = selectedRoom?.id === room.id;
                  return (
                    <div
                      key={room.id}
                      className={`card room-card ${isSelected ? 'room-card-selected' : ''}`}
                      style={{ position: 'relative' }}
                    >
                      {isSelected && (
                        <div className="room-card-check">✓</div>
                      )}
                      <div className="room-card-header">
                        <div>
                          <div className="room-card-type">{ROOM_TYPE_LABELS[room.type] || room.type}</div>
                          <div className="room-card-number">Oda {room.number}</div>
                        </div>
                        <div className="room-card-price">
                          {room.basePrice !== room.finalPricePerNight && (
                            <span className="room-card-base-price">{room.basePrice.toFixed(0)}₺</span>
                          )}
                          <div className="room-card-price-main">{room.finalPricePerNight.toFixed(0)}₺</div>
                          <div className="room-card-price-night">/ gece</div>
                          <div className="room-card-price-total">Toplam: {room.totalPrice.toFixed(0)}₺</div>
                        </div>
                      </div>

                      <div className="room-card-details">
                        <span><MapPin size={14} /> Kat {room.floor}</span>
                        <span><Users size={14} /> {room.capacity} kişi</span>
                        <span><BedDouble size={14} /> {nightCount} gece</span>
                      </div>

                      <div className="room-card-features">
                        {room.features.map(f => (
                          <span key={f} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {FEATURE_ICONS[f] || <Star size={12} />} {f}
                          </span>
                        ))}
                      </div>

                      {room.appliedRules.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          {room.appliedRules.map((r, i) => (
                            <span key={i} className="badge badge-warning" style={{ fontSize: '0.7rem', marginRight: '0.25rem' }}>{r}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: '1rem' }}>
                        <button
                          className={`btn ${isSelected ? 'btn-success' : 'btn-primary'}`}
                          style={{ width: '100%' }}
                          onClick={() => handleSelectRoom(room)}
                        >
                          {isSelected ? '✓ Seçildi' : 'Bu Odayı Seç'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky bottom bar */}
              {selectedRoom && (
                <div className="booking-sticky-bar">
                  <div className="booking-sticky-bar-info">
                    <BedDouble size={22} />
                    <div>
                      <div className="booking-sticky-bar-room">
                        {ROOM_TYPE_LABELS[selectedRoom.type] || selectedRoom.type} — Oda {selectedRoom.number}
                      </div>
                      <div className="booking-sticky-bar-price">
                        {nightCount} gece · Toplam {selectedRoom.totalPrice.toFixed(0)}₺
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => { setError(''); setStep(3); }}
                    style={{ padding: '0.65rem 1.75rem', fontSize: '1rem', fontWeight: 600 }}
                  >
                    Devam Et <ChevronRight size={18} style={{ marginLeft: 6 }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Guest Details */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginBottom: '0.75rem'
            }}>
              <Users size={28} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Misafir Bilgileri</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Rezervasyon için bilgilerinizi girin</p>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ad Soyad *</label>
              <input className="form-input" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Ahmet Yılmaz" />
            </div>
            <div className="form-group">
              <label className="form-label">TC Kimlik No *</label>
              <input className="form-input" value={guestIdNumber} onChange={e => setGuestIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="12345678901" maxLength={11} />
              {guestIdNumber && guestIdNumber.length !== 11 && (
                <div className="form-error">TC Kimlik No 11 haneli olmalıdır ({guestIdNumber.length}/11)</div>
              )}
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">E-posta *</label>
              <input className="form-input" type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="ahmet@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon *</label>
              <input className="form-input" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+90 555 123 4567" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adres *</label>
            <input className="form-input" value={guestAddress} onChange={e => setGuestAddress(e.target.value)} placeholder="İstanbul, Türkiye" />
          </div>

          <div className="form-group">
            <label className="form-label">Özel İstekler</label>
            <textarea className="form-input" rows={3} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Ek yastık, erken check-in, vb." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ChevronLeft size={16} style={{ marginRight: 4 }} /> Geri
            </button>
            <button className="btn btn-primary" onClick={handleGuestSubmit}>
              Devam Et <ChevronRight size={16} style={{ marginLeft: 4 }} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Summary & Confirm */}
      {step === 4 && selectedRoom && (
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', marginBottom: '0.75rem'
            }}>
              <CreditCard size={28} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Rezervasyon Özeti</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Bilgileri kontrol edin ve onaylayın</p>
          </div>

          <div style={{ borderLeft: '4px solid #3b82f6', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', background: 'rgba(59,130,246,0.04)', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Oda Bilgileri</h3>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Oda</span>
              <span className="booking-summary-value">{ROOM_TYPE_LABELS[selectedRoom.type] || selectedRoom.type} - Oda {selectedRoom.number}</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Giriş</span>
              <span className="booking-summary-value">{formatDate(checkIn)}</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Çıkış</span>
              <span className="booking-summary-value">{formatDate(checkOut)}</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Süre</span>
              <span className="booking-summary-value">{nightCount} gece</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Misafir Sayısı</span>
              <span className="booking-summary-value">{guests} kişi</span>
            </div>
          </div>

          <div style={{ borderLeft: '4px solid #10b981', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', background: 'rgba(16,185,129,0.04)', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Misafir Bilgileri</h3>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Ad Soyad</span>
              <span className="booking-summary-value">{guestName}</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">E-posta</span>
              <span className="booking-summary-value">{guestEmail}</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Telefon</span>
              <span className="booking-summary-value">{guestPhone}</span>
            </div>
            {specialRequests && (
              <div className="booking-summary-row">
                <span className="booking-summary-label">Özel İstekler</span>
                <span className="booking-summary-value">{specialRequests}</span>
              </div>
            )}
          </div>

          <div style={{
            borderLeft: '4px solid #f59e0b', padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0',
            background: 'rgba(245,158,11,0.04)', marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Ödeme</h3>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Gecelik Ücret</span>
              <span className="booking-summary-value">{selectedRoom.finalPricePerNight.toFixed(0)}₺</span>
            </div>
            <div className="booking-summary-row">
              <span className="booking-summary-label">Toplam ({nightCount} gece)</span>
              <span className="booking-summary-value" style={{ fontSize: '1.2rem', color: '#059669' }}>
                {selectedRoom.totalPrice.toFixed(0)}₺
              </span>
            </div>
            <div className="booking-summary-row" style={{ borderBottom: 'none' }}>
              <span className="booking-summary-label">Ödeme Yöntemi</span>
              <span className="badge badge-info">Otelde Ödenecek</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>
              <ChevronLeft size={16} style={{ marginRight: 4 }} /> Geri
            </button>
            <button className="btn btn-success" onClick={handleReserve} disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              {loading ? 'Oluşturuluyor...' : 'Rezervasyonu Tamamla'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Confirmation */}
      {step === 5 && confirmation && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="booking-confirmation">
            <div className="booking-confirmation-icon">
              <CheckCircle size={40} style={{ color: '#059669' }} />
            </div>
            <h2 style={{ margin: '0 0 0.5rem', color: '#059669' }}>Rezervasyonunuz Oluşturuldu!</h2>
            <p style={{ color: '#6b7280' }}>Rezervasyon detaylarınız aşağıdadır.</p>

            <div className="booking-confirmation-id">
              Rezervasyon No: {confirmation.reservationId.slice(0, 8).toUpperCase()}
            </div>

            <div style={{ textAlign: 'left', marginTop: '1.5rem' }}>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Misafir</span>
                <span className="booking-summary-value">{confirmation.guestName}</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Oda</span>
                <span className="booking-summary-value">{ROOM_TYPE_LABELS[confirmation.roomType] || confirmation.roomType} - Oda {confirmation.roomNumber}</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Giriş</span>
                <span className="booking-summary-value">{formatDate(confirmation.checkInDate)}</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Çıkış</span>
                <span className="booking-summary-value">{formatDate(confirmation.checkOutDate)}</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Süre</span>
                <span className="booking-summary-value">{confirmation.nightCount} gece</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Toplam Tutar</span>
                <span className="booking-summary-value" style={{ color: '#059669', fontSize: '1.1rem' }}>{confirmation.totalAmount.toFixed(0)}₺</span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Durum</span>
                <span className="badge badge-warning">Onay Bekliyor</span>
              </div>
              <div className="booking-summary-row" style={{ borderBottom: 'none' }}>
                <span className="booking-summary-label">Ödeme</span>
                <span className="badge badge-info">Otelde Ödenecek</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59,130,246,0.06)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                Rezervasyon onayı e-posta adresinize gönderilecektir.
                Herhangi bir sorunuz için <strong>info@otelops.com</strong> ile iletişime geçebilirsiniz.
              </p>
            </div>

            <button className="btn btn-primary" onClick={() => { setStep(1); setRooms([]); setSelectedRoom(null); setConfirmation(null); setGuestName(''); setGuestEmail(''); setGuestPhone(''); setGuestIdNumber(''); setGuestAddress(''); setSpecialRequests(''); setCheckIn(''); setCheckOut(''); }} style={{ marginTop: '1.5rem' }}>
              Yeni Rezervasyon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;

import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { Search as SearchIcon, Users, DoorOpen, UserCircle } from 'lucide-react';

const SearchPage: React.FC = () => {
  const { rooms, staff, guests } = useHotel();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'rooms' | 'staff' | 'guests'>('all');

  const searchResults = () => {
    const term = searchTerm.toLowerCase();
    
    const roomResults = rooms.filter(room => 
      room.number.toLowerCase().includes(term) ||
      room.type.toLowerCase().includes(term) ||
      room.status.toLowerCase().includes(term)
    );

    const staffResults = staff.filter(s =>
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.phoneNumber.includes(term) ||
      s.role.toLowerCase().includes(term)
    );

    const guestResults = guests.filter(g =>
      g.name.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.phone.includes(term) ||
      g.idNumber.includes(term)
    );

    return { roomResults, staffResults, guestResults };
  };

  const { roomResults, staffResults, guestResults } = searchResults();

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Arama</h2>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchIcon 
              size={20} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} 
            />
            <input
              type="text"
              className="form-input"
              placeholder="Oda numarası, personel adı, misafir adı..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>
          <select 
            className="form-input" 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value as any)}
            style={{ width: '200px' }}
          >
            <option value="all">Tümü</option>
            <option value="rooms">Sadece Odalar</option>
            <option value="staff">Sadece Personel</option>
            <option value="guests">Sadece Misafirler</option>
          </select>
        </div>
      </div>

      {searchTerm.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <SearchIcon size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>Arama yapmak için en az 2 karakter girin</p>
        </div>
      ) : (
        <>
          {/* Odalar */}
          {(searchType === 'all' || searchType === 'rooms') && roomResults.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <DoorOpen size={24} />
                Odalar ({roomResults.length})
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Oda No</th>
                    <th>Tip</th>
                    <th>Kat</th>
                    <th>Fiyat</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {roomResults.map(room => (
                    <tr key={room.id}>
                      <td><strong>{room.number}</strong></td>
                      <td>{room.type}</td>
                      <td>{room.floor}</td>
                      <td>{room.price} TL</td>
                      <td>
                        <span className={`badge badge-${room.status === 'available' ? 'success' : 'info'}`}>
                          {room.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Personel */}
          {(searchType === 'all' || searchType === 'staff') && staffResults.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Users size={24} />
                Personel ({staffResults.length})
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>İsim</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Rol</th>
                    <th>Vardiya</th>
                  </tr>
                </thead>
                <tbody>
                  {staffResults.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.firstName} {s.lastName}</strong></td>
                      <td>{s.email}</td>
                      <td>{s.phoneNumber}</td>
                      <td><span className="badge badge-info">{s.role}</span></td>
                      <td>{s.shift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Misafirler */}
          {(searchType === 'all' || searchType === 'guests') && guestResults.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <UserCircle size={24} />
                Misafirler ({guestResults.length})
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>İsim</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>TC Kimlik No</th>
                    <th>Ziyaret</th>
                  </tr>
                </thead>
                <tbody>
                  {guestResults.map(g => (
                    <tr key={g.id}>
                      <td><strong>{g.name}</strong></td>
                      <td>{g.email}</td>
                      <td>{g.phone}</td>
                      <td>{g.idNumber}</td>
                      <td>{g.visits} kez</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sonuç bulunamadı */}
          {roomResults.length === 0 && staffResults.length === 0 && guestResults.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <SearchIcon size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>"{searchTerm}" için sonuç bulunamadı</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;

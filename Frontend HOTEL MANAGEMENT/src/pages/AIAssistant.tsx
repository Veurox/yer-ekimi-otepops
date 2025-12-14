import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { ChatMessage } from '../types';
import { MessageSquare, Send, Bot, User } from 'lucide-react';

const AIAssistantPage: React.FC = () => {
  const { rooms, staff, guests, reservations, inventory } = useHotel();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Merhaba! Ben OtelOPS asistanınızım. Otel verileriniz hakkında sorular sorabilir, raporlar isteyebilirsiniz.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Oda durumu soruları
    if (msg.includes('oda') && (msg.includes('durum') || msg.includes('kaç'))) {
      const available = rooms.filter(r => r.status === 'available').length;
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      const cleaning = rooms.filter(r => r.status === 'cleaning').length;
      const maintenance = rooms.filter(r => r.status === 'maintenance').length;
      
      return `Otel oda durumu:\n\n• Toplam: ${rooms.length} oda\n• Müsait: ${available} oda\n• Dolu: ${occupied} oda\n• Temizleniyor: ${cleaning} oda\n• Bakımda: ${maintenance} oda\n\nDoluluk oranı: %${Math.round((occupied / rooms.length) * 100)}`;
    }

    // Rezervasyon soruları
    if (msg.includes('rezervasyon')) {
      const pending = reservations.filter(r => r.status === 'pending').length;
      const confirmed = reservations.filter(r => r.status === 'confirmed').length;
      const checkedIn = reservations.filter(r => r.status === 'checked-in').length;
      
      return `Rezervasyon durumu:\n\n• Toplam: ${reservations.length} rezervasyon\n• Bekleyen: ${pending}\n• Onaylı: ${confirmed}\n• Konaklayan: ${checkedIn}\n\nBugünkü gelir: ${reservations.reduce((sum, r) => sum + r.totalPrice, 0).toLocaleString('tr-TR')} TL`;
    }

    // Personel soruları
    if (msg.includes('personel') || msg.includes('çalışan')) {
      const managers = staff.filter(s => s.role === 'manager').length;
      const receptionists = staff.filter(s => s.role === 'receptionist').length;
      const housekeeping = staff.filter(s => s.role === 'housekeeping').length;
      const maintenance = staff.filter(s => s.role === 'maintenance').length;
      const roomService = staff.filter(s => s.role === 'room-service').length;

      return `Personel durumu:\n\n• Toplam: ${staff.length} personel\n• Yönetici: ${managers}\n• Resepsiyonist: ${receptionists}\n• Temizlik: ${housekeeping}\n• Teknisyen: ${maintenance}\n• Oda Servisi: ${roomService}`;
    }

    // Misafir soruları
    if (msg.includes('misafir')) {
      const current = guests.filter(g => g.checkInDate && !g.checkOutDate).length;
      const totalVisits = guests.reduce((sum, g) => sum + g.visits, 0);
      const totalSpent = guests.reduce((sum, g) => sum + g.totalSpent, 0);

      return `Misafir istatistikleri:\n\n• Toplam kayıtlı: ${guests.length} misafir\n• Şu an konaklayan: ${current} misafir\n• Toplam ziyaret: ${totalVisits}\n• Toplam gelir: ${totalSpent.toLocaleString('tr-TR')} TL`;
    }

    // Envanter soruları
    if (msg.includes('envanter') || msg.includes('stok')) {
      const lowStock = inventory.filter(i => i.quantity <= i.minQuantity).length;
      const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.pricePerUnit), 0);

      return `Envanter durumu:\n\n• Toplam ürün: ${inventory.length}\n• Düşük stok: ${lowStock} ürün\n• Toplam değer: ${totalValue.toLocaleString('tr-TR')} TL\n\n${lowStock > 0 ? '⚠️ Dikkat: Bazı ürünler minimum stok seviyesinin altında!' : '✅ Tüm ürünler yeterli stokta'}`;
    }

    // Genel rapor
    if (msg.includes('rapor') || msg.includes('özet')) {
      const occupancyRate = Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100);
      const revenue = reservations.reduce((sum, r) => sum + r.totalPrice, 0);

      return `📊 OTEL YÖNETİM RAPORU\n\n🏨 Odalar:\n• Doluluk: %${occupancyRate}\n• Dolu: ${rooms.filter(r => r.status === 'occupied').length}/${rooms.length}\n\n📅 Rezervasyonlar:\n• Aktif: ${reservations.filter(r => r.status !== 'cancelled').length}\n• Gelir: ${revenue.toLocaleString('tr-TR')} TL\n\n👥 Misafirler:\n• Konaklayan: ${guests.filter(g => g.checkInDate && !g.checkOutDate).length}\n\n👨‍💼 Personel:\n• Toplam: ${staff.length} kişi\n\n📦 Envanter:\n• Düşük stok: ${inventory.filter(i => i.quantity <= i.minQuantity).length} ürün`;
    }

    // Varsayılan cevap
    return `Üzgünüm, bu konuda yardımcı olamıyorum. Şu konularda sorular sorabilirsiniz:\n\n• Oda durumları\n• Rezervasyon bilgileri\n• Personel istatistikleri\n• Misafir bilgileri\n• Envanter durumu\n• Genel rapor\n\nÖrnek: "Oda durumları nedir?", "Rezervasyon raporu", "Personel sayısı"`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>AI Asistan</h2>

      <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: message.role === 'user' ? '#3b82f6' : '#10b981',
                color: 'white',
                flexShrink: 0,
              }}>
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{
                flex: 1,
                backgroundColor: message.role === 'user' ? '#eff6ff' : '#f0fdf4',
                padding: '1rem',
                borderRadius: '0.5rem',
                maxWidth: '70%',
              }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
                <small style={{ color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                  {new Date(message.timestamp).toLocaleTimeString('tr-TR')}
                </small>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#10b981',
                color: 'white',
              }}>
                <Bot size={20} />
              </div>
              <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Otel verileriniz hakkında bir şey sorun..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button onClick={handleSend} className="btn btn-primary" disabled={isLoading || !input.trim()}>
            <Send size={20} />
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #3b82f6' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MessageSquare size={20} />
          Örnek Sorular:
        </h4>
        <ul style={{ marginLeft: '1.5rem', color: '#1e40af' }}>
          <li>Oda durumları nedir?</li>
          <li>Rezervasyon raporu göster</li>
          <li>Personel sayısı kaç?</li>
          <li>Misafir istatistikleri</li>
          <li>Envanter durumu</li>
          <li>Genel rapor</li>
        </ul>
      </div>
    </div>
  );
};

export default AIAssistantPage;

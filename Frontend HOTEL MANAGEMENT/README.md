# 🏨 Otel Yönetim Sistemi

Modern, kapsamlı ve kullanıcı dostu bir otel yönetim sistemi. React TypeScript ile geliştirilmiştir.

## ✨ Özellikler

### 1. 🔐 Güvenli Giriş Sistemi
- Formik + Yup ile validasyon
- Rol bazlı kimlik doğrulama
- 5 farklı kullanıcı rolü

### 2. 🚪 Oda Yönetimi
- Oda ekleme, düzenleme, silme
- Oda durumu yönetimi (Müsait, Dolu, Temizleniyor, Bakımda, Rezerve)
- Oda tipi ve fiyatlandırma
- Özellik yönetimi

### 3. 👥 Personel Yönetimi
- Personel CRUD işlemleri
- Rol ve vardiya yönetimi
- Maaş bilgileri
- İşe giriş tarihi takibi

### 4. 👤 Misafir Yönetimi
- Misafir kayıt sistemi
- Konaklayan ve geçmiş misafir takibi
- Ziyaret sayısı ve harcama istatistikleri
- TC Kimlik doğrulama

### 5. 📅 Rezervasyon Sistemi
- Rezervasyon oluşturma ve yönetimi
- Oda tahsisi
- Check-in / Check-out işlemleri
- Rezervasyon durumu takibi
- Özel istek yönetimi

### 6. 🔧 Teknik Servis Modülü
- Arıza kaydı oluşturma
- Öncelik seviyesi belirleme
- Teknisyen ataması
- Arıza takibi ve tamamlama
- Otomatik oda durum güncellemesi

### 7. 🍽️ Oda Servisi ve Menü Yönetimi
- Menü ürünleri CRUD
- Kategori yönetimi
- Sipariş oluşturma ve takibi
- Sipariş durumu güncellemesi

### 8. 📦 Envanter ve Stok Takibi
- Malzeme yönetimi
- Stok artırma/azaltma
- Minimum stok uyarıları
- Tedarikçi bilgileri
- Kategori bazlı organizasyon

### 9. 🔍 Gelişmiş Arama
- Oda, personel ve misafir araması
- Filtreleme seçenekleri
- Hızlı sonuçlar

### 10. 🤖 AI Asistan
- Otel verileri hakkında sohbet
- Otomatik raporlama
- İstatistiksel analizler
- Gerçek zamanlı bilgi

### 11. 🎨 Koyu/Açık Tema
- Toggle ile tema değiştirme
- LocalStorage ile kayıt
- Tüm sayfalarda tutarlı tasarım

### 12. 🔐 Rol Bazlı Erişim Kontrolü
- Her rol için özelleştirilmiş erişim
- Otomatik yetkilendirme
- Güvenli sayfa koruması

## 👥 Kullanıcı Rolleri ve Erişim

### 🔴 Yönetici (Manager)
- **Erişim:** TÜM SAYFALAR
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

### 🟢 Resepsiyonist (Receptionist)
- **Erişim:** Dashboard, Odalar, Misafirler, Rezervasyonlar, Arama
- **Kullanıcı Adı:** `resepsiyon`
- **Şifre:** `resepsiyon123`

### 🟡 Temizlik Personeli (Housekeeping)
- **Erişim:** Dashboard, Odalar
- **Kullanıcı Adı:** `temizlik`
- **Şifre:** `temizlik123`

### 🔵 Teknisyen (Maintenance)
- **Erişim:** Dashboard, Odalar, Teknik Servis
- **Kullanıcı Adı:** `tekniker`
- **Şifre:** `tekniker123`

### 🟣 Mutfak/Oda Servisi (Room Service)
- **Erişim:** Dashboard, Oda Servisi, Envanter
- **Kullanıcı Adı:** `mutfak`
- **Şifre:** `mutfak123`

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

## 🛠️ Teknolojiler

- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Vite** - Build tool
- **React Router** - Routing
- **Formik** - Form yönetimi
- **Yup** - Form validasyon
- **Lucide React** - İkonlar
- **Context API** - State yönetimi
- **LocalStorage** - Veri saklama

## 📁 Proje Yapısı

```
src/
├── components/         # Yeniden kullanılabilir bileşenler
│   ├── Layout.tsx
│   └── Layout.css
├── context/           # Context API state yönetimi
│   ├── AuthContext.tsx
│   ├── HotelContext.tsx
│   └── ThemeContext.tsx
├── pages/             # Sayfa bileşenleri
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Rooms.tsx
│   ├── Staff.tsx
│   ├── Guests.tsx
│   ├── Reservations.tsx
│   ├── Maintenance.tsx
│   ├── RoomService.tsx
│   ├── Inventory.tsx
│   ├── Search.tsx
│   └── AIAssistant.tsx
├── types/             # TypeScript tip tanımları
│   └── index.ts
├── utils/             # Yardımcı fonksiyonlar
│   └── permissions.ts
├── App.tsx            # Ana uygulama
├── main.tsx           # Entry point
└── index.css          # Global stiller
```

## 🎯 Özellikler Detay

### Veri Yönetimi
- Tüm veriler LocalStorage'da saklanır
- Sayfa yenilendiğinde veriler korunur
- CRUD operasyonları için kolay API

### Form Validasyonu
- Tüm formlarda Formik + Yup kullanılır
- Türkçe hata mesajları
- Gerçek zamanlı validasyon

### Responsive Tasarım
- Mobil uyumlu
- Tablet ve desktop desteği
- Esnek grid sistemleri

### Tema Desteği
- Açık ve koyu tema
- Otomatik kayıt
- Tüm bileşenlerde tutarlılık

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Geliştirici Notu:** Bu sistem, gerçek bir otel işletmesinde kullanılabilecek tüm temel özellikleri içerir. Veritabanı entegrasyonu ve backend API ile kolayca genişletilebilir.

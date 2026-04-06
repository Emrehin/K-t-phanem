# 📚 Kütüphanem — Kütüphane Otomasyon Sistemi

Kitap takibi, öğrenci yönetimi ve ödünç/iade süreçlerini otomatize eden web tabanlı kütüphane yönetim sistemi.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/Lisans-ISC-blue)

---

## ✨ Özellikler

- 📖 **Kitap Yönetimi** — Ekleme, düzenleme, silme ve arama (ISBN, yazar, başlık)
- 👨‍🎓 **Öğrenci Yönetimi** — Kayıt, güncelleme ve bölüm bazlı takip
- 📋 **Ödünç / İade** — Transaction ile stok bütünlüğü, otomatik son tarih (14 gün)
- ⏰ **Otomasyon** — Gecikmiş iadeleri 60 sn'de bir otomatik tespit eder
- 📊 **Raporlar** — En çok okunan kitaplar, en aktif öğrenciler, gecikme raporu
- 🔐 **Rol Bazlı Erişim** — Admin paneli + öğrenci self-servis paneli

---

## 🚀 Kurulum

```bash
git clone https://github.com/kullanici/kutuphanem.git
cd kutuphanem
npm install
```

### Çalıştırma

```bash
# Geliştirme (hot-reload)
npm run dev

# Üretim
npm start
```

Tarayıcıda `http://localhost:3000` adresini açın.

### Varsayılan Giriş

| Rol | Kullanıcı | Şifre |
|---|---|---|
| Admin | `admin` | `admin123` |
| Öğrenci | `{öğrenci_no}` | `1234` |

---

## 🏗️ Teknolojiler

| | Teknoloji |
|---|---|
| **Backend** | Node.js, Express 5 |
| **Veritabanı** | SQLite (better-sqlite3, WAL mode) |
| **Oturum** | express-session |
| **Frontend** | Vanilla HTML / CSS / JS |

---

## 📁 Proje Yapısı

```
├── server.js          # Express API sunucusu (18 endpoint)
├── database.js        # SQLite CRUD + transaction'lar
├── automation.js      # Periyodik gecikme kontrolü
├── library.db         # SQLite veritabanı
└── public/
    ├── login.html     # Giriş (admin / öğrenci)
    ├── index.html     # Dashboard
    ├── books.html     # Kitap yönetimi
    ├── students.html  # Öğrenci yönetimi
    ├── loans.html     # Ödünç işlemleri
    ├── reports.html   # Raporlar
    └── student-panel.html  # Öğrenci paneli
```

---

## 🗄️ Veritabanı

4 tablo: `books`, `students`, `admins`, `loans`

- **Foreign key** ve **WAL mode** aktif
- Ödünç/iade işlemleri **transaction** içinde çalışır
- `loans.status`: `active` → `overdue` → `returned`

---

## 🔌 API Özeti

| Endpoint | Metot | Yetki | Açıklama |
|---|---|---|---|
| `/api/auth/login` | POST | — | Giriş yap |
| `/api/books` | GET | Auth | Kitap listesi |
| `/api/books` | POST | Admin | Kitap ekle |
| `/api/students` | GET/POST | Admin | Öğrenci CRUD |
| `/api/loans` | POST | Admin | Ödünç ver |
| `/api/loans/:id/return` | PUT | Admin | İade et |
| `/api/student/my-loans` | GET | Öğrenci | Kendi ödünçleri |
| `/api/reports/stats` | GET | Admin | İstatistikler |

> Tüm yanıtlar JSON formatındadır. Toplam **18 endpoint** mevcuttur.

---

## 📸 Ekran Görüntüleri

<details>
<summary>Görselleri göster</summary>

### Giriş Sayfası
![Giriş](rapor/screenshots/login.png)

### Dashboard
![Dashboard](rapor/screenshots/dashboard.png)

### Kitap Yönetimi
![Kitaplar](rapor/screenshots/books.png)

### Ödünç İşlemleri
![Ödünç](rapor/screenshots/loans.png)

### Raporlar
![Raporlar](rapor/screenshots/reports.png)

</details>

---

## 📄 Lisans

ISC

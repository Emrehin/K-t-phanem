# [cite_start]Kütüphanem - Kütüphane Kitap Takip ve Otomasyon Sistemi [cite: 1]

[cite_start]Kütüphanelerde kitap, öğrenci ve ödünç işlemlerinin düzenli, hızlı ve izlenebilir biçimde yönetilmesini sağlayan web tabanlı bir otomasyon sistemidir. [cite: 20] [cite_start]Sistem, işlem kayıtlarını veritabanında tutar ve gecikmeleri otomatik olarak işaretler. [cite: 170] [cite_start]Öğrenci ve yönetici kullanıcıları için kontrollü bir kullanım deneyimi sunar. [cite: 23]

## Kullanılan Teknolojiler

* [cite_start]**Sunucu:** Node.js, Express 5 [cite: 108]
* [cite_start]**Veritabanı:** SQLite (better-sqlite3) [cite: 108]
* [cite_start]**Oturum Yönetimi:** express-session [cite: 108]
* [cite_start]**Arayüz:** HTML, CSS, JavaScript [cite: 108]

## Özellikler

* **Yönetici (Admin) İşlemleri:**
    * [cite_start]Kitap ekleme, güncelleme ve silme. [cite: 31]
    * [cite_start]Öğrenci kayıt işlemleri. [cite: 31]
    * [cite_start]Kitap ödünç verme ve iade alma. [cite: 31]
    * [cite_start]Gecikmiş kayıtları izleme ve istatistik raporlarını görüntüleme. [cite: 31]
* **Öğrenci İşlemleri:**
    * [cite_start]Sisteme giriş yapma ve kitap kataloğunu görüntüleme. [cite: 32]
    * [cite_start]Kitap adı, yazar veya kategoriye göre arama yapma. [cite: 74]
    * [cite_start]Kendi aktif ve gecikmiş ödünçlerini kalan süre ile birlikte listeleyebilme. [cite: 75]
* **Otomasyon:**
    * [cite_start]Belirlenen periyotlarda teslim tarihi geçmiş aktif kayıtları kontrol eder. [cite: 76]
    * [cite_start]Geciken işlemlerin durumunu 'overdue' olarak günceller. [cite: 76]

## Sistem Mimarisi ve Veritabanı

[cite_start]Sistem katmanlı bir yapı ile tasarlanmıştır. [cite: 91] [cite_start]Sunum katmanı HTML/CSS/JS dosyalarından oluşurken, iş mantığı ve istek yönlendirme katmanı Express sunucusunda yer alır. [cite: 91, 92] 

[cite_start]Veri modeli üç ana tablo üzerinde kuruludur: `books`, `students` ve `loans`. [cite: 83] [cite_start]`loans` tablosu hem kitap hem öğrenci kaydına bağlıdır; bu sayede her ödünç işlemi ilişkilendirilerek saklanır. [cite: 83, 84] [cite_start]Stok tutarlılığını sağlamak amacıyla ödünç verme ve iade işlemleri veritabanında transaction mantığıyla ele alınır. [cite: 85, 111, 112]

## Kurulum ve Çalıştırma

1.  [cite_start]Node.js çalışma ortamını kurun. [cite: 151]
2.  [cite_start]Proje klasörünü açın ve bağımlılıkları `package.json` üzerinden yükleyin (`npm install`). [cite: 152]
3.  [cite_start]`library.db` dosyasının proje kök dizininde bulunduğundan ve yazma iznine sahip olduğundan emin olun. [cite: 154]
4.  [cite_start]Sunucuyu `server.js` dosyası ile başlatın (`node server.js`). [cite: 153]
5.  [cite_start]İlk açılışta varsayılan admin kaydını kontrol edin. [cite: 155]

## Gelecekteki İyileştirmeler

* [cite_start]Parolaların hash'lenmesi ve güvenlik politikalarının eklenmesi. [cite: 176]
* [cite_start]E-posta ile gecikme bildirimi gönderme. [cite: 177]
* [cite_start]Kitap rezervasyon ve bekleme listesi özellikleri. [cite: 178]
* [cite_start]Grafiksel panel ve daha ayrıntılı raporlar. [cite: 179]
* [cite_start]Otomatik test çerçevesi ve CI sürecinin eklenmesi. [cite: 180]
* [cite_start]PostgreSQL gibi daha ölçeklenebilir bir veritabanına geçiş. [cite: 181]

## Geliştiriciler

* [cite_start]Caner Kutluk - 232511017 [cite: 5]
* [cite_start]Emre Durak - 232511049 [cite: 6]
* [cite_start]Furkan Günay - 232511025 [cite: 7]

[cite_start]*Yazılım Mühendisliği Dersi Proje Raporu - 26 Mart 2026* [cite: 2, 3, 4]

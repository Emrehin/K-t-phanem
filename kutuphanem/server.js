const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const automation = require('./automation');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'kutuphane-gizli-anahtar-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 gün
}));

// Login sayfası ve statik dosyalar giriş yapmadan erişilebilir
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// AUTH MIDDLEWARE
// ============================================

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekiyor' });
}

// ============================================
// AUTH API
// ============================================

// Giriş yap
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
        }

        if (role === 'admin') {
            const admin = db.authenticateAdmin(username, password);
            if (!admin) {
                return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
            }
            req.session.user = { id: admin.id, username: admin.username, role: 'admin' };
            res.json({ message: 'Giriş başarılı', user: req.session.user });
        } else if (role === 'student') {
            const student = db.authenticateStudent(username, password);
            if (!student) {
                return res.status(401).json({ error: 'Öğrenci numarası veya şifre hatalı' });
            }
            req.session.user = {
                id: student.id,
                name: student.name,
                student_no: student.student_no,
                department: student.department,
                role: 'student'
            };
            res.json({ message: 'Giriş başarılı', user: req.session.user });
        } else {
            res.status(400).json({ error: 'Geçersiz rol' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Çıkış yap
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Çıkış yapıldı' });
});

// Mevcut kullanıcı bilgisi
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Giriş yapılmamış' });
    }
});

// ============================================
// ÖĞRENCİ PANELİ API (auth gerekli)
// ============================================

// Öğrencinin kendi ödünç kitapları
app.get('/api/student/my-loans', requireAuth, (req, res) => {
    try {
        if (req.session.user.role !== 'student') {
            return res.status(403).json({ error: 'Sadece öğrenciler erişebilir' });
        }
        const loans = db.getLoansByStudent(req.session.user.id);
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// KİTAP API (okuma herkese, yazma admin'e)
// ============================================

// Tüm kitapları listele (herkes)
app.get('/api/books', requireAuth, (req, res) => {
    try {
        const books = db.getAllBooks();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Kitap ara (herkes)
app.get('/api/books/search', requireAuth, (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const books = db.findBooks(q);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tek kitap detayı (herkes)
app.get('/api/books/:id', requireAuth, (req, res) => {
    try {
        const book = db.getBookById(Number(req.params.id));
        if (!book) return res.status(404).json({ error: 'Kitap bulunamadı' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Yeni kitap ekle (sadece admin)
app.post('/api/books', requireAdmin, (req, res) => {
    try {
        const { title, author, isbn, category, quantity } = req.body;

        if (!title || !author) {
            return res.status(400).json({ error: 'Kitap adı ve yazar zorunludur' });
        }

        const result = db.addBook({
            title,
            author,
            isbn: isbn || null,
            category: category || 'Genel',
            quantity: quantity || 1,
            available: quantity || 1
        });

        res.status(201).json({ id: result.lastInsertRowid, message: 'Kitap eklendi' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Bu ISBN zaten kayıtlı' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Kitap güncelle (sadece admin)
app.put('/api/books/:id', requireAdmin, (req, res) => {
    try {
        const { title, author, isbn, category, quantity, available } = req.body;
        const id = Number(req.params.id);

        const existing = db.getBookById(id);
        if (!existing) return res.status(404).json({ error: 'Kitap bulunamadı' });

        db.updateBook({
            id,
            title: title || existing.title,
            author: author || existing.author,
            isbn: isbn !== undefined ? isbn : existing.isbn,
            category: category || existing.category,
            quantity: quantity !== undefined ? quantity : existing.quantity,
            available: available !== undefined ? available : existing.available
        });

        res.json({ message: 'Kitap güncellendi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Kitap sil (sadece admin)
app.delete('/api/books/:id', requireAdmin, (req, res) => {
    try {
        const result = db.deleteBook(Number(req.params.id));
        if (result.changes === 0) return res.status(404).json({ error: 'Kitap bulunamadı' });
        res.json({ message: 'Kitap silindi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ÖĞRENCİ API (sadece admin)
// ============================================

app.get('/api/students', requireAdmin, (req, res) => {
    try {
        const students = db.getAllStudents();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/students/:id', requireAdmin, (req, res) => {
    try {
        const student = db.getStudentById(Number(req.params.id));
        if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', requireAdmin, (req, res) => {
    try {
        const { name, student_no, password, email, department } = req.body;

        if (!name || !student_no) {
            return res.status(400).json({ error: 'İsim ve öğrenci numarası zorunludur' });
        }

        const result = db.addStudent({
            name,
            student_no,
            password: password || '1234',
            email: email || null,
            department: department || ''
        });

        res.status(201).json({ id: result.lastInsertRowid, message: 'Öğrenci eklendi' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Bu öğrenci numarası zaten kayıtlı' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/students/:id', requireAdmin, (req, res) => {
    try {
        const { name, student_no, password, email, department } = req.body;
        const id = Number(req.params.id);

        const existing = db.getStudentById(id);
        if (!existing) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

        db.updateStudent({
            id,
            name: name || existing.name,
            student_no: student_no || existing.student_no,
            password: password || existing.password,
            email: email !== undefined ? email : existing.email,
            department: department !== undefined ? department : existing.department
        });

        res.json({ message: 'Öğrenci güncellendi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/students/:id', requireAdmin, (req, res) => {
    try {
        const result = db.deleteStudent(Number(req.params.id));
        if (result.changes === 0) return res.status(404).json({ error: 'Öğrenci bulunamadı' });
        res.json({ message: 'Öğrenci silindi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ÖDÜNÇ ALMA / İADE API (sadece admin)
// ============================================

app.get('/api/loans', requireAdmin, (req, res) => {
    try {
        const loans = db.getAllLoans();
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/loans/active', requireAdmin, (req, res) => {
    try {
        const loans = db.getActiveLoans();
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/loans/overdue', requireAdmin, (req, res) => {
    try {
        const loans = db.getOverdueLoans();
        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loans', requireAdmin, (req, res) => {
    try {
        const { book_id, student_id, due_date } = req.body;

        if (!book_id || !student_id) {
            return res.status(400).json({ error: 'Kitap ve öğrenci seçimi zorunludur' });
        }

        const book = db.getBookById(Number(book_id));
        if (!book) return res.status(404).json({ error: 'Kitap bulunamadı' });
        if (book.available <= 0) return res.status(400).json({ error: 'Kitap stokta yok' });

        const student = db.getStudentById(Number(student_id));
        if (!student) return res.status(404).json({ error: 'Öğrenci bulunamadı' });

        const result = db.loanBook({
            book_id: Number(book_id),
            student_id: Number(student_id),
            due_date: due_date || null
        });

        res.status(201).json({ id: result.lastInsertRowid, message: 'Kitap ödünç verildi' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/loans/:id/return', requireAdmin, (req, res) => {
    try {
        db.returnBook(Number(req.params.id));
        res.json({ message: 'Kitap iade edildi' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============================================
// OTOMASYON & RAPORLAR API (sadece admin)
// ============================================

app.get('/api/reports/stats', requireAdmin, (req, res) => {
    try {
        const stats = db.getStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/overdue', requireAdmin, (req, res) => {
    try {
        const summary = automation.getOverdueSummary();
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/automation/check', requireAdmin, (req, res) => {
    try {
        const count = automation.checkOverdueLoans();
        res.json({ message: `${count} kayıt güncellendi`, updatedCount: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// SUNUCUYU BAŞLAT
// ============================================

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║   📚 Kütüphane Otomasyon Sistemi          ║
    ║   Sunucu çalışıyor: http://localhost:${PORT}  ║
    ╚════════════════════════════════════════════╝
    `);

    // Otomasyonu başlat (60 saniyede bir gecikme kontrolü)
    automation.startAutomation();
});

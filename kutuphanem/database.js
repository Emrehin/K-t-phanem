const Database = require('better-sqlite3');
const path = require('path');

// Veritabanı bağlantısı
const db = new Database(path.join(__dirname, 'library.db'));

// WAL modu — daha hızlı okuma/yazma
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// TABLO OLUŞTURMA
// ============================================

db.exec(`
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        category TEXT DEFAULT 'Genel',
        quantity INTEGER DEFAULT 1,
        available INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        student_no TEXT UNIQUE NOT NULL,
        password TEXT DEFAULT '1234',
        email TEXT,
        department TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        loan_date TEXT DEFAULT (datetime('now', 'localtime')),
        due_date TEXT NOT NULL,
        return_date TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    );
`);

// Varsayılan admin hesabı oluştur
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
if (adminExists === 0) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'admin123');
    console.log('[DB] Varsayılan admin hesabı oluşturuldu: admin / admin123');
}

// ============================================
// KİMLİK DOĞRULAMA
// ============================================

const authenticateAdmin = (username, password) => {
    return db.prepare('SELECT id, username FROM admins WHERE username = ? AND password = ?').get(username, password);
};

const authenticateStudent = (student_no, password) => {
    return db.prepare('SELECT id, name, student_no, department FROM students WHERE student_no = ? AND password = ?').get(student_no, password);
};

// ============================================
// KİTAP İŞLEMLERİ
// ============================================

const insertBook = db.prepare(`
    INSERT INTO books (title, author, isbn, category, quantity, available)
    VALUES (@title, @author, @isbn, @category, @quantity, @available)
`);

const selectAllBooks = db.prepare('SELECT * FROM books ORDER BY created_at DESC');
const selectBookById = db.prepare('SELECT * FROM books WHERE id = ?');
const deleteBookById = db.prepare('DELETE FROM books WHERE id = ?');
const searchBooks = db.prepare(`SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?`);

const updateBookStmt = db.prepare(`
    UPDATE books SET title = @title, author = @author, isbn = @isbn,
    category = @category, quantity = @quantity, available = @available
    WHERE id = @id
`);

const addBook = (book) => {
    // available varsayılan olarak quantity'ye eşit
    if (book.available === undefined) book.available = book.quantity || 1;
    return insertBook.run(book);
};
const getAllBooks = () => selectAllBooks.all();
const getBookById = (id) => selectBookById.get(id);
const deleteBook = (id) => deleteBookById.run(id);
const updateBook = (book) => updateBookStmt.run(book);
const findBooks = (query) => {
    const q = `%${query}%`;
    return searchBooks.all(q, q, q);
};

// ============================================
// ÖĞRENCİ İŞLEMLERİ
// ============================================

const insertStudent = db.prepare(`
    INSERT INTO students (name, student_no, password, email, department)
    VALUES (@name, @student_no, @password, @email, @department)
`);

const selectAllStudents = db.prepare('SELECT * FROM students ORDER BY created_at DESC');
const selectStudentById = db.prepare('SELECT * FROM students WHERE id = ?');
const deleteStudentById = db.prepare('DELETE FROM students WHERE id = ?');

const updateStudentStmt = db.prepare(`
    UPDATE students SET name = @name, student_no = @student_no,
    password = @password, email = @email, department = @department
    WHERE id = @id
`);

const addStudent = (student) => insertStudent.run(student);
const getAllStudents = () => selectAllStudents.all();
const getStudentById = (id) => selectStudentById.get(id);
const deleteStudent = (id) => deleteStudentById.run(id);
const updateStudent = (student) => updateStudentStmt.run(student);

// ============================================
// ÖDÜNÇ ALMA / İADE İŞLEMLERİ
// ============================================

const insertLoan = db.prepare(`
    INSERT INTO loans (book_id, student_id, due_date)
    VALUES (@book_id, @student_id, @due_date)
`);

const selectAllLoans = db.prepare(`
    SELECT loans.*, books.title AS book_title, students.name AS student_name
    FROM loans
    JOIN books ON loans.book_id = books.id
    JOIN students ON loans.student_id = students.id
    ORDER BY loans.loan_date DESC
`);

const selectActiveLoans = db.prepare(`
    SELECT loans.*, books.title AS book_title, students.name AS student_name
    FROM loans
    JOIN books ON loans.book_id = books.id
    JOIN students ON loans.student_id = students.id
    WHERE loans.status = 'active' OR loans.status = 'overdue'
    ORDER BY loans.due_date ASC
`);

const selectOverdueLoans = db.prepare(`
    SELECT loans.*, books.title AS book_title, students.name AS student_name
    FROM loans
    JOIN books ON loans.book_id = books.id
    JOIN students ON loans.student_id = students.id
    WHERE loans.status = 'overdue'
    ORDER BY loans.due_date ASC
`);

const returnLoanStmt = db.prepare(`
    UPDATE loans SET status = 'returned', return_date = datetime('now', 'localtime')
    WHERE id = ?
`);

const markOverdueStmt = db.prepare(`
    UPDATE loans SET status = 'overdue'
    WHERE status = 'active' AND due_date < datetime('now', 'localtime')
`);

const decreaseAvailable = db.prepare('UPDATE books SET available = available - 1 WHERE id = ? AND available > 0');
const increaseAvailable = db.prepare('UPDATE books SET available = available + 1 WHERE id = ?');

// Ödünç verme (transaction ile stok güncelle)
const loanBook = db.transaction((loanData) => {
    // Aynı kitap aynı kişiye zaten ödünç verilmiş mi kontrol et
    const existingLoan = db.prepare(
        `SELECT id FROM loans WHERE book_id = ? AND student_id = ? AND (status = 'active' OR status = 'overdue')`
    ).get(loanData.book_id, loanData.student_id);

    if (existingLoan) {
        throw new Error('Bu kitap zaten bu öğrenciye ödünç verilmiş!');
    }

    // 14 gün sonrasını hesapla
    if (!loanData.due_date) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        loanData.due_date = dueDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    const result = decreaseAvailable.run(loanData.book_id);
    if (result.changes === 0) {
        throw new Error('Kitap stokta yok!');
    }

    return insertLoan.run(loanData);
});

// İade etme (transaction ile stok güncelle)
const returnBook = db.transaction((loanId) => {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
    if (!loan || loan.status === 'returned') {
        throw new Error('Geçersiz iade işlemi!');
    }

    returnLoanStmt.run(loanId);
    increaseAvailable.run(loan.book_id);
});

const getAllLoans = () => selectAllLoans.all();
const getActiveLoans = () => selectActiveLoans.all();
const getOverdueLoans = () => selectOverdueLoans.all();
const checkOverdue = () => markOverdueStmt.run();

// Öğrenciye özel ödünç kayıtları
const selectLoansByStudent = db.prepare(`
    SELECT loans.*, books.title AS book_title, books.author AS book_author
    FROM loans
    JOIN books ON loans.book_id = books.id
    WHERE loans.student_id = ? AND (loans.status = 'active' OR loans.status = 'overdue')
    ORDER BY loans.due_date ASC
`);
const getLoansByStudent = (studentId) => selectLoansByStudent.all(studentId);

// ============================================
// İSTATİSTİKLER
// ============================================

const getStats = () => {
    const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const activeLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'active'").get().count;
    const overdueLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'overdue'").get().count;

    return { totalBooks, totalStudents, activeLoans, overdueLoans };
};

// ============================================
// EXPORT
// ============================================

module.exports = {
    db,
    // Kimlik doğrulama
    authenticateAdmin, authenticateStudent,
    // Kitaplar
    addBook, getAllBooks, getBookById, deleteBook, updateBook, findBooks,
    // Öğrenciler
    addStudent, getAllStudents, getStudentById, deleteStudent, updateStudent,
    // Ödünç
    loanBook, returnBook, getAllLoans, getActiveLoans, getOverdueLoans, checkOverdue,
    getLoansByStudent,
    // İstatistikler
    getStats
};

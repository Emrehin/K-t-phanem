// ============================================
// ÖĞRENCİ PANELİ — student-panel.js
// ============================================

let currentUser = null;
let allBooks = [];

// ============================================
// SAYFA BAŞLANGIÇ
// ============================================

async function init() {
    try {
        // Kimlik kontrolü
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = await response.json();

        if (currentUser.role !== 'student') {
            window.location.href = 'index.html';
            return;
        }

        // Kullanıcı bilgisi göster
        document.getElementById('studentName').textContent = currentUser.name;
        document.getElementById('studentInfo').textContent = `${currentUser.student_no} • ${currentUser.department || ''}`;

        // Kitapları yükle
        await loadBooks();
        await loadMyLoans();
    } catch (err) {
        window.location.href = 'login.html';
    }
}

// ============================================
// KİTAP KATALOĞU
// ============================================

async function loadBooks() {
    try {
        allBooks = await fetchAPI('/api/books');
        renderBooks(allBooks);
    } catch (err) {
        console.error('Kitaplar yüklenirken hata:', err);
    }
}

function renderBooks(books) {
    const tbody = document.getElementById('booksTableBody');

    if (books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="empty-icon">📭</div><p>Kitap bulunamadı</p></td></tr>`;
        return;
    }

    tbody.innerHTML = books.map(book => {
        const inStock = book.available > 0;
        const stockColor = inStock ? 'var(--accent-success)' : 'var(--accent-danger)';
        const stockText = inStock ? `${book.available} adet mevcut` : 'Stokta yok';
        const stockBadgeClass = inStock ? 'active' : 'overdue';

        return `
            <tr>
                <td><strong>${book.title}</strong></td>
                <td>${book.author}</td>
                <td><span class="category-badge">${book.category}</span></td>
                <td>${book.isbn || '-'}</td>
                <td>
                    <span class="status-badge ${stockBadgeClass}">● ${stockText}</span>
                </td>
            </tr>
        `;
    }).join('');
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!query) {
            renderBooks(allBooks);
            return;
        }
        const filtered = allBooks.filter(b =>
            b.title.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            b.category.toLowerCase().includes(query)
        );
        renderBooks(filtered);
    }, 300);
}

// ============================================
// ÖDÜNÇ KİTAPLARIM
// ============================================

async function loadMyLoans() {
    try {
        const loans = await fetchAPI('/api/student/my-loans');
        renderMyLoans(loans);
    } catch (err) {
        console.error('Ödünç kitaplar yüklenirken hata:', err);
    }
}

function renderMyLoans(loans) {
    const tbody = document.getElementById('myLoansBody');

    if (loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-icon">✅</div><p>Ödünç aldığınız kitap bulunmuyor</p></td></tr>`;
        return;
    }

    tbody.innerHTML = loans.map(loan => {
        const days = daysUntil(loan.due_date);
        const isOverdue = loan.status === 'overdue' || days < 0;

        let timeText, statusClass, statusText;
        if (isOverdue) {
            timeText = `${Math.abs(days)} gün gecikmiş`;
            statusClass = 'overdue';
            statusText = 'Gecikmiş';
        } else if (days <= 3) {
            timeText = `${days} gün kaldı`;
            statusClass = 'overdue';
            statusText = 'Az kaldı!';
        } else {
            timeText = `${days} gün kaldı`;
            statusClass = 'active';
            statusText = 'Aktif';
        }

        return `
            <tr>
                <td><strong>${loan.book_title}</strong></td>
                <td>${loan.book_author}</td>
                <td>${formatDate(loan.loan_date)}</td>
                <td>${formatDate(loan.due_date)}</td>
                <td style="font-weight: 600; color: ${isOverdue ? 'var(--accent-danger)' : days <= 3 ? 'var(--accent-warning)' : 'var(--accent-success)'}">
                    ${timeText}
                </td>
                <td><span class="status-badge ${statusClass}">● ${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// BÖLÜM GEÇİŞİ
// ============================================

function showSection(section) {
    document.getElementById('booksSection').style.display = section === 'books' ? '' : 'none';
    document.getElementById('myloansSection').style.display = section === 'myloans' ? '' : 'none';

    document.getElementById('pageTitle').textContent = section === 'books' ? '📖 Kitap Kataloğu' : '📋 Ödünç Kitaplarım';

    // Sidebar aktif link
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + section);
    });

    // Ödünç kitaplarımı yenile
    if (section === 'myloans') {
        loadMyLoans();
    }
}

// ============================================
// ÇIKIŞ
// ============================================

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = 'login.html';
}

// ============================================
// BAŞLAT
// ============================================

document.addEventListener('DOMContentLoaded', init);

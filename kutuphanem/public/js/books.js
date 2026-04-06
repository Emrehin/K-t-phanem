// ============================================
// KİTAP YÖNETİMİ — books.js
// ============================================

let allBooks = [];

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
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-icon">📭</div><p>Kitap bulunamadı</p></td></tr>`;
        return;
    }

    tbody.innerHTML = books.map(book => `
        <tr>
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${book.isbn || '-'}</td>
            <td><span class="category-badge">${book.category}</span></td>
            <td>
                <span style="color: ${book.available > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'}">
                    ${book.available}/${book.quantity}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editBook(${book.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id}, '${book.title.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function handleBookSubmit(e) {
    e.preventDefault();

    const bookId = document.getElementById('bookId').value;
    const bookData = {
        title: document.getElementById('title').value.trim(),
        author: document.getElementById('author').value.trim(),
        isbn: document.getElementById('isbn').value.trim() || null,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value) || 1
    };

    try {
        if (bookId) {
            // Güncelle
            bookData.available = bookData.quantity;
            await fetchAPI(`/api/books/${bookId}`, { method: 'PUT', body: bookData });
            showToast('Kitap güncellendi', 'success');
        } else {
            // Ekle
            await fetchAPI('/api/books', { method: 'POST', body: bookData });
            showToast('Kitap eklendi', 'success');
        }
        resetForm();
        loadBooks();
    } catch (err) {
        // fetchAPI zaten toast gösteriyor
    }
}

function editBook(id) {
    const book = allBooks.find(b => b.id === id);
    if (!book) return;

    document.getElementById('bookId').value = book.id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('isbn').value = book.isbn || '';
    document.getElementById('category').value = book.category;
    document.getElementById('quantity').value = book.quantity;

    document.getElementById('formTitle').textContent = '✏️ Kitap Düzenle';
    document.getElementById('submitBtn').textContent = '💾 Güncelle';
    document.getElementById('cancelBtn').style.display = '';

    const formCard = document.getElementById('bookFormCard');
    formCard.classList.add('open');
    formCard.scrollIntoView({ behavior: 'smooth' });
}

async function deleteBook(id, title) {
    const ok = await confirmDelete(`"${title}" kitabını silmek istediğinize emin misiniz?`);
    if (!ok) return;

    try {
        await fetchAPI(`/api/books/${id}`, { method: 'DELETE' });
        showToast('Kitap silindi', 'success');
        loadBooks();
    } catch (err) {
        // fetchAPI zaten toast gösteriyor
    }
}

function resetForm() {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('formTitle').textContent = '➕ Yeni Kitap Ekle';
    document.getElementById('submitBtn').textContent = '➕ Ekle';
    document.getElementById('cancelBtn').style.display = 'none';
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
            (b.isbn && b.isbn.includes(query))
        );
        renderBooks(filtered);
    }, 300);
}

document.addEventListener('DOMContentLoaded', loadBooks);

// ============================================
// ÖDÜNÇ İŞLEMLERİ — loans.js
// ============================================

async function loadLoans() {
    try {
        await loadFormData();
        await loadActiveLoans();
        await loadAllLoans();
    } catch (err) {
        console.error('Yüklenirken hata:', err);
    }
}

async function loadFormData() {
    const [students, books] = await Promise.all([
        fetchAPI('/api/students'),
        fetchAPI('/api/books')
    ]);

    const studentSelect = document.getElementById('student_id');
    studentSelect.innerHTML = '<option value="">Öğrenci seçin...</option>' +
        students.map(s => `<option value="${s.id}">${s.name} (${s.student_no})</option>`).join('');

    const bookSelect = document.getElementById('book_id');
    bookSelect.innerHTML = '<option value="">Kitap seçin...</option>' +
        books.filter(b => b.available > 0).map(b =>
            `<option value="${b.id}">${b.title} — ${b.author} (Stok: ${b.available})</option>`
        ).join('');
}

async function loadActiveLoans() {
    const loans = await fetchAPI('/api/loans/active');
    const tbody = document.getElementById('activeLoansBody');

    if (loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-icon">✅</div><p>Tüm kitaplar iade edilmiş</p></td></tr>`;
        return;
    }

    tbody.innerHTML = loans.map(loan => {
        const days = daysUntil(loan.due_date);
        const isOverdue = loan.status === 'overdue' || days < 0;
        const statusClass = isOverdue ? 'overdue' : 'active';
        const statusText = isOverdue ? `Gecikmiş (${Math.abs(days)} gün)` : `${days} gün kaldı`;

        return `
            <tr>
                <td><strong>${loan.student_name}</strong></td>
                <td>${loan.book_title}</td>
                <td>${formatDate(loan.loan_date)}</td>
                <td>${formatDate(loan.due_date)}</td>
                <td><span class="status-badge ${statusClass}">● ${statusText}</span></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="returnBook(${loan.id})">📥 İade Et</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadAllLoans() {
    const loans = await fetchAPI('/api/loans');
    const tbody = document.getElementById('allLoansBody');

    if (loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-icon">📭</div><p>Henüz kayıt yok</p></td></tr>`;
        return;
    }

    tbody.innerHTML = loans.map(loan => {
        const statusMap = {
            active: { class: 'active', text: 'Aktif' },
            returned: { class: 'returned', text: 'İade Edildi' },
            overdue: { class: 'overdue', text: 'Gecikmiş' }
        };
        const status = statusMap[loan.status] || statusMap.active;

        return `
            <tr>
                <td><strong>${loan.student_name}</strong></td>
                <td>${loan.book_title}</td>
                <td>${formatDate(loan.loan_date)}</td>
                <td>${formatDate(loan.due_date)}</td>
                <td>${loan.return_date ? formatDate(loan.return_date) : '-'}</td>
                <td><span class="status-badge ${status.class}">● ${status.text}</span></td>
            </tr>
        `;
    }).join('');
}

async function handleLoanSubmit(e) {
    e.preventDefault();

    const data = {
        book_id: document.getElementById('book_id').value,
        student_id: document.getElementById('student_id').value,
        due_date: document.getElementById('due_date').value || null
    };

    try {
        await fetchAPI('/api/loans', { method: 'POST', body: data });
        showToast('Kitap ödünç verildi', 'success');
        document.getElementById('loanForm').reset();
        loadLoans();
    } catch (err) {}
}

async function returnBook(loanId) {
    try {
        await fetchAPI(`/api/loans/${loanId}/return`, { method: 'PUT' });
        showToast('Kitap iade edildi', 'success');
        loadLoans();
    } catch (err) {}
}

async function checkOverdue() {
    try {
        const result = await fetchAPI('/api/automation/check', { method: 'POST' });
        if (result.updatedCount > 0) {
            showToast(`${result.updatedCount} gecikmiş kayıt güncellendi`, 'warning');
        } else {
            showToast('Gecikmiş kayıt bulunamadı', 'success');
        }
        loadLoans();
    } catch (err) {}
}

document.addEventListener('DOMContentLoaded', loadLoans);

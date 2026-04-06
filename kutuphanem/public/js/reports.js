// ============================================
// RAPORLAR — reports.js
// ============================================

async function loadReports() {
    try {
        // Gecikme raporu
        const overdueData = await fetchAPI('/api/reports/overdue');
        renderOverdueReport(overdueData);

        // Tüm ödünçler — en çok kitap & öğrenci hesaplama
        const loans = await fetchAPI('/api/loans');
        renderTopBooks(loans);
        renderTopStudents(loans);

    } catch (err) {
        console.error('Raporlar yüklenirken hata:', err);
    }
}

function renderOverdueReport(data) {
    const tbody = document.getElementById('overdueBody');

    if (!data.overdueList || data.overdueList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><div class="empty-icon">✅</div><p>Gecikmiş kitap yok — Harika!</p></td></tr>`;
        return;
    }

    tbody.innerHTML = data.overdueList.map(item => `
        <tr>
            <td><strong>${item.studentName}</strong></td>
            <td>${item.bookTitle}</td>
            <td>${formatDate(item.loanDate || '')}</td>
            <td>${formatDate(item.dueDate)}</td>
            <td><span class="status-badge overdue">● ${item.daysLate} gün</span></td>
        </tr>
    `).join('');
}

function renderTopBooks(loans) {
    const list = document.getElementById('topBooksList');

    const bookCounts = {};
    loans.forEach(loan => {
        const key = loan.book_title;
        if (!bookCounts[key]) {
            bookCounts[key] = { title: loan.book_title, author: loan.book_author || '', count: 0 };
        }
        bookCounts[key].count++;
    });

    const sorted = Object.values(bookCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    if (sorted.length === 0) {
        list.innerHTML = `<li class="rank-item" style="justify-content: center; color: var(--text-muted); padding: 32px;">Henüz ödünç kaydı yok</li>`;
        return;
    }

    list.innerHTML = sorted.map((item, i) => `
        <li class="rank-item">
            <div class="rank-num">${i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${item.title}</div>
                <div class="rank-detail">${item.author}</div>
            </div>
            <div class="rank-value">${item.count}×</div>
        </li>
    `).join('');
}

function renderTopStudents(loans) {
    const list = document.getElementById('topStudentsList');

    const studentCounts = {};
    loans.forEach(loan => {
        const key = loan.student_name;
        if (!studentCounts[key]) {
            studentCounts[key] = { name: loan.student_name, count: 0 };
        }
        studentCounts[key].count++;
    });

    const sorted = Object.values(studentCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    if (sorted.length === 0) {
        list.innerHTML = `<li class="rank-item" style="justify-content: center; color: var(--text-muted); padding: 32px;">Henüz ödünç kaydı yok</li>`;
        return;
    }

    list.innerHTML = sorted.map((item, i) => `
        <li class="rank-item">
            <div class="rank-num">${i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${item.name}</div>
                <div class="rank-detail">Toplam ödünç</div>
            </div>
            <div class="rank-value">${item.count}×</div>
        </li>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadReports);

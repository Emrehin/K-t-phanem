// ============================================
// ÖĞRENCİ YÖNETİMİ — students.js
// ============================================

let allStudents = [];

async function loadStudents() {
    try {
        allStudents = await fetchAPI('/api/students');
        renderStudents(allStudents);
    } catch (err) {
        console.error('Öğrenciler yüklenirken hata:', err);
    }
}

function renderStudents(students) {
    const tbody = document.getElementById('studentsTableBody');

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><div class="empty-icon">📭</div><p>Öğrenci bulunamadı</p></td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.student_no}</td>
            <td>${s.email || '-'}</td>
            <td>${s.department || '-'}</td>
            <td>${formatDate(s.created_at)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editStudent(${s.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id}, '${s.name.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const studentId = document.getElementById('studentId').value;
    const data = {
        name: document.getElementById('name').value.trim(),
        student_no: document.getElementById('student_no').value.trim(),
        password: document.getElementById('password').value.trim() || '1234',
        email: document.getElementById('email').value.trim() || null,
        department: document.getElementById('department').value.trim()
    };

    try {
        if (studentId) {
            await fetchAPI(`/api/students/${studentId}`, { method: 'PUT', body: data });
            showToast('Öğrenci güncellendi', 'success');
        } else {
            await fetchAPI('/api/students', { method: 'POST', body: data });
            showToast('Öğrenci eklendi', 'success');
        }
        resetForm();
        loadStudents();
    } catch (err) {}
}

function editStudent(id) {
    const s = allStudents.find(x => x.id === id);
    if (!s) return;

    document.getElementById('studentId').value = s.id;
    document.getElementById('name').value = s.name;
    document.getElementById('student_no').value = s.student_no;
    document.getElementById('password').value = s.password || '1234';
    document.getElementById('email').value = s.email || '';
    document.getElementById('department').value = s.department || '';

    document.getElementById('formTitle').textContent = '✏️ Öğrenci Düzenle';
    document.getElementById('submitBtn').textContent = '💾 Güncelle';
    document.getElementById('cancelBtn').style.display = '';

    const formCard = document.getElementById('studentFormCard');
    formCard.classList.add('open');
    formCard.scrollIntoView({ behavior: 'smooth' });
}

async function deleteStudent(id, name) {
    const ok = await confirmDelete(`"${name}" öğrencisini silmek istediğinize emin misiniz?`);
    if (!ok) return;

    try {
        await fetchAPI(`/api/students/${id}`, { method: 'DELETE' });
        showToast('Öğrenci silindi', 'success');
        loadStudents();
    } catch (err) {}
}

function resetForm() {
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('formTitle').textContent = '➕ Yeni Öğrenci Ekle';
    document.getElementById('submitBtn').textContent = '➕ Ekle';
    document.getElementById('cancelBtn').style.display = 'none';
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!query) {
            renderStudents(allStudents);
            return;
        }
        const filtered = allStudents.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.student_no.includes(query) ||
            (s.department && s.department.toLowerCase().includes(query))
        );
        renderStudents(filtered);
    }, 300);
}

document.addEventListener('DOMContentLoaded', loadStudents);

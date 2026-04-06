// ============================================
// ORTAK FONKSİYONLAR — app.js
// ============================================

const API_BASE = '';

// ============================================
// FETCH HELPER
// ============================================

async function fetchAPI(endpoint, options = {}) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// ============================================
// TOAST BİLDİRİM
// ============================================

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// SIDEBAR NAVİGASYON
// ============================================

function initSidebar() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Sidebar dışına tıklayınca kapat
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// ============================================
// TARİH FORMATLAMA
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function daysUntil(dateStr) {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
}

// ============================================
// SİLME ONAY MODALI
// ============================================

function confirmDelete(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal">
                <h3>⚠️ Silme Onayı</h3>
                <p style="color: var(--text-secondary); margin-bottom: 8px;">${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelDelete">İptal</button>
                    <button class="btn btn-danger" id="confirmDelete">Sil</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#confirmDelete').onclick = () => { overlay.remove(); resolve(true); };
        overlay.querySelector('#cancelDelete').onclick = () => { overlay.remove(); resolve(false); };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
}

// ============================================
// KİMLİK DOĞRULAMA
// ============================================

async function checkAdminAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = 'login.html';
            return null;
        }
        const user = await response.json();
        if (user.role !== 'admin') {
            window.location.href = 'student-panel.html';
            return null;
        }
        return user;
    } catch (err) {
        window.location.href = 'login.html';
        return null;
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = 'login.html';
}

// ============================================
// SAYFA YÜKLEME
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Login ve student-panel sayfalarında auth kontrolü yapma
    const page = window.location.pathname.split('/').pop();
    if (page !== 'login.html' && page !== 'student-panel.html') {
        const user = await checkAdminAuth();
        if (!user) return;
    }
    initSidebar();
});

const db = require('./database');

// ============================================
// OTOMASYON MODÜlÜ
// Periyodik gecikme kontrolü ve stok yönetimi
// ============================================

let intervalId = null;

/**
 * Gecikmiş ödünç kayıtlarını tespit eder ve status'u 'overdue' yapar
 * @returns {number} Güncellenen kayıt sayısı
 */
const checkOverdueLoans = () => {
    const result = db.checkOverdue();
    const count = result.changes;

    if (count > 0) {
        console.log(`[OTOMASYON] ${new Date().toLocaleString('tr-TR')} — ${count} kitap gecikmiş olarak işaretlendi.`);
    }

    return count;
};

/**
 * Dashboard için gecikme özet raporu oluşturur
 * @returns {Object} Gecikme istatistikleri
 */
const getOverdueSummary = () => {
    const overdueLoans = db.getOverdueLoans();
    const stats = db.getStats();

    return {
        overdueCount: stats.overdueLoans,
        activeCount: stats.activeLoans,
        overdueList: overdueLoans.map(loan => ({
            id: loan.id,
            bookTitle: loan.book_title,
            studentName: loan.student_name,
            dueDate: loan.due_date,
            daysLate: Math.floor(
                (new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)
            )
        }))
    };
};

/**
 * Periyodik otomasyon döngüsünü başlatır
 * @param {number} intervalMs - Kontrol aralığı (ms), varsayılan 60 saniye
 */
const startAutomation = (intervalMs = 60 * 1000) => {
    if (intervalId) {
        console.log('[OTOMASYON] Zaten çalışıyor.');
        return;
    }

    // İlk çalıştırmayı hemen yap
    console.log('[OTOMASYON] Başlatıldı — gecikme kontrolü her', intervalMs / 1000, 'saniyede bir çalışacak.');
    checkOverdueLoans();

    // Periyodik kontrol
    intervalId = setInterval(() => {
        checkOverdueLoans();
    }, intervalMs);
};

/**
 * Periyodik otomasyon döngüsünü durdurur
 */
const stopAutomation = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[OTOMASYON] Durduruldu.');
    }
};

module.exports = {
    checkOverdueLoans,
    getOverdueSummary,
    startAutomation,
    stopAutomation
};

const { pool } = require("../config/db");

// 1. Tạo thông báo mới
async function createNotification({ user_id, title, message, type }) {
    const [result] = await pool.query(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [user_id, title, message, type || 'info']
    );
    return result.insertId;
}

// 2. Lấy danh sách thông báo của 1 user
async function getByUserId(userId) {
    const [rows] = await pool.query(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        [userId]
    );
    return rows;
}

// 3. Đánh dấu đã đọc 1 tin
async function markAsRead(notiId, userId) {
    const [result] = await pool.query(
        "UPDATE notifications SET is_read = 1 WHERE noti_id = ? AND user_id = ?",
        [notiId, userId]
    );
    return result.affectedRows;
}

// 4. Đánh dấu đã đọc tất cả
async function markAllAsRead(userId) {
    const [result] = await pool.query(
        "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
        [userId]
    );
    return result.affectedRows;
}

module.exports = {
    createNotification,
    getByUserId,
    markAsRead,
    markAllAsRead
};
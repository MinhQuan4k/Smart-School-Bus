const { pool } = require("../config/db");

/**
 * 1. Gửi thông báo (Admin gửi hoặc Hệ thống gọi nội bộ)
 * [POST] /api/notifications/send
 */
exports.sendNotification = async (req, res, next) => {
    try {
        const { user_id, title, message, type } = req.body;
        // type: 'info', 'alert', 'reminder'

        // 1. Lưu vào Database (để User xem lại lịch sử)
        const [result] = await pool.query(
            "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
            [user_id, title, message, type || 'info']
        );

        // 2. Bắn Socket Real-time (Nếu User đang Online)
        // Lưu ý: Client phải join room dạng "user_{id}" hoặc "parent_{id}" tùy logic
        // Ở đây mình bắn vào cả 2 dạng phòng để chắc chắn nhận được
        const notiData = {
            id: result.insertId,
            title,
            message,
            type,
            time: new Date()
        };

        // Bắn cho phòng user chung
        req.io.to(`user_${user_id}`).emit("push_notification", notiData);
        
        // Bắn cho phòng parent cụ thể (nếu là phụ huynh)
        req.io.to(`parent_${user_id}`).emit("push_notification", notiData);

        res.status(201).json({ success: true, message: "Đã gửi thông báo thành công" });

    } catch (err) {
        next(err);
    }
};

/**
 * 2. Lấy danh sách thông báo của User đang đăng nhập
 * [GET] /api/notifications
 */
exports.getMyNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id; // Lấy từ Token

        const [rows] = await pool.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

/**
 * 3. Đánh dấu đã đọc một thông báo
 * [PUT] /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notiId = req.params.id;

        // Cập nhật is_read = 1 (TRUE)
        // Thêm điều kiện user_id để đảm bảo không đọc dùm tin nhắn người khác
        const [result] = await pool.query(
            "UPDATE notifications SET is_read = 1 WHERE noti_id = ? AND user_id = ?",
            [notiId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Không tìm thấy thông báo hoặc bạn không có quyền." });
        }

        res.json({ success: true, message: "Đã đánh dấu đã đọc." });
    } catch (err) {
        next(err);
    }
};

/**
 * 4. Đánh dấu ĐÃ ĐỌC TẤT CẢ
 * [PUT] /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await pool.query(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            [userId]
        );

        res.json({ success: true, message: "Đã đọc tất cả." });
    } catch (err) {
        next(err);
    }
};
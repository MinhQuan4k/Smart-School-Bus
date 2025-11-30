const { pool } = require("../config/db");

// 1. Xem vị trí xe buýt đang chở con mình
exports.getBusLocation = async (req, res, next) => {
    try {
        const { student_id } = req.params;
        const parentId = req.user.id;

        // A. Kiểm tra xem học sinh này có đúng là con của phụ huynh đang login không?
        const [checkChild] = await pool.query(
            "SELECT student_id FROM students WHERE student_id = ? AND parent_id = ?",
            [student_id, parentId]
        );
        if (checkChild.length === 0) {
            return res.status(403).json({ error: "Bạn không có quyền xem thông tin học sinh này." });
        }

        // B. Tìm chuyến xe MỚI NHẤT mà học sinh này đang tham gia trong ngày hôm nay
        // Logic: Tìm trong trip_attendance -> join schedules -> lấy tọa độ mới nhất
        const sql = `
            SELECT 
                s.schedule_id, s.status as trip_status,
                b.license_plate, b.brand,
                u.full_name as driver_name, u.phone as driver_phone,
                -- Lấy tọa độ mới nhất
                (SELECT latitude FROM location_logs WHERE schedule_id = s.schedule_id ORDER BY log_id DESC LIMIT 1) as lat,
                (SELECT longitude FROM location_logs WHERE schedule_id = s.schedule_id ORDER BY log_id DESC LIMIT 1) as lng,
                (SELECT speed FROM location_logs WHERE schedule_id = s.schedule_id ORDER BY log_id DESC LIMIT 1) as speed
            FROM trip_attendance ta
            JOIN schedules s ON ta.schedule_id = s.schedule_id
            JOIN buses b ON s.bus_id = b.bus_id
            JOIN users u ON s.driver_id = u.user_id
            WHERE ta.student_id = ? 
              AND s.date = CURDATE() 
              AND s.status IN ('running', 'pending')
            LIMIT 1
        `;

        const [rows] = await pool.query(sql, [student_id]);

        if (rows.length === 0) {
            return res.json({ success: false, message: "Hôm nay bé chưa có chuyến xe nào hoạt động." });
        }

        res.json({ success: true, data: rows[0] });

    } catch (err) {
        next(err);
    }
};

// 2. Lấy thông báo riêng của phụ huynh
exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            [userId]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};
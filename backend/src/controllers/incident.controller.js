const { pool } = require("../config/db");

exports.reportIncident = async (req, res, next) => {
    try {
        const { schedule_id, type, description } = req.body;
        const driverId = req.user.id; // Lấy ID tài xế từ Token

        // 1. Lưu vào Database
        const [result] = await pool.query(
            "INSERT INTO incidents (schedule_id, driver_id, type, description) VALUES (?, ?, ?, ?)",
            [schedule_id, driverId, type, description]
        );

        // 2. Lấy thông tin chi tiết để bắn thông báo
        const [rows] = await pool.query(
            `SELECT r.route_name, u.full_name as driver_name 
             FROM schedules s 
             JOIN routes r ON s.route_id = r.route_id
             JOIN users u ON s.driver_id = u.user_id
             WHERE s.schedule_id = ?`, 
            [schedule_id]
        );
        
        const info = rows[0];

        // 3. Bắn Socket khẩn cấp (ALERT)
        const alertData = {
            id: result.insertId,
            schedule_id,
            type, // 'traffic', 'breakdown', 'accident'
            message: `⚠️ SỰ CỐ: ${type.toUpperCase()} tại tuyến ${info.route_name}`,
            description,
            time: new Date()
        };

        // Bắn cho Admin (Dashboard)
        req.io.emit("incident_alert", alertData);
        
        // Bắn cho Phụ huynh đang theo dõi chuyến này
        req.io.to(`trip_${schedule_id}`).emit("incident_alert", alertData);

        res.json({ success: true, message: "Đã gửi báo cáo sự cố!" });

    } catch (err) {
        next(err);
    }
};
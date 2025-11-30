const { pool } = require("../config/db");

// 1. Lấy lịch trình hôm nay của Tài xế
exports.getTodaySchedule = async (req, res, next) => {
    try {
        const driverId = req.user.id; // Lấy ID từ Token
        
        const sql = `
            SELECT s.schedule_id, s.start_time, s.status, 
                   r.route_name, r.start_point, r.end_point, 
                   b.license_plate
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN buses b ON s.bus_id = b.bus_id
            WHERE s.driver_id = ? 
              AND s.date = CURDATE() -- Chỉ lấy ngày hiện tại
            ORDER BY s.start_time ASC
        `;
        
        const [rows] = await pool.query(sql, [driverId]);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// 2. Lấy danh sách học sinh trong chuyến đi
exports.getStudentsBySchedule = async (req, res, next) => {
    try {
        const { id } = req.params; // schedule_id

        // Lấy danh sách học sinh kèm trạng thái điểm danh
        const sql = `
            SELECT st.student_id, st.full_name, st.class_name, st.pickup_address, 
                   st.image_url, ta.status
            FROM trip_attendance ta
            JOIN students st ON ta.student_id = st.student_id
            WHERE ta.schedule_id = ?
        `;
        
        const [rows] = await pool.query(sql, [id]);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

// 3. Cập nhật điểm danh (Đón/Trả)
exports.updateAttendance = async (req, res, next) => {
    try {
        const { schedule_id, student_id, status } = req.body;
        
        // Update DB
        const timeCol = status === 'picked_up' ? 'pickup_time' : 'dropoff_time';
        await pool.query(
            `UPDATE trip_attendance SET status = ?, ${timeCol} = NOW() WHERE schedule_id = ? AND student_id = ?`,
            [status, schedule_id, student_id]
        );

        // Bắn Socket thông báo cho Phụ huynh (Nếu cần)
        // ... (Logic socket tương tự tracking.controller)

        res.json({ success: true, message: "Đã cập nhật trạng thái" });
    } catch (err) {
        next(err);
    }
};
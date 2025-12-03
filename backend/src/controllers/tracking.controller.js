const { pool } = require("../config/db");

// API: Cập nhật trạng thái đón/trả học sinh
exports.updateAttendance = async (req, res, next) => {
    try {
        const { schedule_id, student_id, status } = req.body;
        // status: 'picked_up' | 'dropped_off'

        // 1. Cập nhật vào Database
        // Nếu đón -> update pickup_time, Nếu trả -> update dropoff_time
        const timeCol = status === 'picked_up' ? 'pickup_time' : 'dropoff_time';
        
        const sql = `
            UPDATE trip_attendance 
            SET status = ?, ${timeCol} = NOW() 
            WHERE schedule_id = ? AND student_id = ?
        `;

        const [result] = await pool.query(sql, [status, schedule_id, student_id]);

        // 2. Tìm thông tin để báo cho Phụ huynh
        const [rows] = await pool.query(
            "SELECT s.parent_id, s.full_name FROM students s WHERE s.student_id = ?", 
            [student_id]
        );
        
        if (rows.length > 0) {
            const { parent_id, full_name } = rows[0];
            
            // 3. BẮN SOCKET CHO PHỤ HUYNH
            const message = status === 'picked_up' 
                ? `Học sinh ${full_name} đã lên xe.` 
                : `Học sinh ${full_name} đã xuống xe an toàn.`;

            if (req.io) {
                req.io.to(`parent_${parent_id}`).emit("child_status_change", {
                    student_id,
                    status,
                    message,
                    time: new Date()
                });
                console.log(`>> Đã báo tin cho Phụ huynh ID ${parent_id}: ${message}`);
            }
        }

        res.json({ success: true, message: "Đã cập nhật điểm danh" });

    } catch (err) {
        next(err);
    }
};

// (Nếu bạn có hàm xem lịch sử thì thêm vào đây luôn)
exports.getTripHistory = async (req, res, next) => {
    try {
        const { schedule_id } = req.params;
        const [rows] = await pool.query(
            "SELECT latitude, longitude, speed, recorded_at FROM location_logs WHERE schedule_id = ? ORDER BY log_id ASC",
            [schedule_id]
        );
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};
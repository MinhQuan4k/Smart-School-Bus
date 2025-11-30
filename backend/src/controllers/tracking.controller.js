const { pool } = require("../config/db");

// API: Cập nhật trạng thái đón/trả học sinh
exports.updateAttendance = async (req, res, next) => {
    try {
        const { schedule_id, student_id, status } = req.body;
        // status nên là: 'picked_up' (Đã đón) hoặc 'dropped_off' (Đã trả)

        // 1. Cập nhật vào Database (Lưu giờ giấc)
        // Nếu status là 'picked_up' -> cập nhật pickup_time
        // Nếu status là 'dropped_off' -> cập nhật dropoff_time
        let timeColumn = status === 'picked_up' ? 'pickup_time' : 'dropoff_time';
        
        const sql = `
            UPDATE trip_attendance 
            SET status = ?, ${timeColumn} = NOW() 
            WHERE schedule_id = ? AND student_id = ?
        `;

        const [result] = await pool.query(sql, [status, schedule_id, student_id]);

        if (result.affectedRows === 0) {
            // Nếu không update được (có thể chưa có dòng trong bảng trip_attendance)
            // Ta chèn mới vào (dự phòng)
            await pool.query(
                `INSERT INTO trip_attendance (schedule_id, student_id, status, ${timeColumn}) VALUES (?, ?, ?, NOW())`,
                [schedule_id, student_id, status]
            );
        }

        // 2. Tìm Phụ huynh của bé này để báo tin
        const [rows] = await pool.query("SELECT parent_id, full_name FROM students WHERE student_id = ?", [student_id]);
        
        if (rows.length > 0) {
            const studentName = rows[0].full_name;
            const parentId = rows[0].parent_id;
            
            // 3. BẮN SOCKET CHO RIÊNG PHỤ HUYNH ĐÓ
            const message = status === 'picked_up' 
                ? `Học sinh ${studentName} đã lên xe.` 
                : `Học sinh ${studentName} đã về đến nhà.`;

            req.io.to(`parent_${parentId}`).emit("child_status_change", {
                student_id,
                status,
                message,
                time: new Date()
            });
            
            console.log(`>> Đã báo tin cho Phụ huynh ID ${parentId}: ${message}`);
        }

        res.json({ success: true, message: "Cập nhật điểm danh thành công!" });

    } catch (err) {
        next(err);
    }
};
// API lấy toàn bộ log vị trí của 1 chuyến xe
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
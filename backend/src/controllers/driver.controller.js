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

// 2. Lấy danh sách học sinh 
exports.getStudentsBySchedule = async (req, res, next) => {
    try {
        const { id } = req.params; // schedule_id

        // Logic: Join thêm bảng route_stops để lấy số thứ tự (order_index)
        const sql = `
            SELECT 
                st.student_id, st.full_name, st.class_name, st.image_url, 
                ta.status,
                s.name as stop_name, s.address as stop_address,
                rs.order_index -- Lấy thứ tự trạm
            FROM trip_attendance ta
            JOIN students st ON ta.student_id = st.student_id
            LEFT JOIN stops s ON st.stop_id = s.stop_id
            JOIN schedules sch ON ta.schedule_id = sch.schedule_id
            -- Join để lấy thứ tự trạm trong tuyến này
            LEFT JOIN route_stops rs ON rs.route_id = sch.route_id AND rs.stop_id = s.stop_id
            
            WHERE ta.schedule_id = ?
            ORDER BY rs.order_index ASC, st.full_name ASC -- Sắp xếp theo trạm trước, rồi đến tên
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
        
        // 1. Cập nhật vào Database
        const timeCol = status === 'picked_up' ? 'pickup_time' : 'dropoff_time';
        await pool.query(
            `UPDATE trip_attendance SET status = ?, ${timeCol} = NOW() WHERE schedule_id = ? AND student_id = ?`,
            [status, schedule_id, student_id]
        );

        // 2. Tìm thông tin Phụ huynh để báo tin (Bước này bạn đang thiếu)
        const [rows] = await pool.query(
            "SELECT s.parent_id, s.full_name FROM students s WHERE s.student_id = ?", 
            [student_id]
        );
        
        // 3. Bắn Socket thông báo
        if (rows.length > 0) {
            const { parent_id, full_name } = rows[0];
            
            // Tạo nội dung tin nhắn
            const message = status === 'picked_up' 
                ? `Học sinh ${full_name} đã lên xe.` 
                : `Học sinh ${full_name} đã xuống xe an toàn.`;

            // Gửi sự kiện đến đúng Room của phụ huynh đó
            req.io.to(`parent_${parent_id}`).emit("child_status_change", {
                student_id,
                status,
                message,
                time: new Date()
            });
            
            // (Tùy chọn) Lưu thông báo vào bảng notifications để xem lại sau
            await pool.query(
                "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')",
                [parent_id, "Thông báo đưa đón", message]
            );
        }

        res.json({ success: true, message: "Đã cập nhật trạng thái và gửi thông báo" });
    } catch (err) {
        next(err);
    }
};
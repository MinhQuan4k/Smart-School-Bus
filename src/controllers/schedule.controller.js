const { pool } = require("../config/db");

// API: Tạo lịch tự động cho cả tháng/tuần
exports.createBulkSchedule = async (req, res, next) => {
    const { route_id, bus_id, driver_id, start_date, end_date, start_time } = req.body;
    // VD: start_date="2024-12-01", end_date="2024-12-31", start_time="06:30"

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction(); // Dùng Transaction để đảm bảo an toàn dữ liệu

        let currentDate = new Date(start_date);
        const end = new Date(end_date);
        const promises = [];

        while (currentDate <= end) {
            // Bỏ qua Chủ Nhật (0) hoặc Thứ 7 (6) nếu muốn
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0) { 
                const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
                
                // Query Insert
                const sql = `
                    INSERT INTO schedules (route_id, bus_id, driver_id, date, start_time, status)
                    VALUES (?, ?, ?, ?, ?, 'pending')
                `;
                promises.push(conn.query(sql, [route_id, bus_id, driver_id, dateStr, start_time]));
            }
            
            // Tăng thêm 1 ngày
            currentDate.setDate(currentDate.getDate() + 1);
        }

        await Promise.all(promises); // Chạy tất cả lệnh insert cùng lúc
        await conn.commit();

        res.json({ success: true, message: "Đã tạo lịch trình thành công!" });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};
// API: Cập nhật phân công (Thay tài xế/xe)
exports.updateAssignment = async (req, res, next) => {
    try {
        const { schedule_id, new_driver_id, new_bus_id } = req.body;

        // 1. (Nâng cao) Kiểm tra xem Tài xế mới có bị trùng lịch vào giờ đó không
        // ... (Code logic check trùng)

        // 2. Cập nhật
        const [result] = await pool.query(
            "UPDATE schedules SET driver_id = ?, bus_id = ? WHERE schedule_id = ?",
            [new_driver_id, new_bus_id, schedule_id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: "Không tìm thấy lịch trình" });

        // 3. Bắn thông báo Realtime cho tài xế mới biết
        req.io.to(`user_${new_driver_id}`).emit("notification", {
            message: "Bạn vừa được phân công chuyến mới!"
        });

        res.json({ success: true, message: "Cập nhật phân công thành công" });
    } catch (err) {
        next(err);
    }
};
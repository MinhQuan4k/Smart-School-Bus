const { pool } = require("../config/db");
const { getDistance } = require("../utils/distance"); // Import hàm tính toán

module.exports = (io, socket) => {

    socket.on("join_trip", (data) => {
        socket.join(`trip_${data.schedule_id}`);
    });

    // Tài xế gửi vị trí
    socket.on("driver_send_location", async (data) => {
        const { schedule_id, lat, lng, speed } = data;
        
        // 1. Bắn vị trí cho Admin/Phụ huynh (Như cũ)
        socket.to(`trip_${schedule_id}`).emit("update_location", {
            lat, lng, speed, updated_at: new Date()
        });

        // 2. Lưu vào DB (Như cũ)
        pool.query(
            "INSERT INTO location_logs (schedule_id, latitude, longitude, speed) VALUES (?, ?, ?, ?)",
            [schedule_id, lat, lng, speed || 0]
        ).catch(err => {});

        // --- 3. LOGIC MỚI: TÍNH KHOẢNG CÁCH & BÁO "XE SẮP ĐẾN" ---
        try {
            // Lấy danh sách học sinh của chuyến này mà CHƯA ĐÓN (not_picked)
            const [students] = await pool.query(`
                SELECT s.student_id, s.parent_id, s.full_name, s.latitude, s.longitude, ta.status
                FROM trip_attendance ta
                JOIN students s ON ta.student_id = s.student_id
                WHERE ta.schedule_id = ? AND ta.status = 'not_picked'
            `, [schedule_id]);

            students.forEach(student => {
                // Kiểm tra nếu học sinh có tọa độ
                if (student.latitude && student.longitude) {
                    const dist = getDistance(lat, lng, student.latitude, student.longitude);
                    
                    // Nếu khoảng cách < 500 mét (Bạn có thể chỉnh số này)
                    if (dist < 500) {
                        console.log(`>> Xe đang cách bé ${student.full_name} ${Math.round(dist)}m`);
                        
                        // Bắn thông báo riêng cho Phụ huynh đó
                        io.to(`parent_${student.parent_id}`).emit("push_notification", {
                            title: "XE SẮP ĐẾN!",
                            message: `Xe buýt đang cách điểm đón ${Math.round(dist)}m. Vui lòng chuẩn bị ra đón bé ${student.full_name}.`,
                            type: 'reminder',
                            time: new Date()
                        });
                    }
                }
            });
        } catch (error) {
            console.error("Lỗi tính khoảng cách:", error);
        }
    });

    // ... (Các phần khác như join_room_parent, incident giữ nguyên)
    socket.on("join_room_parent", (data) => {
        socket.join(`parent_${data.parent_id}`);
    });
};
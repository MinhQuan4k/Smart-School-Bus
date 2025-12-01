const { pool } = require("../config/db");
const { getDistance } = require("../utils/distance"); // Hàm tính Haversine

// Lưu thời gian lần cuối bắn noti cho mỗi học sinh để tránh spam (1 phút 1 lần)
const lastNotificationTime = {}; 

module.exports = (io, socket) => {
    socket.on("join_trip", (data) => { socket.join(`trip_${data.schedule_id}`); });
    socket.on("join_room_parent", (data) => { socket.join(`parent_${data.parent_id}`); });

    // Khi Tài xế gửi tọa độ
    socket.on("driver_send_location", async (data) => {
        const { schedule_id, lat, lng, speed } = data;
        
        // 1. Vẽ bản đồ (Real-time)
        socket.to(`trip_${schedule_id}`).emit("update_location", { lat, lng, speed });

        // 2. Logic Thông báo "Xe sắp đến Trạm"
        try {
            // Lấy danh sách học sinh chưa đón + TỌA ĐỘ TRẠM CỦA BÉ ĐÓ
            const sql = `
                SELECT 
                    s.student_id, s.parent_id, s.full_name,
                    st.name as stop_name, st.latitude as stop_lat, st.longitude as stop_lng
                FROM trip_attendance ta
                JOIN students s ON ta.student_id = s.student_id
                JOIN stops st ON s.stop_id = st.stop_id
                WHERE ta.schedule_id = ? AND ta.status = 'not_picked'
            `;
            const [students] = await pool.query(sql, [schedule_id]);

            students.forEach(student => {
                // Tính khoảng cách từ Xe đến Trạm
                const distance = getDistance(lat, lng, student.stop_lat, student.stop_lng);
                
                // Nếu khoảng cách < 500m (Xe sắp tới trạm)
                if (distance < 500) {
                    const now = Date.now();
                    const lastTime = lastNotificationTime[student.student_id] || 0;

                    // Chỉ báo nếu chưa báo trong vòng 5 phút qua (Tránh spam khi kẹt xe gần trạm)
                    if (now - lastTime > 5 * 60 * 1000) {
                        
                        console.log(`🔔 Báo tin cho bé ${student.full_name}: Xe cách trạm ${Math.round(distance)}m`);
                        
                        // Gửi Socket riêng cho Phụ huynh
                        io.to(`parent_${student.parent_id}`).emit("push_notification", {
                            title: "XE SẮP ĐẾN TRẠM!",
                            message: `Xe buýt đang cách trạm ${student.stop_name} khoảng ${Math.round(distance)}m. Phụ huynh vui lòng ra đón bé ${student.full_name}.`,
                            type: 'reminder',
                            time: new Date()
                        });

                        // Lưu log thông báo vào DB (Tùy chọn)
                        pool.query("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'reminder')", 
                            [student.parent_id, "Xe sắp đến trạm", `Xe cách trạm ${student.stop_name} ${Math.round(distance)}m`]);

                        // Cập nhật thời gian báo
                        lastNotificationTime[student.student_id] = now;
                    }
                }
            });

        } catch (e) {
            console.error("Lỗi tính toán trạm dừng:", e);
        }
    });
};
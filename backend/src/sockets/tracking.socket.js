const { pool } = require("../config/db");
const { getDistance } = require("../utils/distance");

// 1. Biến lưu thời gian lần cuối lưu log của từng chuyến xe
// Dạng: { 'schedule_1': 17000000, 'schedule_2': 17000020... }
const lastLogTime = {}; 

// Biến lưu thời gian lần cuối báo tin (như cũ)
const lastAlertTime = {}; 

module.exports = (io, socket) => {
    socket.on("join_trip", (data) => { socket.join(`trip_${data.schedule_id}`); });
    socket.on("join_room_parent", (data) => { socket.join(`parent_${data.parent_id}`); });

    socket.on("driver_send_location", async (data) => {
        const { schedule_id, lat, lng, speed } = data;
        const now = Date.now();
        
        // ===========================================================
        // A. LUỒNG HIỂN THỊ (REAL-TIME) - LUÔN LUÔN CHẠY
        // ===========================================================
        // Bắn ngay lập tức để bản đồ di chuyển mượt mà (2s/lần)
        socket.to(`trip_${schedule_id}`).emit("update_location", { lat, lng, speed });


        // ===========================================================
        // B. LUỒNG LƯU TRỮ (DATABASE) - CHỈ LƯU MỖI 10 GIÂY
        // ===========================================================
        const lastTimeSaved = lastLogTime[schedule_id] || 0;

        // Nếu đã qua 10 giây (10000ms) kể từ lần lưu trước
        if (now - lastTimeSaved > 10000) {
            // Cập nhật thời gian lưu mới nhất
            lastLogTime[schedule_id] = now;

            // Thực hiện lưu vào DB (Không dùng await để tránh block luồng socket)
            pool.query(
                "INSERT INTO location_logs (schedule_id, latitude, longitude, speed) VALUES (?, ?, ?, ?)",
                [schedule_id, lat, lng, speed || 0]
            ).catch(err => console.error("Lỗi lưu log:", err.message));
            
            console.log(`💾 [DB SAVED] Đã lưu log chuyến ${schedule_id}`);
        }


        // ===========================================================
        // C. LUỒNG TÍNH TOÁN KHOẢNG CÁCH (LOGIC CŨ)
        // ===========================================================
        try {
            const sql = `
                SELECT s.student_id, s.parent_id, s.full_name,
                       st.name as stop_name, st.latitude as stop_lat, st.longitude as stop_lng
                FROM trip_attendance ta
                JOIN students s ON ta.student_id = s.student_id
                JOIN stops st ON s.stop_id = st.stop_id
                WHERE ta.schedule_id = ? AND ta.status = 'not_picked'
            `;
            const [students] = await pool.query(sql, [schedule_id]);

            students.forEach(std => {
                const dist = getDistance(lat, lng, std.stop_lat, std.stop_lng);
                
                // Logic báo tin (giữ nguyên như cũ)
                if (dist < 500 && (now - (lastAlertTime[std.student_id] || 0) > 300000)) {
                    io.to(`parent_${std.parent_id}`).emit("push_notification", {
                        title: "XE SẮP ĐẾN TRẠM!",
                        message: `Xe buýt đang cách trạm ${std.stop_name} khoảng ${Math.round(dist)}m.`,
                        type: 'reminder',
                        time: new Date()
                    });
                    lastAlertTime[std.student_id] = now;
                }
            });
        } catch (e) { console.error(e); }
    });
};
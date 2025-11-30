const { pool } = require("../config/db");

/**
 * Module này xử lý toàn bộ logic Real-time
 * @param {Object} io - Đối tượng Server Socket tổng
 * @param {Object} socket - Đối tượng kết nối của từng người dùng cụ thể
 */
module.exports = (io, socket) => {

    // 1. Sự kiện: Tài xế/Phụ huynh tham gia vào chuyến xe (Join Room)
    // Client sẽ gửi lên: { schedule_id: 1 }
    socket.on("join_trip", (data) => {
        const roomId = `trip_${data.schedule_id}`;
        socket.join(roomId);
        console.log(`>> User ${socket.id} đã vào phòng: ${roomId}`);
    });

    // 2. Sự kiện: Tài xế gửi tọa độ (Driver sends location)
    socket.on("driver_send_location", async (data) => {
        const { schedule_id, lat, lng, speed } = data;
        const roomId = `trip_${schedule_id}`;

        console.log(`Nhận tọa độ Trip ${schedule_id}: [${lat}, ${lng}]`);

        // A. Gửi NGAY LẬP TỨC cho Phụ huynh trong phòng (Broadcast)
        // event tên là: "update_location"
        socket.to(roomId).emit("update_location", {
            lat, lng, speed,
            updated_at: new Date()
        });

        // B. Lưu vào Database (Lưu vết lộ trình)
        try {
            await pool.query(
                "INSERT INTO location_logs (schedule_id, latitude, longitude, speed) VALUES (?, ?, ?, ?)",
                [schedule_id, lat, lng, speed || 0]
            );
        } catch (err) {
            console.error("Lỗi lưu log vị trí:", err.message);
        }
    });

    // 3. Sự kiện: Tài xế báo sự cố (Incident)
    socket.on("driver_report_incident", (data) => {
        const { schedule_id, type, message } = data;
        const roomId = `trip_${schedule_id}`;

        // Báo cho tất cả mọi người trong phòng
        io.to(roomId).emit("incident_alert", {
            title: "CẢNH BÁO SỰ CỐ",
            type, // traffic, accident...
            message,
            time: new Date()
        });
    });
    socket.on("join_room_parent", (data) => {
        socket.join(`parent_${data.parent_id}`);
        console.log(`>> Phụ huynh ${data.parent_id} đã online nhận thông báo.`);
    });
};
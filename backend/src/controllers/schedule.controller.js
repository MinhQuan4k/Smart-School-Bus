// 1. Import Model 
const scheduleModel = require("../models/schedule.model");

// 2. IMPORT THÊM CÁI NÀY ĐỂ SỬA LỖI 
const { pool } = require("../config/db"); 

// API: Xem danh sách
exports.list = async (req, res, next) => {
    try {
        const { date } = req.query;
        const data = await scheduleModel.getAllSchedules(date);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// API: Tạo lịch hàng loạt
exports.create = async (req, res, next) => {
    try {
        const { route_id, bus_id, driver_id, start_date, end_date, start_time } = req.body;
        const count = await scheduleModel.createBulkSchedule({
            route_id, bus_id, driver_id, start_date, end_date, start_time
        });
        res.status(201).json({ success: true, message: `Đã tạo thành công ${count} chuyến xe!` });
    } catch (err) {
        next(err);
    }
};

// API: Tài xế xem lịch riêng
exports.getMySchedules = async (req, res, next) => {
    try {
        const driverId = req.user.id; 
        const data = await scheduleModel.getSchedulesByDriverId(driverId);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// --- HÀM MỚI THÊM (Lấy danh sách học sinh) ---
exports.getScheduleStudents = async (req, res, next) => {
    try {
        const { id } = req.params; // schedule_id

        // Query lấy học sinh + trạng thái điểm danh + tên trạm dừng
        const sql = `
            SELECT 
                st.student_id, 
                st.full_name, 
                st.class_name, 
                st.image_url, 
                ta.status,
                s.name as stop_name,      -- Tên trạm
                s.address as stop_address -- Địa chỉ trạm
            FROM trip_attendance ta
            JOIN students st ON ta.student_id = st.student_id
            LEFT JOIN stops s ON st.stop_id = s.stop_id
            WHERE ta.schedule_id = ?
        `;
        
        // Bây giờ biến 'pool' đã được import ở dòng 5 nên sẽ chạy ngon lành
        const [rows] = await pool.query(sql, [id]);
        
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};
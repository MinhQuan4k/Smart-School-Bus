const scheduleModel = require("../models/schedule.model");

// API: Xem danh sách
exports.list = async (req, res, next) => {
    try {
        const { date } = req.query; // Lấy ngày từ URL (nếu có)
        const data = await scheduleModel.getAllSchedules(date);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// API: Tạo lịch hàng loạt
exports.create = async (req, res, next) => {
    try {
        // Lấy dữ liệu từ Body Postman gửi lên
        const { route_id, bus_id, driver_id, start_date, end_date, start_time } = req.body;

        // Gọi Model xử lý
        const count = await scheduleModel.createBulkSchedule({
            route_id, bus_id, driver_id, start_date, end_date, start_time
        });

        res.status(201).json({ 
            success: true, 
            message: `Đã tạo thành công ${count} chuyến xe!` 
        });
    } catch (err) {
        next(err);
    }
};
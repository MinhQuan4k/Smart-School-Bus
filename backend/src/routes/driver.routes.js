const express = require("express");
const router = express.Router();
// 1. Import đúng hàm verifyToken từ middleware (dùng dấu ngoặc nhọn {})
const { verifyToken } = require("../middlewares/auth.middleware");

// 2. Import Controller (Bạn đang thiếu dòng này)
const driverController = require("../controllers/driver.controller");

// 3. Middleware chặn chung cho tất cả các route bên dưới
// Chỉ cho phép người đã đăng nhập (có Token) truy cập
router.use(verifyToken);

// Middleware kiểm tra có phải là Driver không (viết inline cho gọn)
const isDriver = (req, res, next) => {
    if (req.user.role === 'driver') next();
    else res.status(403).json({ error: "Chỉ tài xế mới có quyền này" });
};
router.use(isDriver);

// --- CÁC ROUTE CỦA TÀI XẾ ---

// Xem lịch hôm nay
router.get("/schedules/today", driverController.getTodaySchedule);

// Xem danh sách học sinh của một chuyến cụ thể
router.get("/schedules/:id/students", driverController.getStudentsBySchedule);

// Điểm danh (Đón/Trả)
router.put("/attendance", driverController.updateAttendance);

module.exports = router;
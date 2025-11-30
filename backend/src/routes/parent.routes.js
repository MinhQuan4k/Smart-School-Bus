const express = require("express");
const router = express.Router();
// 1. Import đúng hàm verifyToken
const { verifyToken } = require("../middlewares/auth.middleware");

// 2. Import Controller (Sắp tạo ở bước 2)
const parentController = require("../controllers/parent.controller");

// 3. Middleware bảo vệ (Yêu cầu Login)
router.use(verifyToken);

// 4. Middleware kiểm tra quyền Phụ Huynh (Viết inline cho gọn)
const isParent = (req, res, next) => {
    if (req.user.role === 'parent') next();
    else res.status(403).json({ error: "Chỉ tài khoản Phụ huynh mới được dùng tính năng này" });
};
router.use(isParent);

// --- CÁC ROUTE CỦA PHỤ HUYNH ---

// Xem vị trí xe của con (Dựa vào Student ID)
router.get("/bus-location/:student_id", parentController.getBusLocation);

// Xem thông báo của phụ huynh
router.get("/notifications", parentController.getNotifications);

module.exports = router;
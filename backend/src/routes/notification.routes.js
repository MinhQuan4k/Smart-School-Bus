const express = require("express");
const router = express.Router();
const notiController = require("../controllers/notification.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Lấy danh sách thông báo (Của chính mình)
router.get("/", verifyToken, notiController.getMyNotifications);

// Gửi thông báo (Chỉ Admin mới được gửi)
router.post("/send", verifyToken, isAdmin, notiController.sendNotification);

// Đánh dấu đã đọc 1 tin
router.put("/:id/read", verifyToken, notiController.markAsRead);

// Đánh dấu đã đọc tất cả
router.put("/read-all", verifyToken, notiController.markAllAsRead);

module.exports = router;
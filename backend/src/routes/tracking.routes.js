const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Định nghĩa API Điểm danh
// URL đầy đủ: PUT /api/tracking/attendance
router.put("/attendance", verifyToken, trackingController.updateAttendance);

// Định nghĩa API Xem lịch sử
router.get("/history/:schedule_id", verifyToken, trackingController.getTripHistory);

module.exports = router;
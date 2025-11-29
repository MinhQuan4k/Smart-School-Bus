const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/tracking.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// API: POST /api/tracking/attendance
// (Cần đăng nhập mới được gọi)
router.post("/attendance", verifyToken, trackingController.updateAttendance);

module.exports = router;
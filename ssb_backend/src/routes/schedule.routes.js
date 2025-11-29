const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
// GET /api/schedules (Xem lịch)
router.get("/", scheduleController.list);

// POST /api/schedules (Tạo lịch)
router.post("/", scheduleController.create);
router.post("/", verifyToken, isAdmin, scheduleController.create);
router.get("/driver/me", verifyToken, scheduleController.getMySchedules);
module.exports = router;
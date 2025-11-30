const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// API tải file excel (GET)
router.get("/attendance", verifyToken, reportController.exportAttendance);

module.exports = router;
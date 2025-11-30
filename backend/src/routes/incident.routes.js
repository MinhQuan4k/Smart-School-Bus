const express = require("express");
const router = express.Router();
const incidentController = require("../controllers/incident.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Chỉ tài xế (hoặc người đã đăng nhập) mới được báo sự cố
router.post("/", verifyToken, incidentController.reportIncident);

module.exports = router;
const express = require("express");
const router = express.Router();
const routeController = require("../controllers/route.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// --- API CRUD TUYẾN ĐƯỜNG ---
router.get("/", verifyToken, routeController.list);        // Lấy danh sách
router.post("/", verifyToken, isAdmin, routeController.create); // Tạo mới
router.put("/:id", verifyToken, isAdmin, routeController.update); // Cập nhật
router.delete("/:id", verifyToken, isAdmin, routeController.delete); // Xóa

// --- API QUẢN LÝ TRẠM TRONG TUYẾN ---
router.get("/:id/stops", verifyToken, routeController.getRouteDetails); // Lấy các trạm của tuyến
router.post("/stops", verifyToken, isAdmin, routeController.addStop);   // Thêm trạm vào tuyến
router.delete("/:id/stops/:stopId", verifyToken, isAdmin, routeController.removeStop); // Gỡ trạm khỏi tuyến

module.exports = router;
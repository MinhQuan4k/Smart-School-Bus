const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Xem danh sách (Ai đăng nhập cũng xem được, hoặc chỉ Admin/Tài xế tùy bạn)
router.get("/", verifyToken, studentController.list);

// Thêm/Sửa/Xóa (Chỉ Admin)
router.post("/", verifyToken, isAdmin, studentController.create);
router.put("/:id", verifyToken, isAdmin, studentController.update);
router.delete("/:id", verifyToken, isAdmin, studentController.delete);

module.exports = router;
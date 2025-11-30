const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Quản lý TÀI XẾ
router.get("/drivers", verifyToken, isAdmin, userController.getDrivers);
router.post("/drivers", verifyToken, isAdmin, userController.createDriver);

// Quản lý PHỤ HUYNH
router.get("/parents", verifyToken, isAdmin, userController.getParents);
router.post("/parents", verifyToken, isAdmin, userController.createParent);

// Xóa chung
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);
// Cập nhật chung
router.put("/:id", verifyToken, isAdmin, userController.updateUser);
module.exports = router;
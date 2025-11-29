const express = require("express");
const router = express.Router();
const routeController = require("../controllers/route.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, routeController.list);
router.post("/", verifyToken, isAdmin, routeController.create);
router.put("/:id", verifyToken, isAdmin, routeController.update);
router.delete("/:id", verifyToken, isAdmin, routeController.delete);

module.exports = router;
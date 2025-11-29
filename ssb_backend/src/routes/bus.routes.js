const express = require("express");
const router = express.Router();
const busController = require("../controllers/bus.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, busController.list);
router.post("/", verifyToken, isAdmin, busController.create);
router.delete("/:id", verifyToken, isAdmin, busController.delete);

module.exports = router;
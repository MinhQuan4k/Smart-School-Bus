const express = require("express");
const router = express.Router();
const stopController = require("../controllers/stop.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, stopController.list);
router.post("/", verifyToken, isAdmin, stopController.create);
router.delete("/:id", verifyToken, isAdmin, stopController.delete);

module.exports = router;
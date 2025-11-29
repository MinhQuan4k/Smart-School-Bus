const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Định nghĩa API
router.post("/register", express.json(), authController.register);
router.post("/login", express.json(), authController.login);

module.exports = router;
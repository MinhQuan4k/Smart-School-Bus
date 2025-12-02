const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validate, registerSchema } = require("../utils/validation");
// Định nghĩa API
router.post("/register", express.json(), authController.register);
router.post("/login", express.json(), authController.login);
router.post("/register", validate(registerSchema), authController.register);


module.exports = router;
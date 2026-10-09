const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");
const { validateRegistration, validateLogin } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.get("/me", requireAuth, getMe);

module.exports = router;

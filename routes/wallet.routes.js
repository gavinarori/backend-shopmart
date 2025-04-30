// routes/wallet.js
const express = require("express");
const { withdrawFunds } = require("../controllers/payments/wallet.controller");
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post("/withdraw", authMiddleware, withdrawFunds);

module.exports = router;

// routes/wallet.js
const express = require("express");
const { withdrawFunds } = require("../controllers/payments/wallet.controller");
const router = express.Router();
const auth = require("../middlewares/auth"); 

router.post("/withdraw", auth, withdrawFunds);

module.exports = router;

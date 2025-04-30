// routes/mpesa.js
const express = require("express");
const router = express.Router();
const { handleB2CResult, handleB2CTimeout } = require("../controllers/payments/mpesa.controller");

router.post("/b2c/result", handleB2CResult);
router.post("/b2c/timeout", handleB2CTimeout);

module.exports = router;

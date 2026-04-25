const express = require("express");
const { chatWithAssistant } = require("../controllers/chatbotController");

const router = express.Router();

router.post("/", chatWithAssistant);

module.exports = router;


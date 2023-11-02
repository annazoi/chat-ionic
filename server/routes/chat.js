const express = require("express");
const router = express.Router();
const chatControllers = require("../controllers/chat");
const { protect } = require("../middlewares/authMiddleware");

// chat routes
router.post("/", protect, chatControllers.createChat);
router.get("/", protect, chatControllers.getChats);
router.get("/:chatId", protect, chatControllers.getChat);
router.put("/:chatId", protect, chatControllers.updateChat);
router.delete("/:chatId", protect, chatControllers.deleteChat);

// message routes
router.post("/:chatId/message", protect, chatControllers.createMessage);

module.exports = router;

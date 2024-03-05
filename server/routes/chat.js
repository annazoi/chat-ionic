const express = require("express");
const router = express.Router();
const chatControllers = require("../controllers/chat");
const messageControllers = require("../controllers/message");
const { protect } = require("../middlewares/authMiddleware");

// chat routes
router.post("/", protect, chatControllers.createChat);
router.get("/", protect, chatControllers.getChats);
router.get("/:chatId", protect, chatControllers.getChat);
router.put("/:chatId", protect, chatControllers.updateChat);
router.delete("/:chatId", protect, chatControllers.deleteChat);

// message routes
router.post("/:chatId/message", protect, messageControllers.createMessage);
router.delete(
  "/:chatId/message/:messageId",
  protect,
  messageControllers.deleteMessage
);

module.exports = router;

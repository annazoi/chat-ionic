const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const openAiControllers = require('../controllers/openai');

router.post('/chats/:chatId/summary', protect, openAiControllers.getChatSummary);
router.post('/chats/:chatId/emotions', protect, openAiControllers.getChatEmotions);

module.exports = router;

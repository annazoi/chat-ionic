const Chat = require('../model/Chat');
const summary = require('../services/summary');
const emotions = require('../services/emotions');
const { buildTranscript } = require('../lib/chatTranscript');

async function loadChatForUser(chatId, userId) {
	const chat = await Chat.findById(chatId).populate('messages.senderId', 'username');
	if (!chat) return { error: { status: 404, message: 'Chat not found' } };

	const isMember = (chat.members || []).some((id) => id.toString() === userId.toString());
	if (!isMember) return { error: { status: 403, message: 'Not a member of this chat' } };

	return { chat };
}

const getChatSummary = async (req, res) => {
	try {
		const { chatId } = req.params;

		const { chat, error } = await loadChatForUser(chatId, req.userId);
		if (error) return res.status(error.status).json({ ok: false, error: error.message });

		const lastN = Number(req.query.lastN || 50); // default 50, μπορείς να το αλλάξεις
		const messages = chat.messages.slice(-Math.max(1, Math.min(lastN, 200))); // clamp 1..200

		const transcript = buildTranscript(messages);
		const result = await summary(transcript);

		res.json({ ok: true, result });
	} catch (e) {
		res.status(500).json({ ok: false, error: e.message });
	}
};

const getChatEmotions = async (req, res) => {
	try {
		const { chatId } = req.params;

		const { chat, error } = await loadChatForUser(chatId, req.userId);
		if (error) return res.status(error.status).json({ ok: false, error: error.message });

		const lastN = Number(req.query.lastN || 50);
		const messages = chat.messages.slice(-Math.max(1, Math.min(lastN, 200)));

		const transcript = buildTranscript(messages);
		const result = await emotions(transcript);

		res.json({ ok: true, result });
	} catch (e) {
		res.status(500).json({ ok: false, error: e.message });
	}
};

module.exports = { getChatSummary, getChatEmotions };

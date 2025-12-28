const openai = require('../utils/openAi');

module.exports = async function emotions(transcript) {
	const response = await openai.responses.create({
		model: 'gpt-5-mini',
		instructions:
			'Analyze the emotional tone of a chat conversation. ' +
			'Return ONLY valid JSON with this exact structure:\n' +
			'{ "overall_mood": string, "emotions": string[], "explanation": string }' +
			'Respond in the same language as the conversation. If the conversation is primarily in Greek, respond in Greek. Otherwise, respond in English.',
		input: `Conversation:\n\n${transcript}`,
	});

	const text = (response.output_text ?? '').trim();

	return JSON.parse(text);
};

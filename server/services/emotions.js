const openai = require('../utils/openAi');

module.exports = async function emotions(transcript) {
	const response = await openai.responses.create({
		model: 'gpt-5-mini',
		instructions:
			'You analyze the emotional tone of a chat conversation. Respond in English. ' +
			'Return: (1) Overall mood, (2) Top 3 emotions, (3) A short explanation.',
		input: `Analyze the emotions expressed in the following chat conversation:\n\n${transcript}`,
	});

	return (response.output_text ?? '').trim();
};

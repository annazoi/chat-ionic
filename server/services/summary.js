const openai = require('../utils/openAi');

module.exports = async function summary(transcript) {
	const response = await openai.responses.create({
		model: 'gpt-5-mini',
		instructions:
			'You summarize chat conversations. Respond in English. ' +
			'Be concise and clear.' +
			'If there is not enough information, say so.',
		input: `Summarize the following chat conversation:\n\n${transcript}`,
	});

	return (response.output_text ?? '').trim();
};

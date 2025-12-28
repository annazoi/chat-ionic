const openai = require('../utils/openAi');

module.exports = async function summary(transcript) {
	const response = await openai.responses.create({
		model: 'gpt-5-mini',
		instructions:
			'You summarize chat conversations. Respond in English. ' +
			'Write only the summary, not all chats, not information of chat. in third person' +
			'If there is not enough information, say so.',
		input: `Summarize the following chat conversation:\n\n${transcript}`,
	});

	return (response.output_text ?? '').trim();
};

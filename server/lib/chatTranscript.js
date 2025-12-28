function buildTranscript(messages) {
	return messages
		.filter((m) => m && (m.message || m.image))
		.map((m) => {
			const name = m.senderId?.username || 'user';
			const time = m.createdAt ? ` [${m.createdAt}]` : '';
			const text = m.message ? m.message : '';
			const img = m.image ? ` (image: ${m.image})` : '';
			return `${name}${time}: ${text}${img}`.trim();
		})
		.join('\n');
}

module.exports = { buildTranscript };

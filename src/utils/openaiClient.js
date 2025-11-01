import OpenAI from 'openai';

class OpenAIService {
	constructor() {
		this.tokens = [
			process.env.GITHUB_TOKEN_1,
			process.env.GITHUB_TOKEN_2,
			process.env.GITHUB_TOKEN_3,
		].filter(Boolean);

		if (this.tokens.length === 0) {
			throw new Error(
				'No GitHub tokens configured. Please set GITHUB_TOKEN_1, GITHUB_TOKEN_2, or GITHUB_TOKEN_3'
			);
		}

		this.endpoint = 'https://models.github.ai/inference';
		this.currentTokenIndex = 0;
	}

	getToken(preferredIndex = null) {
		if (preferredIndex !== null && this.tokens[preferredIndex]) {
			return this.tokens[preferredIndex];
		}

		
		const token = this.tokens[this.currentTokenIndex];
		this.currentTokenIndex =
			(this.currentTokenIndex + 1) % this.tokens.length;
		return token;
	}

	createClient(tokenIndex = null) {
		const token = this.getToken(tokenIndex);
		return new OpenAI({
			baseURL: this.endpoint,
			apiKey: token,
			timeout: 60000, // 60 seconds
			maxRetries: 2,
		});
	}

	async chatCompletion(messages, model = 'openai/gpt-4.1', options = {}) {
		const client = this.createClient();

		try {
			const response = await client.chat.completions.create({
				model,
				messages,
				temperature: options.temperature || 1,
				top_p: options.top_p || 1,
				max_tokens: options.max_tokens || 2000,
			});

			return response.choices[0].message.content;
		} catch (error) {
			console.error('OpenAI API Error:', error.message);
			throw new Error(`AI service error: ${error.message}`);
		}
	}

	async visionCompletion(imageDataUrl, prompt, systemPrompt) {
		const client = this.createClient(1); // Use token 2 for vision

		try {
			const response = await client.chat.completions.create({
				model: 'openai/gpt-4.1-mini',
				messages: [
					{
						role: 'system',
						content: systemPrompt,
					},
					{
						role: 'user',
						content: [
							{ type: 'text', text: prompt },
							{
								type: 'image_url',
								image_url: {
									url: imageDataUrl,
									detail: 'high',
								},
							},
						],
					},
				],
				temperature: 1.0,
				top_p: 1.0,
				max_tokens: 1500,
			});

			return response.choices[0].message.content.trim();
		} catch (error) {
			console.error('Vision API Error:', error.message);
			throw new Error(`Vision analysis failed: ${error.message}`);
		}
	}
}

export default new OpenAIService();

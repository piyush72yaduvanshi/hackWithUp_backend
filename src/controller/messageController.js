import Message from '../model/Message.js';


export const getAllMessages = async (req, res, next) => {
	try {
		const limit = Math.min(parseInt(req.query.limit) || 100, 500);
		const skip = Math.max(parseInt(req.query.skip) || 0, 0);

		const messages = await Message.find()
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.lean();

		res.json(messages);
	} catch (error) {
		next(error);
	}
};

export const getMessageById = async (req, res, next) => {
	try {
		const message = await Message.findById(req.params.id).lean();
		if (!message) {
			return res.status(404).json({ error: 'Message not found' });
		}
		res.json(message);
	} catch (error) {
		if (error.name === 'CastError') {
			return res.status(400).json({ error: 'Invalid message ID' });
		}
		next(error);
	}
};


export const createMessage = async (req, res, next) => {
	try {
		const message = new Message(req.body);
		await message.save();
		res.status(201).json(message);
	} catch (error) {
		next(error);
	}
};


export const updateMessage = async (req, res, next) => {
	try {
		const message = await Message.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		if (!message) {
			return res.status(404).json({ error: 'Message not found' });
		}

		res.json(message);
	} catch (error) {
		if (error.name === 'CastError') {
			return res.status(400).json({ error: 'Invalid message ID' });
		}
		next(error);
	}
};


export const deleteMessage = async (req, res, next) => {
	try {
		const message = await Message.findByIdAndDelete(req.params.id);
		if (!message) {
			return res.status(404).json({ error: 'Message not found' });
		}
		res.status(204).send();
	} catch (error) {
		if (error.name === 'CastError') {
			return res.status(400).json({ error: 'Invalid message ID' });
		}
		next(error);
	}
};

import Joi from 'joi';


export const messageSchema = Joi.object({
	text: Joi.string().required().min(1).max(5000).trim(),
	sender: Joi.string().allow(null, '').max(120).trim(),
});

export const updateMessageSchema = Joi.object({
	text: Joi.string().min(1).max(5000).trim(),
	sender: Joi.string().allow(null, '').max(120).trim(),
}).min(1);

export const chatSchema = Joi.object({
	text: Joi.string().required().min(1).max(2000).trim(),
});


export const validate = (schema) => (req, res, next) => {
	const { error } = schema.validate(req.body);
	if (error) {
		return res.status(400).json({ error: error.details[0].message });
	}
	next();
};

import express from 'express';
import {
	getAllMessages,
	getMessageById,
	createMessage,
	updateMessage,
	deleteMessage,
} from '../controller/messageController.js';
import {
	messageSchema,
	updateMessageSchema,
	validate,
} from '../validation/messageValidator.js';

const router = express.Router();


router.get('/', getAllMessages);


router.get('/:id', getMessageById);


router.post('/', validate(messageSchema), createMessage);


router.put('/:id', validate(updateMessageSchema), updateMessage);


router.delete('/:id', deleteMessage);

export default router;

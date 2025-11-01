import express from 'express';
import { chatWithAI } from '../controller/chatgptController.js';
import { chatSchema, validate } from '../validation/messageValidator.js';

const router = express.Router();


router.post('/', validate(chatSchema), chatWithAI);

export default router;

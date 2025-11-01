import express from 'express';
import {
	uploadAndAnalyzePhoto,
	getAllAnalyses,
	getAnalysisById,
	getStatisticsByRole,
} from '../controller/photoController.js';
import upload from '../middleware/upload.js';

const router = express.Router();


router.post('/', upload.single('image'), uploadAndAnalyzePhoto);


router.get('/', getAllAnalyses);


router.get('/stats', getStatisticsByRole);


router.get('/:id', getAnalysisById);

export default router;

import { Router } from 'express';
import { getNewsController } from './news.controller';

const router = Router();

router.get('/', getNewsController);

export default router;
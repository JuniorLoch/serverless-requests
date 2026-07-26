import { Router } from 'express';
import { requestsController } from './requests.controller';

const router = Router();

router.post('/', requestsController.create);
router.get('/:id', requestsController.findOne);
router.get('/', requestsController.findAll);

export const requestsRouter = router;

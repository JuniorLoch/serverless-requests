import { Router } from 'express';
import { requestsController } from './requests.controller';

export const createRequestRouter = Router().post('/requests', requestsController.create);
export const getRequestByIdRouter = Router().get('/requests/:id', requestsController.findOne);
export const listRequestsRouter = Router().get('/requests', requestsController.findAll);

import { type Request, type Response } from 'express';
import { RequestsService, requestsService } from './requests.service';
import { CreateRequestDto } from './dtos/CreateRequestDto';
import { GetRequestsQueryDto } from './dtos/GetRequestsDto';
import { validateDto, sendValidationError } from '../../utils/validation';

import { Logger } from '@aws-lambda-powertools/logger';

export class RequestsController {
  constructor(private readonly service: RequestsService = requestsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const logger = new Logger({ serviceName: '[POST /requests]' });
    try {
      logger.info('Request received:', req.body);

      const validation = await validateDto(CreateRequestDto, req.body);
      if (!validation.isValid) {
        logger.info('[POST /requests] Validation failed:', validation.errors!);
        sendValidationError(res, validation.errors!);
        return;
      }

      const dto = validation.instance!;
      const savedRequest = await this.service.create(dto);
      logger.info('[POST /requests] Request created:', savedRequest.id);

      res.status(201).json(savedRequest);
    } catch (error: any) {
      logger.error('[POST /requests] ✗ Error:', error);
      res.status(500).json({ error: 'Could not create request', details: String(error) });
    }
  };

  findOne = async (req: Request, res: Response): Promise<void> => {
    const logger = new Logger({ serviceName: '[GET /requests/:id]' });

    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      logger.info('Looking for:', id);

      const request = await this.service.findOne(id);
      if (!request) {
        logger.info('Request not found');
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      logger.info(' Request found');
      res.json(request);
    } catch (error: any) {
      logger.error(' ✗ Error:', error);
      res.status(500).json({ error: 'Could not retrieve request', details: String(error) });
    }
  };

  findAll = async (req: Request, res: Response): Promise<void> => {
    const logger = new Logger({ serviceName: '[GET /requests]' });

    try {
      logger.info('Query params:', req.query);

      const validation = await validateDto(GetRequestsQueryDto, req.query);
      if (!validation.isValid) {
        logger.info('Validation failed:', validation.errors!);
        sendValidationError(res, validation.errors!);
        return;
      }

      const query = validation.instance!;
      const requests = await this.service.findAll(query);

      logger.info(`Found ${requests.length} requests`);
      res.json(requests);
    } catch (error: any) {
      logger.error(' ✗ Error:', error);
      res.status(500).json({ error: 'Could not list requests', details: String(error) });
    }
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const logger = new Logger({ serviceName: '[PATCH /requests/:id/complete]' });

    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      logger.info('Completing request:', id);

      const updated = await this.service.complete(id);

      if (!updated) {
        logger.info('Request not found');
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      logger.info('Request marked as completed:', id);
      res.json(updated);
    } catch (error: any) {
      logger.error(' ✗ Error:', error);
      res.status(500).json({ error: 'Could not complete request', details: String(error) });
    }
  };
}

export const requestsController = new RequestsController();

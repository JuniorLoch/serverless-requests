import { type Request, type Response } from 'express';
import { RequestsService, requestsService } from './requests.service';
import { CreateRequestDto } from './dtos/CreateRequestDto';
import { GetRequestsQueryDto } from './dtos/GetRequestsDto';
import { validateDto, sendValidationError } from '../../utils/validation';

export class RequestsController {
  constructor(private readonly service: RequestsService = requestsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[POST /requests] Request received:', req.body);

      const validation = await validateDto(CreateRequestDto, req.body);
      if (!validation.isValid) {
        console.log('[POST /requests] Validation failed:', validation.errors);
        sendValidationError(res, validation.errors!);
        return;
      }

      const dto = validation.instance!;
      const savedRequest = await this.service.create(dto);
      console.log('[POST /requests] Request created:', savedRequest.id);

      res.status(201).json(savedRequest);
    } catch (error) {
      console.error('[POST /requests] ✗ Error:', error);
      res.status(500).json({ error: 'Could not create request', details: String(error) });
    }
  };

  findOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      console.log('[GET /requests/:id] Looking for:', id);

      const request = await this.service.findOne(id);
      if (!request) {
        console.log('[GET /requests/:id] Request not found');
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      console.log('[GET /requests/:id] Request found');
      res.json(request);
    } catch (error) {
      console.error('[GET /requests/:id] ✗ Error:', error);
      res.status(500).json({ error: 'Could not retrieve request', details: String(error) });
    }
  };

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[GET /requests] Query params:', req.query);

      const validation = await validateDto(GetRequestsQueryDto, req.query);
      if (!validation.isValid) {
        console.log('[GET /requests] Validation failed:', validation.errors);
        sendValidationError(res, validation.errors!);
        return;
      }

      const query = validation.instance!;
      const requests = await this.service.findAll(query);

      console.log('[GET /requests] Found', requests.length, 'requests');
      res.json(requests);
    } catch (error) {
      console.error('[GET /requests] ✗ Error:', error);
      res.status(500).json({ error: 'Could not list requests', details: String(error) });
    }
  };
}

export const requestsController = new RequestsController();

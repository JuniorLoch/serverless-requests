import { randomUUID } from 'crypto';
import { AppDataSource } from '../../config/database';
import { Request as RequestEntity } from './entity/request';
import { CreateRequestDto } from './dtos/CreateRequestDto';
import { GetRequestsQueryDto } from './dtos/GetRequestsDto';
import { FindOptionsWhere } from 'typeorm';

export class RequestsService {
  private get repository() {
    return AppDataSource.getRepository(RequestEntity);
  }

  async create(dto: CreateRequestDto): Promise<RequestEntity> {
    const request = this.repository.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      createdBy: dto.createdBy,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return this.repository.save(request);
  }

  async findOne(id: string): Promise<RequestEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(query: GetRequestsQueryDto): Promise<RequestEntity[]> {
    const whereConditions: FindOptionsWhere<RequestEntity> = {
      ...(!!query.createdBy && { createdBy: query.createdBy }),
      ...(!!query.status && { status: query.status }),
    };

    return this.repository.find({ where: whereConditions });
  }
}

export const requestsService = new RequestsService();

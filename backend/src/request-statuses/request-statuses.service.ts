import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestStatus } from './entities/request-status.entity';

@Injectable()
export class RequestStatusesService {
  constructor(
    @InjectRepository(RequestStatus)
    private readonly requestStatusRepository: Repository<RequestStatus>,
  ) {}

  findAll(): Promise<RequestStatus[]> {
    return this.requestStatusRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }
}

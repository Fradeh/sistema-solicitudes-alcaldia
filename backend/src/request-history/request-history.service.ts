import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestHistory } from './entities/request-history.entity';

export interface RegisterStatusChangeInput {
  requestId: string;
  userId: string;
  previousStatusId: string | null;
  newStatusId: string;
  observation?: string | null;
}

@Injectable()
export class RequestHistoryService {
  constructor(
    @InjectRepository(RequestHistory)
    private readonly requestHistoryRepository: Repository<RequestHistory>,
  ) {}

  async registerStatusChange(
    input: RegisterStatusChangeInput,
  ): Promise<RequestHistory | null> {
    if (input.previousStatusId === input.newStatusId) {
      return null;
    }

    const historyRecord = this.requestHistoryRepository.create({
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: input.previousStatusId,
      newStatusId: input.newStatusId,
      observation: input.observation ?? null,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }
}

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

export interface RegisterAssignmentInput {
  requestId: string;
  userId: string;
  previousAssignedUserId: string | null;
  newAssignedUserId: string;
  observation?: string | null;
}

export interface RegisterInternalObservationInput {
  requestId: string;
  userId: string;
  observation: string;
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
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: input.observation ?? null,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerAssignment(
    input: RegisterAssignmentInput,
  ): Promise<RequestHistory | null> {
    if (input.previousAssignedUserId === input.newAssignedUserId) {
      return null;
    }

    const historyRecord = this.requestHistoryRepository.create({
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: input.previousAssignedUserId,
      newAssignedUserId: input.newAssignedUserId,
      observation: input.observation ?? null,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerInternalObservation(
    input: RegisterInternalObservationInput,
  ): Promise<RequestHistory> {
    const historyRecord = this.requestHistoryRepository.create({
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: input.observation,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }

  async findByRequestId(requestId: string): Promise<RequestHistory[]> {
    return this.requestHistoryRepository.find({
      where: { requestId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByRequestId(requestId: string): Promise<RequestHistory | null> {
    return this.requestHistoryRepository.findOne({
      where: { requestId },
      order: { createdAt: 'DESC' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RequestHistory } from './entities/request-history.entity';
import { RequestHistoryEventType } from './enums/request-history-event-type.enum';

export interface RegisterCreationInput {
  requestId: string;
  userId: string;
}

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

export interface RegisterDocumentViewInput {
  requestId: string;
  userId: string;
}

export interface RegisterDocumentUploadInput {
  requestId: string;
  userId: string;
  fileName: string;
}

@Injectable()
export class RequestHistoryService {
  constructor(
    @InjectRepository(RequestHistory)
    private readonly requestHistoryRepository: Repository<RequestHistory>,
  ) {}

  async registerCreation(
    input: RegisterCreationInput,
    entityManager?: EntityManager,
  ): Promise<RequestHistory> {
    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.REQUEST_CREATED,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: null,
    });

    if (entityManager) {
      return entityManager.save(historyRecord);
    }

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerStatusChange(
    input: RegisterStatusChangeInput,
    entityManager?: EntityManager,
  ): Promise<RequestHistory | null> {
    if (input.previousStatusId === input.newStatusId) {
      return null;
    }

    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.STATUS_CHANGED,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: input.previousStatusId,
      newStatusId: input.newStatusId,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: input.observation ?? null,
    });

    if (entityManager) {
      return entityManager.save(historyRecord);
    }

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerAssignment(
    input: RegisterAssignmentInput,
    entityManager?: EntityManager,
  ): Promise<RequestHistory | null> {
    if (input.previousAssignedUserId === input.newAssignedUserId) {
      return null;
    }

    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.ASSIGNED,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: input.previousAssignedUserId,
      newAssignedUserId: input.newAssignedUserId,
      observation: input.observation ?? null,
    });

    if (entityManager) {
      return entityManager.save(historyRecord);
    }

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerInternalObservation(
    input: RegisterInternalObservationInput,
    entityManager?: EntityManager,
  ): Promise<RequestHistory> {
    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.INTERNAL_OBSERVATION,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: input.observation,
    });

    if (entityManager) {
      return entityManager.save(historyRecord);
    }

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerDocumentView(
    input: RegisterDocumentViewInput,
  ): Promise<RequestHistory> {
    const existing = await this.requestHistoryRepository.findOne({
      where: {
        requestId: input.requestId,
        userId: input.userId,
        eventType: RequestHistoryEventType.DOCUMENT_VIEWED,
      },
    });

    if (existing) {
      return existing;
    }

    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.DOCUMENT_VIEWED,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: null,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }

  async registerDocumentUpload(
    input: RegisterDocumentUploadInput,
  ): Promise<RequestHistory> {
    const historyRecord = this.requestHistoryRepository.create({
      eventType: RequestHistoryEventType.DOCUMENT_UPLOADED,
      requestId: input.requestId,
      userId: input.userId,
      previousStatusId: null,
      newStatusId: null,
      previousAssignedUserId: null,
      newAssignedUserId: null,
      observation: `Nueva versión del documento: ${input.fileName}`,
    });

    return this.requestHistoryRepository.save(historyRecord);
  }

  async findByRequestId(requestId: string): Promise<RequestHistory[]> {
    return this.requestHistoryRepository.find({
      where: { requestId },
      relations: [
        'user',
        'previousStatus',
        'newStatus',
        'previousAssignedUser',
        'newAssignedUser',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async findLatestByRequestId(requestId: string): Promise<RequestHistory | null> {
    return this.requestHistoryRepository.findOne({
      where: { requestId },
      order: { createdAt: 'DESC' },
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from '../requests/entities/request.entity';
import { RequestHistoryService } from '../request-history/request-history.service';

export interface PublicTrackingResponse {
  requestId: string;
  trackingCode: string;
  status: string | null;
  submittedAt: Date | string | null;
  lastUpdatedAt: Date | string | null;
  lastUpdateAt: Date | string | null;
  subject: string | null;
}

@Injectable()
export class TrackingService {
  private static readonly TRACKING_CODE_REGEX = /^[A-Z]{3}-[A-Z0-9]+-[A-Z0-9]+$/;

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    private readonly requestHistoryService: RequestHistoryService,
  ) {}

  async getPublicTrackingByCode(
    trackingCode: string,
  ): Promise<PublicTrackingResponse> {
    const normalizedTrackingCode = this.validateAndNormalizeTrackingCode(trackingCode);

    const request = await this.requestRepository.findOne({
      where: { trackingCode: normalizedTrackingCode },
      relations: ['status'],
    });

    if (!request) {
      throw new NotFoundException(
        'No se encontro ninguna solicitud para el codigo de seguimiento proporcionado.',
      );
    }

    const lastUpdatedAt = await this.resolveLastUpdatedAt(
      request.id,
      request.updatedAt,
    );

    return {
      requestId: request.id,
      trackingCode: normalizedTrackingCode,
      status: request.status?.name ?? null,
      submittedAt: request.createdAt,
      lastUpdatedAt,
      lastUpdateAt: lastUpdatedAt,
      subject: request.subject,
    };
  }

  private validateAndNormalizeTrackingCode(trackingCode: string): string {
    const normalizedTrackingCode = trackingCode.trim().toUpperCase();

    if (!normalizedTrackingCode) {
      throw new BadRequestException(
        'El codigo de seguimiento es obligatorio.',
      );
    }

    if (!TrackingService.TRACKING_CODE_REGEX.test(normalizedTrackingCode)) {
      throw new BadRequestException(
        'El codigo de seguimiento no tiene un formato valido.',
      );
    }

    return normalizedTrackingCode;
  }

  private async resolveLastUpdatedAt(
    requestId: string,
    fallbackLastUpdateAt: Date | null,
  ): Promise<Date | string | null> {
    const latestHistory =
      await this.requestHistoryService.findLatestByRequestId(requestId);

    if (!latestHistory?.createdAt) {
      return fallbackLastUpdateAt;
    }

    if (!fallbackLastUpdateAt) {
      return latestHistory.createdAt;
    }

    return latestHistory.createdAt > fallbackLastUpdateAt
      ? latestHistory.createdAt
      : fallbackLastUpdateAt;
  }
}

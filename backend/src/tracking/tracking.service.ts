import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
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
  private static readonly PUBLIC_REQUEST_PROJECTION: Record<string, 1> = {
    _id: 1,
    id: 1,
    requestId: 1,
    trackingCode: 1,
    tracking_code: 1,
    code: 1,
    codigoSeguimiento: 1,
    statusName: 1,
    status: 1,
    currentStatus: 1,
    estado: 1,
    submittedAt: 1,
    createdAt: 1,
    created_at: 1,
    lastUpdateAt: 1,
    updatedAt: 1,
    updated_at: 1,
    subject: 1,
    title: 1,
  };

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly requestHistoryService: RequestHistoryService,
  ) {}

  async getPublicTrackingByCode(
    trackingCode: string,
  ): Promise<PublicTrackingResponse> {
    if (!this.connection.db) {
      throw new NotFoundException('No hay conexion activa a la base de datos.');
    }

    const request = await this.connection.db.collection('requests').findOne(
      {
        $or: [
          { trackingCode },
          { tracking_code: trackingCode },
          { code: trackingCode },
          { codigoSeguimiento: trackingCode },
        ],
      },
      { projection: TrackingService.PUBLIC_REQUEST_PROJECTION },
    );

    if (!request) {
      throw new NotFoundException(
        'No se encontro ninguna solicitud para el codigo de seguimiento proporcionado.',
      );
    }

    const requestId = this.pickRequestId(request);
    const fallbackLastUpdateAt = this.pickValue(request, [
      'lastUpdateAt',
      'updatedAt',
      'updated_at',
    ]);
    const lastUpdatedAt = await this.resolveLastUpdatedAt(
      requestId,
      fallbackLastUpdateAt,
    );

    return {
      requestId,
      trackingCode,
      status: this.pickString(request, [
        'statusName',
        'status',
        'currentStatus',
        'estado',
      ]),
      submittedAt: this.pickValue(request, [
        'submittedAt',
        'createdAt',
        'created_at',
      ]),
      lastUpdatedAt,
      lastUpdateAt: lastUpdatedAt,
      subject: this.pickString(request, ['subject', 'title']),
    };
  }

  private pickRequestId(source: Record<string, unknown>): string {
    const idValue = this.pickString(source, ['id', 'requestId']);
    if (idValue) {
      return idValue;
    }

    const mongoId = source._id;
    if (mongoId && typeof mongoId === 'object' && 'toString' in mongoId) {
      return String(mongoId);
    }

    return 'sin-id';
  }

  private pickValue(
    source: Record<string, unknown>,
    fields: string[],
  ): Date | string | null {
    for (const field of fields) {
      const value = source[field];
      if (value !== undefined && value !== null) {
        if (value instanceof Date || typeof value === 'string') {
          return value;
        }
      }
    }
    return null;
  }

  private pickString(
    source: Record<string, unknown>,
    fields: string[],
  ): string | null {
    for (const field of fields) {
      const value = source[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }

      if (
        value &&
        typeof value === 'object' &&
        'name' in value &&
        typeof (value as { name?: unknown }).name === 'string'
      ) {
        return (value as { name: string }).name;
      }
    }

    return null;
  }

  private async resolveLastUpdatedAt(
    requestId: string,
    fallbackLastUpdateAt: Date | string | null,
  ): Promise<Date | string | null> {
    if (!this.isLikelyUuid(requestId)) {
      return fallbackLastUpdateAt;
    }

    const latestHistory =
      await this.requestHistoryService.findLatestByRequestId(requestId);

    if (!latestHistory?.createdAt) {
      return fallbackLastUpdateAt;
    }

    if (!fallbackLastUpdateAt) {
      return latestHistory.createdAt;
    }

    const fallbackDate = new Date(fallbackLastUpdateAt);

    if (Number.isNaN(fallbackDate.getTime())) {
      return latestHistory.createdAt;
    }

    return latestHistory.createdAt > fallbackDate
      ? latestHistory.createdAt
      : fallbackLastUpdateAt;
  }

  private isLikelyUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}

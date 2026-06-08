import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('Tracking Público')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingCode')
  @ApiOperation({
    summary: 'Consultar estado publico de una solicitud por codigo de seguimiento',
    description: 'Permite el acceso anónimo a los ciudadanos para verificar el estado de su trámite utilizando el código entregado.'
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Codigo de seguimiento entregado al ciudadano',
    example: 'TRK-DEMO-001'
  })
  @ApiResponse({
    status: 200,
    description: 'Informacion basica y publica de la solicitud',
    schema: {
      example: {
        trackingCode: "TRK-DEMO-001",
        subject: "Solicitud de reparacion vial",
        status: "received",
        submittedAt: "2026-05-31T15:00:00.000Z",
        lastUpdateAt: "2026-05-31T15:00:00.000Z"
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontro una solicitud con ese codigo de seguimiento',
    schema: {
      example: {
        statusCode: 404,
        message: "No se encontro una solicitud con ese codigo de seguimiento",
        error: "Not Found"
      }
    }
  })
  async getPublicTracking(@Param('trackingCode') trackingCode: string) {
    return this.trackingService.getPublicTrackingByCode(trackingCode);
  }
}
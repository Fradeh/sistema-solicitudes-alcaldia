import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('Tracking Publico')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':trackingCode')
  @ApiOperation({
    summary:
      'Consultar estado publico de una solicitud por codigo de seguimiento',
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Codigo de seguimiento entregado al ciudadano',
  })
  @ApiResponse({
    status: 200,
    description: 'Informacion basica y publica de la solicitud',
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontro una solicitud con ese codigo de seguimiento',
  })
  async getPublicTracking(@Param('trackingCode') trackingCode: string) {
    return this.trackingService.getPublicTrackingByCode(trackingCode);
  }
}

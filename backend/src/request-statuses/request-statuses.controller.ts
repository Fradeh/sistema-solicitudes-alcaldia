import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequestStatusesService } from './request-statuses.service';
import { RequestStatus } from './entities/request-status.entity';

@ApiTags('request-statuses')
@Controller('request-statuses')
export class RequestStatusesController {
  constructor(
    private readonly requestStatusesService: RequestStatusesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los estados de solicitud' })
  findAll(): Promise<RequestStatus[]> {
    return this.requestStatusesService.findAll();
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestStatusesService } from './request-statuses.service';
import { RequestStatus } from './entities/request-status.entity';

@ApiTags('request-statuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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

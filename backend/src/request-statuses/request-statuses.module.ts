import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestStatus } from './entities/request-status.entity';
import { RequestStatusesController } from './request-statuses.controller';
import { RequestStatusesService } from './request-statuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestStatus])],
  controllers: [RequestStatusesController],
  providers: [RequestStatusesService],
})
export class RequestStatusesModule {}

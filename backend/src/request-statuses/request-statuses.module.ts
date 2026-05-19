import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestStatus } from './entities/request-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestStatus])],
})
export class RequestStatusesModule {}

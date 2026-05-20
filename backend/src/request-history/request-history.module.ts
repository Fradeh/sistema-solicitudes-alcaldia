import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestHistory } from './entities/request-history.entity';
import { RequestHistoryService } from './request-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestHistory])],
  providers: [RequestHistoryService],
  exports: [TypeOrmModule, RequestHistoryService],
})
export class RequestHistoryModule {}

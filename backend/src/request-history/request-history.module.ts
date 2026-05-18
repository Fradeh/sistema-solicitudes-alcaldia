import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestHistory } from './entities/request-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestHistory])],
  exports: [TypeOrmModule],
})
export class RequestHistoryModule {}

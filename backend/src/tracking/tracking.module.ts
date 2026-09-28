import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from '../requests/entities/request.entity';
import { RequestHistoryModule } from '../request-history/request-history.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request]),
    RequestHistoryModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}

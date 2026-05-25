import { Module } from '@nestjs/common';
import { RequestHistoryModule } from '../request-history/request-history.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [RequestHistoryModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}

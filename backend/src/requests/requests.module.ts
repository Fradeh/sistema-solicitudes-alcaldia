import { Module } from '@nestjs/common';
import { RequestHistoryModule } from '../request-history/request-history.module';
import { DocumentsModule } from '../documents/documents.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [
    DocumentsModule,
    RequestHistoryModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller'; 
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    DocumentsModule, // conexión a MongoDB integrada
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
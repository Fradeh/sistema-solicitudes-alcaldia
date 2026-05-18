import { Controller, Get, Param } from '@nestjs/common';
import { DocumentsService } from './service';
import { DocumentUser } from './schema';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('request/:requestId')
  async getByRequest(@Param('requestId') requestId: string): Promise<DocumentUser[]> {
    return this.documentsService.findByRequestId(requestId);
  }
}
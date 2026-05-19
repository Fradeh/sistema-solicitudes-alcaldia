import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Requests & Documents') // 🌟 Esto los agrupa bonito en Swagger UI
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /**
   *  POST /requests/documents Registra la metadata simulada en Mongo
   */
  @Post('documents')
  @ApiOperation({ summary: 'Registrar la metadata de un documento (MongoDB)' })
  @ApiResponse({ status: 201, description: 'Metadata guardada exitosamente.' })
  async registerDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.requestsService.createDocument(createDocumentDto);
  }

  /**
   * GET /requests/:id/documents
   */
  @Get(':id/documents')
  @ApiOperation({ summary: 'Consultar el expediente de documentos de una solicitud' })
  async getRequestDocuments(@Param('id') requestId: string) {
    return this.requestsService.findDocumentsByRequest(requestId);
  }
}
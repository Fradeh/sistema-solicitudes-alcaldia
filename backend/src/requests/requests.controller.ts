import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentUser } from '../documents/schema/document-user.schema'; 

@ApiTags('Requests & Documents')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /**
   * POST /requests/documents
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
  @ApiOperation({ summary: 'Consultar el expediente de documentos de una solicitud específica' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de documentos asociados a la solicitud obtenida con éxito.',
    type: [DocumentUser] // swagger mostrará los campos (fileName, url, etc.) al Frontend
  })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada.' })
  async getRequestDocuments(@Param('id') requestId: string) {
    return this.requestsService.findDocumentsByRequest(requestId);
  }
}
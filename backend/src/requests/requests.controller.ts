import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
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
  @Get('documents/detail/:documentId')
  @ApiOperation({ summary: 'Obtener la metadata de un documento específico junto a su solicitud' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metadata del documento y datos de la solicitud obtenidos con éxito.' 
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async getDocumentDetail(@Param('documentId') documentId: string) {
    const result = await this.requestsService.findDocumentWithRequestDetails(documentId);
    
    if (!result) {
      return { statusCode: 404, message: 'El documento solicitado no existe.' };
    }
    
    return result;
  }
  /**
   * DELETE /requests/documents/:documentId
   */
  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Desactivar/Eliminar lógicamente un documento del expediente' })
  @ApiResponse({ 
    status: 200, 
    description: 'El documento ha sido desactivado exitosamente (eliminación lógica).',
    type: DocumentUser
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async removeDocument(@Param('documentId') documentId: string) {
    const deletedDocument = await this.requestsService.removeDocumentLogically(documentId);
    
    if (!deletedDocument) {
      return { statusCode: 404, message: 'El documento que intenta eliminar no existe.' };
    }
    
    return deletedDocument;
  }
}
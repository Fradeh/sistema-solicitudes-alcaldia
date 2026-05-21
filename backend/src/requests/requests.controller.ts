import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests & Documents')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('documents')
  @ApiOperation({ summary: 'Registrar la metadata de un documento (MongoDB)' })
  @ApiResponse({ status: 201, description: 'Metadata guardada exitosamente.' })
  async registerDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.requestsService.createDocument(createDocumentDto);
  }

  @Get('documents/detail/:documentId')
  @ApiOperation({ summary: 'Obtener la metadata de un documento especifico junto a su solicitud' })
  @ApiResponse({
    status: 200,
    description: 'Metadata del documento y datos de la solicitud obtenidos con exito.',
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async getDocumentDetail(@Param('documentId') documentId: string) {
    const result = await this.requestsService.findDocumentWithRequestDetails(documentId);

    if (!result) {
      return { statusCode: 404, message: 'El documento solicitado no existe.' };
    }

    return result;
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Desactivar/Eliminar logicamente un documento del expediente' })
  @ApiResponse({
    status: 200,
    description: 'El documento ha sido desactivado exitosamente (eliminacion logica).',
    type: DocumentUser,
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async removeDocument(@Param('documentId') documentId: string) {
    const deletedDocument = await this.requestsService.removeDocumentLogically(documentId);

    if (!deletedDocument) {
      return { statusCode: 404, message: 'El documento que intenta eliminar no existe.' };
    }

    return deletedDocument;
  }

  @Post(':requestId/internal-observations')
  @ApiOperation({ summary: 'Registrar observaciones internas de una solicitud' })
  @ApiResponse({ status: 201, description: 'Observacion interna registrada exitosamente.' })
  async registerInternalObservation(
    @Param('requestId') requestId: string,
    @Body() createInternalObservationDto: CreateInternalObservationDto,
  ) {
    return this.requestsService.createInternalObservation(requestId, createInternalObservationDto);
  }
}

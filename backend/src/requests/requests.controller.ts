import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';

@ApiTags('Requests & Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('/register')
  @ApiOperation({ 
    summary: 'Registrar una nueva solicitud', 
    description: 'Crea un nuevo trámite ciudadano en el sistema asignándole un código de seguimiento único.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Solicitud registrada exitosamente.',
    schema: {
      example: {
        id: "3c34dd8d-13fb-4ecf-bf61-e8336f511ef7",
        trackingCode: "TRK-DEMO-001",
        subject: "Solicitud de reparacion vial",
        description: "Se solicita bacheo urgente en la calle principal debido a multiples daños.",
        status: "received",
        priority: "medium",
        createdAt: "2026-05-31T15:00:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de la solicitud inválidos o mal estructurados.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Token Bearer faltante o inválido.' })
  async registerRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: { user: { userId: string } },
  ) {
    return this.requestsService.createRequest(createRequestDto, request.user.userId);
  }

 @Get('/:requestId')
  @ApiOperation({ 
    summary: 'Obtener los detalles de una solicitud por su ID', 
    description: 'Retorna la información completa de un trámite específico mediante su identificador UUID.' 
  })
  @ApiParam({ name: 'requestId', description: 'UUID único de la solicitud', example: '3c34dd8d-13fb-4ecf-bf61-e8336f511ef7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalles de la solicitud obtenidos exitosamente.',
    schema: {
      example: {
        id: "3c34dd8d-13fb-4ecf-bf61-e8336f511ef7",
        trackingCode: "TRK-DEMO-001",
        subject: "Solicitud de reparacion vial",
        description: "Se solicita bacheo urgente en la calle principal debido a multiples daños.",
        applicantName: "Ana Perez",
        priority: "medium",
        status: "received"
      }
    }
  })
  @ApiResponse({ status: 400, description: 'El parámetro requestId proporcionado no es un UUID válido.' })
  @ApiResponse({ status: 401, description: 'No autorizado. Token Bearer faltante o inválido.' })
  @ApiResponse({ status: 404, description: 'La solicitud no existe en la base de datos.' })
  async getRequestById(@Param('requestId', new ParseUUIDPipe()) requestId: string): Promise<any> {
    // Volvemos a colocar el método exacto que está implementado en tu service
    return this.requestsService.getRequestById(requestId);
  }

  @Post('/documents')
  @ApiOperation({ summary: 'Registrar la metadata de un documento (MongoDB)' })
  @ApiResponse({ status: 201, description: 'Metadata guardada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async registerDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.requestsService.createDocument(createDocumentDto);
  }

  @Get('/documents/detail/:documentId')
  @ApiOperation({ summary: 'Obtener la metadata de un documento especifico junto a su solicitud' })
  @ApiResponse({
    status: 200,
    description: 'Metadata del documento y datos de la solicitud obtenidos con exito.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'El documento solicitado no existe.' })
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
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'El documento que intenta eliminar no existe.' })
  async removeDocument(@Param('documentId') documentId: string) {
    const deletedDocument = await this.requestsService.removeDocumentLogically(documentId);
    if (!deletedDocument) {
      return { statusCode: 404, message: 'El documento que intenta eliminar no existe.' };
    }
    return deletedDocument;
  }

  @Post(':requestId/internal-observations')
  @ApiOperation({ 
    summary: 'Registrar observaciones internas de una solicitud',
    description: 'Permite a los funcionarios de la alcaldía registrar comentarios internos sobre la evolución del trámite.'
  })
  @ApiParam({ name: 'requestId', description: 'UUID de la solicitud' })
  @ApiResponse({ status: 201, description: 'Observacion interna registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El ID de la solicitud o los datos del body no son válidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'La solicitud indicada no existe.' })
  async registerInternalObservation(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() createInternalObservationDto: CreateInternalObservationDto,
  ) {
    return this.requestsService.createInternalObservation(requestId, createInternalObservationDto);
  }

  @Get(':requestId/history')
  @ApiOperation({ 
    summary: 'Consultar historial completo de una solicitud',
    description: 'Retorna la bitácora de auditoría con todos los cambios de estado por los que ha pasado el trámite.'
  })
  @ApiParam({ name: 'requestId', description: 'UUID de la solicitud para extraer la bitácora', example: '3c34dd8d-13fb-4ecf-bf61-e8336f511ef7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de la solicitud obtenido con éxito.', 
    type: [RequestHistoryResponseDto],
    schema: {
      example: [
        {
          id: "hist-001",
          requestId: "3c34dd8d-13fb-4ecf-bf61-e8336f511ef7",
          previousStatus: "received",
          newStatus: "assigned",
          observations: "Se asigna al departamento de ingenieria vial para inspeccion.",
          createdAt: "2026-05-31T16:30:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'ID de solicitud inválido.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  async getRequestHistory(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ): Promise<RequestHistoryResponseDto[]> {
    return this.requestsService.getRequestHistory(requestId);
  }
}
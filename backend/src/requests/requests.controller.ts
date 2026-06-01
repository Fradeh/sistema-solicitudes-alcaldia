import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';
import { RequestDetailsDTO } from './dto/RequestDetailsResponseDTO';

@ApiTags('Requests & Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // Registrar una nueva solicitud
@Post('/register')
  @ApiOperation({ summary: 'Registrar una nueva solicitud' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada exitosamente.' })
  @ApiBadRequestResponse({ status: 400, description: 'Datos de solicitud inválidos.' })
  async registerRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: { user: { userId: string } },
  ) {
    return this.requestsService.createRequest(createRequestDto, request.user.userId);
  }
  // Obtener la lista de todas las solicitudes
  @Get('/list')
  @ApiOperation({ summary: 'Obtener la lista de todas las solicitudes' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes obtenida exitosamente.' , isArray: true})
  @ApiBadRequestResponse({ status: 400, description: 'Error al obtener la lista de solicitudes.' })
  async getAllRequests() {
    return this.requestsService.getAllRequests();
  }

  // Obtener los detalles de una solicitud por su ID
  @Get('/:requestId')
  @ApiOperation({ summary: 'Obtener los detalles de una solicitud por su ID' })
  @ApiResponse({ status: 200, description: 'Detalles de la solicitud obtenidos exitosamente.' })
  @ApiNotFoundResponse({ status: 404, description: 'Solicitud no encontrada.' })
  async getRequestById(@Param('requestId', new ParseUUIDPipe()) requestId: string) : Promise<RequestDetailsDTO> {
    return this.requestsService.getRequestById(requestId);
  }

  @Post('/documents')
  @ApiOperation({ summary: 'Registrar la metadata de un documento (MongoDB)' })
  @ApiResponse({ status: 201, description: 'Metadata guardada exitosamente.' })
  async registerDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.requestsService.createDocument(createDocumentDto);
  }

  @Get('/documents/detail/:documentId')
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
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() createInternalObservationDto: CreateInternalObservationDto,
    @Req() request: { user: { userId: string } },
  ) {
    return this.requestsService.createInternalObservation(
      requestId,
      request.user.userId,
      createInternalObservationDto,
    );
  }

  @Get(':requestId/history')
  @ApiOperation({ summary: 'Consultar historial completo de una solicitud' })
  @ApiResponse({ status: 200, description: 'Historial de la solicitud.', type: [RequestHistoryResponseDto] })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  async getRequestHistory(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ): Promise<RequestHistoryResponseDto[]> {
    return this.requestsService.getRequestHistory(requestId);
  }
}

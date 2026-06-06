import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppRole } from '../auth/roles/app-role.enum';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { AssignRequestDto } from './dto/assign-request.dto';
import { FilterRequestDTO } from './dto/FilterRequestDTO';
import { RequestDetailsDto } from './dto/request-details.dto';
import { RequestListDto } from './dto/request-list.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests & Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles(AppRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Registrar una nueva solicitud' })
  @ApiResponse({
    status: 201,
    description: 'Solicitud registrada exitosamente.',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Datos de solicitud invalidos.',
  })
  async registerRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: { user: { userId: string } },
  ) {
    return this.requestsService.createRequest(
      createRequestDto,
      request.user.userId,
    );
  }

  @Post('register')
  @Roles(AppRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Registrar una nueva solicitud (ruta heredada)' })
  @ApiResponse({
    status: 201,
    description: 'Solicitud registrada exitosamente.',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Datos de solicitud invalidos.',
  })
  async registerRequestLegacy(
    @Body() createRequestDto: CreateRequestDto,
    @Req() request: { user: { userId: string } },
  ) {
    return this.requestsService.createRequest(
      createRequestDto,
      request.user.userId,
    );
  }

  @Get()
  @Roles(AppRole.SUPERVISOR, AppRole.ADMIN)
  @ApiOperation({ summary: 'Obtener la lista de todas las solicitudes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes obtenida exitosamente.',
    type: [RequestListDto],
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error al obtener la lista de solicitudes.',
  })
  @ApiForbiddenResponse({ description: 'No tienes permisos suficientes.' })
  async getAllRequests(
    @Query() filters: FilterRequestDTO,
  ): Promise<RequestListDto[]> {
    return this.requestsService.getAllRequests(filters);
  }

  @Get('list')
  @Roles(AppRole.SUPERVISOR, AppRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener la lista de todas las solicitudes (ruta heredada)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitudes obtenida exitosamente.',
    type: [RequestListDto],
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Error al obtener la lista de solicitudes.',
  })
  @ApiForbiddenResponse({ description: 'No tienes permisos suficientes.' })
  async getAllRequestsLegacy(
    @Query() filters: FilterRequestDTO,
  ): Promise<RequestListDto[]> {
    return this.requestsService.getAllRequests(filters);
  }

  @Get(':requestId')
  @Roles(AppRole.OFFICER, AppRole.SUPERVISOR, AppRole.ADMIN)
  @ApiOperation({ summary: 'Obtener los detalles de una solicitud por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la solicitud obtenidos exitosamente.',
    type: RequestDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  @ApiForbiddenResponse({ description: 'No tienes permisos suficientes.' })
  async getRequestById(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Req() request: { user: { userId: string; role?: string } },
  ): Promise<RequestDetailsDto> {
    return this.requestsService.getRequestById(requestId, request.user);
  }

  @Patch(':requestId/assign')
  @Roles(AppRole.SUPERVISOR, AppRole.ADMIN)
  @ApiOperation({ summary: 'Asignar una solicitud a un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud asignada exitosamente.',
    type: RequestDetailsDto,
  })
  @ApiNotFoundResponse({ description: 'Solicitud o usuario no encontrado.' })
  @ApiForbiddenResponse({ description: 'No tienes permisos suficientes.' })
  async assignRequest(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() assignRequestDto: AssignRequestDto,
    @Req() request: { user: { userId: string; role?: string } },
  ): Promise<RequestDetailsDto> {
    return this.requestsService.assignRequest(
      requestId,
      assignRequestDto,
      request.user,
    );
  }

  @Post('/documents')
  @ApiOperation({ summary: 'Registrar la metadata de un documento (MongoDB)' })
  @ApiResponse({ status: 201, description: 'Metadata guardada exitosamente.' })
  async registerDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.requestsService.createDocument(createDocumentDto);
  }

  @Get('/documents/detail/:documentId')
  @ApiOperation({
    summary: 'Obtener la metadata de un documento especifico junto a su solicitud',
  })
  @ApiResponse({
    status: 200,
    description:
      'Metadata del documento y datos de la solicitud obtenidos con exito.',
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async getDocumentDetail(@Param('documentId') documentId: string) {
    const result = await this.requestsService.findDocumentWithRequestDetails(
      documentId,
    );

    if (!result) {
      return { statusCode: 404, message: 'El documento solicitado no existe.' };
    }

    return result;
  }

  @Delete('documents/:documentId')
  @ApiOperation({
    summary: 'Desactivar/Eliminar logicamente un documento del expediente',
  })
  @ApiResponse({
    status: 200,
    description:
      'El documento ha sido desactivado exitosamente (eliminacion logica).',
    type: DocumentUser,
  })
  @ApiResponse({ status: 404, description: 'Documento no encontrado.' })
  async removeDocument(@Param('documentId') documentId: string) {
    const deletedDocument =
      await this.requestsService.removeDocumentLogically(documentId);

    if (!deletedDocument) {
      return {
        statusCode: 404,
        message: 'El documento que intenta eliminar no existe.',
      };
    }

    return deletedDocument;
  }

  @Post(':requestId/internal-observations')
  @Roles(AppRole.OFFICER)
  @ApiOperation({
    summary: 'Registrar observaciones internas de una solicitud',
  })
  @ApiResponse({
    status: 201,
    description: 'Observacion interna registrada exitosamente.',
  })
  async registerInternalObservation(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Body() createInternalObservationDto: CreateInternalObservationDto,
    @Req() request: { user: { userId: string; role?: string } },
  ) {
    return this.requestsService.createInternalObservation(
      requestId,
      request.user,
      createInternalObservationDto,
    );
  }

  @Get(':requestId/history')
  @Roles(AppRole.OFFICER, AppRole.SUPERVISOR, AppRole.ADMIN)
  @ApiOperation({ summary: 'Consultar historial completo de una solicitud' })
  @ApiResponse({
    status: 200,
    description: 'Historial de la solicitud.',
    type: [RequestHistoryResponseDto],
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada.' })
  @ApiForbiddenResponse({ description: 'No tienes permisos suficientes.' })
  async getRequestHistory(
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
    @Req() request: { user: { userId: string; role?: string } },
  ): Promise<RequestHistoryResponseDto[]> {
    return this.requestsService.getRequestHistory(requestId, request.user);
  }
}

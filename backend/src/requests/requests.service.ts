import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { basename } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { normalizeRoleName } from '../auth/roles/role-normalizer';
import { AppRole } from '../auth/roles/app-role.enum';
import { RequestDocument } from '../documents/entities/request-document.entity';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';
import { RequestHistoryService } from '../request-history/request-history.service';
import { UsersService } from '../users/users.service';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { FilterRequestDTO } from './dto/FilterRequestDTO';
import { RequestDetailsDto } from './dto/request-details.dto';
import { RequestListDto } from './dto/request-list.dto';
import { Request } from './entities/request.entity';
import { RequestStatus } from '../request-statuses/entities/request-status.entity';
import { User } from '../users/entities/user.entity';
import { generateTrackingCode } from './utils/tracking-code.util';
import { ChangeStatusDTO } from './dto/ChangeStatusDTO';
import { ChangeDepartmentDto } from './dto/change-department.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Department } from 'src/departments/entities/department.entity';
import { validateRequestDates } from './utils/request-date.util';
import { detectDocumentMime, resolveStoredDocumentPath, validateUploadedDocument } from './utils/request-document.util';
import { envConfig } from '../config/env.config';
interface AuthenticatedUserContext {
  userId: string;
  role?: string;
  departmentId?: string | null;
}

export interface UploadedRequestDocument {
  requestId: string;
  currentUser: AuthenticatedUserContext;
  fileName: string;
  fileType: string;
  size: number;
  path: string;
}

type WorkflowStatus =
  | 'received'
  | 'assigned_to_department'
  | 'in_review'
  | 'approved_by_department'
  | 'rejected_by_department'
  | 'awaiting_mayor_signature'
  | 'returned_to_department'
  | 'rejected_by_mayor_office'
  | 'signed'
  | 'closed';

const WORKFLOW_STATUS_ALIASES: Record<string, WorkflowStatus> = {
  received: 'received',
  assigned: 'assigned_to_department',
  assigned_to_department: 'assigned_to_department',
  in_progress: 'in_review',
  in_review: 'in_review',
  'en proceso': 'in_review',
  approved_by_officer: 'approved_by_department',
  department_approved: 'approved_by_department',
  approved_by_department: 'approved_by_department',
  rejected: 'rejected_by_department',
  rejected_by_department: 'rejected_by_department',
  pending_signature: 'awaiting_mayor_signature',
  awaiting_mayor_signature: 'awaiting_mayor_signature',
  returned_to_department: 'returned_to_department',
  rejected_by_mayor_office: 'rejected_by_mayor_office',
  signed: 'signed',
  closed: 'closed',
  cerrado: 'closed',
  resuelto: 'closed',
};

const MAYOR_TRANSITIONS: Partial<Record<WorkflowStatus, WorkflowStatus[]>> = {
  approved_by_department: [
    'awaiting_mayor_signature',
    'rejected_by_mayor_office',
    'returned_to_department',
  ],
  awaiting_mayor_signature: [
    'signed',
    'rejected_by_mayor_office',
    'returned_to_department',
  ],
};

const DEPARTMENT_TRANSITIONS: Partial<Record<WorkflowStatus, WorkflowStatus[]>> = {
  received: ['in_review'],
  assigned_to_department: ['in_review'],
  in_review: ['approved_by_department', 'rejected_by_department'],
  returned_to_department: ['in_review'],
};

const STATUS_REQUIRING_REASON = new Set<WorkflowStatus>([
  'rejected_by_department',
  'rejected_by_mayor_office',
  'returned_to_department',
]);

function normalizeWorkflowStatus(name: string): WorkflowStatus | undefined {
  return WORKFLOW_STATUS_ALIASES[name.trim().toLowerCase()];
}

@Injectable()
export class RequestsService {
  constructor(
    private readonly requestHistoryService: RequestHistoryService,
    private readonly usersService: UsersService,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(RequestStatus)
    private readonly requestStatusRepository: Repository<RequestStatus>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(RequestDocument)
    private readonly requestDocumentRepository: Repository<RequestDocument>,
  ) {}

  async assertCanUploadDocument(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const request = await this.findRequestByIdOrThrow(requestId, ['status']);
    this.assertRequestAccess(request, currentUser);

    const role = normalizeRoleName(currentUser.role);
    if (
      role === AppRole.RECEPTIONIST &&
      request.receivedById !== currentUser.userId
    ) {
      throw new ForbiddenException('Solo puedes adjuntar documentos a solicitudes recibidas por ti');
    }
    if (role !== AppRole.RECEPTIONIST && role !== AppRole.OFFICER && role !== AppRole.SUPERVISOR) {
      throw new ForbiddenException('No tienes permiso para adjuntar documentos');
    }
  }

  async registerUploadedDocument(input: UploadedRequestDocument): Promise<{
    id: string;
    fileName: string;
    fileType: string;
    size: number;
    url: string;
  }> {
    await this.assertCanUploadDocument(input.requestId, input.currentUser);
    await validateUploadedDocument(input.path, input.fileName, input.fileType);

    const storageReference = `/uploads/requests/${input.requestId}/${basename(input.path)}`;
    const document = this.requestDocumentRepository.create({
      requestId: input.requestId,
      userId: input.currentUser.userId,
      fileName: input.fileName,
      fileType: input.fileType,
      size: input.size,
      url: storageReference,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const saved = await queryRunner.manager.save(document);
      await this.requestHistoryService.registerDocumentUpload(
        {
          requestId: input.requestId,
          userId: input.currentUser.userId,
          fileName: input.fileName,
        },
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();

      return {
        id: saved.id,
        fileName: saved.fileName,
        fileType: saved.fileType,
        size: saved.size,
        url: this.documentContentUrl(input.requestId, saved.id),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getDocumentContent(
    requestId: string,
    documentId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<{ path: string; fileName: string; fileType: string; size: number }> {
    const document = await this.requestDocumentRepository.findOne({
      where: { id: documentId, requestId, isActive: true },
    });
    if (!document) throw new NotFoundException('Documento no encontrado');
    if (normalizeRoleName(currentUser.role) === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador no tiene acceso al contenido de documentos');
    }

    const request = await this.findRequestByIdOrThrow(requestId);
    this.assertRequestAccess(request, currentUser);

    const filePath = resolveStoredDocumentPath(document);
    let content: Buffer;
    try {
      content = await fs.readFile(filePath);
    } catch {
      throw new NotFoundException('El archivo del documento no está disponible');
    }
    if (content.length !== document.size || detectDocumentMime(content) !== document.fileType) {
      throw new NotFoundException('No se pudo validar el archivo del documento');
    }

    return {
      path: filePath,
      fileName: document.fileName,
      fileType: document.fileType,
      size: document.size,
    };
  }

  private documentContentUrl(requestId: string, documentId: string): string {
    return `/${envConfig.apiPrefix}/requests/${requestId}/documents/${documentId}/content`;
  }

  async getRequestDocuments(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ) {
    if (normalizeRoleName(currentUser.role) === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador no tiene acceso a documentos');
    }
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);
    this.assertRequestAccess(request, currentUser);

    const documents = await this.requestDocumentRepository.find({
      where: { requestId, isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return documents.map((document, index) => ({
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      size: document.size,
      url: this.documentContentUrl(requestId, document.id),
      uploadedById: document.userId,
      uploadedByName: `${document.user.firstName} ${document.user.lastName}`,
      createdAt: document.createdAt,
      version: documents.length - index,
      isCurrent: index === 0,
    }));
  }

  async findDocumentWithRequestDetails(
    documentId: string,
    currentUser: AuthenticatedUserContext,
  ) {
    const document = await this.requestDocumentRepository.findOne({
      where: { id: documentId, isActive: true },
      relations: ['request', 'request.category', 'request.department', 'request.status', 'user'],
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (normalizeRoleName(currentUser.role) === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador no tiene acceso a documentos');
    }
    this.assertRequestAccess(document.request, currentUser);

    return {
      id: document.id,
      requestId: document.requestId,
      fileName: document.fileName,
      fileType: document.fileType,
      size: document.size,
      url: this.documentContentUrl(document.requestId, document.id),
      uploadedById: document.userId,
      uploadedByName: `${document.user.firstName} ${document.user.lastName}`,
      createdAt: document.createdAt,
    };
  }

  async removeDocumentLogically(
    documentId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<{ id: string; requestId: string; fileName: string; isActive: boolean } | null> {
    const document = await this.requestDocumentRepository.findOne({
      where: { id: documentId, isActive: true },
      relations: ['request'],
    });

    if (!document) {
      return null;
    }

    if (normalizeRoleName(currentUser.role) === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador no puede eliminar documentos');
    }
    this.assertRequestAccess(document.request, currentUser);
    if (
      normalizeRoleName(currentUser.role) === AppRole.RECEPTIONIST &&
      document.request.receivedById !== currentUser.userId
    ) {
      throw new ForbiddenException('Solo puedes eliminar documentos de solicitudes recibidas por ti');
    }

    document.isActive = false;
    const saved = await this.requestDocumentRepository.save(document);
    return {
      id: saved.id,
      requestId: saved.requestId,
      fileName: saved.fileName,
      isActive: saved.isActive,
    };
  }

  async createInternalObservation(
    requestId: string,
    currentUser: AuthenticatedUserContext,
    createInternalObservationDto: CreateInternalObservationDto,
  ) {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);
    this.assertRequestAccess(request, currentUser);

    return this.requestHistoryService.registerInternalObservation({
      requestId,
      userId: currentUser.userId,
      observation: createInternalObservationDto.observation,
    });
  }

  async getAllRequests(
    filterDto: FilterRequestDTO = {},
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestListDto[]> {
    const role = normalizeRoleName(currentUser.role);
    if (!role || ![AppRole.RECEPTIONIST, AppRole.OFFICER, AppRole.SUPERVISOR, AppRole.MAYOR, AppRole.ADMIN].includes(role)) {
      throw new ForbiddenException('No tienes permiso para consultar solicitudes');
    }

    const query = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.department', 'department')
      .leftJoinAndSelect('request.status', 'status')
      .leftJoinAndSelect('request.userAssigned', 'userAssigned')
      .leftJoinAndSelect('request.receivedBy', 'receivedBy')
      .where('request.isActive = :isActive', { isActive: true })
      .orderBy('request.createdAt', 'DESC');

    if (role === AppRole.OFFICER || role === AppRole.SUPERVISOR) {
      if (!currentUser.departmentId) {
        throw new ForbiddenException('Tu usuario no tiene un departamento activo');
      }
      query.andWhere('request.departmentId = :currentDepartmentId', {
        currentDepartmentId: currentUser.departmentId,
      });
    }

    if (filterDto.categoryId) {
      query.andWhere('request.categoryId = :categoryId', {
        categoryId: filterDto.categoryId,
      });
    }

    if (filterDto.departmentId) {
      query.andWhere('request.departmentId = :departmentId', {
        departmentId: filterDto.departmentId,
      });
    }

    if (filterDto.statusId) {
      query.andWhere('request.statusId = :statusId', {
        statusId: filterDto.statusId,
      });
    }

    if (filterDto.priority) {
      query.andWhere('request.priority = :priority', {
        priority: filterDto.priority,
      });
    }

    const requests = await query.getMany();

    const documents = requests.length
      ? await this.requestDocumentRepository.find({
          where: {
            requestId: In(requests.map((request) => request.id)),
            isActive: true,
          },
          order: { createdAt: 'DESC' },
        })
      : [];

    return requests.map((request) => {
      const document = documents.find((item) => item.requestId === request.id);

      return {
        id: request.id,
        subject: request.subject,
        description: request.description,
        applicantName: request.applicantName,
        applicantContact: request.applicantContact,
        categoryName: request.category.name,
        departmentName: request.department.name,
        statusName: request.status.name,
        priority: request.priority,
        userAssignedName: request.userAssigned
          ? `${request.userAssigned.firstName} ${request.userAssigned.lastName}`
          : null,
        trackingCode: request.trackingCode,
        createdAt: request.createdAt,
        receivedById: request.receivedById,
        receivedByName: `${request.receivedBy.firstName} ${request.receivedBy.lastName}`,
        requestDate: request.requestDate,
        deadline: request.deadline,
        documentName: document?.fileName ?? null,
        documentUrl: role === AppRole.ADMIN || !document
          ? null
          : this.documentContentUrl(request.id, document.id),
      };
    });
  }

  async getRequestById(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestDetailsDto> {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'category',
      'department',
      'status',
      'userAssigned',
      'receivedBy',
    ]);

    this.assertRequestAccess(request, currentUser);

    return this.toRequestDetailsDto(request, currentUser);
  }

  async assignRequest(
    requestId: string,
    assignRequestDto: AssignRequestDto,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestDetailsDto> {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'category',
      'department',
      'status',
      'userAssigned',
      'receivedBy',
    ]);

    this.assertCanOperateRequest(request, currentUser);

    const assignee = await this.usersService.findOne(assignRequestDto.userAssignedId);
    if (assignee.departmentId !== request.departmentId) {
      throw new BadRequestException('El usuario asignado debe pertenecer al departamento de la solicitud');
    }
    const assigneeRole = normalizeRoleName(assignee.role.name);
    if (assigneeRole !== AppRole.OFFICER) {
      throw new BadRequestException('La solicitud solo puede asignarse a un funcionario activo');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      const previousAssignedUserId = request.userAssignedId;
      const previousStatusId = request.statusId;

      request.userAssignedId = assignRequestDto.userAssignedId;
      request.userAssigned = assignee as unknown as User;

      let targetStatus: RequestStatus | null;
      if (assignRequestDto.statusId) {
        targetStatus = await queryRunner.manager.findOne(RequestStatus, {
          where: { id: assignRequestDto.statusId, isActive: true },
        });
        if (!targetStatus) {
          throw new NotFoundException('Estado no encontrado');
        }
      } else {
        targetStatus = await queryRunner.manager.findOne(RequestStatus, {
          where: { name: 'in_review', isActive: true },
        });
        if (!targetStatus) {
          throw new NotFoundException(
            'No se encontro el estado "in_review" en la base de datos',
          );
        }
      }
      this.assertValidStatusTransition(
        request.status.name,
        targetStatus.name,
        currentUser,
        assignRequestDto.observation,
      );
      request.statusId = targetStatus.id;
      request.status = targetStatus;

        await queryRunner.manager.save(request);

        await this.requestHistoryService.registerAssignment(
          {
            requestId,
            userId: currentUser.userId,
            previousAssignedUserId,
            newAssignedUserId: assignRequestDto.userAssignedId,
            observation: assignRequestDto.observation ?? null,
          },
          queryRunner.manager,
        );

        if (previousStatusId !== request.statusId) {
          await this.requestHistoryService.registerStatusChange(
            {
              requestId,
              userId: currentUser.userId,
              previousStatusId,
              newStatusId: request.statusId,
              observation: assignRequestDto.observation ?? null,
            },
            queryRunner.manager,
          );
        }

      await queryRunner.commitTransaction();

      const updatedRequest = await this.findRequestByIdOrThrow(requestId, [
        'category',
        'department',
        'status',
        'userAssigned',
        'receivedBy',
      ]);

      return this.toRequestDetailsDto(updatedRequest, currentUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async registerDocumentView(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ) {
    if (normalizeRoleName(currentUser.role) === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador no puede registrar vistas de documentos');
    }
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);

    this.assertRequestAccess(request, currentUser);

    return this.requestHistoryService.registerDocumentView({
      requestId,
      userId: currentUser.userId,
    });
  }

  async getRequestHistory(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestHistoryResponseDto[]> {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);

    this.assertRequestAccess(request, currentUser);

    const history = await this.requestHistoryService.findByRequestId(requestId);

    return history.map((entry) => ({
      id: entry.id,
      requestId: entry.requestId,
      eventType: entry.eventType,
      previousStatusId: entry.previousStatusId,
      newStatusId: entry.newStatusId,
      previousStatusName: entry.previousStatus?.name ?? null,
      newStatusName: entry.newStatus?.name ?? null,
      previousAssignedUserId: entry.previousAssignedUserId,
      newAssignedUserId: entry.newAssignedUserId,
      previousAssignedUserName: entry.previousAssignedUser
        ? `${entry.previousAssignedUser.firstName} ${entry.previousAssignedUser.lastName}`
        : null,
      newAssignedUserName: entry.newAssignedUser
        ? `${entry.newAssignedUser.firstName} ${entry.newAssignedUser.lastName}`
        : null,
      observation: entry.observation,
      userId: entry.userId,
      userName: `${entry.user.firstName} ${entry.user.lastName}`,
      createdAt: entry.createdAt,
    }));
  }

  async createRequest(
    createRequestDto: CreateRequestDto,
    receivedById: string,
  ) {
    validateRequestDates(createRequestDto.requestDate, createRequestDto.deadline);
    const trackingCode = generateTrackingCode();

    const department = await this.departmentRepository.findOne({
    where: { id: createRequestDto.departmentId },
    });

    if (!department || !department.isActive) {
        throw new NotFoundException(
            'Departamento no encontrado',
        );
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createRequestDto.categoryId },
    });

    if (!category || !category.isActive) {
      throw new BadRequestException('Categoría no encontrada');
    }

    const assignedOfficer = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.departmentId = :departmentId', { departmentId: department.id })
      .andWhere('user.isActive = true')
      .andWhere('LOWER(role.name) IN (:...roles)', { roles: ['officer', 'revisor'] })
      .orderBy('user.createdAt', 'ASC')
      .getOne();

    const initialStatus = await this.requestStatusRepository.findOne({
      where: { name: assignedOfficer ? 'in_review' : 'received', isActive: true },
    });

    if (!initialStatus) {
      throw new BadRequestException(
        `No se encontró el estado inicial "${assignedOfficer ? 'in_review' : 'received'}" en la base de datos`,
      );
    }

    const request = this.requestRepository.create({
      subject: createRequestDto.subject,
      description: createRequestDto.description,
      applicantName: createRequestDto.applicantName,
      applicantContact: createRequestDto.applicantContact,
      categoryId: category.id,
      departmentId: department.id,
      priority: createRequestDto.priority,
      requestDate: createRequestDto.requestDate,
      deadline: createRequestDto.deadline ?? null,
      trackingCode,
      receivedById,
      statusId: initialStatus.id,
      userAssignedId: assignedOfficer?.id ?? null,
    });

    if (!request) {
      throw new BadRequestException('No se pudo crear la solicitud');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedRequest = await queryRunner.manager.save(request);

      await this.requestHistoryService.registerCreation(
        {
          requestId: savedRequest.id,
          userId: receivedById,
        },
        queryRunner.manager,
      );

      if (assignedOfficer) {
        await this.requestHistoryService.registerAssignment(
          {
            requestId: savedRequest.id,
            userId: receivedById,
            previousAssignedUserId: null,
            newAssignedUserId: assignedOfficer.id,
            observation: 'Asignacion automatica al registrar la solicitud',
          },
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
      return savedRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async findRequestByIdOrThrow(
    requestId: string,
    relations: string[] = [],
  ): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, isActive: true },
      relations,
    });

    if (!request) {
      throw new NotFoundException(`Solicitud #${requestId} no encontrada`);
    }

    return request;
  }

  async assertCanUploadDocumentById(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    await this.assertCanUploadDocument(requestId, currentUser);
  }

  private assertCanOperateRequest(
    request: Request,
    currentUser: AuthenticatedUserContext,
  ): void {
    const role = normalizeRoleName(currentUser.role);
    if (role === AppRole.ADMIN) {
      throw new ForbiddenException('El administrador tiene acceso de solo lectura a solicitudes');
    }
    this.assertRequestAccess(request, currentUser);
  }

  private assertRequestAccess(
    request: Request,
    currentUser: AuthenticatedUserContext,
  ): void {
    const role = normalizeRoleName(currentUser.role);
    if (role === AppRole.ADMIN || role === AppRole.MAYOR || role === AppRole.RECEPTIONIST) {
      return;
    }

    if (role !== AppRole.OFFICER && role !== AppRole.SUPERVISOR) {
      throw new ForbiddenException('No tienes permiso para consultar esta solicitud');
    }

    if (!currentUser.departmentId || currentUser.departmentId !== request.departmentId) {
      throw new ForbiddenException(
        'Solo puedes consultar o modificar solicitudes de tu departamento',
      );
    }
  }

  private async toRequestDetailsDto(
    request: Request,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestDetailsDto> {
    const document = await this.requestDocumentRepository.findOne({
      where: { requestId: request.id, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return {
      id: request.id,
      subject: request.subject,
      description: request.description,
      applicantName: request.applicantName,
      applicantContact: request.applicantContact,
      categoryName: request.category.name,
      departmentName: request.department.name,
      statusName: request.status.name,
      priority: request.priority,
      userAssignedName: request.userAssigned
        ? `${request.userAssigned.firstName} ${request.userAssigned.lastName}`
        : null,
      receivedByName: `${request.receivedBy.firstName} ${request.receivedBy.lastName}`,
      receivedById: request.receivedById,
      trackingCode: request.trackingCode,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      requestDate: request.requestDate,
      deadline: request.deadline,
      documentName: document?.fileName ?? null,
      documentUrl:
        normalizeRoleName(currentUser.role) === AppRole.ADMIN || !document
          ? null
          : this.documentContentUrl(request.id, document.id),
    };
  }

  async changeRequestStatus(
    requestId: string,
    dto: ChangeStatusDTO,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestDetailsDto> {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'category',
      'department',
      'status',
      'userAssigned',
      'receivedBy',
    ]);

    this.assertCanOperateRequest(request, currentUser);

    const previousStatusId = request.statusId;
    const status = await this.requestStatusRepository.findOne({
      where: { id: dto.statusId, isActive: true },
    });

    if (!status) {
      throw new NotFoundException('Estado no encontrado');
    }

    this.assertValidStatusTransition(
      request.status.name,
      status.name,
      currentUser,
      dto.observation,
    );

    request.statusId = status.id;
    request.status = status;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(request);

      await this.requestHistoryService.registerStatusChange(
        {
          requestId,
          userId: currentUser.userId,
          previousStatusId,
          newStatusId: status.id,
          observation: dto.observation,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      const updatedRequest = await this.findRequestByIdOrThrow(requestId, [
        'category',
        'department',
        'status',
        'userAssigned',
        'receivedBy',
      ]);

      return this.toRequestDetailsDto(updatedRequest, currentUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private assertValidStatusTransition(
    currentStatusName: string,
    targetStatusName: string,
    currentUser: AuthenticatedUserContext,
    observation?: string,
  ): void {
    const currentStatus = normalizeWorkflowStatus(currentStatusName);
    const targetStatus = normalizeWorkflowStatus(targetStatusName);
    if (!currentStatus || !targetStatus) {
      throw new BadRequestException('La transición solicitada no pertenece al flujo oficial');
    }

    const role = normalizeRoleName(currentUser.role);
    const transitions = role === AppRole.MAYOR
      ? MAYOR_TRANSITIONS
      : role === AppRole.OFFICER || role === AppRole.SUPERVISOR
        ? DEPARTMENT_TRANSITIONS
        : undefined;
    const isAllowed = transitions?.[currentStatus]?.includes(targetStatus) ?? false;

    if (!isAllowed) {
      throw new BadRequestException(
        `No se permite cambiar de ${currentStatus} a ${targetStatus} para este rol`,
      );
    }

    if (
      STATUS_REQUIRING_REASON.has(targetStatus) &&
      (observation?.trim().length ?? 0) < 10
    ) {
      throw new BadRequestException('Debes indicar un motivo de al menos 10 caracteres');
    }
  }

  async changeRequestDepartment(
    requestId: string,
    dto: ChangeDepartmentDto,
    currentUser: AuthenticatedUserContext,
  ): Promise<RequestDetailsDto> {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'category', 'department', 'status', 'userAssigned', 'receivedBy',
    ]);
    this.assertCanOperateRequest(request, currentUser);

    const department = await this.departmentRepository.findOne({
      where: { id: dto.departmentId, isActive: true },
    });
    if (!department) throw new NotFoundException('Departamento no encontrado');

    if (department.id === request.departmentId) {
      throw new BadRequestException('La solicitud ya está asignada a ese departamento');
    }

    const previousDepartment = request.department.name;
    const assignedOfficer = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.departmentId = :departmentId', { departmentId: department.id })
      .andWhere('user.isActive = true')
      .andWhere('LOWER(role.name) IN (:...roles)', { roles: ['officer', 'revisor'] })
      .orderBy('user.createdAt', 'ASC')
      .getOne();
    const previousAssignedUserId = request.userAssignedId;
    request.departmentId = department.id;
    request.department = department;
    request.userAssignedId = assignedOfficer?.id ?? null;
    request.userAssigned = assignedOfficer;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(request);
      await this.requestHistoryService.registerInternalObservation(
        {
          requestId,
          userId: currentUser.userId,
          observation:
            dto.observation?.trim() ||
            `Departamento cambiado de ${previousDepartment} a ${department.name}`,
        },
        queryRunner.manager,
      );
      if (previousAssignedUserId !== request.userAssignedId) {
        await this.requestHistoryService.registerAssignment(
          {
            requestId,
            userId: currentUser.userId,
            previousAssignedUserId,
            newAssignedUserId: request.userAssignedId,
            observation: `Reasignación automática al departamento ${department.name}`,
          },
          queryRunner.manager,
        );
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const updated = await this.findRequestByIdOrThrow(requestId, [
      'category', 'department', 'status', 'userAssigned', 'receivedBy',
    ]);
    return this.toRequestDetailsDto(updated, currentUser);
  }

}

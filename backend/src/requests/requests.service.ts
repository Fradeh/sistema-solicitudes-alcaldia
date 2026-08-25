import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { normalizeRoleName } from '../auth/roles/role-normalizer';
import { AppRole } from '../auth/roles/app-role.enum';
import { RequestDocument } from '../documents/entities/request-document.entity';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';
import { RequestHistoryService } from '../request-history/request-history.service';
import { UsersService } from '../users/users.service';
import { AssignRequestDto } from './dto/assign-request.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
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
interface AuthenticatedUserContext {
  userId: string;
  role?: string;
}

type WorkflowStatus =
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

  async createDocument(
    createDocumentDto: CreateDocumentDto,
  ): Promise<RequestDocument> {
    await this.findRequestByIdOrThrow(createDocumentDto.requestId);
    await this.usersService.findOne(createDocumentDto.userId);

    const document = this.requestDocumentRepository.create(createDocumentDto);
    const savedDocument = await this.requestDocumentRepository.save(document);

    await this.requestHistoryService.registerDocumentUpload({
      requestId: createDocumentDto.requestId,
      userId: createDocumentDto.userId,
      fileName: createDocumentDto.fileName,
    });

    return savedDocument;
  }

  async getRequestDocuments(
    requestId: string,
    currentUser: AuthenticatedUserContext,
  ) {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);
    this.assertOfficerCanAccess(request, currentUser);

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
      url: document.url,
      uploadedById: document.userId,
      uploadedByName: `${document.user.firstName} ${document.user.lastName}`,
      createdAt: document.createdAt,
      version: documents.length - index,
      isCurrent: index === 0,
    }));
  }

  async findDocumentWithRequestDetails(documentId: string) {
    const document = await this.requestDocumentRepository.findOne({
      where: { id: documentId, isActive: true },
      relations: ['request', 'request.category', 'request.department', 'request.status', 'user'],
    });

    if (!document) {
      return null;
    }

    return {
      document,
      request: document.request,
    };
  }

  async removeDocumentLogically(
    documentId: string,
  ): Promise<RequestDocument | null> {
    const document = await this.requestDocumentRepository.findOne({
      where: { id: documentId, isActive: true },
    });

    if (!document) {
      return null;
    }

    document.isActive = false;
    return this.requestDocumentRepository.save(document);
  }

  async createInternalObservation(
    requestId: string,
    currentUser: AuthenticatedUserContext,
    createInternalObservationDto: CreateInternalObservationDto,
  ) {
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);
    this.assertOfficerCanAccess(request, currentUser);

    return this.requestHistoryService.registerInternalObservation({
      requestId,
      userId: currentUser.userId,
      observation: createInternalObservationDto.observation,
    });
  }

  async getAllRequests(
    filterDto: FilterRequestDTO = {},
    currentUser?: AuthenticatedUserContext,
  ): Promise<RequestListDto[]> {
    const query = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.department', 'department')
      .leftJoinAndSelect('request.status', 'status')
      .leftJoinAndSelect('request.userAssigned', 'userAssigned')
      .leftJoinAndSelect('request.receivedBy', 'receivedBy')
      .where('request.isActive = :isActive', { isActive: true })
      .orderBy('request.createdAt', 'DESC');

    if (normalizeRoleName(currentUser?.role) === AppRole.OFFICER) {
      query.andWhere('request.userAssignedId = :currentUserId', {
        currentUserId: currentUser?.userId,
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
      documentUrl: document?.url ?? null,
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

    this.assertOfficerCanAccess(request, currentUser);

    return this.toRequestDetailsDto(request);
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

    await this.usersService.findOne(assignRequestDto.userAssignedId);

    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      
      const previousAssignedUserId = request.userAssignedId;
      const previousStatusId = request.statusId;

      request.userAssignedId = assignRequestDto.userAssignedId;

      if (assignRequestDto.statusId) {
        const statusExists = await queryRunner.manager.findOne(RequestStatus,{
          where: { id: assignRequestDto.statusId }
        });
        if (!statusExists) {
          throw new NotFoundException('Estado no encontrado');
        }
        request.statusId = assignRequestDto.statusId;
      } else {
        const defaultStatus = await queryRunner.manager.findOne(RequestStatus,{
          where: { name: 'in_review' },
        });
        if (!defaultStatus) {
          throw new NotFoundException(
            'No se encontro el estado "in_review" en la base de datos',
          );
        }
        request.statusId = defaultStatus.id;
      }

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

      return this.toRequestDetailsDto(updatedRequest);
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
    const request = await this.findRequestByIdOrThrow(requestId, [
      'userAssigned',
    ]);

    this.assertOfficerCanAccess(request, currentUser);

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

    this.assertOfficerCanAccess(request, currentUser);

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
    const trackingCode = generateTrackingCode();

    let statusId = createRequestDto.statusId;

    const department = await this.departmentRepository.findOne({
    where: { id: createRequestDto.departmentId },
    });

    if (!department) {
        throw new NotFoundException(
            'Departamento no encontrado',
        );
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createRequestDto.categoryId },
    });

    if (!category) {
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

    if (!statusId) {
      const receivedStatus = await this.requestStatusRepository.findOne({
        where: { name: assignedOfficer ? 'in_review' : 'received' },
      });

      if (!receivedStatus) {
        throw new BadRequestException(
          'No se encontro el estado inicial "received" en la base de datos',
        );
      }

      statusId = receivedStatus.id;
    }

    const request = this.requestRepository.create({
      ...createRequestDto,
      trackingCode,
      receivedById,
      statusId,
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

  private assertOfficerCanAccess(
    request: Request,
    currentUser: AuthenticatedUserContext,
  ): void {
    const normalizedRole = normalizeRoleName(currentUser.role);

    if (normalizedRole !== AppRole.OFFICER) {
      return;
    }

    if (request.userAssignedId !== currentUser.userId) {
      throw new ForbiddenException(
        'Solo puedes consultar o modificar las solicitudes asignadas a tu usuario',
      );
    }
  }

  private async toRequestDetailsDto(request: Request): Promise<RequestDetailsDto> {
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
      documentUrl: document?.url ?? null,
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

    this.assertOfficerCanAccess(request, currentUser);

    const previousStatusId = request.statusId;
    const status = await this.requestStatusRepository.findOne({
      where: { id: dto.statusId },
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

      return this.toRequestDetailsDto(updatedRequest);
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
    if (role === AppRole.ADMIN) return;

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
    const department = await this.departmentRepository.findOne({
      where: { id: dto.departmentId, isActive: true },
    });
    if (!department) throw new NotFoundException('Departamento no encontrado');

    const previousDepartment = request.department.name;
    const assignedOfficer = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.departmentId = :departmentId', { departmentId: department.id })
      .andWhere('user.isActive = true')
      .andWhere('LOWER(role.name) IN (:...roles)', { roles: ['officer', 'revisor'] })
      .orderBy('user.createdAt', 'ASC')
      .getOne();
    request.departmentId = department.id;
    request.userAssignedId = assignedOfficer?.id ?? null;
    await this.requestRepository.save(request);
    await this.requestHistoryService.registerInternalObservation({
      requestId,
      userId: currentUser.userId,
      observation: dto.observation || `Departamento cambiado de ${previousDepartment} a ${department.name}`,
    });

    return this.getRequestById(requestId, currentUser);
  }

}

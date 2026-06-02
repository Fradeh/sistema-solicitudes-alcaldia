import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestHistoryService } from '../request-history/request-history.service';
import { RequestHistoryResponseDto } from '../request-history/dto/request-history-response.dto';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { generateTrackingCode } from './utils/tracking-code.util';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { ListRequestDto } from './dto/RequestListResponse';
import { RequestDetailsDTO } from './dto/RequestDetailsResponseDTO';
import { FilterRequestDTO } from './dto/FilterRequestDTO';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(DocumentUser.name)
    private readonly documentModel: Model<DocumentUser>,
    private readonly requestHistoryService: RequestHistoryService,
      @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
  ) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentUser> {
    const newDocument = new this.documentModel(createDocumentDto);
    return newDocument.save();
  }

  async findDocumentWithRequestDetails(documentId: string): Promise<any> {
    const document = await this.documentModel.findById(documentId).exec();
    if (!document) {
      return null;
    }

    let requestDetails = null;
    try {
      requestDetails = await this.documentModel.db
        .collection('requests')
        .findOne({ id: document.requestId });
    } catch (error: any) {
      console.log('No se pudo mapear la solicitud automaticamente:', error.message);
    }

    return {
      document,
      request: requestDetails || 'Solicitud no encontrada en el sistema',
    };
  }

  async removeDocumentLogically(documentId: string): Promise<DocumentUser | null> {
    return this.documentModel
      .findByIdAndUpdate(documentId, { isActive: false }, { new: true })
      .exec();
  }

  async createInternalObservation(
    requestId: string,
    createInternalObservationDto: CreateInternalObservationDto,
  ) {
    return this.requestHistoryService.registerInternalObservation({
      requestId,
      userId: createInternalObservationDto.userId,
      observation: createInternalObservationDto.observation,
    });
  }

  async getRequestHistory(requestId: string): Promise<RequestHistoryResponseDto[]> {
    const request = await this.requestRepository.findOne({ where: { id: requestId } });

    if (!request) {
      throw new NotFoundException(`Solicitud #${requestId} no encontrada`);
    }

    const history = await this.requestHistoryService.findByRequestId(requestId);

    return history.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      observation: entry.observation,
      userId: entry.userId,
      createdAt: entry.createdAt,
    }));
  }

  // Obtener todos los documentos de una solicitud
  async createRequest(createRequestDto: CreateRequestDto, receivedById: string) {


      const trackingCode = generateTrackingCode();

      const request = this.requestRepository.create({
        ...createRequestDto,
        trackingCode,
        receivedById
      });

      if(!request) {
        throw new BadRequestException('No se pudo crear la solicitud');
      }
      return await this.requestRepository.save(request);
  }

  // Obtener todas las solicitudes con sus detalles relacionados con filtros opcionales
  async getAllRequests(
    filterDto: FilterRequestDTO
  ): Promise<ListRequestDto[]> {

    const query = this.requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.category', 'category')
        .leftJoinAndSelect('request.department', 'department')
        .leftJoinAndSelect('request.status', 'status')
        .leftJoinAndSelect('request.userAssigned', 'userAssigned');

    if (filterDto.categoryId) {
      query.andWhere('request.categoryId = :categoryId', { categoryId: filterDto.categoryId });
    }
    if (filterDto.departmentId) {
      query.andWhere('request.departmentId = :departmentId', { departmentId: filterDto.departmentId });
    }
    if (filterDto.statusId) {
      query.andWhere('request.statusId = :statusId', { statusId: filterDto.statusId });
    }
    if (filterDto.priority) {
      query.andWhere('request.priority = :priority', { priority: filterDto.priority });
    }
    
    const requests = await query.getMany();
      
    return requests.map(request => ({
      category: request.category.name,
      department: request.department.name,
      status: request.status.name,
      priority: request.priority,
      trackingCode: request.trackingCode,
      userAssigned: request.userAssigned ? 
      `${request.userAssigned.firstName} ${request.userAssigned.lastName}`
      : undefined
    }));
  }
// Obtener los detalles de una solicitud por su ID
  async getRequestById(requestId: string) : Promise<RequestDetailsDTO>{
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['category', 'department', 'status', 'userAssigned'],
    });
    if (!request) {
      throw new NotFoundException(`Solicitud #${requestId} no encontrada`);
    }
    return {
      idRequest: request.id,
      categoryName: request.category.name,
      departmentName: request.department.name,
      statusName: request.status.name,
      priority: request.priority,
      trackingCode: request.trackingCode,
      userAssignedName: request.userAssigned ?
      `${request.userAssigned.firstName} ${request.userAssigned.lastName}`
      : undefined,
      creationDate: request.createdAt,
      updateDate: request.updatedAt
    };

  }
}


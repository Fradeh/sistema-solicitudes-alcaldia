import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestHistoryService } from '../request-history/request-history.service';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { generateTrackingCode } from './utils/tracking-code.util';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { ListRequestDto } from './dto/RequestListResponse';

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

  async getRequestHistory(requestId: string) {
    return this.requestHistoryService.findByRequestId(requestId);
  }

  //Function to get all documents for a request
  async createRequest(createRequestDto: CreateRequestDto ) {
    

      const trackingCode = generateTrackingCode();

      const request = this.requestRepository.create({
        ...createRequestDto,
        trackingCode
      });

      if(!request) {
        throw new BadRequestException('No se pudo crear la solicitud');
      }
      return await this.requestRepository.save(request);
  }

  async getAllRequests(): Promise<ListRequestDto[]> {

    const requests = await this.requestRepository.find({
      relations: ['category', 'department', 'status', 'userAssigned'],
    });
    
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
}


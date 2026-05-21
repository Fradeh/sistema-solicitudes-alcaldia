import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestHistoryService } from '../request-history/request-history.service';
import { DocumentUser } from '../documents/schema/document-user.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateInternalObservationDto } from './dto/create-internal-observation.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(DocumentUser.name)
    private readonly documentModel: Model<DocumentUser>,
    private readonly requestHistoryService: RequestHistoryService,
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
}

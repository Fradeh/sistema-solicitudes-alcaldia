import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentUser } from '../documents/schema/document-user.schema'; // esquema de Mongo

@Injectable()
export class RequestsService {
  constructor(
    // Inyectamos el modelo de Mongoose para interactuar con MongoDB
    @InjectModel(DocumentUser.name)
    private readonly documentModel: Model<DocumentUser>,
  ) {}

  /**
   * Obtiene todos los documentos asociados al expediente de una solicitud específica
   * @param requestId ID de la solicitud a consultar
   */
  async findDocumentsByRequest(requestId: string): Promise<DocumentUser[]> {
    return this.documentModel.find({ requestId: requestId }).exec();
  }
}
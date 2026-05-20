import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentUser } from '../documents/schema/document-user.schema'; 
import { CreateDocumentDto } from './dto/create-document.dto';// esquema de Mongo

@Injectable()
export class RequestsService {
  constructor(
    // Inyectamos el modelo de Mongoose para interactuar con MongoDB
    @InjectModel(DocumentUser.name)
    private readonly documentModel: Model<DocumentUser>,
  ) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentUser> {
    const newDocument = new this.documentModel(createDocumentDto);
    return newDocument.save();
  }
  async findDocumentsByRequest(requestId: string): Promise<DocumentUser[]> {
    return this.documentModel.find({ requestId: requestId }).exec();
  }
}
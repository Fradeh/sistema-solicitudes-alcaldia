import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentUser, DocumentUserDocument } from './schema';
import { CreateDocumentDto } from './dto/create-document.dto'; // Importamos el DTO

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentUser.name) 
    private readonly documentModel: Model<DocumentUserDocument>,
  ) {}

  // 1. Método de ayer (Consultar)
  async findByRequestId(requestId: string): Promise<DocumentUser[]> {
    return this.documentModel.find({ requestId }).exec();
  }

  // 2. Método de HOY (Registrar/Guardar)
  async create(createDocumentDto: CreateDocumentDto): Promise<DocumentUser> {
    const newDocument = new this.documentModel(createDocumentDto);
    return newDocument.save(); // Guarda directamente en MongoDB
  }
}
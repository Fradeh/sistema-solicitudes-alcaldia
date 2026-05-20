import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentUser } from '../documents/schema/document-user.schema'; 
import { CreateDocumentDto } from './dto/create-document.dto';// esquema de Mongo

@Injectable()
export class RequestsService {
  constructor(
    // inyectamos el modelo de mongoose para interactuar con MongoDB
    @InjectModel(DocumentUser.name)
    private readonly documentModel: Model<DocumentUser>,
  ) {}

  async createDocument(createDocumentDto: CreateDocumentDto): Promise<DocumentUser> {
    const newDocument = new this.documentModel(createDocumentDto);
    return newDocument.save();
  }
 async findDocumentWithRequestDetails(documentId: string): Promise<any> {
    // 1. Buscamos el documento por su ID de MongoDB
    const document = await this.documentModel.findById(documentId).exec();
    if (!document) {
      return null; // Si no existe el documento, retornamos null
    }

    let requestDetails = null;
    try {
      
      requestDetails = await this.documentModel.db
        .collection('requests') 
        .findOne({ id: document.requestId });
    } catch (error: any) {
      console.log('No se pudo mapear la solicitud automáticamente:', error.message);
    }

    // 3.retornamos la metadata del documento y le acoplamos la información de la solicitud
    return {
      document,
      request: requestDetails || 'Solicitud no encontrada en el sistema'
    };
    
  }
  
  async removeDocumentLogically(documentId: string): Promise<DocumentUser | null> {
  // Buscamos el documento y actualizamos su campo isActive a false
  return this.documentModel
    .findByIdAndUpdate(
      documentId, 
      { isActive: false }, 
      { new: true } // { new: true } hace que Mongoose devuelva el documento ya modificado
    )
    .exec();
}
}
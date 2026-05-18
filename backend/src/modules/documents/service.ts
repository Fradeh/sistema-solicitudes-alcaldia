import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentUser, DocumentUserDocument } from './schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentUser.name) 
    private readonly documentModel: Model<DocumentUserDocument>,
  ) {}

  async findByRequestId(requestId: string): Promise<DocumentUser[]> {
    const documents = await this.documentModel.find({ requestId }).exec();
    return documents || [];
  }
}
import { Model } from 'mongoose';
import { DocumentUser, DocumentUserDocument } from './schema';
export declare class DocumentsService {
    private readonly documentModel;
    constructor(documentModel: Model<DocumentUserDocument>);
    findByRequestId(requestId: string): Promise<DocumentUser[]>;
}

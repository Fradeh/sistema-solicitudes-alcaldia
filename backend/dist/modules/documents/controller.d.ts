import { DocumentsService } from './service';
import { DocumentUser } from './schema';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    getByRequest(requestId: string): Promise<DocumentUser[]>;
}

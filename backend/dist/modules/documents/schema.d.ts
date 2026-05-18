import { Document } from 'mongoose';
export type DocumentUserDocument = DocumentUser & Document;
export declare class DocumentUser {
    fileName: string;
    fileType: string;
    size: number;
    url: string;
    requestId: string;
    userId: string;
}
export declare const DocumentSchema: import("mongoose").Schema<DocumentUser, import("mongoose").Model<DocumentUser, any, any, any, any, any, DocumentUser>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DocumentUser, Document<unknown, {}, DocumentUser, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    fileName?: import("mongoose").SchemaDefinitionProperty<string, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    fileType?: import("mongoose").SchemaDefinitionProperty<string, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    size?: import("mongoose").SchemaDefinitionProperty<number, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    url?: import("mongoose").SchemaDefinitionProperty<string, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requestId?: import("mongoose").SchemaDefinitionProperty<string, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    userId?: import("mongoose").SchemaDefinitionProperty<string, DocumentUser, Document<unknown, {}, DocumentUser, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DocumentUser & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, DocumentUser>;

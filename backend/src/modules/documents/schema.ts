import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentUserDocument = DocumentUser & Document;

@Schema({ timestamps: true })
export class DocumentUser {
  
  @Prop({ required: true, trim: true })
  fileName!: string; // <-- Agrega el '!' aquí

  @Prop({ required: true })
  fileType!: string; // <-- Aquí también

  @Prop({ required: true })
  size!: number; // <-- Aquí también

  @Prop({ required: true })
  url!: string; // <-- Aquí también

  @Prop({ required: true })
  requestId!: string; // <-- Aquí también

  @Prop({ required: true })
  userId!: string; // <-- Aquí también
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentUser);
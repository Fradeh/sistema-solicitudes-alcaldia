import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentUserDocument = DocumentUser & Document;

@Schema({ timestamps: true })
export class DocumentUser {
  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  fileType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  requestId!: string;

  @Prop({ required: true })
  userId!: string;
  
  @Prop({ required: true, default: true })
  isActive!: boolean;
}

export const DocumentUserSchema = SchemaFactory.createForClass(DocumentUser);
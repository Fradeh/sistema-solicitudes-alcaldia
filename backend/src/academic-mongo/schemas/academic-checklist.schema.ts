import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Estructura para cada paso individual dentro del checklist
@Schema({ _id: false }) 
export class ChecklistStep {
  @Prop({ required: true })
  stepName!: string; 

  @Prop({ default: false })
  isCompleted!: boolean; 

  @Prop({ required: true })
  updatedBy!: string; 

  @Prop({ default: Date.now })
  updatedAt!: Date; 

  @Prop({ required: false })
  observation?: string; 
}

// Checklist Académico
@Schema({ collection: 'academic_checklists', timestamps: true })
export class AcademicChecklist extends Document {
  
  @Prop({ required: true, index: true })
  requestId!: string; // 🌟 Corregido con '!'

  @Prop({ type: [SchemaFactory.createForClass(ChecklistStep)], default: [] })
  steps!: ChecklistStep[]; // 🌟 Corregido con '!'

  @Prop({ required: false })
  generalObservation?: string;
}

export const AcademicChecklistSchema = SchemaFactory.createForClass(AcademicChecklist);
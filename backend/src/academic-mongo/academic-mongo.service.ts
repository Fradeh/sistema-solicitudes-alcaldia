import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcademicChecklist } from './schemas/academic-checklist.schema'; // 
import { CreateAcademicChecklistDto } from './dto/create-academic-checklist.dto';

@Injectable()
export class AcademicMongoService {
  private readonly logger = new Logger(AcademicMongoService.name);

  // Inyectamos el modelo usando la interfaz estricta de Mongoose
  constructor(
    @InjectModel(AcademicChecklist.name)
    private readonly checklistModel: Model<AcademicChecklist>,
  ) {}

  /**
   * Guarda un nuevo registro de checklist/evento en MongoDB
   */
  async createEvent(createDto: CreateAcademicChecklistDto): Promise<any> {
    try {
      this.logger.log(`Intentando registrar evento en MongoDB para la solicitud: ${createDto.requestId}`);
      
      // Creamos la instancia usando el modelo inyectado
      const newEvent = new this.checklistModel(createDto);
      
      // Guardamos en la base de datos de Mongo
      const savedEvent = await newEvent.save();
      
      this.logger.log(`Evento registrado con éxito en MongoDB. ID: ${savedEvent._id}`);
      return savedEvent;
    } catch (error) {
      this.logger.error(`Error al guardar el evento en MongoDB para la solicitud ${createDto.requestId}`, error as Error);
      throw error;
    }
  }
}
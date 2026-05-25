import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcademicChecklist } from './schemas/academic-checklist.schema';
import { CreateAcademicChecklistDto } from './dto/create-academic-checklist.dto';

@Injectable()
export class AcademicMongoService {
  private readonly logger = new Logger(AcademicMongoService.name);

  // reglas definidas para el Issue #54
  private readonly ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // limite de ejemplo: 5MB

  constructor(
    @InjectModel(AcademicChecklist.name)
    private readonly checklistModel: Model<AcademicChecklist>,
  ) {}

  /**
   *  metodo privado para validar los requerimientos del Issue #54
   */
  private async validateDocument(requestId: string, fileName: string, fileSize: number): Promise<void> {
    // 1 Validar que la solicitud exista (aquí puedes meter luego la lógica con Postgres)
    if (!requestId || requestId.trim() === '') {
      throw new BadRequestException('El ID de la solicitud es requerido y debe ser válido.');
    }

    // validar que el nombre del archivo no esté vacío
    if (!fileName || fileName.trim() === '') {
      throw new BadRequestException('El nombre del archivo no puede estar vacío.');
    }

    // validar que el tipo de archivo sea permitido (extensión)
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(`Tipo de archivo no permitido (${fileExtension}). Permitidos: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // validar que el tamaño sea válido
    if (fileSize <= 0 || fileSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`Tamaño de archivo inválido. Máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    this.logger.log(`Todas las validaciones estricta pasaron para la solicitud: ${requestId}`);
  }

  /**
   * Guarda un nuevo registro de checklist/evento en MongoDB con previas validaciones
   */
  async createEvent(
    createDto: CreateAcademicChecklistDto, 
    fileName: string, 
    fileSize: number
  ): Promise<AcademicChecklist> {
    
    // ejecutamos las validaciones antes de hacer el save en MongoDB
    await this.validateDocument(createDto.requestId, fileName, fileSize);

    try {
      this.logger.log(`Intentando registrar evento validado en MongoDB para la solicitud: ${createDto.requestId}`);
      
      const newEvent = new this.checklistModel(createDto);
      const savedEvent = await newEvent.save();
      
      this.logger.log(`Evento registrado con éxito en MongoDB. ID: ${savedEvent._id}`);
      return savedEvent;
    } catch (error) {
      this.logger.error(`Error al guardar el evento en MongoDB para la solicitud ${createDto.requestId}`, error as Error);
      throw error;
    }
  }
}
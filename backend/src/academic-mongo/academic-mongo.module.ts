import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicChecklist, AcademicChecklistSchema } from './schemas/academic-checklist.schema';
import { AcademicMongoService } from './academic-mongo.service'; // Importación nueva

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicChecklist.name, schema: AcademicChecklistSchema }
    ]),
  ],
  providers: [AcademicMongoService], // Agregado como Provider
  controllers: [],
  exports: [MongooseModule, AcademicMongoService], // Exportado para que otros módulos lo usen
})
export class AcademicMongoModule {}
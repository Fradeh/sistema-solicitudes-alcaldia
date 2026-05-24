import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicChecklist, AcademicChecklistSchema } from './schemas/academic-checklist.schema';

@Module({
  imports: [
    // Registramos el esquema para que Mongoose cree la colección en Mongo
    MongooseModule.forFeature([
      { name: AcademicChecklist.name, schema: AcademicChecklistSchema }
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [MongooseModule], // Exportarlo permite que otros módulos lo usen si es necesario
})
export class AcademicMongoModule {}

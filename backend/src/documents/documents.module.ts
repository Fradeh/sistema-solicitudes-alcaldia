import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentUser, DocumentUserSchema } from './schema/document-user.schema';

@Module({
  imports: [
    // Aqui registramos dl nuevo modelo en Mongoose para el Issue #45
    MongooseModule.forFeature([
      { name: DocumentUser.name, schema: DocumentUserSchema }
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule] // Lo exportamos para que el módulo de Solicitudes pueda usarlo después
})
export class DocumentsModule {}
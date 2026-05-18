import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentUser, DocumentSchema } from './schema';
import { DocumentsService } from './service';
import { DocumentsController } from './controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DocumentUser.name, schema: DocumentSchema }]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService, MongooseModule],
})
export class DocumentsModule {}
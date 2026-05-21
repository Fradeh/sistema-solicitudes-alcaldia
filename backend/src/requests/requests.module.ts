import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller'; 
import { DocumentsModule } from '../documents/documents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { Department } from 'src/departments/entities/department.entity';



@Module({
  imports: [ TypeOrmModule.forFeature([Request, Department]), // Importa las entidades para TypeORM
    DocumentsModule, // conexión a MongoDB integrada
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  })
export class RequestsModule {}

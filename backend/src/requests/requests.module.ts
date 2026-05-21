import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller'; 
import { DocumentsModule } from '../documents/documents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';

//Relasionships with other modules
import { DepartmentsModule } from 'src/departments/departments.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { RequestStatusesModule } from 'src/request-statuses/request-statuses.module';
import { UsersModule } from 'src/users/users.module';



@Module({
  imports: [ TypeOrmModule.forFeature([Request]), // Importa las entidades para TypeORM
    DocumentsModule, // conexión a MongoDB integrada
    DepartmentsModule, // conexión al módulo de departamentos
    CategoriesModule, // conexión al módulo de categorías
    RequestStatusesModule, // conexión al módulo de estados de solicitudes
    UsersModule, // conexión al módulo de usuarios
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  })
export class RequestsModule {}

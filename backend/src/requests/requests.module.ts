import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller'; 
import { DocumentsModule } from '../documents/documents.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';

//Relasionships with other modules
import { DepartmentsModule } from 'src/departments/departments.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { RequestStatusesModule } from 'src/request-statuses/request-statuses.module';
import { UsersModule } from 'src/users/users.module';
import { RequestHistoryModule } from 'src/request-history/request-history.module';


@Module({
  imports: [ TypeOrmModule.forFeature([Request, User]), // Importa las entidades para TypeORM
    DocumentsModule, // conexión a MongoDB integrada
    DepartmentsModule, // conexión al módulo de departamentos
    CategoriesModule, // conexión al módulo de categorías
    RequestStatusesModule, // conexión al módulo de estados de solicitudes
    UsersModule, // conexión al módulo de usuarios
    RequestHistoryModule, // conexión al módulo de historial de solicitudes
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  })
export class RequestsModule {}

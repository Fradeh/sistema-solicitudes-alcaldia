import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from '../documents/documents.module';
import { RequestHistoryModule } from '../request-history/request-history.module';
import { RequestStatus } from '../request-statuses/entities/request-status.entity';
import { RequestStatusesModule } from '../request-statuses/request-statuses.module';
import { CategoriesModule } from '../categories/categories.module';
import { DepartmentsModule } from '../departments/departments.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { Request } from './entities/request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, User, RequestStatus]),
    DocumentsModule,
    DepartmentsModule,
    CategoriesModule,
    RequestStatusesModule,
    UsersModule,
    RequestHistoryModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

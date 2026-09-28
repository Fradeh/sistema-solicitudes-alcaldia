import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcademicMongoModule } from './academic-mongo/academic-mongo.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './departments/departments.module';
import { DocumentsModule } from './documents/documents.module';
import { RequestHistoryModule } from './request-history/request-history.module';
import { RequestStatusesModule } from './request-statuses/request-statuses.module';
import { RequestsModule } from './requests/requests.module';
import { RolesModule } from './roles/roles.module';
import { TrackingModule } from './tracking/tracking.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Se le añade el punto para que lea tu archivo '.env'
    }),
    DatabaseModule, //modulo se encargará de levantar ambas bases de datos
    AuthModule,
    RolesModule,
    UsersModule,
    DepartmentsModule,
    CategoriesModule,
    RequestStatusesModule,
    RequestsModule,
    RequestHistoryModule,
    DocumentsModule,
    TrackingModule,
    AcademicMongoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
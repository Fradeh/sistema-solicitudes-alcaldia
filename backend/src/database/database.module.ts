import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getPostgresConfig } from '../config/database.config';

@Module({
  imports: [
    // (PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getPostgresConfig,
    }),
    
    // Base de datos NoSQL 
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Lee la URI de tu archivo .env. Si está vacío, usa el nombre del contenedor de Docker como respaldo
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://solicitudes_user:solicitudes_password@solicitudes_mongodb:27017/solicitudes_academic?authSource=admin',
        ),
      }),
    }),
  ],
  //  exportamos ambos módulos para que el resto del sistema pueda usarlos sin problemas
  exports: [TypeOrmModule, MongooseModule], 
})
export class DatabaseModule {}
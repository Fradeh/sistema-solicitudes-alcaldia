import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getPostgresConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST', 'localhost'),
  port: Number(configService.get<string>('POSTGRES_PORT', '5432')),
  username: configService.get<string>('POSTGRES_USER', 'solicitudes_user'),
  password: configService.get<string>(
    'POSTGRES_PASSWORD',
    'solicitudes_password',
  ),
  database: configService.get<string>('POSTGRES_DB', 'solicitudes_db'),
  autoLoadEntities: true,
  synchronize: false,
});

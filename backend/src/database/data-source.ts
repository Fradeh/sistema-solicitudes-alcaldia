import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

const postgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'solicitudes_user',
  password: process.env.POSTGRES_PASSWORD || 'solicitudes_password',
  database: process.env.POSTGRES_DB || 'solicitudes_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default postgresDataSource;

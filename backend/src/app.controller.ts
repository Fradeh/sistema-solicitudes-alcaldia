import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectConnection()
    private readonly mongoConnection: Connection,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        postgres: this.dataSource.isInitialized ? 'connected' : 'disconnected',
        mongodb:
          this.mongoConnection.readyState === 1 ? 'connected' : 'disconnected',
      },
    };
  }
}

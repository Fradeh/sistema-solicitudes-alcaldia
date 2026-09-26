import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestDocument } from './entities/request-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestDocument])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class DocumentsModule {}

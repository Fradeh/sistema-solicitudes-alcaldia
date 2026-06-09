import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AssignRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userAssignedId!: string;

  @ApiProperty({ format: 'uuid', required: false, description: 'Nuevo estado (opcional, por defecto "in_progress")' })
  @IsUUID()
  @IsOptional()
  statusId?: string;
}


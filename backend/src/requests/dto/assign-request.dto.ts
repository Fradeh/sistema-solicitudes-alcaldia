import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userAssignedId!: string;

  @ApiProperty({
    format: 'uuid',
    required: false,
    description: 'Nuevo estado (opcional, por defecto "in_review")',
  })
  @IsUUID()
  @IsOptional()
  statusId?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Observacion asociada a la asignacion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observation?: string;
}


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChangeDepartmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  departmentId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(300)
  observation?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInternalObservationDto {
  @ApiProperty({
    description: 'Comentario interno relacionado con la solicitud',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  observation!: string;
}

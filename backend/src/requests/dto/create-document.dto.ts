import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'cedula-identidad.pdf', description: 'Nombre del archivo' })
  @IsString()
  @IsNotEmpty()
  fileName!: string; // Cambiado de name a fileName

  @ApiProperty({ example: 'application/pdf', description: 'Tipo MIME del archivo' })
  @IsString()
  @IsNotEmpty()
  fileType!: string; // Cambiado de type a fileType

  @ApiProperty({ example: 15420, description: 'Tamaño en bytes' })
  @IsNumber()
  @IsNotEmpty()
  size!: number;

  @ApiProperty({ example: '/uploads/documents/solicitud_999/cedula.pdf', description: 'Ruta o URL del archivo' })
  @IsString()
  @IsNotEmpty()
  url!: string; // Cambiado de path a url

  @ApiProperty({ example: '12345', description: 'ID de la solicitud asociada (Postgres)' })
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty({ example: 'user_saul_77', description: 'ID del usuario que sube el documento' })
  @IsString()
  @IsNotEmpty()
  userId!: string; // ¡Añadido porque Mongo lo exige!
}
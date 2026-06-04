import { ApiProperty } from '@nestjs/swagger';

export class RequestDetailsDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Solicitud de limpieza de parque' })
  subject!: string;

  @ApiProperty({ example: 'Descripcion completa de la solicitud' })
  description!: string;

  @ApiProperty({ example: 'Maria Gomez' })
  applicantName!: string;

  @ApiProperty({ example: 'maria@example.com' })
  applicantContact!: string;

  @ApiProperty({ example: 'Servicios Publicos' })
  categoryName!: string;

  @ApiProperty({ example: 'Obras Municipales' })
  departmentName!: string;

  @ApiProperty({ example: 'En Proceso' })
  statusName!: string;

  @ApiProperty({ example: 'Medium' })
  priority!: string;

  @ApiProperty({ example: 'Juan Perez', nullable: true })
  userAssignedName!: string | null;

  @ApiProperty({ example: 'Ana Lopez' })
  receivedByName!: string;

  @ApiProperty({ example: 'ABC-123-XYZ' })
  trackingCode!: string;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-01T13:00:00.000Z' })
  updatedAt!: Date;
}


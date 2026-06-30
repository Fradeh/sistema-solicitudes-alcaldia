import { ApiProperty } from '@nestjs/swagger';

export class RequestListDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Solicitud de limpieza de parque' })
  subject!: string;

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

  @ApiProperty({ example: 'ABC-123-XYZ' })
  trackingCode!: string;

  @ApiProperty({ example: 'María García' })
  applicantName!: string;

  @ApiProperty({ example: '2023-01-15T10:30:00Z' })
  createdAt!: Date;

  @ApiProperty({ format: 'uuid' })
  receivedById!: string;

  @ApiProperty({ example: '2026-06-28' })
  requestDate!: string;

  @ApiProperty({ example: '2026-07-05', nullable: true })
  deadline!: string | null;

  @ApiProperty({ example: 'solicitud.pdf', nullable: true })
  documentName!: string | null;

  @ApiProperty({ example: '/uploads/requests/id/solicitud.pdf', nullable: true })
  documentUrl!: string | null;
}


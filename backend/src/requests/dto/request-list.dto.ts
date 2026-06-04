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
}


import { ApiProperty } from '@nestjs/swagger';

export class RequestDetailsDTO {
    @ApiProperty({
        description: "Identificador único de la solicitud",
        example: "8f5d4c6f-2f8d-4b0d-9e54-123456789abc"
    })
    idRequest!: string;

    @ApiProperty({
        description: "Nombre de la categoría a la que pertenece la solicitud",
        example: "Salud"
    })
    categoryName!: string;

    @ApiProperty({
        description: "Nombre del departamento al que pertenece la solicitud",
        example: "Recursos Humanos"
    })
    departmentName!: string;

    @ApiProperty({
        description: "Nombre del estado actual de la solicitud",
        example: "En Proceso"
    })
    statusName!: string;

    @ApiProperty({
        description: "Prioridad asignada a la solicitud",
        example: "High"
    })
    priority!: string;

    @ApiProperty({
        description: "Código de seguimiento de la solicitud",
        example: "TR-SH094KLA-SGAYTB12"
    })
    trackingCode!: string;

    @ApiProperty({
        description: "Nombre completo del usuario asignado a la solicitud",
        example: "Juan Pérez",
        required: false
    })
    userAssignedName?: string;

    @ApiProperty({
        description: "Fecha de creación de la solicitud",
        example: "2026-05-30T10:30:00.000Z"
    })
    creationDate!: Date;

    @ApiProperty({
        description: "Fecha de la última actualización de la solicitud",
        example: "2026-05-30T15:45:00.000Z"
    })
    updateDate!: Date;
}
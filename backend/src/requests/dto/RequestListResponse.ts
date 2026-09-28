import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export class ListRequestDto {

    
    //Name of the category the request belongs to
    @ApiProperty({
        description: "Saludo el id de la solicitud",
        example: "Salud"
    })
    categoryName?: string;

    //Name of the department the request belongs to
    @ApiProperty({
        description: "Nombre del departamento al que pertenece la solicitud",
        example: "Recursos Humanos"
    })
    departmentName?: string;

    //Name of the status the request belongs to
    @ApiProperty({
        description: "Nombre del estado al que pertenece la solicitud",
        example: "En Proceso"
    })
    statusName?: string;

    //Priority of the request
    
    @ApiProperty({
        description: "Prioridad de la solicitud",
        example: "Alta"
    })
    priority?: string;

    //Name of the user who assigned the request
    @ApiProperty({
        description: "Nombre del usuario que asignó la solicitud",
        example: "Juan Pérez"
    })
    userAssignedName?: string;

    //Tracking number of the request
    @ApiProperty({
        description: "Número de seguimiento de la solicitud",
        example: "TR-SH094KLA-SGAYTB12"
    })
    trackingNumber?: string;
}
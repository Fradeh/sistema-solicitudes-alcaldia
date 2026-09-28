import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { RequestPriority } from "../enums/request-priority.enum";


export class FilterRequestDTO {
    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional({
        description: "Id de la categoría",
        example: "d290f1ee-6c54-4b01-90e6-d701748f0851"
    })
    categoryId?: string;

    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional({
        description: "Id del departamento",
        example: "d290f1ee-6c54-4b01-90e6-d701748f0852"
    })
    departmentId?: string;

    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional({
        description: "Id del estado",
        example: "d290f1ee-6c54-4b01-90e6-d701748f0853"
    })
    statusId?: string;

    @IsOptional()
    @IsEnum(RequestPriority)
    @ApiPropertyOptional({
        description: "Prioridad de la solicitud",
        enum: RequestPriority
    })
    priority?: RequestPriority;
}

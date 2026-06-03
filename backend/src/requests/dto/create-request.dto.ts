import {IsUUID, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator'
import { RequestPriority } from 'src/requests/enums/request-priority.enum'
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {

    // Sujeto de la solicutud
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    subject!: string;

    // Descripcion de la solicistud
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description!: string;

    // Nombre del solicitante
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    applicantName!: string;

    // Contacto del solicitante
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    applicantContact!: string;

    // UUID de la categoría a la que pertenece la solicitud
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    categoryId!: string;

    // UUID del departamento al que pertenece la solicitud
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    departmentId!: string;

    // UUID del estado al que pertenece la solicitud
    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    statusId?: string;

    // Prioridad de la solicitud
    @ApiProperty()
    @IsEnum(RequestPriority,{
        message: `Priority must be one of the following values: ${Object.values(RequestPriority).join(', ')}`
    })
    @IsNotEmpty()
    priority!: RequestPriority;

    // UUID del usuario asignado a la solicitud
    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    userAssignedId?: string;

}
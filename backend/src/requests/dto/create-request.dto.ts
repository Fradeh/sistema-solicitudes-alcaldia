import {IsUUID, IsNotEmpty, IsString, IsEnum } from 'class-validator'
import { RequestPriority } from 'src/requests/enums/request-priority.enum'
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
    
    //UUID of the category the request belongs to
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    categoryId!: string;

    //UUID of the department the request belongs to
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    departmentId!: string;

    //UUID of the status the request belongs to
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    statusId!: string;

    //Priority of the request
    @ApiProperty()
    @IsEnum(RequestPriority,{
        message: `Priority must be one of the following values: ${Object.values(RequestPriority).join(', ')}`
    })
    @IsNotEmpty()
    priority!: RequestPriority;

    //UUID of the user who assigned the request
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    userAssignedId!: string;

    //Tracking number of the request
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    trackingNumber!: string;

}
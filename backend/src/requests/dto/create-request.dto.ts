import {IsUUID, IsNotEmpty, IsString, IsEnum } from 'class-validator'
import { RequestPriority } from 'src/requests/enums/request-priority.enum'

export class CreateRequestDto {
    
    //UUID of the category the request belongs to
    @IsUUID()
    @IsNotEmpty()
    categoryId!: string;

    //UUID of the department the request belongs to
    @IsUUID()
    @IsNotEmpty()
    departmentId!: string;

    //UUID of the status the request belongs to
    @IsUUID()
    @IsNotEmpty()
    statusId!: string;

    //Priority of the request
    @IsEnum(RequestPriority,{
        message: `Priority must be one of the following values: ${Object.values(RequestPriority).join(', ')}`
    })
    @IsNotEmpty()
    priority!: RequestPriority;

    //UUID of the user who assigned the request
    @IsUUID()
    @IsNotEmpty()
    userAssignedId!: string;

    //Tracking number of the request
    @IsString()
    @IsNotEmpty()
    trackingNumber!: string;

}
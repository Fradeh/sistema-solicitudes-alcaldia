import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AssignRequestDTO {
@IsUUID()
@ApiProperty({
    description: "Id del usuario al que se asignará la solicitud",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0854"
})
userAssignedId!: string;
}
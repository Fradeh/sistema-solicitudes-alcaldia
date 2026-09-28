import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeStatusDTO {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: "Id del estado al que se desea cambiar",
        example: "d290f1ee-6c54-4b01-90e6-d701748f0853"
    })
    statusId!: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    @ApiPropertyOptional()
    observation?: string;
}

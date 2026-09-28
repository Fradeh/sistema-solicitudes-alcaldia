import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  roleId!: string;

  @ApiProperty()
  role!: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  departmentId?: string;

  @ApiPropertyOptional()
  department?: {
    id: string;
    name: string;
  };

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

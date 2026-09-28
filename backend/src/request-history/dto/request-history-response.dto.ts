import { ApiProperty } from '@nestjs/swagger';

export class RequestHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  requestId!: string;

  @ApiProperty({ example: 'REQUEST_CREATED' })
  eventType!: string;

  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  previousStatusId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  newStatusId!: string | null;

  @ApiProperty({ nullable: true, example: 'in_review' })
  previousStatusName!: string | null;

  @ApiProperty({ nullable: true, example: 'approved_by_department' })
  newStatusName!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  previousAssignedUserId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  newAssignedUserId!: string | null;

  @ApiProperty({ nullable: true, example: 'Funcionario Demo' })
  previousAssignedUserName!: string | null;

  @ApiProperty({ nullable: true, example: 'Funcionario Demo' })
  newAssignedUserName!: string | null;

  @ApiProperty({ nullable: true, example: null })
  observation!: string | null;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'Ana López' })
  userName!: string;

  @ApiProperty({ example: '2026-05-24T16:00:00.000Z' })
  createdAt!: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class RequestHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'REQUEST_CREATED' })
  eventType!: string;

  @ApiProperty({ nullable: true, example: null })
  observation!: string | null;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: '2026-05-24T16:00:00.000Z' })
  createdAt!: Date;
}

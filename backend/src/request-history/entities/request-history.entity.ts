import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('request_history')
export class RequestHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'previous_status_id', type: 'uuid', nullable: true })
  previousStatusId!: string | null;

  @Column({ name: 'new_status_id', type: 'uuid', nullable: true })
  newStatusId!: string | null;

  @Column({ name: 'previous_assigned_user_id', type: 'uuid', nullable: true })
  previousAssignedUserId!: string | null;

  @Column({ name: 'new_assigned_user_id', type: 'uuid', nullable: true })
  newAssignedUserId!: string | null;

  @Column({ name: 'observation', type: 'text', nullable: true })
  observation!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestStatus } from '../../request-statuses/entities/request-status.entity';
import { Request } from '../../requests/entities/request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('request_history')
export class RequestHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => Request)
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'previous_status_id', type: 'uuid', nullable: true })
  previousStatusId!: string | null;

  @ManyToOne(() => RequestStatus, { nullable: true })
  @JoinColumn({ name: 'previous_status_id' })
  previousStatus!: RequestStatus | null;

  @Column({ name: 'new_status_id', type: 'uuid', nullable: true })
  newStatusId!: string | null;

  @ManyToOne(() => RequestStatus, { nullable: true })
  @JoinColumn({ name: 'new_status_id' })
  newStatus!: RequestStatus | null;

  @Column({ name: 'previous_assigned_user_id', type: 'uuid', nullable: true })
  previousAssignedUserId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'previous_assigned_user_id' })
  previousAssignedUser!: User | null;

  @Column({ name: 'new_assigned_user_id', type: 'uuid', nullable: true })
  newAssignedUserId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'new_assigned_user_id' })
  newAssignedUser!: User | null;

  @Column({ name: 'observation', type: 'text', nullable: true })
  observation!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

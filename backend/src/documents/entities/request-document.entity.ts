import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Request } from '../../requests/entities/request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('request_documents')
export class RequestDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName!: string;

  @Column({ type: 'varchar', length: 100, name: 'file_type' })
  fileType!: string;

  @Column({ type: 'integer' })
  size!: number;

  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'uuid', name: 'request_id' })
  requestId!: string;

  @ManyToOne(() => Request)
  @JoinColumn({ name: 'request_id' })
  request!: Request;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}

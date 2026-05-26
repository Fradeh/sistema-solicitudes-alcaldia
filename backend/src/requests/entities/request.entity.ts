import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Department } from '../../departments/entities/department.entity';
import { Category } from '../../categories/entities/category.entity';
import { RequestPriority } from '../enums/request-priority.enum';
import { RequestStatus } from '../../request-statuses/entities/request-status.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'requests' })
export class Request {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'varchar',
        length: 200,
    })
    subject!: string;

    @Column({
        type: 'text',
    })
    description!: string;

    @Column({
        type: 'varchar',
        length: 150,
        name: 'applicant_name',
    })
    applicantName!: string;

    @Column({
        type: 'varchar',
        length: 150,
        name: 'applicant_contact',
    })
    applicantContact!: string;

    //Category Entity
    @Column({
        type: 'uuid',
        name: 'category_id',
    })
    categoryId!: string;

    //Relatioship with Category Entity
    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category!: Category;

    //Department Entity
    @Column({
        type: 'uuid',
        name: 'department_id',
    })
    departmentId!: string;

    //Relatioship with Department Entity
    @ManyToOne(() => Department)
    @JoinColumn({ name: 'department_id' })
    department!: Department;
    
    //Status Entity
    @Column({
        type: 'uuid',
        name: 'status_id',
    })
    statusId!: string;

    //Relatioship with Status Entity
    @ManyToOne(() => RequestStatus)
    @JoinColumn({ name: 'status_id' })
    status!: RequestStatus;

    //Priority Enum
    @Column({
        type: 'enum',
        enum: RequestPriority,
        default: RequestPriority.MEDIUM,
    })
    priority!: RequestPriority;

    @Column({
        type: 'uuid',
        name: 'received_by_id',
    })
    receivedById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'received_by_id' })
    receivedBy!: User;

    //Assigned User Entity
    @Column({
        type: 'uuid',
        name: 'user_assigned_id',
        nullable: true,
    })
    userAssignedId!: string | null;

    //Relatioship with Assigned User Entity
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_assigned_id' })
    userAssigned!: User | null;

    //Tracking Code
    @Column({
        type: 'varchar',
        length: 30,
        unique: true,
        name: 'tracking_code',
    })
    trackingCode!: string;

    @Column({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive!: boolean;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt!: Date;
}

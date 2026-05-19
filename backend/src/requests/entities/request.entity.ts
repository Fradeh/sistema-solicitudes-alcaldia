import { Entity, 
        PrimaryGeneratedColumn, 
        Column, 
        CreateDateColumn, 
        UpdateDateColumn,
        DeleteDateColumn } from 'typeorm'

@Entity({ name: 'requests' })
export class Request {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        type: 'uuid',
        name: 'category_id',
    })
    categoryId!: string;

    @Column({
        type: 'uuid',
        name: 'department_id',
    })
    departmentId!: string;

    @Column({
        type: 'uuid',
        name: 'state_id',
    })
    stateId!: string;

    @Column({
        type: 'varchar',
        length: 50,
    })
    priority!: string;

    @Column({
        type: 'uuid',
        name: 'user_assigned_id',
        nullable: true,
    })
    userAssignedId!: string;

    @Column({
        type: 'varchar',
        length: 30,
        unique: true,
        name: 'tracking_code',
    })
    trackingCode!: string;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt!: Date;

    @DeleteDateColumn({
        name: 'deleted_at',
        nullable: true,
    })
    deletedAt?: Date;
}

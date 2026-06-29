import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { normalizeRoleName } from '../auth/roles/role-normalizer';
import { AppRole } from '../auth/roles/app-role.enum';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '../roles/entities/role.entity';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const departmentId = await this.resolveDepartmentId(
      dto.roleId,
      dto.departmentId,
    );
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      departmentId: departmentId ?? null,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      relations: ['role', 'department'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    return users.map((user) => this.toResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return this.toResponseDto(await this.findActiveUser(id));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['role', 'department'],
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser?: { userId: string; role?: string },
  ): Promise<UserResponseDto> {
    if (
      currentUser &&
      currentUser.userId !== id &&
      normalizeRoleName(currentUser.role) !== AppRole.ADMIN
    ) {
      throw new ForbiddenException('No puedes modificar otro usuario');
    }
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'department'],
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.roleId || dto.departmentId !== undefined) {
      const requestedDepartmentId =
        dto.departmentId !== undefined
          ? dto.departmentId
          : dto.roleId
            ? undefined
            : (user.departmentId ?? undefined);
      user.departmentId =
        (await this.resolveDepartmentId(
          dto.roleId ?? user.roleId,
          requestedDepartmentId,
        )) ?? null;
      delete dto.departmentId;
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);

    await this.userRepository.save(user);
    const updated = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'department'],
    });
    if (!updated) throw new NotFoundException('User not found');
    return this.toResponseDto(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findActiveUser(id);

    await this.userRepository.update(id, { isActive: false });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async findActiveUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['role', 'department'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async resolveDepartmentId(
    roleId: string,
    departmentId?: string,
  ): Promise<string | undefined> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, isActive: true },
    });
    if (!role) throw new BadRequestException('El rol seleccionado no existe o está inactivo');

    const normalizedRole = normalizeRoleName(role.name);
    const fixedDepartmentName =
      normalizedRole === AppRole.RECEPTIONIST
        ? 'Secretaría General'
        : normalizedRole === AppRole.MAYOR
          ? 'Despacho del Alcalde'
          : undefined;

    if (fixedDepartmentName) {
      const fixedDepartment = await this.departmentRepository.findOne({
        where: { name: fixedDepartmentName, isActive: true },
      });
      if (!fixedDepartment) {
        throw new BadRequestException(
          `No existe el departamento requerido: ${fixedDepartmentName}`,
        );
      }
      return fixedDepartment.id;
    }

    const requiresDepartment =
      normalizedRole === AppRole.OFFICER || normalizedRole === AppRole.SUPERVISOR;
    if (requiresDepartment && !departmentId) {
      throw new BadRequestException(
        'El usuario debe estar asignado a un departamento',
      );
    }

    if (departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId, isActive: true },
      });
      if (!department) {
        throw new BadRequestException(
          'El departamento seleccionado no existe o está inactivo',
        );
      }
      return department.id;
    }

    return undefined;
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      departmentId: user.departmentId ?? undefined,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
          }
        : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

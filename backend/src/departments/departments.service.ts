import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  normalizeComparableText,
  repairLegacyText,
} from '../common/utils/text-normalizer';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const normalized = await this.normalizeAndValidateName(
      createDepartmentDto.name,
    );
    const department = this.departmentRepository.create({
      ...createDepartmentDto,
      name: normalized,
      description: createDepartmentDto.description
        ? repairLegacyText(createDepartmentDto.description).trim()
        : undefined,
    });
    return this.departmentRepository.save(department);
  }

  findAll(): Promise<Department[]> {
    return this.departmentRepository.find();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOneBy({ id });
    if (!department) {
      throw new NotFoundException(`Department #${id} not found`);
    }
    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const normalizedName = updateDepartmentDto.name
      ? await this.normalizeAndValidateName(updateDepartmentDto.name, id)
      : undefined;
    const department = await this.departmentRepository.preload({
      id,
      ...updateDepartmentDto,
      ...(normalizedName ? { name: normalizedName } : {}),
      ...(updateDepartmentDto.description !== undefined
        ? {
            description: repairLegacyText(
              updateDepartmentDto.description,
            ).trim(),
          }
        : {}),
    });

    if (!department) {
      throw new NotFoundException(`Department #${id} not found`);
    }

    return this.departmentRepository.save(department);
  }

  private async normalizeAndValidateName(
    name: string,
    currentId?: string,
  ): Promise<string> {
    const repaired = repairLegacyText(name).replace(/\s+/g, ' ').trim();
    const comparable = normalizeComparableText(repaired);
    const departments = await this.departmentRepository.find();
    const duplicate = departments.find(
      (department) =>
        department.id !== currentId &&
        normalizeComparableText(department.name) === comparable,
    );
    if (duplicate) {
      throw new ConflictException(`Ya existe el departamento ${duplicate.name}`);
    }
    return repaired;
  }
}

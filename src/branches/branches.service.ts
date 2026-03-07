import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId?: string, page: number = 1, limit: number = 10, search?: string) {
        const skip = (page - 1) * limit;
        const where: any = tenantId ? { tenantId } : {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.clinicBranch.findMany({
                where,
                include: {
                    tenant: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.clinicBranch.count({ where }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, tenantId?: string) {
        const branch = await this.prisma.clinicBranch.findUnique({
            where: { id },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        if (tenantId && branch.tenantId !== tenantId) {
            throw new ForbiddenException('Access denied to this branch');
        }

        return branch;
    }

    async create(data: CreateBranchDto & { tenantId: string }) {
        return this.prisma.clinicBranch.create({
            data,
        });
    }

    async update(id: string, dto: UpdateBranchDto, tenantId: string) {
        const branch = await this.findOne(id, tenantId);
        return this.prisma.clinicBranch.update({
            where: { id: branch.id },
            data: dto,
        });
    }

    async delete(id: string, tenantId: string) {
        const branch = await this.findOne(id, tenantId);
        // TODO: Check if branch has active data before deletion
        return this.prisma.clinicBranch.delete({
            where: { id: branch.id },
        });
    }
}

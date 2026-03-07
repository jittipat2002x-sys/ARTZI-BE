import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findOneWithRole(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                roleRef: true,
                tenant: true,
                branches: {
                    include: { branch: true }
                }
            },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                roleRef: true,
                tenant: true,
                branches: {
                    include: { branch: true }
                }
            },
        });
    }

    async findAll(tenantId?: string, page: number = 1, limit: number = 10, search?: string, branchId?: string) {
        const skip = (page - 1) * limit;
        const where: any = tenantId ? { tenantId } : {};

        if (branchId) {
            where.branches = {
                some: { branchId }
            };
        }

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    roleRef: true,
                    tenant: true,
                    branches: {
                        include: { branch: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
            include: {
                branches: {
                    include: { branch: true }
                }
            }
        });
    }

    async delete(id: string): Promise<User> {
        return this.prisma.user.delete({ where: { id } });
    }
}

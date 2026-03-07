import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.role.findMany({
                include: {
                    _count: { select: { users: true, menus: true } },
                },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.role.count()
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

    async findById(id: string) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                menus: { include: { menu: true } },
                _count: { select: { users: true } },
            },
        });
        if (!role) throw new NotFoundException('ไม่พบ Role นี้');
        return role;
    }

    async create(dto: CreateRoleDto) {
        return this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async update(id: string, dto: UpdateRoleDto) {
        await this.findById(id);
        return this.prisma.role.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return this.prisma.role.delete({ where: { id } });
    }

    async assignMenus(roleId: string, menuIds: string[]) {
        await this.findById(roleId);

        // Delete existing assignments and create new ones
        await this.prisma.$transaction([
            this.prisma.roleMenu.deleteMany({ where: { roleId } }),
            ...menuIds.map(menuId =>
                this.prisma.roleMenu.create({
                    data: { roleId, menuId },
                }),
            ),
        ]);

        return this.findById(roleId);
    }

    async getMenusForRole(roleId: string) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                menus: {
                    include: {
                        menu: {
                            include: { children: true },
                        },
                    },
                },
            },
        });
        if (!role) throw new NotFoundException('ไม่พบ Role นี้');
        return role.menus.map(rm => rm.menu);
    }
}

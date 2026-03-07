import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';

@Injectable()
export class MenusService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.menu.findMany({
            where: { parentId: null }, // Top-level menus only
            include: {
                children: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findAllFlat() {
        return this.prisma.menu.findMany({
            include: { children: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async findById(id: string) {
        const menu = await this.prisma.menu.findUnique({
            where: { id },
            include: { children: true, parent: true },
        });
        if (!menu) throw new NotFoundException('ไม่พบเมนูนี้');
        return menu;
    }

    async create(dto: CreateMenuDto) {
        return this.prisma.menu.create({
            data: {
                name: dto.name,
                path: dto.path,
                icon: dto.icon,
                parentId: dto.parentId,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    async update(id: string, dto: UpdateMenuDto) {
        await this.findById(id);
        return this.prisma.menu.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return this.prisma.menu.delete({ where: { id } });
    }
}

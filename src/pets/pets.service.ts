import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto, UpdatePetDto } from './dto/pet.dto';

@Injectable()
export class PetsService {
    constructor(private prisma: PrismaService) { }

    async create(createPetDto: CreatePetDto) {
        try {
            const data: any = { ...createPetDto };
            if (data.birthDate) {
                data.birthDate = new Date(data.birthDate);
            }
            if (data.weight !== undefined) {
                data.weight = parseFloat(String(data.weight));
            }
            console.log('Creating pet with data:', JSON.stringify(data));
            return await this.prisma.pet.create({ data });
        } catch (error) {
            console.error('Pet creation error:', error);
            throw error;
        }
    }

    async findAll(tenantId: string, customerId?: string) {
        const where: any = { tenantId };
        if (customerId) where.customerId = customerId;

        return this.prisma.pet.findMany({
            where,
            include: {
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const pet = await this.prisma.pet.findFirst({
            where: { id, tenantId },
            include: {
                customer: true,
            },
        });
        if (!pet) throw new NotFoundException('Pet not found');
        return pet;
    }

    async update(id: string, updatePetDto: UpdatePetDto, tenantId: string) {
        await this.findOne(id, tenantId);
        try {
            const data: any = { ...updatePetDto };
            if (data.birthDate) {
                data.birthDate = new Date(data.birthDate);
            }
            if (data.weight !== undefined && data.weight !== null) {
                data.weight = parseFloat(String(data.weight));
            }
            return await this.prisma.pet.update({
                where: { id },
                data,
            });
        } catch (error: any) {
            console.error('Pet update error:', error);
            if (error.code === 'P2025') {
                throw new NotFoundException(`Pet with id ${id} not found`);
            }
            throw error;
        }
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId);
        return this.prisma.pet.delete({
            where: { id },
        });
    }
}

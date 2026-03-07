import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        return this.prisma.customer.create({
            data: createCustomerDto as any,
        });
    }

    async findAll(tenantId: string, search?: string, page = 1, limit = 10, branchId?: string) {
        const skip = (page - 1) * limit;

        const where: any = { tenantId };

        if (branchId) {
            where.branchId = branchId;
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                include: {
                    pets: true,
                    branch: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, tenantId: string) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
            include: {
                pets: true,
            },
        });
        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto, tenantId: string) {
        await this.findOne(id, tenantId);
        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId);
        // Delete related pets first, then the customer (in a transaction)
        return this.prisma.$transaction([
            this.prisma.pet.deleteMany({ where: { customerId: id } }),
            this.prisma.customer.delete({ where: { id } }),
        ]);
    }
}

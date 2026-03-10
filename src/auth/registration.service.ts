import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegistrationService {
    constructor(private prisma: PrismaService) { }

    async registerClinic(dto: RegisterClinicDto) {
        // 1. Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.ownerEmail },
        });
        if (existingUser) {
            throw new ConflictException('อีเมลเจ้าของคลินิกนี้ถูกใช้งานไปแล้ว');
        }

        const existingTenant = await this.prisma.tenant.findUnique({
            where: { email: dto.clinicEmail },
        });
        if (existingTenant) {
            throw new ConflictException('อีเมลคลินิกนี้ถูกใช้งานไปแล้ว');
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // 3. Find OWNER role
        const ownerRole = await this.prisma.role.findUnique({
            where: { name: 'OWNER' },
        });
        if (!ownerRole) {
            throw new InternalServerErrorException('ไม่พบ Role "OWNER" ในระบบ กรุณาติดต่อแอดมิน');
        }

        // 4. Create everything in a transaction
        try {
            return await this.prisma.$transaction(async (tx) => {
                // 3.1 Calculate Trial Expiry (30 days from now)
                const trialExpiry = new Date();
                trialExpiry.setDate(trialExpiry.getDate() + 30);

                // Create Tenant
                const tenant = await tx.tenant.create({
                    data: {
                        name: dto.clinicName,
                        taxId: dto.taxId,
                        email: dto.clinicEmail,
                        phone: dto.clinicPhone,
                        description: dto.clinicDescription,
                        paymentSlipUrl: dto.paymentSlipUrl,
                        status: 'APPROVED', // Auto-approved for free trial
                        isActive: true,      // Active immediately
                        activePlan: 'FREE',
                        planExpiresAt: trialExpiry,
                    },
                });

                // Create Owner User
                const user = await tx.user.create({
                    data: {
                        email: dto.ownerEmail,
                        password: hashedPassword,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        roleId: ownerRole.id,
                        tenantId: tenant.id,
                    },
                });

                // Create First Branch
                const branch = await tx.clinicBranch.create({
                    data: {
                        name: dto.branchName,
                        address: dto.branchAddress,
                        phone: dto.branchPhone,
                        tenantId: tenant.id,
                    },
                });

                // Link User to Branch (via BranchStaff)
                await tx.branchStaff.create({
                    data: {
                        userId: user.id,
                        branchId: branch.id,
                    },
                });

                return {
                    message: 'ลงทะเบียนสำเร็จ! บัญชีของคุณพร้อมใช้งานแล้ว (ทดลองใช้งานฟรี 1 เดือน)',
                    clinicId: tenant.id,
                };
            });
        } catch (error) {
            console.error('Registration error:', error);
            throw new InternalServerErrorException('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        }
    }
}

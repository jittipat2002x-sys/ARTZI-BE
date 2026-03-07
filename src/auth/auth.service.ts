import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findOne(registerDto.email);
        if (existingUser) {
            throw new ConflictException('อีเมลนี้ถูกใช้งานไปแล้ว');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user: any = await this.usersService.findOneWithRole(loginDto.email);
        if (!user) {
            throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        // --- Subscription & Grace Period Check ---
        let subscriptionStatus = 'active';
        let daysRemaining = null;

        if (user.tenant && user.tenant.planExpiresAt) {
            const now = new Date();
            const expiry = new Date(user.tenant.planExpiresAt);
            const gracePeriodEnd = new Date(expiry);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

            if (now > gracePeriodEnd) {
                throw new UnauthorizedException('บัญชีของคุณถูกระงับเนื่องจากหมดอายุการใช้งานเกินกำหนด กรุณาติดต่อแอดมินเพื่อต่ออายุ');
            } else if (now > expiry) {
                subscriptionStatus = 'grace_period';
                const diffTime = Math.abs(gracePeriodEnd.getTime() - now.getTime());
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        const roleName = user.roleRef?.name || 'USER';
        const roleDescription = user.roleRef?.description || roleName;
        const payload = {
            email: user.email,
            sub: user.id,
            role: roleName,
            tenantId: user.tenantId,
            subscriptionStatus,
            daysRemaining
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: roleName,
                roleDescription,
                tenantName: user.tenant?.name || null,
                brandColor: user.tenant?.brandColor || null,
                logoUrl: user.tenant?.logoUrl || null,
                branchName: user.branches?.[0]?.branch?.name || null,
                subscriptionStatus,
                daysRemaining
            }
        };
    }

    async getMenusForUser(userId: string) {
        const user: any = await this.usersService.findById(userId);
        if (!user || !user.roleId) return [];

        const roleMenus = await this.prisma.roleMenu.findMany({
            where: { roleId: user.roleId },
            include: {
                menu: {
                    include: { children: { orderBy: { sortOrder: 'asc' } } },
                },
            },
        });

        // Return only top-level menus (with children included)
        const menus = roleMenus.map((rm: any) => rm.menu);
        const topLevel = menus.filter((m: any) => !m.parentId);
        return topLevel.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    }
}

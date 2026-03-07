import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'List all users' })
    async findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('branchId') branchId?: string,
        @Query('tenantId') queryTenantId?: string,
    ) {
        const user = req.user;
        const isSaasAdmin = user.roleRef?.name === 'SAAS_ADMIN';
        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 10;
        const tid = isSaasAdmin ? (queryTenantId || undefined) : user.tenantId;

        const result = await this.usersService.findAll(tid, p, l, search, branchId);
        result.data = result.data.map(({ password, ...user }: any) => user);
        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    async findById(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) return null;
        const { password, ...result } = user;
        return result;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    async create(@Request() req: any, @Body() dto: CreateUserDto) {
        const currentUser = req.user;
        const isSaasAdmin = currentUser.roleRef?.name === 'SAAS_ADMIN';

        // If not SAAS_ADMIN, force the tenantId to be the current user's tenantId
        const tenantId = isSaasAdmin ? undefined : currentUser.tenantId;

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            tenant: tenantId ? { connect: { id: tenantId } } : undefined,
            roleRef: dto.roleId ? { connect: { id: dto.roleId } } : undefined,
            branches: dto.branchIds && dto.branchIds.length > 0 ? {
                create: dto.branchIds.map(branchId => ({
                    branch: { connect: { id: branchId } }
                }))
            } : undefined,
        });
        const { password, ...result } = user;
        return result;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user' })
    async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
        const currentUser = req.user;
        const isSaasAdmin = currentUser.roleRef?.name === 'SAAS_ADMIN';

        const targetUser = await this.usersService.findById(id);
        if (!targetUser) throw new NotFoundException('User not found');

        // Security check: Only SuperAdmin or Owner matching tenantId can update
        if (!isSaasAdmin && targetUser.tenantId !== currentUser.tenantId) {
            throw new ForbiddenException('You do not have permission to update this user');
        }

        const data: any = {};
        if (dto.email) data.email = dto.email;
        if (dto.firstName) data.firstName = dto.firstName;
        if (dto.lastName) data.lastName = dto.lastName;
        if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
        if (dto.roleId) data.roleRef = { connect: { id: dto.roleId } };

        if (dto.branchIds !== undefined) {
            data.branches = {
                deleteMany: {},
                create: dto.branchIds.map(branchId => ({
                    branch: { connect: { id: branchId } }
                }))
            };
        }

        const user = await this.usersService.update(id, data);
        const { password, ...result } = user;
        return result;
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a user' })
    async delete(@Request() req: any, @Param('id') id: string) {
        const currentUser = req.user;
        const isSaasAdmin = currentUser.roleRef?.name === 'SAAS_ADMIN';

        const targetUser = await this.usersService.findById(id);
        if (!targetUser) throw new NotFoundException('User not found');

        // Security check: Only SuperAdmin or Owner matching tenantId can delete
        if (!isSaasAdmin && targetUser.tenantId !== currentUser.tenantId) {
            throw new ForbiddenException('You do not have permission to delete this user');
        }

        const user = await this.usersService.delete(id);
        const { password, ...result } = user;
        return result;
    }
}

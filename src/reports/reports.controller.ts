import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory')
  async getInventoryReport(@Req() req: any, @Query('branchId') branchId?: string) {
    const user = req.user;
    const targetBranchId = branchId || user?.branches?.[0]?.branchId;
    if (!targetBranchId) return { error: 'BranchId required' };
    return this.reportsService.getInventoryReport(targetBranchId);
  }

  @Get('finance')
  async getFinanceReport(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req.user;
    const targetBranchId = branchId || user?.branches?.[0]?.branchId;
    if (!targetBranchId) return { error: 'BranchId required' };

    const end = endDate ? new Date(endDate) : new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setUTCDate(start.getUTCDate() - 30);
    start.setUTCHours(0, 0, 0, 0);

    return this.reportsService.getFinanceReport(targetBranchId, start, end);
  }

  @Get('stats')
  async getStatsReport(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req.user;
    const targetBranchId = branchId || user?.branches?.[0]?.branchId;
    if (!targetBranchId) return { error: 'BranchId required' };

    const end = endDate ? new Date(endDate) : new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setUTCDate(start.getUTCDate() - 30);
    start.setUTCHours(0, 0, 0, 0);

    return this.reportsService.getStatsReport(targetBranchId, start, end);
  }
}

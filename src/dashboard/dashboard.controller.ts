import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req.user;
    const targetBranchId = branchId || user?.branches?.[0]?.branchId;
    if (!targetBranchId) {
        return {
            summary: { totalRevenue: 0, totalExpenses: 0, profit: 0, totalVisits: 0, totalAppointments: 0 },
            chartData: [],
            topItems: []
        };
    }

    return this.dashboardService.getSummary(targetBranchId, startDate, endDate);
  }
}

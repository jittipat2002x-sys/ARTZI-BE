import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(branchId: string, startDateStr?: string, endDateStr?: string) {
    // 1. Setup UTC boundaries
    const end = endDateStr ? new Date(endDateStr) : new Date();
    // Set to end of UTC day: 23:59:59.999Z
    end.setUTCHours(23, 59, 59, 999);
    
    const start = startDateStr ? new Date(startDateStr) : new Date();
    if (!startDateStr) {
        start.setUTCDate(start.getUTCDate() - 30);
    }
    // Set to start of UTC day: 00:00:00.000Z
    start.setUTCHours(0, 0, 0, 0);

    const dateFilter = {
        gte: start,
        lte: end
    };

    // 2. Fetch data
    const invoices = await this.prisma.invoice.findMany({
        where: {
            branchId,
            createdAt: dateFilter
        },
        select: {
            id: true,
            netAmount: true,
            createdAt: true
        }
    });

    // 3. Setup Chart Data Map
    const chartDataMap = new Map<string, { date: string; revenue: number; expense: number; visits: number }>();
    let currDate = new Date(start);
    while (currDate <= end) {
        const dateStr = currDate.toISOString().split('T')[0];
        chartDataMap.set(dateStr, { date: dateStr, revenue: 0, expense: 0, visits: 0 });
        currDate.setUTCDate(currDate.getUTCDate() + 1);
    }

    // 4. Calculate Revenue and Expenses
    const totalRevenue = invoices.reduce((sum, inv) => {
        const dateStr = inv.createdAt.toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
            chartDataMap.get(dateStr)!.revenue += Number(inv.netAmount);
        }
        return sum + Number(inv.netAmount);
    }, 0);

    let totalExpenses = 0;
    if (invoices.length > 0) {
        const requestItems = await this.prisma.invoiceItem.findMany({
            where: {
                invoiceId: { in: invoices.map(i => i.id) },
                productId: { not: null }
            },
            include: {
                product: { select: { cost: true } },
                invoice: { select: { createdAt: true } }
            }
        });

        totalExpenses = requestItems.reduce((sum, item) => {
            const cost = Number(item.product?.cost || 0);
            const qty = Number(item.quantity || 0);
            const lineCost = qty * cost;
            
            const dateStr = item.invoice.createdAt.toISOString().split('T')[0];
            if (chartDataMap.has(dateStr)) {
                chartDataMap.get(dateStr)!.expense += lineCost;
            }
            return sum + lineCost;
        }, 0);
    }

    const profit = totalRevenue - totalExpenses;

    // 5. Calculate Visits and Appointments
    const totalVisits = await this.prisma.visit.count({ where: { branchId, visitDate: dateFilter } });
    const totalAppointments = await this.prisma.appointment.count({ where: { branchId, date: dateFilter } });

    const visits = await this.prisma.visit.findMany({
        where: { branchId, visitDate: dateFilter },
        select: { visitDate: true }
    });

    visits.forEach(v => {
        const dateStr = v.visitDate.toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
            chartDataMap.get(dateStr)!.visits += 1;
        }
    });
    
    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Top Selling Items
    const topItemsData = await this.prisma.invoiceItem.groupBy({
        by: ['productId', 'name'],
        where: {
            invoice: {
                branchId,
                createdAt: dateFilter
            }
        },
        _sum: {
            quantity: true,
            totalPrice: true
        },
        orderBy: {
            _sum: {
                quantity: 'desc'
            }
        },
        take: 5
    });

    const topItems = topItemsData.map(item => ({
        id: item.productId,
        name: item.name,
        quantity: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.totalPrice || 0)
    }));

    return {
        summary: {
            totalRevenue,
            totalExpenses,
            profit,
            totalVisits,
            totalAppointments
        },
        chartData,
        topItems
    };
  }
}

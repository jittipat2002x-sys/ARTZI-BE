import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getInventoryReport(branchId: string) {
    const allItems = await this.prisma.inventory.findMany({
        where: { branchId, isActive: true },
        include: { 
            category: { select: { nameTh: true } } 
        }
    });

    const typeMapping: Record<string, string> = {
        'MEDICINE': 'ยา',
        'VACCINE': 'วัคซีน',
        'SUPPLY': 'วัสดุสิ้นเปลือง',
        'FOOD': 'อาหารสัตว์',
        'SERVICE': 'บริการ',
        'OTHER': 'อื่นๆ'
    };

    const typeStats = new Map<string, { type: string; _count: { _all: number }; _sum: { quantity: number } }>();
    
    allItems.forEach(item => {
        const typeLabel = item.category?.nameTh || typeMapping[item.type] || item.type || 'อื่นๆ';
        if (!typeStats.has(typeLabel)) {
            typeStats.set(typeLabel, { type: typeLabel, _count: { _all: 0 }, _sum: { quantity: 0 } });
        }
        const stats = typeStats.get(typeLabel)!;
        stats._count._all += 1;
        stats._sum.quantity += item.quantity;
    });

    const lowStock = allItems.filter(item => item.quantity <= (item.lowStockThreshold || 0));

    return {
        byType: Array.from(typeStats.values()),
        lowStock: lowStock.map(i => ({ 
            name: i.name, 
            quantity: i.quantity, 
            lowStockThreshold: i.lowStockThreshold, 
            type: i.category?.nameTh || typeMapping[i.type] || i.type 
        })),
        totalItems: allItems.length,
        items: allItems.slice(0, 50) // Limit to 50 for summary
    };
  }

  async getFinanceReport(branchId: string, start: Date, end: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: { 
        branchId, 
        createdAt: { gte: start, lte: end } 
      },
      include: {
        items: {
          include: {
            product: { select: { cost: true } }
          }
        }
      }
    });

    // Group by day
    const dailyData = new Map<string, { date: string; revenue: number; expense: number }>();
    
    invoices.forEach(inv => {
      const dateStr = inv.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { date: dateStr, revenue: 0, expense: 0 });
      }
      const data = dailyData.get(dateStr)!;
      data.revenue += Number(inv.netAmount);
      
      inv.items.forEach(item => {
        if (item.product?.cost) {
          data.expense += (Number(item.quantity) * Number(item.product.cost));
        }
      });
    });

    return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getStatsReport(branchId: string, start: Date, end: Date) {
    // 1. Visit counts by day (for context)
    const visitCount = await this.prisma.visit.count({
        where: { branchId, visitDate: { gte: start, lte: end } }
    });

    // 2. Product Usage Statistics (Grouped by Type)
    const items = await this.prisma.invoiceItem.findMany({
        where: {
            invoice: { branchId, createdAt: { gte: start, lte: end } },
            productId: { not: null }
        },
        include: {
            product: {
                select: { 
                    type: true,
                    category: { select: { nameTh: true } }
                }
            }
        }
    });

    const typeMapping: Record<string, string> = {
        'MEDICINE': 'ยา',
        'VACCINE': 'วัคซีน',
        'SUPPLY': 'วัสดุสิ้นเปลือง',
        'FOOD': 'อาหารสัตว์',
        'SERVICE': 'บริการ',
        'OTHER': 'อื่นๆ'
    };

    const typeStats = new Map<string, { type: string; count: number; revenue: number }>();
    items.forEach(item => {
        const type = item.product?.category?.nameTh || typeMapping[item.product?.type || 'OTHER'] || item.product?.type || 'อื่นๆ';
        if (!typeStats.has(type)) {
            typeStats.set(type, { type, count: 0, revenue: 0 });
        }
        const stats = typeStats.get(type)!;
        stats.count += Number(item.quantity);
        stats.revenue += Number(item.totalPrice);
    });

    return {
        visitCount,
        usageByProductType: Array.from(typeStats.values()),
        totalSalesItems: items.length
    };
  }
}

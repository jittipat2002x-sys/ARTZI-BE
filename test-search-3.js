const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const search = 'อิอิ';
    const dateStr = '2026-03-08';
    
    const where = {};
    const [year, month, day] = dateStr.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    const startRange = new Date(baseDate.getTime() - (12 * 60 * 60 * 1000));
    const endRange = new Date(baseDate.getTime() + (36 * 60 * 60 * 1000));

    where.visitDate = {
        gte: startRange,
        lte: endRange
    };
    
    where.OR = [
        {
            customer: {
                OR: [
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                    { phone: { contains: search } },
                    { lineId: { contains: search } },
                ]
            }
        },
        {
            medicalRecords: {
                some: {
                    pet: {
                        OR: [
                            { name: { contains: search } },
                            { tagId: { contains: search } },
                        ]
                    }
                }
            }
        }
    ];
    
    console.log("WHERE CLAUSE:", JSON.stringify(where, null, 2));
    
    const visits = await prisma.visit.findMany({
        where,
        include: { customer: true, medicalRecords: { include: { pet: true } } }
    });
    console.log("Visits found:", visits.length);
    if(visits.length > 0) {
        console.log("First visit matching:", JSON.stringify({
            visitDate: visits[0].visitDate,
            customerName: visits[0].customer.firstName,
            petNames: visits[0].medicalRecords.map((m) => m.pet.name)
        }, null, 2));
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());

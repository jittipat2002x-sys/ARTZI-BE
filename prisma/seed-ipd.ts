import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding IPD Menu...');

    // Find if menu by path exists
    const existingMenu = await prisma.menu.findFirst({
        where: { path: '/dashboard/ipd' }
    });

    let ipdMenu;
    if (existingMenu) {
        ipdMenu = await prisma.menu.update({
            where: { id: existingMenu.id },
            data: { name: 'แอดมิท (IPD)', icon: 'Layout', sortOrder: 6.7 }
        });
    } else {
        ipdMenu = await prisma.menu.create({
            data: {
                name: 'แอดมิท (IPD)',
                path: '/dashboard/ipd',
                icon: 'Layout',
                sortOrder: 6.7,
            },
        });
    }

    const roles = await prisma.role.findMany({
        where: { name: { in: ['OWNER', 'VET', 'NURSE', 'RECEPTIONIST'] } }
    });

    for (const role of roles) {
        const existingAssignment = await prisma.roleMenu.findFirst({
            where: { roleId: role.id, menuId: ipdMenu.id }
        });

        if (!existingAssignment) {
            await prisma.roleMenu.create({
                data: { roleId: role.id, menuId: ipdMenu.id },
            });
        }
    }

    console.log('✅ IPD Menu seeded and assigned to roles.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

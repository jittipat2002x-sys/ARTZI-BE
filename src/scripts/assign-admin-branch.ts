import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = 'admin@example.com';
    const user = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!user) {
        console.error('Admin user not found');
        return;
    }

    const branch = await prisma.clinicBranch.findFirst();
    if (!branch) {
        console.error('No branch found in the database');
        return;
    }

    // Check if association already exists in BranchStaff
    const existing = await prisma.branchStaff.findFirst({
        where: {
            userId: user.id,
            branchId: branch.id,
        },
    });

    if (existing) {
        console.log('Admin already assigned to branch in BranchStaff');
    } else {
        await prisma.branchStaff.create({
            data: {
                userId: user.id,
                branchId: branch.id,
            },
        });
        console.log(`Assigned admin ${adminEmail} to branch: ${branch.name} in BranchStaff`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

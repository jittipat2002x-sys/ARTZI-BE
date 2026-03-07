import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🧹 Clearing visits, medical records, invoices, and appointments...');

    try {
        // Delete in order to satisfy foreign key constraints
        const treatments = await prisma.medicalTreatment.deleteMany({});
        console.log(`- Deleted ${treatments.count} medical treatments`);

        const records = await prisma.medicalRecord.deleteMany({});
        console.log(`- Deleted ${records.count} medical records`);

        const items = await prisma.invoiceItem.deleteMany({});
        console.log(`- Deleted ${items.count} invoice items`);

        const invoices = await prisma.invoice.deleteMany({});
        console.log(`- Deleted ${invoices.count} invoices`);

        const visits = await prisma.visit.deleteMany({});
        console.log(`- Deleted ${visits.count} visits`);

        const appointments = await prisma.appointment.deleteMany({});
        console.log(`- Deleted ${appointments.count} appointments`);

        console.log('✅ Data cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

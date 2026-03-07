import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
    const customerId = 'd51f2075-fb51-4764-8226-c7206f4c7699';

    console.log('--- Checking Appointments for Customer Pets ---');
    const appointments = await prisma.appointment.findMany({
        where: {
            pet: {
                customerId: customerId
            }
        },
        include: {
            pet: true
        }
    });
    console.log(JSON.stringify(appointments, null, 2));

    console.log('\n--- Checking Visits ---');
    const visits = await prisma.visit.findMany({
        where: { customerId: customerId },
        include: {
            medicalRecords: true,
            invoice: true
        }
    });
    console.log(JSON.stringify(visits, null, 2));

    await prisma.$disconnect();
}

checkData();


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Setting up Consent Flags for Testing ---');
  
  // Find surgery related items and set requiresConsent = true
  const result = await prisma.inventory.updateMany({
    where: {
      OR: [
        { name: { contains: 'Surgery' } },
        { name: { contains: 'Anesthesia' } },
        { name: { contains: 'แอดมิท' } },
        { name: { contains: 'ผ่าตัด' } }
      ]
    },
    data: {
      requiresConsent: true
    }
  });

  console.log(`Updated ${result.count} items to require consent.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

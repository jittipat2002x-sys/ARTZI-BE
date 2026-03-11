import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Roles
    const saasAdminRole = await prisma.role.upsert({
        where: { name: 'SAAS_ADMIN' },
        update: {},
        create: {
            name: 'SAAS_ADMIN',
            description: 'แอดมินใหญ่สุด (Super Admin)',
        },
    });

    const ownerRole = await prisma.role.upsert({
        where: { name: 'OWNER' },
        update: {},
        create: {
            name: 'OWNER',
            description: 'เจ้าของคลินิก (Tenant Admin)',
        },
    });

    const vetRole = await prisma.role.upsert({
        where: { name: 'VET' },
        update: {},
        create: {
            name: 'VET',
            description: 'สัตวแพทย์',
        },
    });

    const nurseRole = await prisma.role.upsert({
        where: { name: 'NURSE' },
        update: {},
        create: {
            name: 'NURSE',
            description: 'ผู้ช่วย/พยาบาล',
        },
    });

    const receptionistRole = await prisma.role.upsert({
        where: { name: 'RECEPTIONIST' },
        update: {},
        create: {
            name: 'RECEPTIONIST',
            description: 'พนักงานต้อนรับ',
        },
    });

    console.log('✅ Roles created:', { saasAdminRole, ownerRole, vetRole, nurseRole, receptionistRole });

    // 2. Cleanup existing Menus and RoleMenu to avoid duplicates
    await prisma.roleMenu.deleteMany({});
    await prisma.menu.deleteMany({});
    console.log('🗑️  Cleaned up existing menus and assignments');

    // 3. Create Default Menus
    const dashboardMenu = await prisma.menu.create({
        data: { name: 'แดชบอร์ด', path: '/dashboard', icon: 'LayoutDashboard', sortOrder: 1 },
    });

    const userMgmtMenu = await prisma.menu.create({
        data: { name: 'จัดการผู้ใช้', path: '/dashboard/users', icon: 'Users', sortOrder: 2 },
    });

    const roleMgmtMenu = await prisma.menu.create({
        data: { name: 'จัดการ Role', path: '/dashboard/roles', icon: 'Shield', sortOrder: 3 },
    });

    const menuMgmtMenu = await prisma.menu.create({
        data: { name: 'จัดการเมนู', path: '/dashboard/menus', icon: 'Menu', sortOrder: 4 },
    });

    const appointmentMenu = await prisma.menu.create({
        data: { name: 'นัดหมาย', path: '/dashboard/appointments', icon: 'Calendar', sortOrder: 5 },
    });

    const medicalMenu = await prisma.menu.create({
        data: { name: 'ประวัติการรักษา', path: '/dashboard/medical', icon: 'FileText', sortOrder: 6 },
    });

    const customerMenu = await prisma.menu.create({
        data: { name: 'ลูกค้าและสัตว์เลี้ยง', path: '/dashboard/customers', icon: 'Users', sortOrder: 6.5 },
    });

    const ipdMenu = await prisma.menu.create({
        data: { name: 'แอดมิท (IPD)', path: '/dashboard/ipd', icon: 'Layout', sortOrder: 6.7 },
    });

    const inventoryMenu = await prisma.menu.create({
        data: { name: 'คลังยา/สินค้า', path: '/dashboard/inventory', icon: 'Package', sortOrder: 7 },
    });

    const billingMenu = await prisma.menu.create({
        data: { name: 'ออกบิล/ใบเสร็จ', path: '/dashboard/billing', icon: 'Receipt', sortOrder: 8 },
    });

    const reportsMenu = await prisma.menu.create({
        data: { name: 'รายงาน', path: '/dashboard/reports', icon: 'BarChart3', sortOrder: 9 },
    });

    const masterDataMenu = await prisma.menu.create({
        data: { name: 'จัดการข้อมูลหลัก', path: '/dashboard/settings/master-data', icon: 'Database', sortOrder: 9.5 },
    });

    const clinicApprovalMenu = await prisma.menu.create({
        data: { name: 'ตรวจสอบคลินิก', path: '/dashboard/admin/clinics', icon: 'Building2', sortOrder: 10 },
    });

    const branchMgmtMenu = await prisma.menu.create({
        data: { name: 'จัดการสาขา', path: '/dashboard/settings/branches', icon: 'MapPin', sortOrder: 11 },
    });

    const brandingMenu = await prisma.menu.create({
        data: { name: 'ตั้งค่าแบรนดิ้ง', path: '/dashboard/settings/branding', icon: 'Palette', sortOrder: 12 },
    });

    console.log('✅ Menus created');

    // 3. Assign menus to roles
    // SAAS_ADMIN gets only core management and master data menus
    const saasAdminMenus = [
        dashboardMenu,
        userMgmtMenu,
        roleMgmtMenu,
        menuMgmtMenu,
        masterDataMenu,
        clinicApprovalMenu
    ];
    for (const menu of saasAdminMenus) {
        await prisma.roleMenu.create({
            data: { roleId: saasAdminRole.id, menuId: menu.id },
        });
    }

    // OWNER gets specific menus
    const ownerMenus = [dashboardMenu, appointmentMenu, medicalMenu, customerMenu, ipdMenu, inventoryMenu, billingMenu, reportsMenu, branchMgmtMenu, brandingMenu];
    for (const menu of ownerMenus) {
        await prisma.roleMenu.create({
            data: { roleId: ownerRole.id, menuId: menu.id },
        });
    }

    // VET gets specific menus
    const vetMenus = [dashboardMenu, appointmentMenu, medicalMenu, customerMenu, ipdMenu, inventoryMenu, billingMenu, reportsMenu];
    for (const menu of vetMenus) {
        await prisma.roleMenu.create({
            data: { roleId: vetRole.id, menuId: menu.id },
        });
    }

    // NURSE gets specific menus
    const nurseMenus = [dashboardMenu, appointmentMenu, medicalMenu, customerMenu, ipdMenu, inventoryMenu];
    for (const menu of nurseMenus) {
        await prisma.roleMenu.create({
            data: { roleId: nurseRole.id, menuId: menu.id },
        });
    }

    // RECEPTIONIST gets specific menus
    const receptionistMenus = [dashboardMenu, appointmentMenu, medicalMenu, customerMenu, ipdMenu, inventoryMenu, billingMenu];
    for (const menu of receptionistMenus) {
        await prisma.roleMenu.create({
            data: { roleId: receptionistRole.id, menuId: menu.id },
        });
    }
    console.log('✅ Menus assigned to roles');

    // 5. Create SuperAdmin User
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { roleId: saasAdminRole.id },
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            roleId: saasAdminRole.id,
        },
    });

    console.log('✅ SuperAdmin user created:', superAdmin.email);

    // 6. Master Data Seeding
    console.log('🌱 Seeding Master Data...');

    // Product Categories
    const categories = [
        { nameTh: 'ยา', nameEn: 'Medicine' },
        { nameTh: 'วัคซีน', nameEn: 'Vaccine' },
        { nameTh: 'วัสดุสิ้นเปลือง', nameEn: 'Supply' },
        { nameTh: 'อาหารสัตว์', nameEn: 'Food' },
        { nameTh: 'บริการ', nameEn: 'Service' },
        { nameTh: 'อื่นๆ', nameEn: 'Other' },
    ];

    for (const cat of categories) {
        await prisma.masterProductCategory.upsert({
            where: { nameTh: cat.nameTh },
            update: { nameEn: cat.nameEn },
            create: cat,
        });
    }

    // Medicine Categories
    const medCategories = [
        { nameTh: 'แบบฉีด', nameEn: 'Injection' },
        { nameTh: 'แบบน้ำ', nameEn: 'Liquid' },
        { nameTh: 'แบบเม็ด', nameEn: 'Pill' },
    ];

    const createdMedCats: any = {};
    for (const medCat of medCategories) {
        const result = await prisma.masterMedicineCategory.upsert({
            where: { nameTh: medCat.nameTh },
            update: { nameEn: medCat.nameEn },
            create: medCat,
        });
        createdMedCats[medCat.nameEn] = result.id;
    }

    // Units
    const units = [
        { nameTh: 'เม็ด', nameEn: 'Pill', medCatEn: 'Pill' },
        { nameTh: 'ขวด', nameEn: 'Bottle', medCatEn: null },
        { nameTh: 'cc', nameEn: 'cc', medCatEn: 'Liquid' },
        { nameTh: 'มล.', nameEn: 'ml', medCatEn: 'Liquid' },
        { nameTh: 'ม้วน', nameEn: 'Roll', medCatEn: null },
        { nameTh: 'แผง', nameEn: 'Panel', medCatEn: 'Pill' },
        { nameTh: 'หลอด', nameEn: 'Tube', medCatEn: 'Injection' },
        { nameTh: 'เข็ม', nameEn: 'Needle', medCatEn: 'Injection' },
        { nameTh: 'ครั้ง', nameEn: 'Time', medCatEn: null },
    ];

    for (const unit of units) {
        await prisma.masterUnit.create({
            data: {
                nameTh: unit.nameTh,
                nameEn: unit.nameEn,
                medicineCategoryId: unit.medCatEn ? createdMedCats[unit.medCatEn] : null,
            },
        });
    }

    // Usage Instructions
    const frequencies = [
        { nameTh: 'วันละ 1 ครั้ง', nameEn: '1 time per day' },
        { nameTh: 'วันละ 2 ครั้ง', nameEn: '2 times per day' },
        { nameTh: 'วันละ 3 ครั้ง', nameEn: '3 times per day' },
        { nameTh: 'วันละ 4 ครั้ง', nameEn: '4 times per day' },
        { nameTh: 'ทุก 4 ชั่วโมง', nameEn: 'Every 4 hours' },
    ];

    for (const freq of frequencies) {
        await prisma.masterUsageInstruction.create({
            data: { ...freq, type: 'FREQUENCY' },
        });
    }

    const usageTimes = [
        { nameTh: 'ก่อนอาหาร', nameEn: 'Before Meal' },
        { nameTh: 'หลังอาหาร', nameEn: 'After Meal' },
        { nameTh: 'พร้อมอาหาร', nameEn: 'With Meal' },
        { nameTh: 'ก่อนนอน', nameEn: 'Before Bed' },
        { nameTh: 'เวลาปวด', nameEn: 'When Pain' },
    ];

    for (const time of usageTimes) {
        await prisma.masterUsageInstruction.create({
            data: { ...time, type: 'TIME' },
        });
    }

    console.log('✅ Master Data seeded');
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding initial users...');
    // 1. Customer
    const customerPassword = await bcryptjs_1.default.hash('customer123456', 10);
    await prisma.user.upsert({
        where: { email: 'customer@livlab.vn' },
        update: {},
        create: {
            email: 'customer@livlab.vn',
            name: 'Khách hàng LivLab',
            passwordHash: customerPassword,
            role: 'CUSTOMER',
        },
    });
    // 2. Showroom
    const showroomPassword = await bcryptjs_1.default.hash('showroom123456', 10);
    await prisma.user.upsert({
        where: { email: 'showroom@livlab.vn' },
        update: {},
        create: {
            email: 'showroom@livlab.vn',
            name: 'Showroom LivLab',
            passwordHash: showroomPassword,
            role: 'SHOWROOM',
        },
    });
    // 3. Admin
    const adminPassword = await bcryptjs_1.default.hash('admin123456', 10);
    await prisma.user.upsert({
        where: { email: 'admin@livlab.vn' },
        update: {},
        create: {
            email: 'admin@livlab.vn',
            name: 'Admin LivLab',
            passwordHash: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance to be shared across the application
const prisma = new PrismaClient();

// Handle graceful shutdown
process.on('beforeExit', async () => {
 await prisma.$disconnect();
});

export default prisma;

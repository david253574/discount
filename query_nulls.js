const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const nullOrders = await prisma.order.count({ where: { userId: null } });
  console.log(`Null Orders: ${nullOrders}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());

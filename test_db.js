const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const a = await prisma.attachment.findFirst({ include: { message: { include: { conversation: { include: { order: true } } } } } });
  console.log(a.id, a.message.conversation.order.userId);
}
main().catch(console.error).finally(() => prisma.$disconnect());
